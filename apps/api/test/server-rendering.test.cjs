const { test } = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { runInNewContext } = require("node:vm");
const ts = require("typescript");
function load(file, imports, globals = {}) {
  const exports = {};
  runInNewContext(
    ts.transpileModule(
      readFileSync(join(__dirname, "../../web", file), "utf8"),
      {
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          target: ts.ScriptTarget.ES2022,
        },
      },
    ).outputText,
    {
      exports,
      require: (name) => imports[name],
      process: { env: { NODE_ENV: "production" } },
      ...globals,
    },
  );
  return exports;
}
function setup(status = 200, token = "signed-token") {
  const calls = [],
    writes = [];
  const jar = {
    get: () => (token ? { value: token } : undefined),
    set: (...args) => writes.push(args),
    delete: (name) => writes.push(["delete", name]),
  };
  const imports = {
    "server-only": {},
    react: { cache: (fn) => fn },
    "next/headers": { cookies: async () => jar },
    "next/navigation": {
      redirect: (path) => {
        throw new Error(`redirect:${path}`);
      },
    },
    "./api": { getApiUrl: () => "http://api.test" },
  };
  const session = load("server-session.ts", imports, {
    fetch: async (url, options) => {
      calls.push({ url, options });
      return {
        status,
        ok: status === 200,
        json: async () => ({ id: "verified-user", role: "organizer" }),
      };
    },
  });
  const actions = load("app/session-actions.ts", {
    "../server-session": session,
    "next/headers": imports["next/headers"],
    "next/cache": { revalidatePath: () => {} },
  });
  return { session, actions, calls, writes };
}
test("server sessions validate bearer credentials and private fetches bypass shared caches", async () => {
  const { session, calls } = setup();
  const result = await session.getServerSession();
  assert.equal(result.user.id, "verified-user");
  assert.equal(calls[0].url, "http://api.test/auth/me");
  assert.equal(calls[0].options.headers.Authorization, "Bearer signed-token");
  assert.equal(calls[0].options.cache, "no-store");
  await session.serverPrivateData("/events/mine", result.token);
  assert.equal(calls[1].options.cache, "no-store");
});
test("missing and expired sessions redirect before protected page data renders", async () => {
  for (const setupArgs of [[200, ""], [401], [403]]) {
    const { session } = setup(...setupArgs);
    assert.equal(await session.getServerSession(), null);
    await assert.rejects(
      session.requireServerSession("/events"),
      /redirect:\/login\?next=%2Fevents/,
    );
  }
});
test("API failure is surfaced, never treated as a valid session", async () => {
  const { session } = setup(503);
  await assert.rejects(session.getServerSession(), /Unable to verify/);
});
test("session action validates before writing a secure cookie and logout deletes it", async () => {
  const { actions, writes } = setup();
  await actions.establishServerSession("signed-token");
  assert.equal(writes[0][0], "passmint-server-session");
  assert.equal(writes[0][2].httpOnly, true);
  assert.equal(writes[0][2].secure, true);
  assert.equal(writes[0][2].sameSite, "lax");
  await actions.clearServerSession();
  assert.equal(writes[1][0], "delete");
  assert.equal(writes[1][1], "passmint-server-session");
});
test("invalid tokens cannot establish a server session", async () => {
  const { actions, writes } = setup(401);
  await assert.rejects(actions.establishServerSession("expired"), /expired/);
  await assert.rejects(actions.establishServerSession(""), /Invalid session/);
  await assert.rejects(
    actions.establishServerSession("x".repeat(4097)),
    /Invalid session/,
  );
  assert.equal(writes.length, 0);
});

test("event timestamps use the same timezone on server and client", () => {
  const { dateTime, shortDate } = load("formatters.ts", {});
  assert.equal(dateTime.resolvedOptions().timeZone, "Africa/Kampala");
  assert.equal(shortDate.resolvedOptions().timeZone, "Africa/Kampala");
  assert.match(dateTime.format(new Date("2030-09-14T22:00:00Z")), /15/);
});

test("post-login destinations use canonical organizer routes and reject external URLs", () => {
  const { organizerReturnPath } = load("organizer-routes.ts", {}, { URL });
  for (const [input, expected] of [
    ["/events/new", "/events/new"],
    ["/reports", "/reports"],
    ["/check-in", "/check-in"],
    ["/dashboard/events/example", "/events/example"],
    ["/dashboard", "/events"],
    ["https://evil.test/events", "/events"],
    ["//evil.test/events", "/events"],
    ["/login", "/events"],
    [undefined, "/events"],
  ])
    assert.equal(organizerReturnPath(input), expected);
});
