/* Chạy: node --test scripts/verify-admin-orders.cjs. Không cần backend thật. */
const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const axios = require("axios");
const { QueryClient, MutationObserver } = require("@tanstack/react-query");

const root = path.resolve(__dirname, "..");
const makeToken = (sub = "100", expOffsetSec = 3600) =>
  `header.${Buffer.from(JSON.stringify({ sub, exp: Math.floor(Date.now() / 1000) + expOffsetSec })).toString("base64url")}.signature`;

function memoryStorage() {
  const map = new Map();
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
  };
}

function createLoader(mocks = {}) {
  const cache = new Map();
  const localStorage = memoryStorage();
  const sessionStorage = memoryStorage();
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
      { location: { origin: "https://store.test" } },
      localStorage,
      sessionStorage,
    );
    return module.exports;
  }
  return load;
}

const sampleOrder = (overrides = {}) => ({
  id: "9007199254740993",
  orderStatus: "PENDING",
  paymentStatus: "UNPAID",
  paymentMethod: "COD",
  totalPrice: 500000,
  ...overrides,
});

test("Filters: parse, serialize và toAdminOrdersParams xử lý hợp lệ và biên", () => {
  const load = createLoader();
  const {
    parseAdminOrdersFilters,
    serializeAdminOrdersFilters,
    toAdminOrdersParams,
  } = load("@/features/admin/orders/filters");

  const parsed = parseAdminOrdersFilters(
    new URLSearchParams("keyword=DH01&orderStatus=SHIPPED&paymentStatus=PAID&page=3&size=20&sortBy=totalPrice&direction=asc"),
  );
  assert.deepEqual(parsed, {
    keyword: "DH01",
    orderStatus: "SHIPPED",
    paymentStatus: "PAID",
    page: 3,
    size: 20,
    sortBy: "totalPrice",
    direction: "asc",
  });

  const fallback = parseAdminOrdersFilters(
    new URLSearchParams("page=0&size=99&orderStatus=BAD&paymentStatus=BAD&sortBy=other&direction=weird"),
  );
  assert.deepEqual(fallback, {
    keyword: "",
    orderStatus: undefined,
    paymentStatus: undefined,
    page: 1,
    size: 10,
    sortBy: "createdAt",
    direction: "desc",
  });

  const overflow = parseAdminOrdersFilters(new URLSearchParams("page=99999999999999"));
  assert.equal(overflow.page, 1);

  const serialized = serializeAdminOrdersFilters({ ...parsed, keyword: "  DH01  " });
  assert.equal(serialized.get("orderStatus"), "SHIPPED");
  assert.equal(serialized.get("page"), "3");
  assert.equal(serialized.get("size"), "20");

  const minimalSerialized = serializeAdminOrdersFilters(fallback);
  assert.equal(minimalSerialized.has("keyword"), false);
  assert.equal(minimalSerialized.has("orderStatus"), false);
  assert.equal(minimalSerialized.has("paymentStatus"), false);

  const params = toAdminOrdersParams({ ...parsed, keyword: "  DH01  " });
  assert.equal(params.keyword, "DH01");
  assert.equal(params.page, 2);
});

test("OrderActions & Schemas: chuyển trạng thái theo từng bước và validate hủy đơn", () => {
  const load = createLoader();
  const {
    getNextFulfillmentStatus,
    canUpdateFulfillmentStatus,
    canCancelAdminOrder,
  } = load("@/features/admin/orders/orderActions");
  const {
    updateOrderStatusSchema,
    cancelAdminOrderSchema,
  } = load("@/features/admin/orders/schemas");

  assert.equal(getNextFulfillmentStatus("PENDING"), "PROCESSING");
  assert.equal(getNextFulfillmentStatus("PROCESSING"), "SHIPPED");
  assert.equal(getNextFulfillmentStatus("SHIPPED"), "DELIVERED");
  assert.equal(getNextFulfillmentStatus("DELIVERED"), undefined);
  assert.equal(getNextFulfillmentStatus("CANCELLED"), undefined);

  assert.equal(canUpdateFulfillmentStatus("PENDING", "PROCESSING"), true);
  assert.equal(canUpdateFulfillmentStatus("PENDING", "DELIVERED"), false);

  assert.equal(canCancelAdminOrder("PENDING"), true);
  assert.equal(canCancelAdminOrder("PROCESSING"), true);
  assert.equal(canCancelAdminOrder("SHIPPED"), false);
  assert.equal(canCancelAdminOrder("DELIVERED"), false);
  assert.equal(canCancelAdminOrder("CANCELLED"), false);

  assert.equal(updateOrderStatusSchema.safeParse({ newStatus: "PROCESSING" }).success, true);
  assert.equal(updateOrderStatusSchema.safeParse({ newStatus: "CANCELLED" }).success, false);
  assert.equal(updateOrderStatusSchema.safeParse({ newStatus: "PROCESSING", extra: 1 }).success, false);

  assert.deepEqual(cancelAdminOrderSchema.parse({ reason: "  Khách đổi ý  " }), { reason: "Khách đổi ý" });
  assert.equal(cancelAdminOrderSchema.safeParse({ reason: "   " }).success, false);
  assert.equal(cancelAdminOrderSchema.safeParse({ reason: "Hủy", extra: true }).success, false);
});

test("API: getAdminOrders, getAdminOrderDetail, updateAdminOrderStatus, cancelAdminOrder gửi đúng HTTP và Bearer", async () => {
  const load = createLoader({
    "@/shared/config/env": { env: { API_BASE_URL: "https://orders.test" } },
  });
  const { api } = load("@/shared/api/client");
  const orderApi = load("@/features/admin/orders/api");
  const token = makeToken();
  const calls = [];

  api.defaults.adapter = async (config) => {
    calls.push({
      method: config.method,
      url: config.url,
      params: config.params,
      data: config.data ? JSON.parse(config.data) : undefined,
      auth: config.headers.get("Authorization"),
    });
    if (config.url === "/api/admin/orders") {
      return {
        data: {
          content: [sampleOrder()],
          page: { number: 0, size: 10, totalElements: 1, totalPages: 1 },
        },
        status: 200,
        headers: {},
        config,
      };
    }
    return {
      data: sampleOrder({ orderStatus: config.url.endsWith("/cancel") ? "CANCELLED" : "PROCESSING" }),
      status: 200,
      headers: {},
      config,
    };
  };

  const controller = new AbortController();
  const page = await orderApi.getAdminOrders({ page: 0, size: 10, sortBy: "createdAt", direction: "desc", keyword: "" }, controller.signal, token);
  assert.equal(page.items.length, 1);
  assert.equal(page.totalItems, 1);

  const detail = await orderApi.getAdminOrderDetail("9007199254740993", controller.signal, token);
  assert.equal(detail.id, "9007199254740993");

  const updated = await orderApi.updateAdminOrderStatus("9007199254740993", { newStatus: "PROCESSING" }, token);
  assert.equal(updated.orderStatus, "PROCESSING");

  const cancelled = await orderApi.cancelAdminOrder("9007199254740993", { reason: "Hết hàng" }, token);
  assert.equal(cancelled.orderStatus, "CANCELLED");

  assert.equal(calls.length, 4);
  for (const call of calls) {
    assert.equal(call.auth, `Bearer ${token}`);
  }
  assert.deepEqual(calls.map((c) => `${c.method.toUpperCase()} ${c.url}`), [
    "GET /api/admin/orders",
    "GET /api/admin/orders/9007199254740993",
    "PUT /api/admin/orders/9007199254740993/status",
    "PUT /api/admin/orders/9007199254740993/cancel",
  ]);
});

function ordersQueryFixture(handlers = {}) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const token = makeToken("100");
  let current = { user: { id: "100", role: "MANAGER" }, token };
  const useSession = (select) => select(current);
  useSession.getState = () => current;

  const toasts = [];
  let mutationOptions;
  let queryOptions;
  const orderId = "9007199254740993";

  const load = createLoader({
    "@/shared/auth/session.store": { useSession },
    "@/features/admin/orders/api": {
      getAdminOrders: handlers.getAdminOrders ?? (async () => ({ items: [sampleOrder()], totalElements: 1, totalPages: 1, page: 0, size: 10 })),
      getAdminOrderDetail: handlers.getAdminOrderDetail ?? (async () => sampleOrder()),
      updateAdminOrderStatus: handlers.updateAdminOrderStatus ?? (async () => sampleOrder({ orderStatus: "PROCESSING" })),
      cancelAdminOrder: handlers.cancelAdminOrder ?? (async () => sampleOrder({ orderStatus: "CANCELLED" })),
    },
    "@tanstack/react-query": {
      ...require("@tanstack/react-query"),
      useQueryClient: () => queryClient,
      useIsMutating: () => 0,
      useQuery: (opts) => { queryOptions = opts; return opts; },
      useMutation: (opts) => { mutationOptions = opts; return { ...opts, isPending: false }; },
    },
    sonner: {
      toast: { success: (msg, opts) => toasts.push({ msg, opts }) },
    },
  });

  const queries = load("@/features/admin/orders/queries");
  return {
    queryClient,
    token,
    orderId,
    toasts,
    queries,
    ApiError: load("@/shared/api/errors").ApiError,
    setCurrent: (next) => { current = next; },
    getMutationOptions: () => mutationOptions,
    getQueryOptions: () => queryOptions,
    baseSession: () => ({ userId: "100", role: "MANAGER", token, expectedStatus: "PENDING" }),
  };
}

test("Queries: useAdminOrders & useAdminOrderDetail kiểm tra quyền, ID, abort và đổi phiên", async () => {
  let releaseDetail;
  const fixture = ordersQueryFixture({
    getAdminOrderDetail: () => new Promise((resolve) => { releaseDetail = resolve; }),
  });

  const listQuery = fixture.queries.useAdminOrders({ page: 0, size: 10, sortBy: "createdAt", direction: "desc", keyword: "" }, true);
  assert.equal(listQuery.enabled, true);
  const listRes = await listQuery.queryFn({ signal: new AbortController().signal });
  assert.equal(listRes.items.length, 1);

  assert.equal(fixture.queries.useAdminOrders({ page: 0, size: 10, sortBy: "createdAt", direction: "desc", keyword: "" }, false).enabled, false);

  const detailQuery = fixture.queries.useAdminOrderDetail(fixture.orderId);
  assert.equal(detailQuery.enabled, true);

  const invalidDetail = fixture.queries.useAdminOrderDetail("0");
  assert.equal(invalidDetail.enabled, false);
  await assert.rejects(invalidDetail.queryFn({ signal: new AbortController().signal }), (e) => e.status === 400);

  const aborted = new AbortController();
  aborted.abort();
  const pendingAborted = detailQuery.queryFn({ signal: aborted.signal });
  releaseDetail(sampleOrder());
  await assert.rejects(pendingAborted, (e) => e.name === "AbortError");

  const pendingSwitch = detailQuery.queryFn({ signal: new AbortController().signal });
  fixture.setCurrent({ user: { id: "200", role: "CUSTOMER" }, token: "other" });
  releaseDetail(sampleOrder());
  await assert.rejects(pendingSwitch, (e) => e.status === 401);

  fixture.queryClient.clear();
});

test("Queries: useUpdateAdminOrderStatus happy path, guards, busy 409, stale status và onError", async () => {
  let detailStatus = "PENDING";
  let updateResult = sampleOrder({ orderStatus: "PROCESSING" });
  let shouldFailUpdate = null;

  const fixture = ordersQueryFixture({
    getAdminOrderDetail: async () => sampleOrder({ orderStatus: detailStatus }),
    updateAdminOrderStatus: async () => {
      if (shouldFailUpdate) throw shouldFailUpdate;
      return updateResult;
    },
  });

  const dashKey = ["admin", "100", "MANAGER", "dashboard"];
  const reportsKey = ["admin", "100", "MANAGER", "reports"];
  fixture.queryClient.setQueryData(dashKey, { ok: true });
  fixture.queryClient.setQueryData(reportsKey, { ok: true });

  fixture.queries.useUpdateAdminOrderStatus(fixture.orderId);
  const opts = fixture.getMutationOptions();
  const observer = () => new MutationObserver(fixture.queryClient, opts);

  const res = await observer().mutate({ ...fixture.baseSession(), payload: { newStatus: "PROCESSING" } });
  assert.equal(res.orderStatus, "PROCESSING");
  assert.equal(fixture.toasts.length, 1);
  assert.equal(fixture.queryClient.getQueryState(dashKey).isInvalidated, true);
  assert.equal(fixture.queryClient.getQueryState(reportsKey).isInvalidated, true);

  // 400 invalid orderId
  fixture.queries.useUpdateAdminOrderStatus("invalid");
  await assert.rejects(
    new MutationObserver(fixture.queryClient, fixture.getMutationOptions()).mutate({ ...fixture.baseSession(), payload: { newStatus: "PROCESSING" } }),
    (e) => e.status === 400,
  );

  // Restore valid orderId
  fixture.queries.useUpdateAdminOrderStatus(fixture.orderId);
  const validOpts = fixture.getMutationOptions();

  // 400 invalid transition
  await assert.rejects(
    new MutationObserver(fixture.queryClient, validOpts).mutate({ ...fixture.baseSession(), expectedStatus: "PENDING", payload: { newStatus: "DELIVERED" } }),
    (e) => e.status === 400 && e.code === "INVALID_FULFILLMENT_TRANSITION",
  );

  // 409 stale status on reload
  detailStatus = "SHIPPED";
  await assert.rejects(
    new MutationObserver(fixture.queryClient, validOpts).mutate({ ...fixture.baseSession(), expectedStatus: "PENDING", payload: { newStatus: "PROCESSING" } }),
    (e) => e.status === 409,
  );
  detailStatus = "PENDING";

  // 0 wrong returned ID
  updateResult = sampleOrder({ id: "999", orderStatus: "PROCESSING" });
  await assert.rejects(
    new MutationObserver(fixture.queryClient, validOpts).mutate({ ...fixture.baseSession(), payload: { newStatus: "PROCESSING" } }),
    (e) => e.status === 0,
  );

  // onError reload on server 500
  shouldFailUpdate = new fixture.ApiError(500, "Server error");
  await assert.rejects(
    new MutationObserver(fixture.queryClient, validOpts).mutate({ ...fixture.baseSession(), payload: { newStatus: "PROCESSING" } }),
    (e) => e.status === 500,
  );

  // 401 session changed
  shouldFailUpdate = null;
  updateResult = sampleOrder({ orderStatus: "PROCESSING" });
  fixture.setCurrent({ user: { id: "999", role: "ADMIN" }, token: "other" });
  await assert.rejects(
    new MutationObserver(fixture.queryClient, validOpts).mutate({ ...fixture.baseSession(), payload: { newStatus: "PROCESSING" } }),
    (e) => e.status === 401,
  );

  fixture.queryClient.clear();
});

test("Queries: useCancelAdminOrder happy path (cả PENDING_REFUND), 403 STAFF, 409 busy, stale và invalid result", async () => {
  let detailStatus = "PENDING";
  let cancelResult = sampleOrder({ orderStatus: "CANCELLED", paymentStatus: "UNPAID" });
  let releaseCancel;
  let holdCancel = false;

  const fixture = ordersQueryFixture({
    getAdminOrderDetail: async () => sampleOrder({ orderStatus: detailStatus }),
    cancelAdminOrder: async () => {
      if (holdCancel) return new Promise((resolve) => { releaseCancel = resolve; });
      return cancelResult;
    },
  });

  const invKey = ["admin", "100", "MANAGER", "inventory"];
  const prodKey = ["products"];
  fixture.queryClient.setQueryData(invKey, []);
  fixture.queryClient.setQueryData(prodKey, []);

  fixture.queries.useCancelAdminOrder(fixture.orderId);
  const opts = fixture.getMutationOptions();
  const run = (vars = {}) => new MutationObserver(fixture.queryClient, opts).mutate({
    ...fixture.baseSession(),
    payload: { reason: "Khách hủy" },
    ...vars,
  });

  // Normal cancel
  await run();
  assert.equal(fixture.toasts.at(-1).msg, "Đã hủy đơn hàng.");
  assert.equal(fixture.queryClient.getQueryState(invKey).isInvalidated, true);
  assert.equal(fixture.queryClient.getQueryState(prodKey).isInvalidated, true);

  // PENDING_REFUND toast
  cancelResult = sampleOrder({ orderStatus: "CANCELLED", paymentStatus: "PENDING_REFUND" });
  await run();
  assert.match(fixture.toasts.at(-1).msg, /chờ hoàn tiền/);

  // 403 STAFF cannot cancel
  fixture.setCurrent({ user: { id: "100", role: "STAFF" }, token: fixture.token });
  await assert.rejects(run({ role: "STAFF" }), (e) => e.status === 403);
  fixture.setCurrent({ user: { id: "100", role: "MANAGER" }, token: fixture.token });

  // 400 invalid cancel status
  await assert.rejects(run({ expectedStatus: "SHIPPED" }), (e) => e.status === 400 && e.code === "INVALID_CANCEL_STATUS");

  // 409 stale status on reload
  detailStatus = "DELIVERED";
  await assert.rejects(run(), (e) => e.status === 409);
  detailStatus = "PENDING";

  // 0 when server returns non-CANCELLED
  cancelResult = sampleOrder({ orderStatus: "PENDING" });
  await assert.rejects(run(), (e) => e.status === 0);

  // 409 concurrent busy mutation
  holdCancel = true;
  const first = run();
  await new Promise((resolve) => setTimeout(resolve, 10));
  await assert.rejects(run(), (e) => e.status === 409 && e.code === "ORDER_ACTION_BUSY");
  releaseCancel(sampleOrder({ orderStatus: "CANCELLED" }));
  await first;

  fixture.queryClient.clear();
});
