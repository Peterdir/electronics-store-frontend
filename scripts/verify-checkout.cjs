/* Kiểm tra logic C10/C12 bằng Node, không cài thêm test framework hoặc gọi backend. */
const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const axios = require("axios");
const { QueryClient, QueryObserver, focusManager, onlineManager } = require("@tanstack/react-query");

const root = path.resolve(__dirname, "..");
const token = (subject = "user-1", expires = Date.now() + 60_000) =>
  `header.${Buffer.from(JSON.stringify({ sub: subject, exp: expires / 1000 })).toString("base64url")}.signature`;

function memoryStorage() {
  const data = new Map();
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, String(value)),
    removeItem: (key) => data.delete(key),
  };
}

function fixture() {
  const localStorage = memoryStorage();
  const sessionStorage = memoryStorage();
  const state = {
    token: null,
    user: null,
    clear() { state.token = null; state.user = null; },
  };
  const useSession = { getState: () => state };
  const mergeState = { isMerging: false, attempts: [], dropVariant() {}, clearAttempts() {} };
  const invalidations = [];
  const queryClient = { invalidateQueries: async (options) => { invalidations.push(options); } };
  const mocks = {
    "@/shared/auth/session.store": { useSession },
    "@/shared/config/env": { env: { API_BASE_URL: "https://checkout.test", BACKEND_ORIGIN: "https://checkout.test" } },
    "@/features/cart/cartMerge.store": { useCartMerge: { getState: () => mergeState } },
    "@tanstack/react-query": { useMutation: (options) => options, useQuery: (options) => options, useQueryClient: () => queryClient },
  };
  const cache = new Map();
  function load(specifier, parent = path.join(root, "src", "index.ts")) {
    const resolved = specifier.startsWith("@/")
      ? path.join(root, "src", specifier.slice(2))
      : specifier.startsWith(".") ? path.resolve(path.dirname(parent), specifier) : null;
    if (Object.hasOwn(mocks, specifier)) return mocks[specifier];
    if (resolved) {
      const alias = "@/" + path.relative(path.join(root, "src"), resolved).split(path.sep).join("/");
      if (Object.hasOwn(mocks, alias)) return mocks[alias];
    }
    if (!resolved) return require(specifier);
    const filename = fs.existsSync(resolved + ".ts") ? resolved + ".ts" : resolved;
    if (cache.has(filename)) return cache.get(filename).exports;
    const module = { exports: {} };
    cache.set(filename, module);
    const output = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
      compilerOptions: { target: ts.ScriptTarget.ES2023, module: ts.ModuleKind.CommonJS },
    }).outputText;
    new Function("require", "module", "exports", "window", "localStorage", "sessionStorage", output)(
      (name) => load(name, filename), module, module.exports,
      { location: { origin: "https://store.test" } }, localStorage, sessionStorage,
    );
    return module.exports;
  }
  function login() {
    state.token = token();
    state.user = { id: "user-1" };
    return { userId: state.user.id, token: state.token };
  }
  return { load, state, login, sessionStorage, queryClient, invalidations };
}

const item = { productVariantId: "987654321012345678", quantity: 2 };
const address = { recipientName: " Nguyễn Văn A ", recipientPhone: "0901234567", shippingAddress: " 12 Nguyễn Huệ, TP.HCM " };
const input = (source, selected = address) => ({ source, address: selected, shippingMethod: "EXPRESS", paymentMethod: "COD", couponCode: " SAVE ", contactEmail: " buyer@example.com " });
const order = (guest = true) => ({
  orderId: "987654321012345679", ...address, subtotal: 200_000, shippingFee: 55_000,
  discountAmount: 10_000, totalPrice: 245_000, couponCode: "SAVE", orderStatus: "PENDING",
  paymentStatus: "UNPAID", paymentMethod: "COD", createdAt: "2026-11-05T03:00:00Z",
  items: [{ id: "987654321012345680", variantId: item.productVariantId, productName: "Sản phẩm", variantSku: "SKU-1", unitPrice: 100_000, quantity: 2, subtotal: 200_000 }],
  message: "Order placed successfully!", isGuestOrder: guest,
});
const guestItem = (variantId, quantity) => ({
  variantId, quantity, snapshot: { productId: "1", name: "Sản phẩm", sku: "SKU", price: 100_000, image: null, attributes: null, stock: 20 },
});

test("Payload: bốn luồng COD, ID string, đúng địa chỉ và bỏ trường rỗng", () => {
  const { load } = fixture();
  const { buildCheckoutRequest: build } = load("@/features/checkout/buildCheckoutRequest");
  const sources = [{ kind: "guestCart", items: [item] }, { kind: "userCart" }, { kind: "buyNow", item }, { kind: "buyNow", item }];
  sources.forEach((source, index) => {
    const payload = build(input(source, index === 1 || index === 3 ? { addressId: "987654321012345681" } : address));
    assert.equal(payload.couponCode, "SAVE");
    assert.equal(payload.contactEmail, "buyer@example.com");
    if (source.kind === "userCart") assert.equal(Object.hasOwn(payload, "directItems"), false);
    else assert.deepEqual(payload.directItems, [item]);
    assert.equal(Object.hasOwn(payload, "totalPrice"), false);
    assert.equal(Object.hasOwn(payload, "recipientName"), index !== 1 && index !== 3);
  });
  const minimal = build({ ...input(sources[0]), couponCode: " ", contactEmail: " " });
  assert.equal(Object.hasOwn(minimal, "couponCode"), false);
  assert.equal(Object.hasOwn(minimal, "contactEmail"), false);
  assert.equal(minimal.recipientName, "Nguyễn Văn A");
  assert.throws(() => build(input({ kind: "guestCart", items: [] })));
  assert.throws(() => build({ ...input(sources[0]), paymentMethod: "INVALID" }));
  assert.throws(() => build({ ...input(sources[0]), contactEmail: "invalid" }));
  assert.throws(() => build(input({ kind: "buyNow", item: { ...item, quantity: 0 } })));
});

test("Guest cleanup giữ hàng thêm trong lúc chờ và các variant khác", () => {
  const { load } = fixture();
  const { useGuestCart } = load("@/features/cart/guestCart.store");
  useGuestCart.getState().add(guestItem(item.productVariantId, 2));
  useGuestCart.getState().add(guestItem(item.productVariantId, 3));
  useGuestCart.getState().add(guestItem("2", 1));
  useGuestCart.getState().consumePurchased([item]);
  assert.deepEqual(useGuestCart.getState().items.map(({ variantId, quantity }) => [variantId, quantity]), [[item.productVariantId, 3], ["2", 1]]);
  useGuestCart.getState().consumePurchased([{ productVariantId: "2", quantity: 1 }]);
  assert.equal(useGuestCart.getState().items.length, 1);
});

test("Confirmation kiểm tra orderId, userId, schema, storage lỗi và dữ liệu hỏng", () => {
  const { load, sessionStorage } = fixture();
  const storage = load("@/features/checkout/confirmation.storage");
  const response = order();
  assert.equal(storage.saveConfirmation(response, null), true);
  assert.equal(storage.readConfirmation(response.orderId, null).order.totalPrice, 245_000);
  assert.equal(storage.readConfirmation(response.orderId, "other-user"), null);
  assert.equal(storage.parseConfirmation({ userId: null, order: response }, "wrong-id", null), null);
  assert.equal(storage.parseConfirmation({ userId: null, order: { ...response, totalPrice: "fake" } }, response.orderId, null), null);
  sessionStorage.setItem(`ec.checkout.confirmation.${response.orderId}`, "broken-json");
  assert.equal(storage.readConfirmation(response.orderId, null), null);
  sessionStorage.setItem = () => { throw new Error("Storage disabled"); };
  assert.equal(storage.saveConfirmation(response, null), false);
});

test("API chặn đổi/hết phiên ngay lúc dispatch; không gửi đơn dưới tài khoản khác", async () => {
  const { load, state, login } = fixture();
  const { api } = load("@/shared/api/client");
  const { placeOrder } = load("@/features/checkout/api");
  const session = login();
  let requests = 0;
  api.defaults.adapter = async (config) => { requests++; return { data: order(false), status: 200, statusText: "OK", headers: {}, config }; };
  const pending = placeOrder({}, session);
  state.token = token("user-2");
  state.user = { id: "user-2" };
  await assert.rejects(pending, (error) => error.status === 401);
  assert.equal(requests, 0);
  state.token = token("user-1", Date.now() - 1_000);
  state.user = { id: "user-1" };
  await assert.rejects(placeOrder({}, { userId: "user-1", token: state.token }), (error) => error.status === 401);
  assert.equal(requests, 0);
});

test("API 401/timeout không retry; guest gửi không kèm Authorization", async () => {
  const { load, login } = fixture();
  const { api } = load("@/shared/api/client");
  const { placeOrder } = load("@/features/checkout/api");
  const session = login();
  let requests = 0;
  api.defaults.adapter = async (config) => {
    requests++;
    const response = { data: { message: "Expired" }, status: 401, statusText: "Unauthorized", headers: {}, config };
    throw new axios.AxiosError("Expired", "ERR_BAD_REQUEST", config, null, response);
  };
  await assert.rejects(placeOrder({}, session), (error) => error.status === 401);
  assert.equal(requests, 1);
  api.defaults.adapter = async (config) => {
    requests++;
    assert.equal(config.headers.get("Authorization"), undefined);
    throw new axios.AxiosError("Timeout", "ECONNABORTED", config);
  };
  await assert.rejects(placeOrder({}, { userId: null, token: null }), (error) => error.status === 0);
  assert.equal(requests, 2);
});

test("Mutation: COD/VNPAY cleanup đúng nguồn và cập nhật lịch sử của user, không retry hoặc xếp hàng offline", async () => {
  for (const [kind, paymentMethod] of ["guestCart", "userCart", "buyNowGuest", "buyNowUser"].flatMap(
    (kind) => ["COD", "VNPAY"].map((method) => [kind, method]),
  )) {
    const env = fixture();
    const session = kind === "userCart" || kind === "buyNowUser" ? env.login() : { userId: null, token: null };
    const source = kind.startsWith("buyNow") ? { kind: "buyNow", item } : kind === "userCart" ? { kind } : { kind, items: [item] };
    const { useGuestCart } = env.load("@/features/cart/guestCart.store");
    useGuestCart.getState().add(guestItem(item.productVariantId, 2));
    const { api } = env.load("@/shared/api/client");
    api.defaults.adapter = async (config) => ({
      data: {
        ...order(session.userId === null),
        paymentMethod,
        paymentUrl: paymentMethod === "VNPAY" ? `/api/payments/vnpay/create?orderId=${order().orderId}` : null,
      },
      status: 200, statusText: "OK", headers: {}, config,
    });
    const mutation = env.load("@/features/checkout/queries").usePlaceOrder();
    const payload = env.load("@/features/checkout/buildCheckoutRequest").buildCheckoutRequest({ ...input(source), paymentMethod });
    const result = await mutation.mutationFn({ payload, source, session });
    assert.equal(mutation.retry, false);
    assert.equal(mutation.networkMode, "always");
    assert.equal(result.confirmation.order.totalPrice, 245_000);
    assert.equal(result.confirmation.order.paymentMethod, paymentMethod);
    assert.equal(env.load("@/features/checkout/confirmation.storage").readConfirmation(order().orderId, session.userId).order.paymentMethod, paymentMethod);
    assert.equal(useGuestCart.getState().items.length, kind === "guestCart" ? 0 : 1);
    const expectedInvalidations = [];
    if (session.userId) {
      expectedInvalidations.push({
        queryKey: ["orders", session.userId, "list"],
        refetchType: "none",
      });
    }
    if (kind === "userCart") {
      expectedInvalidations.push({
        queryKey: ["cart", session.userId],
        exact: true,
        refetchType: "none",
      });
    }
    assert.deepEqual(env.invalidations, expectedInvalidations);
  }
});

test("Mutation: nhấn lặp chỉ gửi một POST, lỗi không xóa giỏ", async () => {
  const env = fixture();
  const { api } = env.load("@/shared/api/client");
  const { useGuestCart } = env.load("@/features/cart/guestCart.store");
  useGuestCart.getState().add(guestItem(item.productVariantId, 2));
  let rejectRequest;
  let requests = 0;
  api.defaults.adapter = (config) => {
    requests++;
    return new Promise((_, reject) => { rejectRequest = () => reject(new axios.AxiosError("Invalid coupon", "ERR_BAD_REQUEST", config, null, { status: 400, data: { message: "Invalid coupon" }, config })); });
  };
  const mutation = env.load("@/features/checkout/queries").usePlaceOrder();
  const source = { kind: "guestCart", items: [item] };
  const args = { source, session: { userId: null, token: null }, payload: env.load("@/features/checkout/buildCheckoutRequest").buildCheckoutRequest(input(source)) };
  const pending = mutation.mutationFn(args);
  await assert.rejects(mutation.mutationFn(args), /đang được xử lý/);
  rejectRequest();
  await assert.rejects(pending, /Invalid coupon/);
  assert.equal(requests, 1);
  assert.equal(useGuestCart.getState().items[0].quantity, 2);
});

test("Response đến sau đổi phiên không lưu xác nhận hoặc dọn giỏ phiên mới", async () => {
  const env = fixture();
  const { api } = env.load("@/shared/api/client");
  let resolveResponse;
  api.defaults.adapter = (config) => new Promise((resolve) => {
    resolveResponse = () => resolve({ data: order(), status: 200, statusText: "OK", headers: {}, config });
  });
  const mutation = env.load("@/features/checkout/queries").usePlaceOrder();
  const source = { kind: "guestCart", items: [item] };
  const { useGuestCart } = env.load("@/features/cart/guestCart.store");
  useGuestCart.getState().add(guestItem(item.productVariantId, 2));
  const pending = mutation.mutationFn({ payload: env.load("@/features/checkout/buildCheckoutRequest").buildCheckoutRequest(input(source)), source, session: { userId: null, token: null } });
  // Chờ adapter bắt đầu, sau đó mô phỏng login trong lúc POST đang chạy.
  await new Promise((resolve) => setImmediate(resolve));
  env.login();
  resolveResponse();
  await assert.rejects(pending, /Đơn đã được tạo nhưng phiên/);
  assert.equal(useGuestCart.getState().items.length, 1);
  assert.equal(env.load("@/features/checkout/confirmation.storage").readConfirmation(order().orderId, null), null);
});

test("Response của user cũ không invalidate lịch sử sau khi đổi tài khoản", async () => {
  const env = fixture();
  const session = env.login();
  const { api } = env.load("@/shared/api/client");
  let resolveResponse;
  api.defaults.adapter = (config) => new Promise((resolve) => {
    resolveResponse = () => resolve({ data: order(false), status: 200, statusText: "OK", headers: {}, config });
  });
  const mutation = env.load("@/features/checkout/queries").usePlaceOrder();
  const source = { kind: "buyNow", item };
  const payload = env.load("@/features/checkout/buildCheckoutRequest").buildCheckoutRequest(input(source));
  const pending = mutation.mutationFn({ payload, source, session });
  await new Promise((resolve) => setImmediate(resolve));

  env.state.token = token("user-2");
  env.state.user = { id: "user-2" };
  resolveResponse();

  await assert.rejects(pending, /Đơn đã được tạo nhưng phiên/);
  assert.deepEqual(env.invalidations, []);
});

test("Lỗi storage/cache sau HTTP thành công không biến thành lỗi đặt đơn", async () => {
  const env = fixture();
  const session = env.login();
  env.sessionStorage.setItem = () => { throw new Error("Storage unavailable"); };
  env.queryClient.invalidateQueries = async () => { throw new Error("Cache unavailable"); };
  env.load("@/shared/api/client").api.defaults.adapter = async (config) => ({ data: order(false), status: 200, headers: {}, config });
  const mutation = env.load("@/features/checkout/queries").usePlaceOrder();
  const payload = env.load("@/features/checkout/buildCheckoutRequest").buildCheckoutRequest(input({ kind: "userCart" }));
  const result = await mutation.mutationFn({ payload, source: { kind: "userCart" }, session });
  assert.equal(result.stored, false);
  assert.equal(result.cartSyncFailed, true);
  assert.equal(result.confirmation.order.orderId, order().orderId);
});

test("VNPay: payload giữ đúng nguồn, địa chỉ và ID string", () => {
  const { load } = fixture();
  const { buildCheckoutRequest: build } = load("@/features/checkout/buildCheckoutRequest");
  for (const source of [{ kind: "guestCart", items: [item] }, { kind: "userCart" }, { kind: "buyNow", item }]) {
    for (const selected of [address, { addressId: "987654321012345681" }]) {
      const cod = build(input(source, selected));
      const vnpay = build({ ...input(source, selected), paymentMethod: "VNPAY" });
      assert.deepEqual(vnpay, { ...cod, paymentMethod: "VNPAY" });
    }
  }
});

test("VNPay: URL tương đối/tuyệt đối đúng backend; chặn thiếu URL, sai origin/đơn/endpoint", () => {
  const { load } = fixture();
  const { getVnpayRedirectUrl } = load("@/features/payment/redirect");
  const paymentUrl = `/api/payments/vnpay/create?orderId=${order().orderId}`;
  const expected = `https://checkout.test${paymentUrl}`;
  for (const url of [paymentUrl, expected]) {
    assert.equal(getVnpayRedirectUrl({ ...order(), paymentMethod: "VNPAY", paymentUrl: url }), expected);
  }
  for (const url of [
    null, "", `https://other.test${paymentUrl}`, `//other.test${paymentUrl}`,
    "javascript:alert(1)", "/api/payments/vnpay/create?orderId=wrong",
    `/other?orderId=${order().orderId}`, `https://user:password@checkout.test${paymentUrl}`,
  ]) {
    assert.throws(() => getVnpayRedirectUrl({ ...order(), paymentUrl: url }));
  }
});

const callbackSearch = `?vnp_TxnRef=${order().orderId}&vnp_OrderInfo=Don+hang%20%2B%26&vnp_ResponseCode=00&vnp_SecureHash=test`;

test("VNPay: callback giữ nguyên query; bỏ token và không gửi header nội bộ", async () => {
  const { load, login, state } = fixture();
  const session = login();
  const { api } = load("@/shared/api/client");
  let requests = 0;
  api.defaults.adapter = async (config) => {
    requests++;
    assert.equal(config.method, "get");
    assert.equal(config.url, `/api/payments/vnpay/return${callbackSearch}`);
    assert.equal(config.headers.get("Authorization"), undefined);
    assert.equal(config.headers.get("X-Skip-Auth"), undefined);
    return { data: { success: true, message: "Payment successful!", orderId: order().orderId }, status: 200, headers: {}, config };
  };
  const result = await load("@/features/payment/api").verifyVnpayReturn(callbackSearch);
  assert.equal(result.success, true);
  assert.equal(result.orderId, order().orderId);
  assert.equal(requests, 1);
  assert.equal(state.token, session.token);
});

test("VNPay: lỗi HTTP/timeout không retry và không xóa phiên đăng nhập", async () => {
  const { load, login, state } = fixture();
  const session = login();
  const { api } = load("@/shared/api/client");
  const { verifyVnpayReturn } = load("@/features/payment/api");
  let requests = 0;
  for (const status of [401, 500, 0]) {
    api.defaults.adapter = async (config) => {
      requests++;
      const response = status ? { status, data: { message: "Failure" }, headers: {}, config } : undefined;
      throw new axios.AxiosError("Failure", status ? "ERR_BAD_RESPONSE" : "ECONNABORTED", config, null, response);
    };
    await assert.rejects(verifyVnpayReturn(callbackSearch), (error) => error.status === status);
    assert.equal(state.token, session.token);
  }
  assert.equal(requests, 3);
});

test("VNPay: query báo 00 vẫn giữ kết quả backend; response thành công thiếu mã đơn bị từ chối", async () => {
  const { load } = fixture();
  const { api } = load("@/shared/api/client");
  const { verifyVnpayReturn } = load("@/features/payment/api");
  for (const result of [
    { success: false, message: "Verification failed" },
    { success: false, message: "Payment cancelled", orderId: order().orderId },
    { success: false, message: "Payment failed", orderId: order().orderId },
  ]) {
    api.defaults.adapter = async (config) => ({ data: result, status: 200, headers: {}, config });
    assert.deepEqual(await verifyVnpayReturn(callbackSearch), result);
  }
  for (const result of [
    { success: true, message: "Payment successful!" },
    { success: "true", message: "Payment successful!", orderId: order().orderId },
    { success: true, message: "Payment successful!", orderId: 123 },
  ]) {
    api.defaults.adapter = async (config) => ({ data: result, status: 200, headers: {}, config });
    await assert.rejects(verifyVnpayReturn(callbackSearch), (error) => error.status === 0);
  }
});

test("VNPay: observer mount lại/focus/reconnect không gọi lặp kể cả sau lỗi", async () => {
  for (const fails of [false, true]) {
    const { load } = fixture();
    const { api } = load("@/shared/api/client");
    const options = load("@/features/payment/queries").useVnpayReturn(callbackSearch, true);
    const client = new QueryClient();
    client.mount();
    let requests = 0;
    let finishRequest;
    api.defaults.adapter = (config) => {
      requests++;
      return new Promise((resolve, reject) => {
        finishRequest = () => fails
          ? reject(new axios.AxiosError("Timeout", "ECONNABORTED", config))
          : resolve({ data: { success: true, message: "Paid", orderId: order().orderId }, status: 200, headers: {}, config });
      });
    };
    let unsubscribe = () => {};
    try {
      // Mô phỏng subscribe → unsubscribe → subscribe trong lúc request đang chạy.
      unsubscribe = new QueryObserver(client, options).subscribe(() => {});
      await new Promise((resolve) => setImmediate(resolve));
      unsubscribe();
      unsubscribe = new QueryObserver(client, options).subscribe(() => {});
      const pending = client.getQueryCache().find({ queryKey: options.queryKey, exact: true }).promise;
      finishRequest();
      if (fails) await assert.rejects(pending);
      else await pending;

      unsubscribe();
      unsubscribe = new QueryObserver(client, options).subscribe(() => {});
      focusManager.setFocused(false);
      focusManager.setFocused(true);
      onlineManager.setOnline(false);
      onlineManager.setOnline(true);
      await new Promise((resolve) => setImmediate(resolve));
      assert.equal(requests, 1);
      assert.equal(client.getQueryState(options.queryKey).status, fails ? "error" : "success");
    } finally {
      unsubscribe();
      client.unmount();
      client.clear();
      focusManager.setFocused(undefined);
      onlineManager.setOnline(true);
    }
  }
});
