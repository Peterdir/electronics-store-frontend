const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const { QueryClient, MutationObserver } = require("@tanstack/react-query");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const { MemoryRouter } = require("react-router");

const src = path.resolve(__dirname, "../src");
const orderId = "9007199254740993";
const orderItemId = "9007199254740999";
const userId = "100";
const photo = new File(["test bytes"], "proof.png", { type: "image/png" });
const values = { quantity: 1, reason: "Sản phẩm bị lỗi hoặc không hoạt động", description: "", images: [photo] };

function fixture(t) {
  const client = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity } } });
  t.after(() => client.clear());
  const token = `header.${Buffer.from(JSON.stringify({ exp: Date.now() / 1000 + 3600 })).toString("base64url")}.signature`;
  const session = { token, user: { id: userId } };
  const useSession = (selector) => selector(session);
  useSession.getState = () => session;
  const order = {
    id: orderId, orderStatus: "DELIVERED", updatedAt: new Date().toISOString(),
    items: [{ id: orderItemId, productName: "Tai nghe", variantSku: "SKU1", quantity: 2 }],
  };
  const receipt = { ...values, id: "9223372036854775807", orderId, orderItemId, status: "PENDING",
    imageUrls: ["/uploads/returns/proof.png"], createdAt: order.updatedAt };
  const requests = [];
  const api = { post: async (...args) => { requests.push(args); return { data: receipt }; } };
  const mocks = {
    "@/shared/api/client": { api },
    "@/shared/auth/session.store": { useSession },
    "@/shared/config/env": { env: { API_BASE_URL: "" } },
    "@tanstack/react-query": {
      useQueryClient: () => client,
      useIsMutating: (filters) => client.isMutating(filters),
      useMutation(options) {
        const observer = new MutationObserver(client, options);
        return { mutateAsync: observer.mutate };
      },
    },
  };
  const modules = new Map();
  function load(name, parent = path.join(src, "main.tsx")) {
    if (Object.hasOwn(mocks, name)) return mocks[name];
    const base = name.startsWith("@/") ? path.join(src, name.slice(2))
      : name.startsWith(".") ? path.resolve(path.dirname(parent), name) : null;
    if (!base) return require(name);

    const filename = [base + ".ts", base + ".tsx"].find(fs.existsSync);
    if (!filename) throw new Error(`Module missing: ${name}`);
    if (modules.has(filename)) return modules.get(filename).exports;
    const module = { exports: {} };
    modules.set(filename, module);
    const { outputText } = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
      fileName: filename,
      compilerOptions: {
        target: ts.ScriptTarget.ES2023, module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
      },
    });
    new Function("require", "module", "exports", outputText)(
      (specifier) => load(specifier, filename), module, module.exports,
    );
    return module.exports;
  }

  const detailKey = ["orders", userId, "detail", orderId];
  const listKey = ["orders", userId, "list", { page: 0 }];
  const otherKey = ["orders", "200", "detail", orderId];
  client.setQueryData(detailKey, order);
  client.setQueryData(listKey, []);
  client.setQueryData(otherKey, order);
  return { api, client, detailKey, listKey, load, mocks, order, otherKey, receipt, requests, session, token };
}

test("Multipart preserves long IDs, encodes each file as images, and omits blank description", async (t) => {
  const f = fixture(t);
  const { createReturnRequest } = f.load("@/features/returns/api");
  const second = new File(["other bytes"], "extra.webp", { type: "image/webp" });
  await createReturnRequest({ ...values, orderItemId, images: [photo, second] }, f.token);
  const [endpoint, body, config] = f.requests[0];
  assert.equal(endpoint, "/api/return-requests");
  assert.equal(body.get("orderItemId"), orderItemId);
  assert.equal(body.get("quantity"), "1");
  assert.equal(body.get("reason"), values.reason);
  assert.equal(body.has("description"), false);
  assert.deepEqual(body.getAll("images").map((file) => file.name), [photo.name, second.name]);
  assert.deepEqual(config, { meta: { authToken: f.token, noPublicRetry: true } });

  const request = new Request("https://example.test/api/return-requests", { method: "POST", body });
  assert.match(request.headers.get("content-type"), /^multipart\/form-data; boundary=.+/);
  assert.equal(await (await request.formData()).getAll("images")[1].text(), "other bytes");
  await createReturnRequest({ ...values, orderItemId, description: "Mô tả thêm" }, f.token);
  assert.equal(f.requests[1][1].get("description"), "Mô tả thêm");
});

test("Schema enforces bought quantity, trimmed reason and image limits", (t) => {
  const f = fixture(t);
  const schema = f.load("@/features/returns/schemas").createReturnRequestSchema(2);
  assert.equal(schema.parse({ ...values, reason: "  Lỗi  " }).reason, "Lỗi");
  const limit = 5 * 1024 * 1024;
  const edge = new File([new Uint8Array(limit)], "edge.JPG", { type: "image/jpeg" });
  assert.equal(schema.safeParse({ ...values, quantity: 2, images: Array(5).fill(edge) }).success, true);
  for (const overrides of [
    { quantity: 0 }, { quantity: 3 }, { quantity: 1.5 }, { reason: "  " }, { images: [] },
    { images: Array(6).fill(photo) },
    { images: [new File([], "empty.png", { type: "image/png" })] },
    { images: [new File([new Uint8Array(limit + 1)], "large.png", { type: "image/png" })] },
    { images: [new File(["wrong MIME"], "wrong.png", { type: "text/plain" })] },
    { images: [new File(["unsupported"], "wrong.gif", { type: "image/gif" })] },
  ]) {
    assert.equal(schema.safeParse({ ...values, ...overrides }).success, false);
  }
});

test("Images are required only for faulty or damaged products, optional uploads remain validated", async (t) => {
  const f = fixture(t);
  const schema = f.load("@/features/returns/schemas").createReturnRequestSchema(2);
  const { returnReasons } = f.load("@/features/returns/reasons");
  for (const reason of returnReasons) {
    assert.equal(schema.safeParse({ ...values, reason: ` ${reason.label} `, images: [] }).success,
      !reason.requiresImages, reason.label);
  }
  const custom = { ...values, reason: "Tôi không còn nhu cầu sử dụng", images: [] };
  assert.equal(schema.safeParse(custom).success, true);
  assert.equal(schema.safeParse({ ...custom, images: Array(6).fill(photo) }).success, false);
  assert.equal(schema.safeParse({ ...custom,
    images: [new File(["invalid"], "file.gif", { type: "image/gif" })],
  }).success, false);

  await f.load("@/features/returns/api").createReturnRequest({ ...custom, orderItemId }, f.token);
  assert.equal(f.requests[0][1].get("reason"), custom.reason);
  assert.deepEqual(f.requests[0][1].getAll("images"), []);
});

test("Eligibility allows the seven-day boundary, blocks the next instant and orders in transit", (t) => {
  const f = fixture(t);
  const { getReturnEligibility } = f.load("@/features/returns/eligibility");
  const deadline = Date.parse(f.order.updatedAt) + 7 * 24 * 60 * 60 * 1000;
  assert.equal(getReturnEligibility(f.order, deadline).deadline, deadline);
  assert.match(getReturnEligibility(f.order, deadline + 1).error, /hết thời hạn/);
  assert.match(getReturnEligibility({ ...f.order, orderStatus: "SHIPPED" }).error, /đã giao/);
  assert.match(getReturnEligibility({ ...f.order, updatedAt: "invalid" }).error, /Không xác định/);
});

test("Return states allow other items while preserving the original deadline", (t) => {
  const f = fixture(t);
  const { getReturnEligibility } = f.load("@/features/returns/eligibility");
  const now = Date.now();
  for (const orderStatus of ["RETURN_REQUESTED", "RETURNED", "RETURN_REJECTED"]) {
    const order = { ...f.order, orderStatus, returnDeadline: new Date(now + 60_000).toISOString() };
    assert.equal(getReturnEligibility(order, now).deadline, now + 60_000);
    assert.match(getReturnEligibility({ ...order, returnDeadline: new Date(now - 1).toISOString() }, now).error, /hết thời hạn/);
  }
});

test("An item with an existing return cannot be submitted again", async (t) => {
  const f = fixture(t);
  f.client.setQueryData(f.detailKey, {
    ...f.order, orderStatus: "RETURN_REQUESTED",
    items: [{ ...f.order.items[0], returnStatus: "PENDING" }],
  });
  const { useCreateReturnRequest } = f.load("@/features/returns/queries");
  await assert.rejects(useCreateReturnRequest(orderId, orderItemId).submit(values), { status: 409 });
  assert.equal(f.requests.length, 0);
});

test("Order items show the existing return status and offer returns only for remaining items", (t) => {
  const f = fixture(t);
  const { OrderItems } = f.load("@/features/orders/components/OrderItems");
  const item = { ...f.order.items[0], thumbnailUrl: null, unitPrice: 100_000, subtotal: 200_000 };
  const html = renderToStaticMarkup(React.createElement(MemoryRouter, null,
    React.createElement(OrderItems, {
      items: [{ ...item, returnStatus: "PENDING" }, { ...item, id: "99", returnStatus: null }],
      returnOrderId: orderId,
      reviewableItemIds: new Set([orderItemId]),
    }),
  ));
  assert.match(html, /Yêu cầu trả hàng đang chờ xử lý/);
  assert.match(html, new RegExp(`returns/new\\?orderId=${orderId}&amp;orderItemId=99`));
  assert.doesNotMatch(html, new RegExp(`returns/new\\?orderId=${orderId}&amp;orderItemId=${orderItemId}`));
  assert.match(html, /Đánh giá/);
});

test("Submit blocks concurrent requests, leaves order status intact and refreshes only its account", async (t) => {
  const f = fixture(t);
  const { useCreateReturnRequest } = f.load("@/features/returns/queries");
  let finish;
  f.api.post = (...args) => {
    f.requests.push(args);
    return new Promise((resolve) => { finish = resolve; });
  };
  const first = useCreateReturnRequest(orderId, orderItemId);
  const second = useCreateReturnRequest(orderId, orderItemId);
  const pending = first.submit(values);
  await second.submit(values);
  await new Promise(setImmediate);
  assert.equal(f.requests.length, 1);
  finish({ data: f.receipt });
  await pending;
  assert.equal(f.client.getQueryData(f.detailKey).orderStatus, "DELIVERED");
  assert.equal(f.client.getQueryState(f.detailKey).isInvalidated, true);
  assert.equal(f.client.getQueryState(f.listKey).isInvalidated, true);
  assert.equal(f.client.getQueryState(f.otherKey).isInvalidated, false);
});

test("Submit rejects stale sessions, an item outside the order and an expired order before upload", async (t) => {
  const f = fixture(t);
  const { useCreateReturnRequest } = f.load("@/features/returns/queries");
  const stale = useCreateReturnRequest(orderId, orderItemId);
  f.session.user = { id: "200" };
  await assert.rejects(stale.submit(values), { status: 401 });
  f.session.user = { id: userId };
  await assert.rejects(useCreateReturnRequest(orderId, "9").submit(values), { status: 404 });
  f.client.setQueryData(f.detailKey, { ...f.order, updatedAt: "2000-01-01T00:00:00Z" });
  await assert.rejects(useCreateReturnRequest(orderId, orderItemId).submit(values), { status: 400 });
  assert.equal(f.requests.length, 0);
});

test("Late success after logout does not refill orders and network failure never retries", async (t) => {
  const f = fixture(t);
  const { useCreateReturnRequest } = f.load("@/features/returns/queries");
  const { ApiError } = f.load("@/shared/api/errors");
  let attempts = 0;
  f.api.post = async () => { attempts++; throw new ApiError(0, "Timeout"); };
  await assert.rejects(useCreateReturnRequest(orderId, orderItemId).submit(values), { status: 0 });
  assert.equal(attempts, 1);

  let finish;
  f.api.post = () => new Promise((resolve) => { finish = resolve; });
  const pending = useCreateReturnRequest(orderId, orderItemId).submit(values);
  await new Promise(setImmediate);
  f.session.token = null;
  f.session.user = null;
  f.client.clear();
  finish({ data: f.receipt });
  await assert.rejects(pending, { status: 401 });
  assert.equal(f.client.getQueryCache().getAll().length, 0);
});

test("Page handles incomplete URL, a mismatched item, duplicates and a receipt during refetch", (t) => {
  const f = fixture(t);
  let mutation = {};
  let orderQuery = { data: f.order, isSuccess: true, isFetchedAfterMount: true, fetchStatus: "idle" };
  f.mocks["@/features/orders/queries"] = {
    useOrderDetail(id, verifyOnMount) {
      assert.equal(id, orderId);
      assert.equal(verifyOnMount, true);
      return orderQuery;
    },
  };
  // Keep the real page and form while injecting each server outcome at the hook boundary.
  f.mocks["../queries"] = { useCreateReturnRequest: () => mutation };
  const { ApiError } = f.load("@/shared/api/errors");
  const { ReturnRequestPage } = f.load("@/features/returns/pages/ReturnRequestPage");
  const render = (query) => renderToStaticMarkup(React.createElement(MemoryRouter, {
    initialEntries: [`/account/returns/new?orderId=${orderId}${query}`],
  }, React.createElement(ReturnRequestPage)));
  assert.match(render(""), /Về danh sách đơn hàng/);
  assert.match(render("&orderItemId=9"), /Không tìm thấy sản phẩm trong đơn hàng này/);

  const selected = `&orderItemId=${orderItemId}`;
  assert.match(render(selected), /Gửi yêu cầu trả hàng/);
  const available = orderQuery;
  orderQuery = { ...available, fetchStatus: "fetching", isFetchedAfterMount: false };
  assert.match(render(selected), /Đang kiểm tra đơn hàng/);
  assert.match(render(selected), /<fieldset disabled=""/);
  orderQuery = { error: new ApiError(400, "You do not have permission to view this order.") };
  assert.match(render(selected), /Bạn không có quyền/);
  orderQuery = available;
  mutation = { error: new ApiError(409, "Duplicate") };
  assert.match(render(selected), /đã có yêu cầu trả hàng/);
  assert.doesNotMatch(render(selected), /type="submit"/);
  mutation = { receipt: f.receipt };
  f.order.orderStatus = "RETURNED";
  assert.match(render(selected), /Chờ xử lý/);
  assert.match(render(selected), /9223372036854775807/);
  assert.doesNotMatch(render(selected), /type="submit"/);
});

test("Login returns to the protected form with its query and hash intact", (t) => {
  const f = fixture(t);
  const previousWindow = globalThis.window;
  globalThis.window = { location: { origin: "https://example.test" } };
  t.after(() => { globalThis.window = previousWindow; });
  const { getLoginDestination } = f.load("@/shared/auth/redirect");
  const form = `/account/returns/new?orderId=${orderId}&orderItemId=${orderItemId}#form`;
  assert.equal(getLoginDestination("CUSTOMER", undefined, form), form);
  assert.equal(getLoginDestination("CUSTOMER", `//external.test${form}`), "/");
  assert.equal(getLoginDestination("CUSTOMER", "/account/returns/other"), "/");
});
