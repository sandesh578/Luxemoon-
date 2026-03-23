const assert = require('node:assert/strict');
const crypto = require('node:crypto');

const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:3000';

async function jsonRequest(path, options = {}) {
  const res = await fetch(`${base}${path}`, {
    redirect: 'manual',
    headers: {
      'content-type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });
  const body = await res.json().catch(() => ({}));
  return { res, body };
}

async function run() {
  const seed = crypto.randomBytes(6).toString('hex');
  const email = `e2e.${seed}@luxemoon.test`;
  const password = `LuxeMoon!${seed}`;

  const register = await jsonRequest('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'E2E User',
      email,
      phone: '9800000000',
      password,
    }),
  });
  assert.equal(register.res.status, 200, `register failed: ${register.res.status}`);
  assert.equal(register.body?.success, true, 'register did not return success=true');
  const registerCookie = register.res.headers.get('set-cookie') || '';
  assert.ok(registerCookie.length > 0, 'register response missing session cookie');

  const sessionAfterRegister = await jsonRequest('/api/auth/session', {
    method: 'GET',
    headers: { cookie: registerCookie },
  });
  assert.equal(sessionAfterRegister.res.status, 200, 'session after register failed');
  assert.equal(sessionAfterRegister.body?.authenticated, true, 'session should be authenticated after register');
  assert.equal(sessionAfterRegister.body?.user?.email, email, 'session email mismatch after register');

  const logout = await jsonRequest('/api/auth/logout', {
    method: 'POST',
    headers: { cookie: registerCookie },
  });
  assert.equal(logout.res.status, 200, 'logout failed');

  const sessionAfterLogout = await jsonRequest('/api/auth/session', { method: 'GET' });
  assert.equal(sessionAfterLogout.res.status, 200, 'session after logout failed');
  assert.equal(sessionAfterLogout.body?.authenticated, false, 'session should be unauthenticated after logout');

  const badLogin = await jsonRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password: 'WrongPassword!123' }),
  });
  assert.equal(badLogin.res.status, 401, `bad login should fail with 401, got ${badLogin.res.status}`);

  const login = await jsonRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  assert.equal(login.res.status, 200, `login failed: ${login.res.status}`);
  const loginCookie = login.res.headers.get('set-cookie') || '';
  assert.ok(loginCookie.length > 0, 'login response missing session cookie');

  const sessionAfterLogin = await jsonRequest('/api/auth/session', {
    method: 'GET',
    headers: { cookie: loginCookie },
  });
  assert.equal(sessionAfterLogin.res.status, 200, 'session after login failed');
  assert.equal(sessionAfterLogin.body?.authenticated, true, 'session should be authenticated after login');
  assert.equal(sessionAfterLogin.body?.user?.email, email, 'session email mismatch after login');

  const forgot = await jsonRequest('/api/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
  assert.equal(forgot.res.status, 200, `forgot-password failed: ${forgot.res.status}`);
  assert.equal(forgot.body?.success, true, 'forgot-password did not return success=true');

  console.log(`auth flow smoke passed against ${base}`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
