/* Chạy: node --test scripts/verify-admin-brands.cjs. Không cần backend thật. */
const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
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

const sampleBrand = (overrides = {}) => ({
  id: "9007199254740993",
  name: "Apple",
  status: "ACTIVE",
  logoUrl: "/uploads/apple.png",
  ...overrides,
});

test("Filters: parseBrandFilters, serializeBrandFilters, selectBrandPage", () => {
  const load = createLoader();
  const {
    parseBrandFilters,
    serializeBrandFilters,
    selectBrandPage,
  } = load("@/features/admin/brands/filters");

  const parsed = parseBrandFilters(new URLSearchParams("keyword=điện&status=INACTIVE&page=2&size=20"));
  assert.deepEqual(parsed, { keyword: "điện", status: "INACTIVE", page: 2, size: 20 });

  const defaults = parseBrandFilters(new URLSearchParams("page=0&status=OTHER&size=99"));
  assert.deepEqual(defaults, { keyword: "", status: "", page: 1, size: 10 });

  assert.equal(serializeBrandFilters(parsed).toString(), "keyword=%C4%91i%E1%BB%87n&status=INACTIVE&page=2&size=20");
  assert.equal(serializeBrandFilters(defaults).toString(), "");

  const brands = [
    sampleBrand({ id: "1", name: "Điện máy X", status: "ACTIVE" }),
    sampleBrand({ id: "2", name: "ĐIỆN THOẠI Y", status: "INACTIVE" }),
    sampleBrand({ id: "3", name: "Samsung", status: "ACTIVE" }),
  ];
  const page = selectBrandPage(brands, { keyword: "điện", status: "INACTIVE", page: 5, size: 10 });
  assert.equal(page.totalItems, 1);
  assert.equal(page.totalPages, 1);
  assert.equal(page.page, 1);
  assert.equal(page.rows[0].id, "2");
});

test("Schemas: createBrandSchema, updateBrandSchema và getBrandFormSchema kiểm tra logo và MIME", () => {
  const load = createLoader();
  const {
    createBrandSchema,
    updateBrandSchema,
    getBrandFormSchema,
  } = load("@/features/admin/brands/schemas");

  const validLogo = new File(["img"], "logo.png", { type: "image/png" });
  const badLogo = new File(["txt"], "bad.txt", { type: "text/plain" });

  assert.equal(createBrandSchema.safeParse({ name: "  Sony  ", status: "ACTIVE", logo: validLogo }).success, true);
  assert.equal(createBrandSchema.safeParse({ name: "Sony", status: "ACTIVE" }).success, false);
  assert.equal(createBrandSchema.safeParse({ name: "Sony", status: "ACTIVE", logo: badLogo }).success, false);

  assert.equal(updateBrandSchema.safeParse({ name: "Sony", status: "INACTIVE" }).success, true);
  assert.equal(updateBrandSchema.safeParse({ name: "   ", status: "ACTIVE" }).success, false);

  assert.equal(getBrandFormSchema(false).safeParse({ name: "Sony", status: "ACTIVE" }).success, false);
  assert.equal(getBrandFormSchema(true).safeParse({ name: "Sony", status: "ACTIVE" }).success, true);
  assert.equal(getBrandFormSchema(false).safeParse({ name: "Sony", status: "ACTIVE", logo: validLogo }).success, true);
});

test("API: buildBrandFormData và CRUD endpoints gửi đúng HTTP + FormData", async () => {
  const load = createLoader({
    "@/shared/config/env": { env: { API_BASE_URL: "https://brands.test" } },
  });
  const { api } = load("@/shared/api/client");
  const brandApi = load("@/features/admin/brands/api");
  const token = makeToken();
  const logo = new File(["img"], "sony.webp", { type: "image/webp" });

  const fdCreate = brandApi.buildBrandFormData({ name: "  Sony  ", status: "ACTIVE", logo }, "create");
  assert.equal(fdCreate.get("name"), "Sony");
  assert.equal(fdCreate.get("status"), "ACTIVE");
  assert.equal(fdCreate.get("logo").name, "sony.webp");

  const fdUpdate = brandApi.buildBrandFormData({ name: "Sony", status: "INACTIVE" }, "update");
  assert.equal(fdUpdate.get("logo"), null);

  const calls = [];
  api.defaults.adapter = async (config) => {
    calls.push({ method: config.method.toUpperCase(), url: config.url, auth: config.headers.get("Authorization") });
    if (config.url === "/api/brands") return { data: [sampleBrand()], status: 200, headers: {}, config };
    return { data: sampleBrand(), status: 200, headers: {}, config };
  };

  const list = await brandApi.getAdminBrands(new AbortController().signal, token);
  assert.equal(list.length, 1);
  await brandApi.createAdminBrand({ name: "Sony", status: "ACTIVE", logo }, token);
  await brandApi.updateAdminBrand("9007199254740993", { name: "Sony", status: "INACTIVE" }, token);
  await brandApi.deleteAdminBrand("9007199254740993", token);

  assert.deepEqual(calls.map((c) => `${c.method} ${c.url}`), [
    "GET /api/brands",
    "POST /api/admin/brands",
    "PUT /api/admin/brands/9007199254740993",
    "DELETE /api/admin/brands/9007199254740993",
  ]);
  assert.ok(calls.every((c) => c.auth === `Bearer ${token}`));
});

function brandQueryFixture(handlers = {}) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const token = makeToken("100");
  let current = { user: { id: "100", role: "ADMIN" }, token };
  const useSession = (select) => select(current);
  useSession.getState = () => current;

  const toasts = [];
  let mutationOptions;
  const load = createLoader({
    "@/shared/auth/session.store": { useSession },
    "@/features/admin/brands/api": {
      getAdminBrands: handlers.getAdminBrands ?? (async () => [sampleBrand()]),
      createAdminBrand: handlers.createAdminBrand ?? (async () => sampleBrand()),
      updateAdminBrand: handlers.updateAdminBrand ?? (async () => sampleBrand({ name: "Apple Updated" })),
      deleteAdminBrand: handlers.deleteAdminBrand ?? (async () => undefined),
    },
    "@tanstack/react-query": {
      ...require("@tanstack/react-query"),
      useQueryClient: () => queryClient,
      useIsMutating: () => 0,
      useQuery: (opts) => opts,
      useMutation: (opts) => { mutationOptions = opts; return { ...opts, isPending: false }; },
    },
    sonner: { toast: { success: (msg) => toasts.push(msg) } },
  });

  const queries = load("@/features/admin/brands/queries");
  return {
    queryClient,
    token,
    toasts,
    queries,
    ApiError: load("@/shared/api/errors").ApiError,
    setCurrent: (next) => { current = next; },
    getMutationOptions: () => mutationOptions,
    session: () => ({ userId: "100", role: "ADMIN", token }),
  };
}

test("Queries: useAdminBrands và useBrandMutation đầy đủ create/update/delete, guards và onError", async () => {
  let failCreate = null;
  let createResp = sampleBrand();
  let holdDelete = false;
  let releaseDelete;

  const fixture = brandQueryFixture({
    createAdminBrand: async () => {
      if (failCreate) throw failCreate;
      return createResp;
    },
    deleteAdminBrand: async () => {
      if (holdDelete) return new Promise((resolve) => { releaseDelete = resolve; });
      return undefined;
    },
  });

  assert.equal(fixture.queries.useBrandWritesPending(), false);
  const listQuery = fixture.queries.useAdminBrands();
  assert.equal(listQuery.enabled, true);
  assert.equal((await listQuery.queryFn({ signal: new AbortController().signal })).length, 1);

  assert.equal(fixture.queries.isBrandResultUncertain(new fixture.ApiError(0, "net")), true);
  assert.equal(fixture.queries.isBrandResultUncertain(new fixture.ApiError(502, "bad gw")), true);
  assert.equal(fixture.queries.isBrandResultUncertain(new fixture.ApiError(400, "bad req")), false);

  const brandsKey = ["admin", "100", "ADMIN", "brands"];
  const publicBrandsKey = ["brands"];
  fixture.queryClient.setQueryData(brandsKey, []);
  fixture.queryClient.setQueryData(publicBrandsKey, []);

  fixture.queries.useBrandMutation();
  const run = (vars) => new MutationObserver(fixture.queryClient, fixture.getMutationOptions()).mutate({
    session: fixture.session(),
    ...vars,
  });

  const logo = new File(["img"], "logo.png", { type: "image/png" });
  await run({ kind: "create", values: { name: "Apple", status: "ACTIVE", logo } });
  await run({ kind: "update", id: "9007199254740993", values: { name: "Apple Updated", status: "ACTIVE" } });
  await run({ kind: "delete", id: "9007199254740993" });
  assert.deepEqual(fixture.toasts, ["Đã lưu thương hiệu.", "Đã lưu thương hiệu.", "Đã xóa thương hiệu."]);
  assert.equal(fixture.queryClient.getQueryState(brandsKey).isInvalidated, true);
  assert.equal(fixture.queryClient.getQueryState(publicBrandsKey).isInvalidated, true);

  // 403 STAFF
  fixture.setCurrent({ user: { id: "100", role: "STAFF" }, token: fixture.token });
  await assert.rejects(
    run({ kind: "delete", id: "9007199254740993", session: { userId: "100", role: "STAFF", token: fixture.token } }),
    (e) => e.status === 403,
  );
  fixture.setCurrent({ user: { id: "100", role: "ADMIN" }, token: fixture.token });

  // 400 invalid id
  await assert.rejects(run({ kind: "delete", id: "0" }), (e) => e.status === 400);

  // 0 invalid create response
  createResp = { id: "bad" };
  await assert.rejects(run({ kind: "create", values: { name: "Apple", status: "ACTIVE", logo } }), (e) => e.status === 0);

  // onError 404 refreshes related
  failCreate = new fixture.ApiError(404, "Not found");
  await assert.rejects(run({ kind: "create", values: { name: "Apple", status: "ACTIVE", logo } }), (e) => e.status === 404);
  failCreate = null;

  // 409 busy concurrent
  holdDelete = true;
  const first = run({ kind: "delete", id: "9007199254740993" });
  await new Promise((resolve) => setTimeout(resolve, 10));
  await assert.rejects(run({ kind: "delete", id: "9007199254740993" }), (e) => e.status === 409);
  releaseDelete();
  await first;

  fixture.queryClient.clear();
});
