/* Chạy: node --test scripts/verify-admin-categories.cjs. Không cần backend thật. */
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

const sampleCategory = (overrides = {}) => ({
  id: "9007199254740993",
  name: "Laptop",
  status: "ACTIVE",
  imageUrl: "/uploads/laptop.png",
  ...overrides,
});

test("Filters & Schemas: parseCategoryFilters, serializeCategoryFilters, selectCategoryPage và categoryFormSchema", () => {
  const load = createLoader();
  const {
    parseCategoryFilters,
    serializeCategoryFilters,
    selectCategoryPage,
  } = load("@/features/admin/categories/filters");
  const { categoryFormSchema } = load("@/features/admin/categories/schemas");

  const parsed = parseCategoryFilters(new URLSearchParams("keyword=máy&status=ACTIVE&page=2&size=50"));
  assert.deepEqual(parsed, { keyword: "máy", status: "ACTIVE", page: 2, size: 50 });

  const defaults = parseCategoryFilters(new URLSearchParams("page=-1&status=X&size=15"));
  assert.deepEqual(defaults, { keyword: "", status: "", page: 1, size: 10 });

  assert.equal(serializeCategoryFilters(parsed).toString(), "keyword=m%C3%A1y&status=ACTIVE&page=2&size=50");
  assert.equal(serializeCategoryFilters(defaults).toString(), "");

  const categories = [
    sampleCategory({ id: "1", name: "Máy tính", status: "ACTIVE" }),
    sampleCategory({ id: "2", name: "MÁY ẢNH", status: "INACTIVE" }),
  ];
  const page = selectCategoryPage(categories, { keyword: "máy", status: "ACTIVE", page: 9, size: 10 });
  assert.equal(page.totalItems, 1);
  assert.equal(page.page, 1);
  assert.equal(page.rows[0].id, "1");

  const img = new File(["img"], "cat.png", { type: "image/png" });
  assert.equal(categoryFormSchema.safeParse({ name: "  Laptop  ", status: "ACTIVE", image: img }).success, true);
  assert.equal(categoryFormSchema.safeParse({ name: "Laptop", status: "INACTIVE" }).success, true);
  assert.equal(categoryFormSchema.safeParse({ name: "  ", status: "ACTIVE" }).success, false);
});

test("API: buildCategoryFormData và CRUD endpoints gửi đúng HTTP + FormData", async () => {
  const load = createLoader({
    "@/shared/config/env": { env: { API_BASE_URL: "https://categories.test" } },
  });
  const { api } = load("@/shared/api/client");
  const catApi = load("@/features/admin/categories/api");
  const token = makeToken();
  const image = new File(["img"], "cat.webp", { type: "image/webp" });

  const fd = catApi.buildCategoryFormData({ name: "  Laptop  ", status: "ACTIVE", image });
  assert.equal(fd.get("name"), "Laptop");
  assert.equal(fd.get("status"), "ACTIVE");
  assert.equal(fd.get("image").name, "cat.webp");

  const fdNoImg = catApi.buildCategoryFormData({ name: "Laptop", status: "INACTIVE" });
  assert.equal(fdNoImg.get("image"), null);

  const calls = [];
  api.defaults.adapter = async (config) => {
    calls.push({ method: config.method.toUpperCase(), url: config.url, auth: config.headers.get("Authorization") });
    if (config.url === "/api/categories") return { data: [sampleCategory()], status: 200, headers: {}, config };
    return { data: sampleCategory(), status: 200, headers: {}, config };
  };

  assert.equal((await catApi.getAdminCategories(new AbortController().signal, token)).length, 1);
  await catApi.createAdminCategory({ name: "Laptop", status: "ACTIVE", image }, token);
  await catApi.updateAdminCategory("9007199254740993", { name: "Laptop", status: "INACTIVE" }, token);
  await catApi.deleteAdminCategory("9007199254740993", token);

  assert.deepEqual(calls.map((c) => `${c.method} ${c.url}`), [
    "GET /api/categories",
    "POST /api/admin/categories",
    "PUT /api/admin/categories/9007199254740993",
    "DELETE /api/admin/categories/9007199254740993",
  ]);
  assert.ok(calls.every((c) => c.auth === `Bearer ${token}`));
});

function categoryQueryFixture(handlers = {}) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const token = makeToken("100");
  let current = { user: { id: "100", role: "MANAGER" }, token };
  const useSession = (select) => select(current);
  useSession.getState = () => current;

  const toasts = [];
  let mutationOptions;
  const load = createLoader({
    "@/shared/auth/session.store": { useSession },
    "@/features/admin/categories/api": {
      getAdminCategories: handlers.getAdminCategories ?? (async () => [sampleCategory()]),
      createAdminCategory: handlers.createAdminCategory ?? (async () => sampleCategory()),
      updateAdminCategory: handlers.updateAdminCategory ?? (async () => sampleCategory({ name: "Laptop Pro" })),
      deleteAdminCategory: handlers.deleteAdminCategory ?? (async () => undefined),
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

  const queries = load("@/features/admin/categories/queries");
  return {
    queryClient,
    token,
    toasts,
    queries,
    ApiError: load("@/shared/api/errors").ApiError,
    setCurrent: (next) => { current = next; },
    getMutationOptions: () => mutationOptions,
    session: () => ({ userId: "100", role: "MANAGER", token }),
  };
}

test("Queries: useAdminCategories và useCategoryMutation đầy đủ create/update/delete, guards và onError", async () => {
  let failUpdate = null;
  let updateResp = sampleCategory({ name: "Laptop Pro" });
  let holdCreate = false;
  let releaseCreate;

  const fixture = categoryQueryFixture({
    createAdminCategory: async () => {
      if (holdCreate) return new Promise((resolve) => { releaseCreate = resolve; });
      return sampleCategory();
    },
    updateAdminCategory: async () => {
      if (failUpdate) throw failUpdate;
      return updateResp;
    },
  });

  assert.equal(fixture.queries.useCategoryWritesPending(), false);
  const listQuery = fixture.queries.useAdminCategories();
  assert.equal(listQuery.enabled, true);
  assert.equal((await listQuery.queryFn({ signal: new AbortController().signal })).length, 1);

  assert.equal(fixture.queries.isCategoryResultUncertain(new fixture.ApiError(500, "err")), true);
  assert.equal(fixture.queries.isCategoryResultUncertain(new fixture.ApiError(404, "missing")), false);

  const catKey = ["admin", "100", "MANAGER", "categories"];
  const pubCatKey = ["categories"];
  fixture.queryClient.setQueryData(catKey, []);
  fixture.queryClient.setQueryData(pubCatKey, []);

  fixture.queries.useCategoryMutation();
  const run = (vars) => new MutationObserver(fixture.queryClient, fixture.getMutationOptions()).mutate({
    session: fixture.session(),
    ...vars,
  });

  await run({ kind: "create", values: { name: "Laptop", status: "ACTIVE" } });
  await run({ kind: "update", id: "9007199254740993", values: { name: "Laptop Pro", status: "ACTIVE" } });
  await run({ kind: "delete", id: "9007199254740993" });
  assert.deepEqual(fixture.toasts, ["Đã lưu danh mục.", "Đã lưu danh mục.", "Đã xóa danh mục."]);
  assert.equal(fixture.queryClient.getQueryState(catKey).isInvalidated, true);
  assert.equal(fixture.queryClient.getQueryState(pubCatKey).isInvalidated, true);

  // 403 STAFF
  fixture.setCurrent({ user: { id: "100", role: "STAFF" }, token: fixture.token });
  await assert.rejects(
    run({ kind: "delete", id: "9007199254740993", session: { userId: "100", role: "STAFF", token: fixture.token } }),
    (e) => e.status === 403,
  );
  fixture.setCurrent({ user: { id: "100", role: "MANAGER" }, token: fixture.token });

  // 400 invalid id
  await assert.rejects(run({ kind: "update", id: "bad", values: { name: "X", status: "ACTIVE" } }), (e) => e.status === 400);

  // 0 mismatch returned ID on update
  updateResp = sampleCategory({ id: "999" });
  await assert.rejects(run({ kind: "update", id: "9007199254740993", values: { name: "X", status: "ACTIVE" } }), (e) => e.status === 0);

  // onError 500 refreshes
  failUpdate = new fixture.ApiError(500, "Server error");
  await assert.rejects(run({ kind: "update", id: "9007199254740993", values: { name: "X", status: "ACTIVE" } }), (e) => e.status === 500);
  failUpdate = null;

  // 409 concurrent busy
  holdCreate = true;
  const first = run({ kind: "create", values: { name: "Laptop", status: "ACTIVE" } });
  await new Promise((resolve) => setTimeout(resolve, 10));
  await assert.rejects(run({ kind: "create", values: { name: "Laptop", status: "ACTIVE" } }), (e) => e.status === 409);
  releaseCreate(sampleCategory());
  await first;

  fixture.queryClient.clear();
});
