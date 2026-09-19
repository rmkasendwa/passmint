const { test } = require('node:test');
const assert = require('node:assert/strict');
const { AuthService } = require('../dist/auth/auth.service');

function service(configuredEmail, users) {
  const prisma = {
    $transaction: async (callback) => callback(prisma),
    user: {
      updateMany: async ({ where, data }) => {
        let count = 0;
        for (const user of users) {
          const matchesRole = !where.role || user.role === where.role;
          const matchesEmail = !where.email ||
            (typeof where.email === 'string'
              ? user.email === where.email
              : user.email !== where.email.not);
          if (matchesRole && matchesEmail) {
            user.role = data.role;
            count++;
          }
        }
        return { count };
      },
    },
  };
  const config = { get: (key) => key === 'ROOT_ADMIN_EMAIL' ? configuredEmail : undefined };
  return new AuthService(prisma, config);
}

test('root administrator reconciliation grants, transfers and revokes configuration authority', async () => {
  const users = [
    { email: 'old@example.com', role: 'root_admin' },
    { email: 'new@example.com', role: 'user' },
    { email: 'delegated@example.com', role: 'admin' },
  ];

  await service(' NEW@example.com ', users).reconcileRootAdmin();
  assert.deepEqual(users.map(({ role }) => role), ['user', 'root_admin', 'admin']);

  await service('', users).reconcileRootAdmin();
  assert.deepEqual(users.map(({ role }) => role), ['user', 'user', 'admin']);
});

test('missing matching account leaves every ordinary account unchanged', async () => {
  const users = [{ email: 'person@example.com', role: 'user' }];
  await service('future@example.com', users).reconcileRootAdmin();
  assert.equal(users[0].role, 'user');
});
