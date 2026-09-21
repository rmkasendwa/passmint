const { test } = require('node:test');
const assert = require('node:assert/strict');
const { AuthService } = require('../dist/auth/auth.service');

function service(values) {
  const config = { get: (key) => values[key] };
  return new AuthService({}, config);
}

test('Google OAuth uses the public frontend callback URL', () => {
  const auth = service({
    AUTH_SECRET: 'test-secret',
    GOOGLE_CLIENT_ID: 'client-id',
    WEB_ORIGIN: 'https://tickets.example.com',
  });

  const authorization = new URL(auth.googleAuthorization().url);
  assert.equal(
    authorization.searchParams.get('redirect_uri'),
    'https://tickets.example.com/auth/google/callback',
  );
});

test('Google OAuth never emits a wildcard listener as a browser URL', () => {
  const development = service({
    AUTH_SECRET: 'test-secret',
    GOOGLE_CLIENT_ID: 'client-id',
    WEB_ORIGIN: 'http://0.0.0.0:8088',
  });
  const authorization = new URL(development.googleAuthorization().url);

  assert.equal(
    authorization.searchParams.get('redirect_uri'),
    'http://localhost:8088/auth/google/callback',
  );
  assert.equal(
    development.googleCallbackUrl('token'),
    'http://localhost:8088/auth/google/callback?token=token',
  );

  const production = service({
    GOOGLE_CLIENT_ID: 'client-id',
    NODE_ENV: 'production',
    WEB_ORIGIN: 'http://0.0.0.0:8088',
  });
  assert.throws(
    () => production.googleAuthorization(),
    /WEB_ORIGIN must use a public hostname/,
  );
});
