/* D11: QueryClient/MutationObserver thật, API giả lập; không thay thế thử backend/browser. */
const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const { QueryClient, QueryObserver, MutationObserver } = require("@tanstack/react-query");

const root = path.resolve(__dirname, "..");
const productId = "9007199254740993";
const item = {
  id: "88", productId, productName: "Điện thoại", price: 12000000,
  primaryImageUrl: null, inStock: true, productStatus: "ACTIVE",
  addedAt: "2026-11-17T00:00:00Z",
};
const tick = () => new Promise((resolve) => setImmediate(resolve));

function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

function fixture(t) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  t.after(() => client.clear());
  const token = `header.${Buffer.from(JSON.stringify({ exp: Date.now() / 1000 + 3600 })).toString("base64url")}.signature`;
  const session = { user: { id: "100" }, token };
  const key = ["wishlist", "100"];
  const input = { userId: "100", token, productId, desired: true };
  const calls = [], messages = [], observers = [], promises = [], queries = [], navigations = [];
  const location = { pathname: "/products", search: "?page=2", hash: "#items" };
  let serverItems = [];
  const api = {
    get: async (...args) => { calls.push({ method: "GET", args }); return { data: serverItems }; },
    request: async (config) => {
      calls.push(config);
      serverItems = config.method === "POST" ? [item] : [];
      return { data: { message: "OK" } };
    },
  };
  const useSession = Object.assign((select) => select(session), { getState: () => session });
  const mocks = {
    "@/shared/api/client": { api },
    "@/shared/auth/session.store": { useSession },
    "react-router": {
      useLocation: () => location,
      useNavigate: () => (...args) => navigations.push(args),
      Link: ({ to, children, ...props }) => React.createElement("a", { ...props, href: to }, children),
    },
    "@tanstack/react-query": {
      useQueryClient: () => client,
      useQuery: (options) => {
        queries.push(options);
        return new QueryObserver(client, options).getOptimisticResult(options);
      },
      useMutation: (options) => {
        const observer = new MutationObserver(client, options);
        observers.push(observer);
        return { mutate: (value) => {
          const promise = observer.mutate(value);
          promises.push(promise);
          promise.catch(() => {});
        } };
      },
      useMutationState: ({ filters, select }) => client.getMutationCache().findAll(filters).map(select),
    },
    sonner: { toast: Object.fromEntries(["success", "error", "info"].map((kind) => [
      kind, (...args) => messages.push({ kind, args }),
    ])) },
  };
  const cache = new Map();
  function load(name, parent = path.join(root, "src", "index.ts")) {
    const target = name.startsWith("@/") ? path.join(root, "src", name.slice(2))
      : name.startsWith(".") ? path.resolve(path.dirname(parent), name) : null;
    if (Object.hasOwn(mocks, name)) return mocks[name];
    if (!target) return require(name);
    const alias = "@/" + path.relative(path.join(root, "src"), target).split(path.sep).join("/");
    if (Object.hasOwn(mocks, alias)) return mocks[alias];
    const filename = [target + ".ts", target + ".tsx", path.join(target, "index.ts")].find(fs.existsSync);
    if (!filename) throw new Error("Cannot load " + name);
    if (cache.has(filename)) return cache.get(filename).exports;
    const module = { exports: {} };
    cache.set(filename, module);
    const output = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
      compilerOptions: { target: ts.ScriptTarget.ES2023, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
      fileName: filename,
    }).outputText;
    new Function("require", "module", "exports", output)(
      (specifier) => load(specifier, filename), module, module.exports,
    );
    return module.exports;
  }
  client.setQueryData(key, []);
  const hooks = load("@/features/wishlist/queries");
  return { client, session, key, input, calls, messages, observers, promises, queries, navigations,
    location, api, mocks, load, hooks, setServer: (items) => { serverItems = items; } };
}

test("API keeps product IDs as strings, pins auth and passes AbortSignal", async (t) => {
  const f = fixture(t);
  const api = f.load("@/features/wishlist/api");
  const controller = new AbortController();
  await api.getWishlist(controller.signal, f.input.token);
  await api.setProductWishlist(productId, true, f.input.token);
  await api.setProductWishlist(productId, false, f.input.token);
  assert.equal(f.calls[0].args[0], "/api/wishlists");
  assert.equal(f.calls[0].args[1].signal, controller.signal);
  for (const config of [f.calls[0].args[1], ...f.calls.slice(1)]) {
    assert.deepEqual(config.meta, { authToken: f.input.token, noPublicRetry: true });
  }
  assert.equal(f.calls[1].url, `/api/wishlists/${productId}`);
  assert.equal(f.calls[1].method, "POST");
  assert.equal(f.calls[2].method, "DELETE");
  assert.equal(f.calls[1].data, undefined);
});

test("Private GET is disabled for guests and rejects a late response after session change", async (t) => {
  const f = fixture(t);
  f.session.token = null;
  f.session.user = null;
  assert.equal(f.hooks.useWishlistState().authenticated, false);
  assert.equal(f.queries.at(-1).enabled, false);
  f.session.token = f.input.token;
  f.session.user = { id: "100" };
  f.hooks.useWishlistState();
  const delayed = deferred();
  f.api.get = () => delayed.promise;
  const request = f.client.fetchQuery({ ...f.queries.at(-1), staleTime: 0 });
  f.session.user = { id: "200" };
  f.session.token = "changed";
  f.client.clear();
  delayed.resolve({ data: [item] });
  await assert.rejects(request);
  assert.equal(f.client.getQueryCache().getAll().length, 0);
});

test("Shared optimistic state updates two views, blocks rapid writes and waits for GET", async (t) => {
  const f = fixture(t);
  f.hooks.useWishlistState();
  const write = deferred(), read = deferred();
  f.api.request = (config) => { f.calls.push(config); return write.promise; };
  f.api.get = (...args) => { f.calls.push({ method: "GET", args }); return read.promise; };
  const first = f.hooks.useSetWishlist(), second = f.hooks.useSetWishlist();
  first.submit(f.input);
  second.submit({ ...f.input, productId: "42" });
  await tick();
  assert.equal(f.calls.length, 1);
  for (let view = 0; view < 2; view++) {
    const state = f.hooks.useWishlistState();
    assert.equal(state.productIds.has(productId), true);
    assert.equal(state.productIds.has("42"), false);
    assert.equal(state.busy, true);
  }
  assert.deepEqual(f.client.getQueryData(f.key), []);
  write.resolve({ data: { message: "OK" } });
  await tick();
  assert.equal(f.hooks.useWishlistState().busy, true);
  read.resolve({ data: [item] });
  await f.promises[0];
  assert.equal(f.hooks.useWishlistState().busy, false);
  assert.deepEqual(f.client.getQueryData(f.key), [item]);
});

test("Failed remove rolls back its overlay and preserves other products/accounts", async (t) => {
  const f = fixture(t);
  const other = { ...item, id: "89", productId: "42" };
  f.client.setQueryData(f.key, [item, other]);
  f.client.setQueryData(["wishlist", "200"], [other]);
  f.setServer([item, other]);
  f.hooks.useWishlistState();
  const delayed = deferred();
  f.api.request = () => delayed.promise;
  f.hooks.useSetWishlist().submit({ ...f.input, desired: false });
  await tick();
  assert.deepEqual([...f.hooks.useWishlistState().productIds], ["42"]);
  const { ApiError } = f.load("@/shared/api/errors");
  delayed.reject(new ApiError(500, "Server error"));
  await assert.rejects(f.promises[0]);
  assert.deepEqual([...f.hooks.useWishlistState().productIds], [productId, "42"]);
  assert.deepEqual(f.client.getQueryData(["wishlist", "200"]), [other]);
  assert.equal(f.client.getQueryState(["wishlist", "200"]).isInvalidated, false);
  assert.equal(f.messages.at(-1).kind, "error");
});

test("DELETE 404 converges by GET; POST 404 remains an error", async (t) => {
  const f = fixture(t);
  f.client.setQueryData(f.key, [item]);
  f.hooks.useWishlistState();
  const { ApiError } = f.load("@/shared/api/errors");
  f.api.request = async () => { throw new ApiError(404, "Not found"); };
  f.hooks.useSetWishlist().submit({ ...f.input, desired: false });
  await f.promises.at(-1);
  assert.deepEqual(f.client.getQueryData(f.key), []);
  assert.equal(f.messages.at(-1).kind, "success");
  f.hooks.useSetWishlist().submit(f.input);
  await assert.rejects(f.promises.at(-1));
  assert.equal(f.messages.at(-1).kind, "error");
});

test("Late mutation cannot restore cache, toast or refetch after account switch/logout", async (t) => {
  const f = fixture(t);
  f.hooks.useWishlistState();
  const delayed = deferred();
  f.api.request = (config) => { f.calls.push(config); return delayed.promise; };
  f.hooks.useSetWishlist().submit(f.input);
  await tick();
  f.session.user = { id: "200" };
  f.session.token = "changed";
  f.client.clear();
  delayed.resolve({ data: { message: "OK" } });
  await assert.rejects(f.promises[0]);
  assert.equal(f.calls.length, 1);
  assert.deepEqual(f.messages, []);
  assert.equal(f.client.getQueryCache().getAll().length, 0);
});

test("Changed session blocks dispatch before HTTP", async (t) => {
  const f = fixture(t);
  const { submit } = f.hooks.useSetWishlist();
  f.session.token = "changed";
  submit(f.input);
  await assert.rejects(f.promises[0]);
  // Handler của cây React cũ không được gửi cho user mới trước khi render lại.
  f.session.user = { id: "200" };
  f.session.token = f.input.token;
  submit({ ...f.input, userId: "200" });
  await assert.rejects(f.promises[1]);
  assert.deepEqual(f.calls, []);
  assert.deepEqual(f.messages, []);
});

test("Refetch failure keeps server data and offers retry without guessing membership", async (t) => {
  const f = fixture(t);
  f.hooks.useWishlistState();
  f.api.get = async () => { throw new Error("Offline"); };
  f.hooks.useSetWishlist().submit(f.input);
  await f.promises[0];
  const state = f.hooks.useWishlistState();
  assert.equal(state.query.isError, true);
  assert.equal(state.busy, false);
  const { WishlistToggleButton } = f.load("@/features/wishlist/components/WishlistToggleButton");
  const button = WishlistToggleButton({ productId, productName: item.productName });
  assert.equal(button.props["aria-pressed"], undefined);
  assert.match(button.props["aria-label"], /Tải lại/);
  assert.equal(button.props.disabled, false);
});

test("Guest prompt preserves return URL and does not submit wishlist intent", (t) => {
  const f = fixture(t);
  f.session.user = null;
  f.session.token = null;
  const { WishlistToggleButton } = f.load("@/features/wishlist/components/WishlistToggleButton");
  const button = WishlistToggleButton({ productId, productName: item.productName });
  button.props.onClick();
  assert.deepEqual(f.calls, []);
  assert.equal(f.messages[0].kind, "info");
  f.messages[0].args[1].action.onClick();
  assert.deepEqual(f.navigations, [["/login", { state: { from: f.location } }]]);
  assert.equal(button.props["aria-pressed"], undefined);
});

test("Wishlist UI handles empty, unavailable products and uses productId for the PDP", (t) => {
  const f = fixture(t);
  const { WishlistPage } = f.load("@/features/wishlist/pages/WishlistPage");
  const { WishlistCard } = f.load("@/features/wishlist/components/WishlistCard");
  const render = (Component, props) => renderToStaticMarkup(React.createElement(Component, props));
  assert.match(render(WishlistPage), /Bạn chưa có sản phẩm yêu thích/);
  const available = render(WishlistCard, { item });
  assert.match(available, new RegExp(`href="/products/${productId}"`));
  assert.equal((available.match(new RegExp(`href="/products/${productId}"`, "g")) ?? []).length, 3);
  assert.match(available, /aria-label="Xem chi tiết Điện thoại"/);
  assert.match(available, /<h2[^>]*><a[^>]*>Điện thoại<\/a><\/h2>/);
  assert.doesNotMatch(available, /href="\/products\/88"/);
  for (const unavailable of [{ ...item, inStock: false }, { ...item, productStatus: "INACTIVE" }]) {
    const html = render(WishlistCard, { item: unavailable });
    assert.match(html, /disabled=""/);
    assert.equal((html.match(new RegExp(`href="/products/${productId}"`, "g")) ?? []).length, 2);
    assert.doesNotMatch(html, /<a[^>]*>Chọn phiên bản<\/a>/);
    assert.match(html, /Yêu thích/);
  }
});

test("Login return allows catalog/account routes and rejects unsafe or invalid IDs", (t) => {
  const f = fixture(t);
  const previousWindow = global.window;
  global.window = { location: { origin: "http://localhost:5173" } };
  t.after(() => { global.window = previousWindow; });
  const { getLoginDestination } = f.load("@/shared/auth/redirect");
  for (const url of ["/account/wishlist", "/products?page=2#items", `/products/${productId}?ref=wish#buy`]) {
    assert.equal(getLoginDestination("CUSTOMER", url), url);
  }
  for (const url of ["//evil.example", "/\\evil.example", "https://evil.example/products", "/products/bad", "/products/9223372036854775808"]) {
    assert.equal(getLoginDestination("CUSTOMER", url), "/");
  }
});
