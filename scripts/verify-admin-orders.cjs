/* E2: kiểm tra URL, contract và race của query với QueryClient thật, API giả lập. */
const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const { QueryClient, QueryObserver } = require("@tanstack/react-query");

const root = path.resolve(__dirname, "..");
const tick = () => new Promise((resolve) => setImmediate(resolve));
function deferred() {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
}

function fixture(t) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  t.after(() => client.clear());
  const token = `header.${Buffer.from(JSON.stringify({ exp: Date.now() / 1000 + 3600 })).toString("base64url")}.signature`;
  const session = { user: { id: "9007199254740993", role: "STAFF" }, token };
  const useSession = (selector) => selector(session);
  useSession.getState = () => session;
  const http = { get: async () => { throw new Error("Cần mock GET cho ca này"); } };
  const mocks = {
    "@tanstack/react-query": { useQuery: (options) => options },
    "@/shared/auth/session.store": { useSession },
    "@/shared/api/client": { api: http },
  };
  const cache = new Map();
  function load(name, parent = path.join(root, "src", "index.ts")) {
    const target = name.startsWith("@/") ? path.join(root, "src", name.slice(2))
      : name.startsWith(".") ? path.resolve(path.dirname(parent), name) : null;
    const alias = target ? "@/" + path.relative(path.join(root, "src"), target).split(path.sep).join("/") : name;
    if (Object.hasOwn(mocks, alias)) return mocks[alias];
    if (!target) return require(name);
    const filename = target + ".ts";
    if (cache.has(filename)) return cache.get(filename).exports;
    const module = { exports: {} };
    cache.set(filename, module);
    const output = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
      compilerOptions: { target: ts.ScriptTarget.ES2023, module: ts.ModuleKind.CommonJS },
    }).outputText;
    new Function("require", "module", "exports", output)((specifier) => load(specifier, filename), module, module.exports);
    return module.exports;
  }
  const filters = load("@/features/admin/orders/filters");
  const params = filters.toAdminOrdersParams(filters.parseAdminOrdersFilters(new URLSearchParams()));
  const options = (next = params, enabled = true) => load("@/features/admin/orders/queries").useAdminOrders(next, enabled);
  return { client, session, token, http, load, filters, params, options };
}

function response(id, page = 0) {
  return { data: {
    content: [{ id, customerName: "Nguyễn An", customerEmail: null, totalPrice: 1500000,
      orderDate: "2026-11-19T01:00:00Z", orderStatus: "PENDING", paymentStatus: "UNPAID" }],
    page: { number: page, size: 10, totalElements: 21, totalPages: 3 },
  } };
}

test("URL sai được chuẩn hóa: enum, sort whitelist, size, page, tham số lạ/trùng", (t) => {
  const { filters: f } = fixture(t);
  for (const page of ["0", "-1", "abc", "1.5", "01", "2147483648", "99999999999999999999"]) {
    assert.equal(f.parseAdminOrdersFilters(new URLSearchParams({ page })).page, 1);
  }
  const parsed = f.parseAdminOrdersFilters(new URLSearchParams("orderStatus=BAD&paymentStatus=BAD&page=0&size=999&sortBy=orderDate&direction=bad&foo=bar&page=2"));
  assert.equal(f.serializeAdminOrdersFilters(parsed).toString(), "page=1&size=10&sortBy=createdAt&direction=desc");
  assert.equal(f.parseAdminOrdersFilters(new URLSearchParams("page=2147483647")).page, 2147483647);
});

test("URL round trip/Back/reload: giữ filters, page UI 2 → API 1, chỉ trim khi gửi", (t) => {
  const { filters: f } = fixture(t);
  const initial = new URLSearchParams("keyword=+Nguyễn+An+&orderStatus=PROCESSING&paymentStatus=PAID&page=2&size=20&sortBy=totalPrice&direction=asc");
  const parsed = f.parseAdminOrdersFilters(initial);
  assert.deepEqual(f.parseAdminOrdersFilters(f.serializeAdminOrdersFilters(parsed)), parsed);
  const params = f.toAdminOrdersParams(parsed);
  assert.equal(parsed.keyword, " Nguyễn An ");
  assert.equal(params.keyword, "Nguyễn An");
  assert.equal(params.page, 1);
  assert.equal(params.sortBy, "totalPrice");
});

test("API đúng endpoint/params/signal/token, normalize Spring Page, giữ ID string", async (t) => {
  const f = fixture(t);
  const signal = new AbortController().signal;
  f.http.get = async (url, config) => {
    assert.equal(url, "/api/admin/orders");
    assert.deepEqual(config.params, f.params);
    assert.equal(config.signal, signal);
    assert.deepEqual(config.meta, { authToken: f.token, noPublicRetry: true });
    return response("9007199254740999");
  };
  const page = await f.load("@/features/admin/orders/api").getAdminOrders(f.params, signal, f.token);
  assert.equal(page.items[0].id, "9007199254740999");
  assert.equal(page.items[0].customerEmail, null);
  assert.deepEqual({ ...page, items: [] }, { items: [], page: 0, size: 10, totalItems: 21, totalPages: 3 });
});

test("Query key theo user/role, không chứa token; disabled khi debounce/guest/customer/hết hạn", (t) => {
  const f = fixture(t);
  assert.deepEqual(f.options().queryKey, ["admin", f.session.user.id, "STAFF", "orders", "list", f.params]);
  assert.equal(JSON.stringify(f.options().queryKey).includes(f.token), false);
  assert.equal(f.options().enabled, true);
  assert.equal(f.options(f.params, false).enabled, false);
  for (const role of ["ADMIN", "MANAGER", "STAFF"]) {
    f.session.user.role = role;
    assert.equal(f.options().enabled, true);
  }
  f.session.user.role = "CUSTOMER";
  assert.equal(f.options().enabled, false);
  f.session.user.role = "STAFF";
  f.session.token = "expired";
  assert.equal(f.options().enabled, false);
  f.session.token = null;
  f.session.user = null;
  assert.equal(f.options().enabled, false);
});

test("Đổi user/token/role trước dispatch hoặc sau GET: không ghi cache dữ liệu phiên cũ", async (t) => {
  for (const change of [
    (session) => { session.user = { ...session.user, id: "other" }; },
    (session) => { session.token = "other-token"; },
    (session) => { session.user = { ...session.user, role: "MANAGER" }; },
    (session) => { session.user = null; session.token = null; },
  ]) {
    const f = fixture(t);
    const pending = deferred();
    let calls = 0;
    f.http.get = () => { calls++; return pending.promise; };
    const options = f.options();
    const result = f.client.fetchQuery(options);
    change(f.session);
    pending.resolve(response("1"));
    await assert.rejects(result, /Phiên quản trị đã thay đổi/);
    assert.equal(calls, 1);
    assert.equal(f.client.getQueryData(options.queryKey), undefined);
    await assert.rejects(options.queryFn({ signal: new AbortController().signal }), /Phiên quản trị đã thay đổi/);
    assert.equal(calls, 1);
  }
});

test("Tìm kiếm trả sai thứ tự: hủy signal cũ, observer/cache chỉ nhận kết quả đúng key", async (t) => {
  const f = fixture(t);
  const old = deferred();
  let oldSignal;
  f.http.get = async (_url, { params, signal }) => {
    if (params.keyword === "old") { oldSignal = signal; return old.promise; }
    return response("new");
  };
  const first = f.options({ ...f.params, keyword: "old" });
  const second = f.options({ ...f.params, keyword: "new" });
  const observer = new QueryObserver(f.client, first);
  const unsubscribe = observer.subscribe(() => {});
  t.after(unsubscribe);
  observer.setOptions(second);
  await tick();
  assert.equal(oldSignal.aborted, true);
  assert.equal(observer.getCurrentResult().data.items[0].id, "new");
  old.resolve(response("old"));
  await tick();
  assert.equal(observer.getCurrentResult().data.items[0].id, "new");
  assert.equal(f.client.getQueryData(first.queryKey), undefined);
});

test("Redirect STAFF về orders, giữ deep link/query/hash đúng quyền và chặn URL ngoài", (t) => {
  const f = fixture(t);
  const previousWindow = global.window;
  global.window = { location: { origin: "http://localhost:5173" } };
  t.after(() => { global.window = previousWindow; });
  const { getLoginDestination: destination } = f.load("@/shared/auth/redirect");
  assert.equal(destination("STAFF"), "/admin/orders");
  assert.equal(destination("ADMIN"), "/admin");
  assert.equal(destination("MANAGER"), "/admin");
  for (const role of ["ADMIN", "MANAGER", "STAFF"]) {
    assert.equal(destination(role, "/admin/orders?page=2#list"), "/admin/orders?page=2#list");
  }
  assert.equal(destination("CUSTOMER", "/admin/orders"), "/");
  assert.equal(destination("STAFF", "//evil.test/admin/orders"), "/admin/orders");
  assert.equal(destination("STAFF", "/account/orders/9007199254740993?page=2"), "/account/orders/9007199254740993?page=2");
});
