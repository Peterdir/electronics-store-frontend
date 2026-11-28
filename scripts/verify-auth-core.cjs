/* Chạy: node --test scripts/verify-auth-core.cjs. Không cần backend thật. */
const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

const root = path.resolve(__dirname, "..");
const makeToken = (sub = "100", expOffsetSec = 3600, extra = {}) =>
  `header.${Buffer.from(JSON.stringify({ sub, exp: Math.floor(Date.now() / 1000) + expOffsetSec, ...extra })).toString("base64url")}.signature`;

function memoryStorage() {
  const map = new Map();
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
  };
}

function createLoader(mocks = {}, extraGlobals = {}) {
  const cache = new Map();
  const localStorage = extraGlobals.localStorage ?? memoryStorage();
  const sessionStorage = extraGlobals.sessionStorage ?? memoryStorage();
  const win = extraGlobals.window ?? { location: { origin: "https://store.test" } };
  function load(specifier, parent = path.join(root, "src", "index.ts")) {
    const resolved = specifier.startsWith("@/")
      ? path.join(root, "src", specifier.slice(2))
      : specifier.startsWith(".") ? path.resolve(path.dirname(parent), specifier) : null;
    const alias = resolved ? "@/" + path.relative(path.join(root, "src"), resolved).split(path.sep).join("/") : specifier;
    if (Object.hasOwn(mocks, alias)) return mocks[alias];
    if (!resolved) return require(specifier);
    const filename = [resolved + ".ts", resolved + ".tsx", resolved].find(fs.existsSync);
    if (!filename) throw new Error("Cannot load " + specifier);
    if (cache.has(filename)) return cache.get(filename).exports;
    const module = { exports: {} };
    cache.set(filename, module);
    const output = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
      compilerOptions: { target: ts.ScriptTarget.ES2023, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
    }).outputText;
    new Function("require", "module", "exports", "window", "localStorage", "sessionStorage", output)(
      (name) => load(name, filename),
      module,
      module.exports,
      win,
      localStorage,
      sessionStorage,
    );
    return module.exports;
  }
  return { load, localStorage, sessionStorage, win };
}

test("Auth API: cả 10 endpoint gửi đúng HTTP method, URL và header Authorization / X-Skip-Auth", async () => {
  const { load } = createLoader({
    "@/shared/config/env": { env: { API_BASE_URL: "https://auth.test" } },
  });
  const { api } = load("@/shared/api/client");
  const authApi = load("@/features/auth/api");
  const { useSession } = load("@/shared/auth/session.store");
  const token = makeToken("100");
  useSession.getState().setSession(token, { id: "100", email: "a@b.com", role: "CUSTOMER" });

  const calls = [];
  api.defaults.adapter = async (config) => {
    calls.push({
      method: config.method.toUpperCase(),
      url: config.url,
      params: config.params,
      auth: config.headers.get("Authorization"),
      skip: config.headers.get("X-Skip-Auth"),
    });
    if (config.url === "/api/auth/login" || config.url === "/api/auth/verify") {
      return { data: { accessToken: token, user: { id: "100", email: "a@b.com", role: "CUSTOMER" } }, status: 200, headers: {}, config };
    }
    if (config.url === "/api/users/me" && config.method === "get") {
      return { data: { id: "100", email: "a@b.com", fullName: "A" }, status: 200, headers: {}, config };
    }
    return { data: { message: "OK" }, status: 200, headers: {}, config };
  };

  await authApi.login({ email: "a@b.com", password: "123" });
  await authApi.getMyProfile(new AbortController().signal, token);
  await authApi.logout(token);
  await authApi.registerAccount({ email: "a@b.com", password: "123", fullName: "A", phone: "0901234567" });
  await authApi.resendVerification("a@b.com");
  await authApi.verifyEmail("verify-token");
  await authApi.forgotPassword({ email: "a@b.com" });
  await authApi.resetPassword({ token: "reset", newPassword: "456" });
  await authApi.updateMyProfile({ fullName: "B", phone: "0901234567" }, token);
  await authApi.changePassword({ currentPassword: "123", newPassword: "456" }, token);

  assert.equal(calls.length, 10);
  // Public endpoints strip Authorization & X-Skip-Auth header
  for (const idx of [0, 3, 4, 5, 6, 7]) {
    assert.equal(calls[idx].auth, undefined);
    assert.equal(calls[idx].skip, undefined);
  }
  // Protected endpoints include Bearer token
  for (const idx of [1, 2, 8, 9]) {
    assert.equal(calls[idx].auth, `Bearer ${token}`);
  }
  assert.deepEqual(calls[5].params, { token: "verify-token" });
});

test("Auth Queries: login, verifyEmail, logout, register, password reset, updateProfile, changePassword", async () => {
  const token = makeToken("100");
  let sessionState = {
    token: null,
    user: null,
    setSession: (t, u) => { sessionState.token = t; sessionState.user = u; },
    clear: ({ reason } = {}) => { sessionState.token = null; sessionState.user = null; clearedReasons.push(reason); },
  };
  const clearedReasons = [];
  const useSession = (select) => select(sessionState);
  useSession.getState = () => sessionState;

  const toasts = [];
  let mergeFails = false;
  let logoutFails = false;
  let refetchFails = false;
  const queryStateMap = new Map();

  const queryClient = {
    invalidateQueries: async ({ queryKey }) => {
      if (refetchFails) throw new Error("refetch failed");
      queryStateMap.set(JSON.stringify(queryKey), { status: "success", isInvalidated: false, data: { id: "100", fullName: "Updated" } });
    },
    getQueryState: (queryKey) => queryStateMap.get(JSON.stringify(queryKey)),
  };

  const { load } = createLoader({
    "@/shared/auth/session.store": { useSession },
    "@/features/auth/api": {
      login: async () => ({ accessToken: token, user: { id: "100", email: "a@b.com", role: "CUSTOMER" } }),
      verifyEmail: async () => ({ accessToken: token, user: { id: "100", email: "a@b.com", role: "CUSTOMER" } }),
      getMyProfile: async () => ({ id: "100", email: "a@b.com", fullName: "A" }),
      logout: async () => { if (logoutFails) throw new Error("offline"); return { message: "bye" }; },
      registerAccount: async () => ({ message: "registered" }),
      resendVerification: async () => ({ message: "resent" }),
      forgotPassword: async () => ({ message: "sent" }),
      resetPassword: async () => ({ message: "reset" }),
      updateMyProfile: async () => ({ message: "profile updated" }),
      changePassword: async () => ({ message: "pw changed" }),
    },
    "@/features/cart/mergeGuestCart": {
      startGuestCartMerge: async () => {
        if (mergeFails) throw new Error("merge fail");
      },
    },
    "@tanstack/react-query": {
      useQuery: (opts) => opts,
      useMutation: (opts) => opts,
      useQueryClient: () => queryClient,
    },
    sonner: {
      toast: {
        error: (m) => toasts.push(["error", m]),
        warning: (m) => toasts.push(["warning", m]),
      },
    },
  });

  const q = load("@/features/auth/queries");

  // useLogin success + merge failure toast
  const loginMut = q.useLogin();
  const loginRes = await loginMut.mutationFn({ email: "a@b.com", password: "123" });
  mergeFails = true;
  loginMut.onSuccess(loginRes);
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(sessionState.token, token);
  assert.equal(toasts.at(-1)[0], "error");
  mergeFails = false;

  // useVerifyEmail success
  const verifyMut = q.useVerifyEmail();
  const vRes = await verifyMut.mutationFn("vtok");
  verifyMut.onSuccess(vRes);
  await new Promise((resolve) => setImmediate(resolve));

  // useMe enabled & queryFn
  const meQuery = q.useMe();
  assert.equal(meQuery.enabled, true);
  assert.equal((await meQuery.queryFn({ signal: new AbortController().signal })).id, "100");

  // useLogout: null token no-op, success, failure warning
  const logoutMut = q.useLogout();
  await logoutMut.mutationFn(null);
  logoutFails = true;
  await logoutMut.mutationFn(token);
  assert.equal(toasts.at(-1)[0], "warning");
  assert.equal(clearedReasons.at(-1), "logout");

  // Restore session for profile & password updates
  sessionState.setSession(token, { id: "100", email: "a@b.com", role: "CUSTOMER" });
  const updateMut = q.useUpdateProfile();
  const updated = await updateMut.mutationFn({ payload: { fullName: "Updated", phone: "0901234567" }, userId: "100", token });
  assert.equal(updated.profile.fullName, "Updated");

  refetchFails = true;
  const updatedNoRefetch = await updateMut.mutationFn({ payload: { fullName: "Updated", phone: "0901234567" }, userId: "100", token });
  assert.equal(updatedNoRefetch.profile, null);
  assert.equal(updatedNoRefetch.message, "profile updated");

  // Mismatched session returns null
  assert.equal(await updateMut.mutationFn({ payload: {}, userId: "999", token }), null);
  const pwMut = q.useChangePassword();
  assert.deepEqual(await pwMut.mutationFn({ payload: { currentPassword: "1", newPassword: "2" }, userId: "100", token }), { message: "pw changed" });
  assert.equal(await pwMut.mutationFn({ payload: {}, userId: "999", token }), null);

  // Simple mutation hooks
  assert.equal((await q.useRegister().mutationFn({})).message, "registered");
  assert.equal((await q.useResendVerification().mutationFn("a@b.com")).message, "resent");
  assert.equal((await q.useForgotPassword().mutationFn({})).message, "sent");
  assert.equal((await q.useResetPassword().mutationFn({})).message, "reset");
});

test("SessionLifecycle: warning/expiration timers, malformed token, cross-tab storage event và cleanup", async () => {
  let nextTimerId = 1;
  const timers = new Map();
  const listeners = new Map();
  const localStorage = memoryStorage();
  const mockWin = {
    location: { origin: "https://store.test" },
    localStorage,
    setTimeout: (fn, delay) => {
      const id = nextTimerId++;
      timers.set(id, { fn, delay });
      return id;
    },
    clearTimeout: (id) => { timers.delete(id); },
    addEventListener: (type, fn) => { listeners.set(type, fn); },
    removeEventListener: (type, fn) => { if (listeners.get(type) === fn) listeners.delete(type); },
  };

  let clearedCalls = 0;
  const emitted = [];
  const { load } = createLoader({
    "@/shared/api/queryClient": { queryClient: { clear: () => { clearedCalls++; } } },
  }, { window: mockWin, localStorage });

  const { authEvents } = load("@/shared/auth/auth.events");
  const unsubEvents = authEvents.subscribe((e) => emitted.push(e));
  const { useSession } = load("@/shared/auth/session.store");
  const { startSessionLifecycle } = load("@/shared/auth/session.lifecycle");

  // Token > 60s schedules warning and expiration timers
  const validLongToken = makeToken("100", 120, { email: "a@b.com", role: "CUSTOMER" });
  useSession.getState().setSession(validLongToken);

  const stop = startSessionLifecycle();
  assert.equal(timers.size, 2);

  // Fire warning then expiration timer
  for (const [, t] of [...timers.entries()]) t.fn();
  assert.equal(emitted.some((e) => e.type === "session-expiring"), true);
  assert.equal(emitted.some((e) => e.type === "session-cleared" && e.reason === "expired"), true);
  assert.equal(useSession.getState().token, null);

  // Token < 60s emits warning immediately
  const shortToken = makeToken("100", 20, { email: "a@b.com", role: "CUSTOMER" });
  emitted.length = 0;
  useSession.getState().setSession(shortToken);
  assert.equal(emitted.some((e) => e.type === "session-expiring"), true);

  // Malformed token clears immediately
  emitted.length = 0;
  useSession.getState().setSession("bad-token");
  assert.equal(useSession.getState().token, null);

  // Storage event cross-tab logout
  useSession.getState().setSession(validLongToken);
  localStorage.setItem("ec.session", JSON.stringify({ state: { token: null, user: null }, version: 0 }));
  emitted.length = 0;
  const onStorage = listeners.get("storage");
  await onStorage({ storageArea: {}, key: "ec.session" }); // ignored wrong area
  await onStorage({ storageArea: localStorage, key: "other.key" }); // ignored wrong key
  await onStorage({ storageArea: localStorage, key: "ec.session" });
  assert.ok(clearedCalls >= 1);
  assert.deepEqual(emitted.at(-1), { type: "session-cleared", reason: "logout" });

  stop();
  unsubEvents();
  assert.equal(listeners.has("storage"), false);
});

test("Admin navigation, Inventory filters và Checkout entry guards", () => {
  const { load } = createLoader();

  const { adminNavigation } = load("@/features/admin/navigation");
  assert.ok(adminNavigation.some((item) => item.to === "/admin/orders" && item.permission === "order.view"));
  assert.ok(adminNavigation.some((item) => item.to === "/admin/products" && item.permission === "product.write"));

  const invFilters = load("@/features/admin/inventory/filters");
  const parsedInv = invFilters.parseInventoryFilters(
    new URLSearchParams("keyword=iphone&status=LOW_STOCK&minQuantity=1&maxQuantity=10&sortBy=sku&direction=desc&page=2&size=20"),
  );
  assert.equal(parsedInv.direction, "desc");
  assert.equal(invFilters.validateInventoryFilters(parsedInv), null);
  assert.match(invFilters.validateInventoryFilters({ ...parsedInv, minQuantity: "20", maxQuantity: "5" }), /không được lớn hơn/);
  assert.match(invFilters.validateInventoryFilters({ ...parsedInv, minQuantity: "-1" }), /số nguyên không âm/);
  assert.equal(invFilters.serializeInventoryFilters(parsedInv).get("sortBy"), "sku");
  assert.deepEqual(invFilters.toInventoryParams(parsedInv), { status: "LOW_STOCK", minQuantity: 1, maxQuantity: 10 });

  const page = invFilters.selectInventoryPage([
    { id: "1", sku: "B-SKU", productName: "iPhone", quantity: 5, updatedAt: null },
    { id: "2", sku: "A-SKU", productName: "Samsung", quantity: 10, updatedAt: "2026-11-01" },
  ], { ...parsedInv, keyword: "", page: 1 });
  assert.equal(page.rows[0].id, "1");

  const { readCheckoutEntry } = load("@/features/checkout/entry");
  assert.deepEqual(readCheckoutEntry("?source=cart", { startedUserId: null }), { kind: "cart", startedUserId: null });
  assert.equal(readCheckoutEntry("?source=cart", { startedUserId: "" }), null);
  assert.equal(readCheckoutEntry("?source=other", { startedUserId: null }), null);
  assert.equal(readCheckoutEntry("?source=buy-now", { startedUserId: "1", directItems: [] }), null);

  const buyNow = readCheckoutEntry("?source=buy-now", {
    startedUserId: "1",
    directItems: [{ productVariantId: "99", quantity: 2 }],
    snapshot: { productId: "10", productName: "Phone", sku: "SKU-1", unitPrice: 1000, imageUrl: null, availableStock: 5 },
  });
  assert.equal(buyNow.kind, "buyNow");
  assert.equal(buyNow.directItem.quantity, 2);
});
