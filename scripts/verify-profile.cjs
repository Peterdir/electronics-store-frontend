/* Kiểm tra D2 bằng Node và QueryClient thật; không gọi backend. */
const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const { QueryClient, MutationObserver } = require("@tanstack/react-query");

const root = path.resolve(__dirname, "..");
const profile = { id: "9007199254740993", email: "customer@example.test", fullName: "Tên mới", phone: null };
const deferred = () => {
    let resolve;
    const promise = new Promise((done) => { resolve = done; });
    return { promise, resolve };
};

function fixture(t) {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
    t.after(() => client.clear());
    const token = `header.${Buffer.from(JSON.stringify({ exp: Date.now() / 1000 + 3600 })).toString("base64url")}.signature`;
    const session = { user: { id: profile.id }, token };
    const calls = { put: 0, get: 0 };
    const api = {
        updateMyProfile: async () => { calls.put++; return { message: "Profile updated successfully." }; },
    };
    const mocks = {
        "@tanstack/react-query": {
            useQueryClient: () => client,
            useMutation: (options) => new MutationObserver(client, options),
        },
        "@/shared/auth/session.store": { useSession: { getState: () => session } },
        "@/features/cart/mergeGuestCart": {},
        "@/features/auth/api": api,
        sonner: {},
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
    const key = ["me", profile.id];
    function seed(get = async () => profile) {
        client.setQueryDefaults(key, { queryFn: async ({ signal }) => { calls.get++; return get(signal); } });
        client.setQueryData(key, { ...profile, fullName: "Tên cũ", phone: "0912345678" });
    }
    const variables = { userId: profile.id, token, payload: { fullName: profile.fullName } };
    return { client, session, calls, api, load, key, seed, variables };
}

test("Schema: trim, tên bắt buộc, SĐT trống/0/+84 và định dạng sai", (t) => {
    const { load } = fixture(t);
    const { profileSchema } = load("@/features/auth/schemas");
    assert.deepEqual(profileSchema.parse({ fullName: " An ", phone: " " }), { fullName: "An", phone: "" });
    for (const phone of ["0912345678", "+84912345678"]) {
        assert.equal(profileSchema.safeParse({ fullName: "An", phone }).success, true);
    }
    for (const phone of ["123", "84912345678", "09123456789", "abc"]) {
        assert.equal(profileSchema.safeParse({ fullName: "An", phone }).success, false);
    }
    assert.equal(profileSchema.safeParse({ fullName: "   ", phone: "" }).success, false);
});

test("PUT → GET: trả hồ sơ mới, chỉ invalidate me đúng user, ID giữ string", async (t) => {
    const f = fixture(t);
    f.seed();
    f.client.setQueryData(["me", "other"], { id: "other" });
    f.api.updateMyProfile = async (payload, token) => {
        f.calls.put++;
        assert.deepEqual(payload, { fullName: profile.fullName });
        assert.equal(token, f.variables.token);
        return { message: "Saved" };
    };
    const result = await f.load("@/features/auth/queries").useUpdateProfile().mutate(f.variables);
    assert.deepEqual(result, { message: "Saved", profile });
    assert.equal(f.calls.put, 1);
    assert.equal(f.calls.get, 1);
    assert.deepEqual(f.client.getQueryData(f.key), profile);
    assert.equal(f.client.getQueryState(["me", "other"]).isInvalidated, false);
});

test("PUT lỗi: giữ nguyên lỗi fieldErrors và không GET lại", async (t) => {
    const f = fixture(t);
    f.seed();
    const { ApiError } = f.load("@/shared/api/errors");
    const error = new ApiError(400, "Invalid", undefined, { phone: "Invalid phone" });
    f.api.updateMyProfile = async () => { f.calls.put++; throw error; };
    await assert.rejects(f.load("@/features/auth/queries").useUpdateProfile().mutate(f.variables), (caught) => caught === error);
    assert.equal(f.calls.put, 1);
    assert.equal(f.calls.get, 0);
});

test("PUT thành công, GET lỗi: trả profile null; thử tải lại không gửi PUT lần nữa", async (t) => {
    const f = fixture(t);
    let offline = true;
    f.seed(async () => {
        if (offline) throw new Error("Offline");
        return profile;
    });
    const result = await f.load("@/features/auth/queries").useUpdateProfile().mutate(f.variables);
    assert.equal(result.profile, null);
    assert.equal(f.client.getQueryData(f.key).fullName, "Tên cũ");
    offline = false;
    await f.client.refetchQueries({ queryKey: f.key, exact: true }, { throwOnError: true });
    assert.deepEqual(f.client.getQueryData(f.key), profile);
    assert.equal(f.calls.put, 1);
});

test("Phiên cũ trước submit: không gửi PUT", async (t) => {
    const f = fixture(t);
    f.session.token = "new-session";
    const result = await f.load("@/features/auth/queries").useUpdateProfile().mutate(f.variables);
    assert.equal(result, null);
    assert.equal(f.calls.put, 0);
});

test("Đổi user khi PUT đang chờ: bỏ response, không invalidate cache phiên mới", async (t) => {
    const f = fixture(t);
    f.seed();
    const waiting = deferred();
    const started = deferred();
    f.api.updateMyProfile = async () => { started.resolve(); return waiting.promise; };
    const pending = f.load("@/features/auth/queries").useUpdateProfile().mutate(f.variables);
    await started.promise;
    f.session.user = { id: "other" };
    f.session.token = "other-token";
    waiting.resolve({ message: "Saved" });
    assert.equal(await pending, null);
    assert.equal(f.calls.get, 0);
    assert.equal(f.client.getQueryState(f.key).isInvalidated, false);
});

test("Logout khi GET đang chờ: hủy query, không khôi phục cache hồ sơ cũ", async (t) => {
    const f = fixture(t);
    const started = deferred();
    const waiting = deferred();
    let signal;
    f.seed(async (requestSignal) => { signal = requestSignal; started.resolve(); return waiting.promise; });
    const pending = f.load("@/features/auth/queries").useUpdateProfile().mutate(f.variables);
    await started.promise;
    f.client.clear();
    f.session.token = null;
    f.session.user = null;
    waiting.resolve(profile);
    assert.equal(await pending, null);
    assert.equal(signal.aborted, true);
    assert.equal(f.client.getQueryData(f.key), undefined);
});
