const { test } = require("node:test");
const assert = require("node:assert/strict");
const { AuthService } = require("../dist/auth/auth.service");

function authService(environment) {
  const upserts = [];
  const user = {
    id: "usr_demo_organizer",
    name: "Passmint Demo Organizer",
    email: "demo.organizer@example.test",
    passwordHash: "demo-password-disabled",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const prisma = {
    user: {
      async upsert(args) {
        upserts.push(args);
        return user;
      },
    },
  };
  const config = {
    get(key) {
      return environment[key];
    },
  };
  return { service: new AuthService(prisma, config), upserts };
}

test("demo login is unavailable unless demo mode is explicitly enabled", async () => {
  const { service, upserts } = authService({ NODE_ENV: "development" });

  assert.deepEqual(service.demoAvailability(), { enabled: false });
  await assert.rejects(service.loginToDemo(), /Demo mode is not available/);
  assert.equal(upserts.length, 0);
});

test("demo login remains unavailable in production", async () => {
  const { service, upserts } = authService({
    NODE_ENV: "production",
    PASSMINT_DEMO_MODE: "true",
  });

  assert.deepEqual(service.demoAvailability(), { enabled: false });
  await assert.rejects(service.loginToDemo(), /Demo mode is not available/);
  assert.equal(upserts.length, 0);
});

test("demo login returns a normal session for the dedicated organizer", async () => {
  const { service, upserts } = authService({
    AUTH_SECRET: "test-auth-secret",
    NODE_ENV: "development",
    PASSMINT_DEMO_MODE: "true",
  });

  assert.deepEqual(service.demoAvailability(), { enabled: true });
  const session = await service.loginToDemo();

  assert.equal(upserts.length, 1);
  assert.equal(upserts[0].create.email, "demo.organizer@example.test");
  assert.equal(upserts[0].create.role, "user");
  assert.equal(session.user.id, "usr_demo_organizer");
  assert.equal(session.user.role, "user");
  assert.match(session.token, /^[^.]+\.[^.]+$/);
});
