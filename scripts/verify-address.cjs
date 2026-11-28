/* Chạy: node --test scripts/verify-address.cjs. Không cần backend thật. */
const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

const root = path.resolve(__dirname, "..");
const makeToken = (sub = "user-1", expOffsetSec = 3600) =>
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

const validAddress = {
  fullName: "  Nguyễn Văn A  ",
  phone: "0901234567",
  province: "TP.HCM",
  district: "Quận 1",
  ward: "Phường Bến Nghé",
  specificAddress: "12 Nguyễn Huệ",
  isDefault: true,
};

test("Schemas: addressSchema, toAddressRequest và toManualCheckoutAddress", () => {
  const load = createLoader();
  const {
    addressSchema,
    emptyAddressValues,
    toAddressRequest,
    toManualCheckoutAddress,
  } = load("@/features/address/schemas");

  assert.equal(emptyAddressValues.isDefault, false);
  const parsed = addressSchema.parse(validAddress);
  assert.equal(parsed.fullName, "Nguyễn Văn A");
  assert.equal(addressSchema.safeParse({ ...validAddress, phone: "+84901234567" }).success, true);

  for (const invalid of [
    { ...validAddress, phone: "12345" },
    { ...validAddress, fullName: "   " },
    { ...validAddress, province: "" },
    { ...validAddress, district: "" },
    { ...validAddress, ward: "" },
    { ...validAddress, specificAddress: "" },
  ]) {
    assert.equal(addressSchema.safeParse(invalid).success, false);
  }

  assert.deepEqual(toAddressRequest(parsed), parsed);
  assert.deepEqual(toManualCheckoutAddress(parsed), {
    recipientName: "Nguyễn Văn A",
    recipientPhone: "0901234567",
    shippingAddress: "12 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP.HCM",
  });
});

test("API: getAddresses, createAddress, updateAddress, deleteAddress, setDefaultAddress", async () => {
  const load = createLoader({
    "@/shared/config/env": { env: { API_BASE_URL: "https://address.test" } },
  });
  const { api } = load("@/shared/api/client");
  const addressApi = load("@/features/address/api");
  const calls = [];

  api.defaults.adapter = async (config) => {
    calls.push(`${config.method.toUpperCase()} ${config.url}`);
    if (config.method === "get") {
      return { data: [{ id: "1", ...validAddress }], status: 200, headers: {}, config };
    }
    return { data: { message: "OK" }, status: 200, headers: {}, config };
  };

  const list = await addressApi.getAddresses(new AbortController().signal);
  assert.equal(list.length, 1);
  assert.equal((await addressApi.createAddress(validAddress)).message, "OK");
  assert.equal((await addressApi.updateAddress({ id: "1", payload: validAddress })).message, "OK");
  assert.equal((await addressApi.deleteAddress("1")).message, "OK");
  assert.equal((await addressApi.setDefaultAddress("1")).message, "OK");

  assert.deepEqual(calls, [
    "GET /api/addresses",
    "POST /api/addresses",
    "PUT /api/addresses/1",
    "DELETE /api/addresses/1",
    "PATCH /api/addresses/1/default",
  ]);
});

test("Queries: useGetAddresses & mutations invalidate cache đúng phiên", async () => {
  let state = { token: makeToken("user-1"), user: { id: "user-1" } };
  const useSession = (select) => select(state);
  useSession.getState = () => state;

  const invalidations = [];
  const queryClient = {
    invalidateQueries: async (opts) => { invalidations.push(opts); },
  };
  const apiMocks = {
    getAddresses: async () => [{ id: "1" }],
    createAddress: async () => ({ message: "created" }),
    updateAddress: async () => ({ message: "updated" }),
    deleteAddress: async () => ({ message: "deleted" }),
    setDefaultAddress: async () => ({ message: "default" }),
  };

  const load = createLoader({
    "@/shared/auth/session.store": { useSession },
    "@/features/address/api": apiMocks,
    "@tanstack/react-query": {
      useQuery: (opts) => opts,
      useMutation: (opts) => opts,
      useQueryClient: () => queryClient,
    },
  });

  const queries = load("@/features/address/queries");

  const getOpts = queries.useGetAddresses();
  assert.equal(getOpts.enabled, true);
  assert.deepEqual(getOpts.queryKey, ["addresses", "user-1"]);
  assert.deepEqual(await getOpts.queryFn({ signal: new AbortController().signal }), [{ id: "1" }]);

  state = { token: makeToken("user-1", -60), user: { id: "user-1" } };
  assert.equal(queries.useGetAddresses().enabled, false);

  state = { token: makeToken("user-1"), user: { id: "user-1" } };
  for (const hook of [queries.useCreateAddress, queries.useUpdateAddress, queries.useDeleteAddress, queries.useSetDefaultAddress]) {
    const m = hook();
    await m.onSuccess();
  }
  assert.equal(invalidations.length, 4);
  assert.deepEqual(invalidations[0], { queryKey: ["addresses", "user-1"] });

  // User changed before onSuccess runs -> should not invalidate
  const createMut = queries.useCreateAddress();
  state = { token: makeToken("user-2"), user: { id: "user-2" } };
  await createMut.onSuccess();
  assert.equal(invalidations.length, 4);
});
