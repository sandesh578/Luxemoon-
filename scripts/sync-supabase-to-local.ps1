param(
  [switch]$KeepDump
)

$ErrorActionPreference = "Stop"

function Read-DotEnv([string]$FilePath) {
  $result = @{}
  if (-not (Test-Path $FilePath)) { return $result }
  Get-Content -LiteralPath $FilePath | ForEach-Object {
    $line = $_.Trim()
    if ([string]::IsNullOrWhiteSpace($line)) { return }
    if ($line.StartsWith("#")) { return }
    $parts = $line -split "=", 2
    if ($parts.Length -ne 2) { return }
    $key = $parts[0].Trim()
    $value = $parts[1].Trim()
    if ($value.Length -ge 2 -and $value.StartsWith('"') -and $value.EndsWith('"')) {
      $value = $value.Substring(1, $value.Length - 2)
    }
    if (-not [string]::IsNullOrWhiteSpace($key)) {
      $result[$key] = $value
    }
  }
  return $result
}

function Fail([string]$Message) {
  Write-Error $Message
  exit 1
}

function Mask-DbUrl([string]$Url) {
  if ([string]::IsNullOrWhiteSpace($Url)) { return "<empty>" }
  try {
    $uri = [System.Uri]$Url
    $dbHost = $uri.Host
    $db = $uri.AbsolutePath.TrimStart("/")
    if ([string]::IsNullOrWhiteSpace($db)) { $db = "<default>" }
    return "$dbHost/$db"
  } catch {
    $dbHost = Read-DbHost $Url
    if ([string]::IsNullOrWhiteSpace($dbHost)) { return "<invalid-url>" }
    return "$dbHost/<db>"
  }
}

function Read-DbHost([string]$Url) {
  try {
    return ([System.Uri]$Url).Host
  } catch {
    if ([string]::IsNullOrWhiteSpace($Url)) { return "" }
    $m = [regex]::Match($Url, "^[a-zA-Z][a-zA-Z0-9+\.-]*://(.+)$")
    if (-not $m.Success) { return "" }
    $rest = $m.Groups[1].Value
    $authority = $rest.Split('/')[0]
    $at = $authority.LastIndexOf('@')
    if ($at -ge 0) { $authority = $authority.Substring($at + 1) }
    if ($authority.StartsWith('[')) {
      $end = $authority.IndexOf(']')
      if ($end -gt 0) { return $authority.Substring(1, $end - 1) }
      return ""
    }
    $colon = $authority.LastIndexOf(':')
    if ($colon -gt 0) { return $authority.Substring(0, $colon) }
    return $authority
  }
}

$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$dotenv = Read-DotEnv (Join-Path $projectRoot ".env")

function First-Value([string[]]$Values) {
  foreach ($v in $Values) {
    if (-not [string]::IsNullOrWhiteSpace($v)) { return $v }
  }
  return $null
}

function Resolve-PgTool([string]$ToolName) {
  $fromPath = Get-Command $ToolName -ErrorAction SilentlyContinue
  if ($fromPath) { return $fromPath.Source }

  $candidates = @(
    "C:\Program Files\PostgreSQL\17\bin\$ToolName.exe",
    "C:\Program Files\PostgreSQL\16\bin\$ToolName.exe",
    "C:\Program Files\PostgreSQL\15\bin\$ToolName.exe",
    "C:\Program Files\PostgreSQL\14\bin\$ToolName.exe",
    "C:\Program Files\PostgreSQL\13\bin\$ToolName.exe",
    "C:\Program Files\PostgreSQL\12\bin\$ToolName.exe"
  )

  foreach ($candidate in $candidates) {
    if (Test-Path $candidate) { return $candidate }
  }

  return $null
}

function Normalize-PgUrl([string]$Url) {
  if ([string]::IsNullOrWhiteSpace($Url)) { return $Url }
  try {
    [void][System.Uri]$Url
    return $Url
  } catch {
    $m = [regex]::Match($Url, "^([a-zA-Z][a-zA-Z0-9+\.-]*://[^:/?#]+:)(.*)(@[^/]+/.*)$")
    if ($m.Success) {
      return $m.Groups[1].Value + [System.Uri]::EscapeDataString($m.Groups[2].Value) + $m.Groups[3].Value
    }
    return $Url
  }
}

function Get-PgMajorVersion([string]$PgDumpPath) {
  try {
    $verOutput = & $PgDumpPath --version
    $match = [regex]::Match(($verOutput | Out-String), "(\d+)\.")
    if ($match.Success) { return [int]$match.Groups[1].Value }
  } catch {}
  return 0
}

$sourceUrl = First-Value @($env:SUPABASE_DATABASE_URL, $dotenv["SUPABASE_DATABASE_URL"], $env:DIRECT_URL, $dotenv["DIRECT_URL"])
$targetUrl = First-Value @($env:LOCAL_DATABASE_URL, $dotenv["LOCAL_DATABASE_URL"], $env:DATABASE_URL, $dotenv["DATABASE_URL"])
$allowAnySource = ($env:ALLOW_NON_SUPABASE_SOURCE -eq "true")
$allowSupabaseTarget = ($env:ALLOW_SUPABASE_TARGET -eq "true")

if ([string]::IsNullOrWhiteSpace($sourceUrl)) {
  Fail "Missing SUPABASE_DATABASE_URL or DIRECT_URL. One of them must point to the Supabase Postgres database."
}

if ([string]::IsNullOrWhiteSpace($targetUrl)) {
  Fail "Missing LOCAL_DATABASE_URL or DATABASE_URL. This must point to your local/on-prem Postgres database."
}

if ($sourceUrl -eq $targetUrl) {
  Fail "Source and target URLs are identical. Aborting to protect data."
}

$sourceUrl = Normalize-PgUrl $sourceUrl
$targetUrl = Normalize-PgUrl $targetUrl

$sourceHost = Read-DbHost $sourceUrl
if (-not $allowAnySource -and $sourceHost -notlike "*.supabase.co") {
  Fail "SUPABASE_DATABASE_URL host '$sourceHost' is not a Supabase host. Set ALLOW_NON_SUPABASE_SOURCE=true only if this is intentional."
}

$targetHost = Read-DbHost $targetUrl
if (-not $allowSupabaseTarget -and $targetHost -like "*.supabase.co") {
  Fail "Target host '$targetHost' looks like Supabase. Refusing to write to Supabase. Set LOCAL_DATABASE_URL to your on-prem/local DB."
}

$pgDumpPath = Resolve-PgTool "pg_dump"
$pgRestorePath = Resolve-PgTool "pg_restore"
if (-not $pgDumpPath) { Fail "pg_dump not found. Install PostgreSQL client tools (or add to PATH)." }
if (-not $pgRestorePath) { Fail "pg_restore not found. Install PostgreSQL client tools (or add to PATH)." }

$pgMajor = Get-PgMajorVersion $pgDumpPath
$forceDocker = ($env:DB_SYNC_USE_DOCKER_PG17 -eq "true")
$useDockerPgTools = $false

if ($forceDocker -or $pgMajor -lt 17) {
  $docker = Get-Command docker -ErrorAction SilentlyContinue
  if (-not $docker) {
    Fail "pg_dump is version $pgMajor but Supabase is PostgreSQL 17. Install PostgreSQL 17 client tools or Docker."
  }
  $useDockerPgTools = $true
}

$tmpDir = Join-Path $projectRoot ".tmp"
if (-not (Test-Path $tmpDir)) {
  New-Item -ItemType Directory -Path $tmpDir | Out-Null
}

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$dumpFile = Join-Path $tmpDir "supabase-sync-$timestamp.dump"
$dumpFileContainer = "/work/.tmp/supabase-sync-$timestamp.dump"
$projectRootResolved = (Resolve-Path $projectRoot).Path

Write-Host "Sync start: Supabase -> Local"
Write-Host "Source: $(Mask-DbUrl $sourceUrl)"
Write-Host "Target: $(Mask-DbUrl $targetUrl)"
if ($useDockerPgTools) {
  Write-Host "Using Docker PostgreSQL 17 tools for compatibility."
}
Write-Host "Step 1/2: Creating dump from Supabase..."

if ($useDockerPgTools) {
  & docker run --rm `
    -v "${projectRootResolved}:/work" `
    postgres:17 `
    pg_dump `
    --format=custom `
    --no-owner `
    --no-privileges `
    --dbname="$sourceUrl" `
    --file="$dumpFileContainer"
} else {
  & $pgDumpPath `
    --format=custom `
    --no-owner `
    --no-privileges `
    --dbname="$sourceUrl" `
    --file="$dumpFile"
}

if ($LASTEXITCODE -ne 0) {
  Fail "pg_dump failed with exit code $LASTEXITCODE."
}

Write-Host "Step 2/2: Restoring dump into local database (this overwrites local objects)..."

if ($useDockerPgTools) {
  $targetForDocker = $targetUrl -replace "://([^@/]+@)?localhost(:\d+)?/", "://${1}host.docker.internal$2/"
  & docker run --rm `
    -v "${projectRootResolved}:/work" `
    postgres:17 `
    pg_restore `
    --clean `
    --if-exists `
    --no-owner `
    --no-privileges `
    --exit-on-error `
    --dbname="$targetForDocker" `
    "$dumpFileContainer"
} else {
  & $pgRestorePath `
    --clean `
    --if-exists `
    --no-owner `
    --no-privileges `
    --exit-on-error `
    --dbname="$targetUrl" `
    "$dumpFile"
}

if ($LASTEXITCODE -ne 0) {
  Fail "pg_restore failed with exit code $LASTEXITCODE."
}

if (-not $KeepDump) {
  Remove-Item -LiteralPath $dumpFile -Force -ErrorAction SilentlyContinue
}

Write-Host "Sync complete. Local database is now refreshed from Supabase."
