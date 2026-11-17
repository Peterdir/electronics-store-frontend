/* D10 regression checks using real QueryClient and mocked API responses. */
const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const { QueryClient, MutationObserver } = require("@tanstack/react-query");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");

const root = path.resolve(__dirname, "..");
const reviewId = "9007199254740993";
const oldReview = {
  id: reviewId, productId: "42", productName: "Điện thoại",
  productImage: null, variantAttributes: null, rating: 3,
  reviewText: "Nội dung cũ", imageUrl: "/uploads/reviews/old.png",
  createdAt: "2026-11-17T00:00:00Z",
};

function fixture(t) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  t.after(() => client.clear());
  const token = `header.${Buffer.from(JSON.stringify({ exp: Date.now() / 1000 + 3600 })).toString("base64url")}.signature`;
  const session = { user: { id: "100" }, token };
  const messages = [];
  const requests = [];
  const api = {
    put: async (...args) => { requests.push(args); return { data: { ...oldReview, rating: 5 } }; },
    delete: async (...args) => { requests.push(args); return { status: 204, data: "" }; },
  };
  const useSession = (selector) => selector(session);
  useSession.getState = () => session;
  const mocks = {
    "@/shared/api/client": { api },
    "@/shared/auth/session.store": { useSession },
    "@tanstack/react-query": {
      useQueryClient: () => client,
      useMutation: (options) => new MutationObserver(client, options),
      useIsMutating: () => 0,
    },
    sonner: { toast: {
      success: (message) => messages.push(message),
      info: (message) => messages.push(message),
      error: (message) => messages.push(message),
    } },
  };
  const cache = new Map();
  function load(name, parent = path.join(root, "src", "index.ts")) {
    if (Object.hasOwn(mocks, name)) return mocks[name];
    const target = name.startsWith("@/") ? path.join(root, "src", name.slice(2))
      : name.startsWith(".") ? path.resolve(path.dirname(parent), name) : null;
    if (!target) return require(name);
    const filename = [target + ".ts", target + ".tsx"].find(fs.existsSync);
    if (!filename) throw new Error(`Module missing: ${name}`);
    if (cache.has(filename)) return cache.get(filename).exports;
    const module = { exports: {} };
    cache.set(filename, module);
    const output = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
      compilerOptions: {
        target: ts.ScriptTarget.ES2023,
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.ReactJSX,
        esModuleInterop: true,
      },
      fileName: filename,
    }).outputText;
    new Function("require", "module", "exports", output)(
      (specifier) => load(specifier, filename), module, module.exports,
    );
    return module.exports;
  }
  const historyKey = ["reviews", "100", "history"];
  client.setQueryData(historyKey, [oldReview]);
  client.setQueryData(["reviews", "100", "pending"], []);
  client.setQueryData(["products", "detail", "42"], { averageRating: 3 });
  const input = { userId: "100", token, action: "update", payload: { rating: 5, reviewText: "" } };
  return { client, session, messages, requests, api, mocks, load, historyKey, input };
}

test("PUT keeps string IDs, clears text, supports removal and multipart replacement", async (t) => {
  const f = fixture(t);
  const { updateReview, deleteReview } = f.load("@/features/reviews/api");
  await updateReview(reviewId, { rating: 5, reviewText: "", removeImage: false }, f.input.token);
  assert.equal(f.requests[0][0], `/api/reviews/${reviewId}`);
  assert.equal(f.requests[0][1].reviewText, "");
  assert.equal(f.requests[0][2].meta.authToken, f.input.token);
  await updateReview(reviewId, { rating: 4, removeImage: true }, f.input.token);
  assert.equal(f.requests[1][1].removeImage, true);
  const image = new File(["image bytes"], "new.png", { type: "image/png" });
  await updateReview(reviewId, { rating: 4, reviewText: "" }, f.input.token, image);
  const body = f.requests[2][1];
  assert.ok(body instanceof FormData);
  assert.deepEqual([...body.keys()], ["rating", "reviewText", "image"]);
  assert.equal(await body.get("image").text(), "image bytes");
  assert.equal(f.requests[2][2].headers, undefined);
  await assert.rejects(updateReview(reviewId, { rating: 4, removeImage: true }, f.input.token, image));
  assert.equal(f.requests.length, 3);
  assert.equal(await deleteReview(reviewId, f.input.token), undefined);
});

test("Update refreshes review and catalog caches, preserves unrelated account", async (t) => {
  const f = fixture(t);
  const otherKey = ["reviews", "200", "history"];
  f.client.setQueryData(otherKey, [oldReview]);
  const { mutation } = f.load("@/features/reviews/queries").useManageReview("100", reviewId);
  await mutation.mutate(f.input);
  assert.equal(f.client.getQueryData(f.historyKey)[0].rating, 5);
  assert.equal(f.client.getQueryState(["reviews", "100", "pending"]).isInvalidated, true);
  assert.equal(f.client.getQueryState(["products", "detail", "42"]).isInvalidated, true);
  assert.equal(f.client.getQueryState(otherKey).isInvalidated, false);
  assert.equal(f.messages.length, 1);
});

test("DELETE 204 removes history entry and refetches pending without inventing an item", async (t) => {
  const f = fixture(t);
  const { mutation } = f.load("@/features/reviews/queries").useManageReview("100", reviewId);
  await mutation.mutate({ userId: "100", token: f.input.token, action: "delete" });
  assert.deepEqual(f.client.getQueryData(f.historyKey), []);
  assert.deepEqual(f.client.getQueryData(["reviews", "100", "pending"]), []);
  assert.equal(f.client.getQueryState(["reviews", "100", "pending"]).isInvalidated, true);
});

test("Late response after logout leaves caches empty and suppresses toast", async (t) => {
  const f = fixture(t);
  let finish;
  f.api.put = () => new Promise((resolve) => { finish = resolve; });
  const { mutation } = f.load("@/features/reviews/queries").useManageReview("100", reviewId);
  const result = mutation.mutate(f.input);
  while (!finish) await new Promise((resolve) => setImmediate(resolve));
  f.session.user = { id: "200" };
  f.session.token = "new-session";
  f.client.clear();
  finish({ data: { ...oldReview, rating: 5 } });
  await assert.rejects(result);
  assert.equal(f.client.getQueryCache().getAll().length, 0);
  assert.deepEqual(f.messages, []);
});

test("403/404 refresh history and validation failure retains cached data", async (t) => {
  const f = fixture(t);
  const { ApiError } = f.load("@/shared/api/errors");
  const { useManageReview } = f.load("@/features/reviews/queries");
  for (const status of [400, 403, 404]) {
    f.client.setQueryData(f.historyKey, [oldReview]);
    f.api.put = async () => { throw new ApiError(status, "Rejected"); };
    await assert.rejects(useManageReview("100", reviewId).mutation.mutate(f.input));
    assert.deepEqual(f.client.getQueryData(f.historyKey), [oldReview]);
    assert.equal(f.client.getQueryState(f.historyKey).isInvalidated, status !== 400);
  }
});

test("Edit and delete share a lock and reject dispatch from a changed session", async (t) => {
  const f = fixture(t);
  let finish;
  f.api.put = () => new Promise((resolve) => { finish = resolve; });
  const { useManageReview } = f.load("@/features/reviews/queries");
  const first = useManageReview("100", reviewId);
  const second = useManageReview("100", reviewId);
  assert.deepEqual(first.mutationKey, second.mutationKey);
  const result = first.mutation.mutate(f.input);
  while (!finish) await new Promise((resolve) => setImmediate(resolve));
  await assert.rejects(second.mutation.mutate({
    userId: "100", token: f.input.token, action: "delete",
  }));
  assert.deepEqual(f.requests, []);
  finish({ data: { ...oldReview, rating: 5 } });
  await result;
  f.session.token = "changed-token";
  await assert.rejects(useManageReview("100", reviewId).mutation.mutate(f.input));
  assert.deepEqual(f.requests, []);
});

test("Schema blocks image/removal conflict and edit form loads history values", (t) => {
  const f = fixture(t);
  const { reviewSchema } = f.load("@/features/reviews/schemas");
  const values = { rating: 4, reviewText: "", removeImage: false, image: null };
  assert.equal(reviewSchema.safeParse(values).success, true);
  assert.equal(reviewSchema.safeParse({ ...values, rating: 0 }).success, false);
  assert.equal(reviewSchema.safeParse({ ...values, removeImage: true,
    image: new File(["png"], "new.png", { type: "image/png" }),
  }).success, false);
  let defaults;
  const hookForm = require("react-hook-form");
  f.mocks["react-hook-form"] = {
    ...hookForm,
    useForm(options) {
      defaults = options.defaultValues;
      return hookForm.useForm(options);
    },
  };
  const { ReviewForm } = f.load("@/features/reviews/components/ReviewForm");
  const html = renderToStaticMarkup(React.createElement(ReviewForm, {
    review: oldReview, canSubmit: true, onClose() {},
  }));
  assert.deepEqual(defaults, { rating: 3, reviewText: "Nội dung cũ", image: null, removeImage: false });
  assert.match(html, /Lưu thay đổi/);
  assert.match(html, /Gỡ ảnh hiện tại khi lưu/);
  assert.match(html, /checked=""/);
  assert.match(html, /\/uploads\/reviews\/old.png/);
});
