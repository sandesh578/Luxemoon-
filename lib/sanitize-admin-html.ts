// Lightweight server-safe HTML sanitizer for trusted admin-authored rich text.
// Removes executable tags and obvious script injection vectors.
export function sanitizeAdminHtml(input: string): string {
  if (!input) return "";

  return input
    .replace(/<\s*(script|style|iframe|object|embed|link|meta)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, "")
    .replace(/<\s*(script|style|iframe|object|embed|link|meta)[^>]*\/?\s*>/gi, "")
    .replace(/\son\w+\s*=\s*(['"]).*?\1/gi, "")
    .replace(/\son\w+\s*=\s*[^\s>]+/gi, "")
    .replace(/(href|src)\s*=\s*(['"])\s*javascript:[\s\S]*?\2/gi, '$1="#"')
    .replace(/(href|src)\s*=\s*javascript:[^\s>]+/gi, '$1="#"');
}
