const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const { QueryClient, MutationObserver, onlineManager } = require('@tanstack/react-query');
const root = path.resolve(__dirname, '..');

function loader(mocks = {}) {
  const cache = new Map();
  function load(name, parent = path.join(root, 'src/index.ts')) {
    const resolved = name.startsWith('@/') ? path.join(root, 'src', name.slice(2)) : name.startsWith('.') ? path.resolve(path.dirname(parent), name) : null;
    const alias = resolved ? '@/' + path.relative(path.join(root, 'src'), resolved).split(path.sep).join('/') : name;
    if (Object.hasOwn(mocks, alias)) return mocks[alias];
    if (!resolved) return require(name);
    const filename = [resolved + '.ts', resolved + '.tsx', resolved].find(fs.existsSync);
    if (cache.has(filename)) return cache.get(filename).exports;
    const module = { exports: {} };
    cache.set(filename, module);
    const source = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      compilerOptions: { target: ts.ScriptTarget.ES2023, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
    }).outputText;
    new Function('require', 'module', 'exports', source)(child => load(child, filename), module, module.exports);
    return module.exports;
  }
  return load;
}

const sample = { id: '9007199254740993', fullName: 'Test', email: 'test@example.com', phone: null, role: 'CUSTOMER', status: 'ACTIVE' };

test('actor/target matrix denies self changes, STAFF/CUSTOMER and manager non-customer status changes', () => {
  const policy = loader()('@/features/admin/users/policy');
  for (const role of ['ADMIN', 'MANAGER', 'STAFF', 'CUSTOMER']) {
    for (const targetRole of ['ADMIN', 'MANAGER', 'STAFF', 'CUSTOMER']) {
      const target = { ...sample, role: targetRole };
      const actor = { userId: '10', role };
      assert.equal(policy.canChangeUserStatus(actor, target), role === 'ADMIN' || (role === 'MANAGER' && targetRole === 'CUSTOMER'));
      assert.equal(policy.canChangeUserRole(actor, target), role === 'ADMIN');
      assert.equal(policy.canChangeUserRole({ ...actor, userId: target.id }, target), false);
      assert.equal(policy.canChangeUserStatus({ ...actor, userId: target.id }, target), false);
    }
  }
  assert.equal(policy.canChangeUserStatus({ userId: '10', role: 'ADMIN' }, { ...sample, status: 'PENDING' }), false);
  assert.equal(policy.canPerformUserAction({ userId: '10', role: 'ADMIN' }, sample, { kind: 'status', value: 'ACTIVE' }), false);
});

test('URL normalizes page/size, trims keyword and round trips', () => {
  const { parseUserFilters: parse, serializeUserFilters: serialize } = loader()('@/features/admin/users/filters');
  const filters = parse(new URLSearchParams('keyword=%20Test%20&page=2&size=20'));
  assert.deepEqual(filters, { keyword: 'Test', page: 2, size: 20 });
  assert.deepEqual(parse(serialize(filters)), filters);
  for (const page of ['0', '-1', 'Infinity', '1.5', '2147483648']) {
    assert.equal(parse(new URLSearchParams({ page, size: '999' })).page, 1);
    assert.equal(parse(new URLSearchParams({ page, size: '999' })).size, 10);
  }
});

test('runtime action validation rejects PENDING and unknown roles', () => {
  const { userActionSchema: schema } = loader()('@/features/admin/users/schemas');
  assert.equal(schema.safeParse({ kind: 'status', value: 'PENDING' }).success, false);
  assert.equal(schema.safeParse({ kind: 'role', value: 'ROOT' }).success, false);
  assert.deepEqual(schema.parse({ kind: 'role', value: 'MANAGER' }), { kind: 'role', value: 'MANAGER' });
});

test('HTTP uses server pagination, string Long IDs, text PUT with query params and no JSON body', async () => {
  const calls = [];
  const api = loader({ '@/shared/api/client': { api: {
    get: async (...args) => { calls.push(['GET', ...args]); return { data: args[0].endsWith(sample.id) ? sample : { content: [sample], page: { number: 1, size: 20, totalElements: 21, totalPages: 2 } } }; },
    put: async (...args) => { calls.push(['PUT', ...args]); return { data: 'OK' }; },
  } } })('@/features/admin/users/api');
  const signal = new AbortController().signal;
  assert.equal((await api.getAdminUsers({ keyword: 'test', page: 2, size: 20 }, signal, 'token')).items[0].id, sample.id);
  assert.deepEqual(calls[0][2].params, { keyword: 'test', page: 1, size: 20 });
  assert.equal(calls[0][2].signal, signal);
  assert.equal((await api.getAdminUser(sample.id, signal, 'token')).id, sample.id);
  for (const action of [{ kind: 'status', value: 'INACTIVE' }, { kind: 'role', value: 'STAFF' }]) {
    assert.equal(await api.updateAdminUser(sample.id, action, 'token'), 'OK');
    const call = calls.at(-1);
    assert.equal(call[1], `/api/admin/users/${sample.id}/${action.kind}`);
    assert.equal(call[2], undefined);
    assert.deepEqual(call[3].params, { [action.kind]: action.value });
    assert.equal(call[3].responseType, 'text');
    assert.deepEqual(call[3].meta, { authToken: 'token', noPublicRetry: true });
  }
  const count = calls.length;
  for (const id of ['0', 'abc', '9223372036854775808']) await assert.rejects(api.getAdminUser(id, signal, 'token'));
  await assert.rejects(api.updateAdminUser(sample.id, { kind: 'status', value: 'PENDING' }, 'token'));
  assert.equal(calls.length, count);
});

function queryHarness(role = 'ADMIN', target = sample) {
  const client = new QueryClient();
  const snapshot = { userId: '10', role, token: 'snapshot' };
  const current = { user: { id: '10', role }, token: 'snapshot' };
  let mutationOptions, queryOptions, expired = false, writes = 0, failure;
  let read = async () => target;
  const load = loader({
    '@tanstack/react-query': {
      useQueryClient: () => client, useIsMutating: () => 0,
      useMutation: options => { mutationOptions = options; return {}; },
      useQuery: options => { queryOptions = options; return {}; },
    },
    '@/shared/auth/session.store': { useSession: { getState: () => current } },
    '@/shared/auth/jwt': { isExpired: () => expired },
    '@/features/admin/users/api': {
      getAdminUsers: async () => read(), getAdminUser: async () => read(),
      updateAdminUser: async () => { writes++; if (failure) throw failure; return 'OK'; },
    },
  });
  const hooks = load('@/features/admin/users/queries');
  hooks.useUserAction(target, snapshot);
  hooks.useAdminUser(target.id, snapshot);
  return { hooks, client, snapshot, current, mutationOptions, queryOptions,
    writes: () => writes, expire: () => { expired = true; }, fail: error => { failure = error; }, setRead: fn => { read = fn; } };
}

test('query and mutation enforce session, expiry and actor/target permissions before HTTP', async () => {
  for (const role of ['STAFF', 'CUSTOMER', 'MANAGER']) {
    const h = queryHarness(role, { ...sample, role: 'STAFF' });
    assert.equal(h.queryOptions.enabled, role === 'MANAGER');
    await assert.rejects(h.mutationOptions.mutationFn({ kind: 'status', value: 'INACTIVE' }));
    await assert.rejects(h.mutationOptions.mutationFn({ kind: 'role', value: 'ADMIN' }));
    assert.equal(h.writes(), 0);
    h.client.clear();
  }
  for (const change of [h => { h.current.token = 'new'; }, h => h.expire()]) {
    const h = queryHarness();
    change(h);
    await assert.rejects(h.queryOptions.queryFn({ signal: new AbortController().signal }));
    await assert.rejects(h.mutationOptions.mutationFn({ kind: 'status', value: 'INACTIVE' }));
    assert.equal(h.writes(), 0);
    h.client.clear();
  }
});

test('late or aborted GET cannot publish data; keys include actor/role but no token', async () => {
  const h = queryHarness();
  assert.deepEqual(h.queryOptions.queryKey.slice(-5), ['10', 'ADMIN', 'users', 'detail', sample.id]);
  assert.equal(h.queryOptions.queryKey.includes(h.snapshot.token), false);
  h.setRead(async () => { h.current.user.role = 'CUSTOMER'; return sample; });
  await assert.rejects(h.queryOptions.queryFn({ signal: new AbortController().signal }));
  h.current.user.role = 'ADMIN';
  h.setRead(async () => sample);
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(h.queryOptions.queryFn({ signal: controller.signal }));
  h.client.clear();
});

test('timeout does not pause/replay mutation when connection resumes', async () => {
  const h = queryHarness();
  h.fail(new Error('timeout'));
  onlineManager.setOnline(false);
  try {
    const observer = new MutationObserver(h.client, h.mutationOptions);
    await assert.rejects(observer.mutate({ kind: 'status', value: 'INACTIVE' }));
    onlineManager.setOnline(true);
    await h.client.resumePausedMutations();
    assert.equal(h.writes(), 1);
    assert.equal(observer.getCurrentResult().isPaused, false);
    assert.equal(h.mutationOptions.retry, false);
  } finally { onlineManager.setOnline(true); h.client.clear(); }
});

// Execute the actual form callback with deterministic hook slots; no DOM/focus assertions.
function dialogHarness({ write = async () => 'OK', read = async () => {} } = {}) {
  const React = require('react');
  const { ApiError } = loader()('@/shared/api/errors');
  const slots = [];
  let cursor = 0, writes = 0, blocked = false, missing = false, current = true;
  const notices = [];
  const load = loader({
    react: { ...React,
      useState: initial => {
        const index = cursor++;
        if (!(index in slots)) slots[index] = typeof initial === 'function' ? initial() : initial;
        return [slots[index], value => { slots[index] = typeof value === 'function' ? value(slots[index]) : value; }];
      },
      useRef: initial => {
        const index = cursor++;
        if (!(index in slots)) slots[index] = { current: initial };
        return slots[index];
      },
      useEffect: fn => { fn(); }, useId: () => 'test-id',
    },
    '@/shared/api/errors': { ApiError },
    '@/features/admin/users/queries': {
      isCurrentUsersSession: () => current,
      useUserAction: () => ({ isPending: false, mutateAsync: async action => { writes++; return write(action, ApiError); }, refresh: read }),
    },
  });
  const { UserActionDialog } = load('@/features/admin/users/components/UserActionDialog');
  function render() {
    cursor = 0;
    return UserActionDialog({ user: sample, kind: 'status', snapshot: { userId: '10', role: 'ADMIN' }, blocked,
      onBlocked: () => { blocked = true; }, onMissing: () => { missing = true; }, onNotice: text => notices.push(text) });
  }
  function find(predicate, node = render()) {
    if (!node || typeof node !== 'object') return;
    if (predicate(node)) return node;
    for (const child of React.Children.toArray(node.props?.children)) {
      const found = find(predicate, child);
      if (found) return found;
    }
  }
  return { find, notices, submit: () => find(node => node.type === 'form').props.onSubmit({ preventDefault() {} }),
    changeSession: () => { current = false; }, get writes() { return writes; }, get blocked() { return blocked; }, get missing() { return missing; } };
}

test('real dialog double submit sends once and saved/GET error blocks resubmission', async () => {
  let finish;
  const h = dialogHarness({ write: () => new Promise(resolve => { finish = resolve; }), read: async () => { throw new Error('GET'); } });
  h.submit(); h.submit();
  assert.equal(h.writes, 1);
  finish('OK');
  await new Promise(setImmediate);
  assert.equal(h.blocked, true);
  assert.match(h.notices.at(-1), /Đã lưu.*không gửi lại/);
  h.submit();
  assert.equal(h.writes, 1);
});

test('real dialog timeout stays blocked after successful GET and reopening', async () => {
  const h = dialogHarness({ write: async () => { throw new Error('timeout'); } });
  h.submit();
  await new Promise(setImmediate);
  assert.equal(h.blocked, true);
  const root = () => h.find(node => typeof node.props?.onOpenChange === 'function');
  root().props.onOpenChange(false, { cancel() {} });
  root().props.onOpenChange(true, { cancel() {} });
  h.submit();
  assert.equal(h.writes, 1);
});

test('real dialog handles 400 as editable and 404 as missing', async () => {
  const bad = dialogHarness({ write: async (_, ApiError) => { throw new ApiError(400, 'invalid'); } });
  bad.submit();
  await new Promise(setImmediate);
  assert.equal(bad.blocked, false);
  assert.ok(bad.find(node => node.props?.children === 'invalid'));
  const missing = dialogHarness({ write: async (_, ApiError) => { throw new ApiError(404, 'missing'); } });
  missing.submit();
  await new Promise(setImmediate);
  assert.equal(missing.missing, true);
});

test('real dialog ignores late success after changing session', async () => {
  let finish;
  const h = dialogHarness({ write: () => new Promise(resolve => { finish = resolve; }) });
  h.submit(); h.changeSession(); finish('OK');
  await new Promise(setImmediate);
  assert.deepEqual(h.notices, []);
});

test('redirect preserves list/detail query/hash only for ADMIN/MANAGER', () => {
  const previous = global.window;
  global.window = { location: { origin: 'https://shop.test' } };
  try {
    const { getLoginDestination } = loader()('@/shared/auth/redirect');
    for (const target of ['/admin/users?keyword=test&page=2#list', `/admin/users/${sample.id}#detail`]) {
      for (const role of ['ADMIN', 'MANAGER']) assert.equal(getLoginDestination(role, target), target);
      assert.equal(getLoginDestination('STAFF', target), '/admin/orders');
      assert.equal(getLoginDestination('CUSTOMER', target), '/');
    }
    assert.equal(getLoginDestination('ADMIN', '/admin/users/0'), '/admin/dashboard');
  } finally { global.window = previous; }
});
