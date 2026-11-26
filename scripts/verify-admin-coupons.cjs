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

const sample = {
  id: '9007199254740993', code: 'SALE', discountType: 'PERCENTAGE', discountValue: 100,
  minOrderValue: 0, usageLimit: 3, usedCount: 1, active: true,
  startDate: '2026-11-24T17:00:00Z', endDate: '2026-11-25T17:00:00Z',
};
const form = {
  code: '  SALE  ', discountType: 'PERCENTAGE', discountValue: '100', minOrderValue: '0', usageLimit: '3',
  startDate: '2026-11-25T00:00', endDate: '2026-11-26T00:00',
};

test('Vietnam dates round trip across midnight without depending on machine timezone', () => {
  const time = loader()('@/features/admin/coupons/time');
  const previous = process.env.TZ;
  try {
    for (const timezone of ['UTC', 'America/Los_Angeles', 'Asia/Tokyo']) {
      process.env.TZ = timezone;
      assert.equal(time.vietnamTimeToInstant('2026-11-25T00:00'), '2026-11-24T17:00:00.000Z');
      assert.equal(time.instantToVietnamInput('2026-11-24T17:00:00.123Z'), '2026-11-25T00:00:00.123');
      assert.equal(time.vietnamTimeToInstant('2028-02-29T23:59:59.123'), '2028-02-29T16:59:59.123Z');
    }
    for (const value of ['', '2026-02-29T12:00', '2026-02-30T12:00', '2026-13-01T12:00', '2026-11-25T24:00', '2026-11-25T00:00Z']) {
      assert.equal(time.vietnamTimeToInstant(value), null, value);
    }
  } finally {
    if (previous === undefined) delete process.env.TZ;
    else process.env.TZ = previous;
  }
});

test('form enforces percentage/fixed amount rules, integer limits and inclusive date range', () => {
  const { couponFormSchema: schema, toCouponRequest } = loader()('@/features/admin/coupons/schemas');
  const payload = toCouponRequest(schema.parse(form));
  assert.equal(payload.code, 'SALE');
  assert.equal(payload.discountValue, 100);
  assert.equal(payload.startDate, '2026-11-24T17:00:00.000Z');
  assert.equal('active' in payload, false);
  assert.equal(schema.safeParse({ ...form, endDate: form.startDate }).success, true);
  assert.equal(schema.safeParse({ ...form, discountType: 'FIXED_AMOUNT', discountValue: '200000' }).success, true);
  for (const patch of [
    { code: ' ' }, { discountValue: '100.01' }, { discountValue: '0' }, { discountValue: '-1' },
    { discountValue: '' }, { discountValue: 'Infinity' }, { minOrderValue: '-1' },
    { usageLimit: '0' }, { usageLimit: '1.5' }, { usageLimit: '2147483648' },
    { endDate: '2026-11-24T23:59' }, { startDate: '' }, { discountType: 'UNKNOWN' },
    { discountType: 'FIXED_AMOUNT', discountValue: '0' },
  ]) assert.equal(schema.safeParse({ ...form, ...patch }).success, false, JSON.stringify(patch));
});

test('effective badge follows server inclusive start/end and usage limit; disabled takes precedence', () => {
  const { getCouponStatus: status } = loader()('@/features/admin/coupons/status');
  const start = Date.parse(sample.startDate);
  const end = Date.parse(sample.endDate);
  assert.equal(status(sample, start - 1), 'scheduled');
  assert.equal(status(sample, start), 'running');
  assert.equal(status(sample, end), 'running');
  assert.equal(status(sample, end + 1), 'expired');
  assert.equal(status({ ...sample, usedCount: 3 }, start), 'exhausted');
  assert.equal(status({ ...sample, active: false, usedCount: 3 }, end + 1), 'disabled');
});

test('array filtering/pagination stays local, clamps pages and preserves URL filters', () => {
  const { parseCouponFilters: parse, serializeCouponFilters: serialize, selectCouponPage: select } = loader()('@/features/admin/coupons/filters');
  const filters = parse(new URLSearchParams('keyword=SALE&status=running&page=99&size=10'));
  const rows = Array.from({ length: 11 }, (_, index) => ({ ...sample, id: String(index + 1) }));
  const result = select(rows, filters, Date.parse(sample.startDate));
  assert.equal(result.page, 2);
  assert.equal(result.rows.length, 1);
  assert.equal(result.totalItems, 11);
  assert.deepEqual(parse(serialize(filters)), filters);
  assert.equal(parse(new URLSearchParams('page=Infinity&size=200&status=unknown')).page, 1);
  assert.equal(parse(new URLSearchParams('size=200')).size, 10);
  assert.equal(select(rows, { ...filters, keyword: 'other' }, Date.parse(sample.startDate)).totalItems, 0);
});

test('HTTP contract uses array GET, JSON POST/PUT, text PUT toggle, string IDs and snapshot token', async () => {
  const calls = [];
  const api = loader({ '@/shared/api/client': { api: {
    get: async (...args) => { calls.push(['GET', ...args]); return { data: [sample] }; },
    post: async (...args) => { calls.push(['POST', ...args]); return { data: sample }; },
    put: async (...args) => { calls.push(['PUT', ...args]); return { data: args[0].endsWith('toggle-status') ? 'OK' : sample }; },
  } } })('@/features/admin/coupons/api');
  const signal = new AbortController().signal;
  assert.deepEqual(await api.getAdminCoupons(signal, 'snapshot'), [sample]);
  await api.saveAdminCoupon({}, 'snapshot');
  await api.saveAdminCoupon({}, 'snapshot', sample.id);
  assert.equal(await api.toggleAdminCoupon(sample.id, 'snapshot'), 'OK');
  assert.deepEqual(calls.map(call => [call[0], call[1]]), [
    ['GET', '/api/admin/coupons'], ['POST', '/api/admin/coupons'],
    ['PUT', '/api/admin/coupons/9007199254740993'], ['PUT', '/api/admin/coupons/9007199254740993/toggle-status'],
  ]);
  assert.equal(calls[0][2].signal, signal);
  assert.equal(calls[0][2].params, undefined);
  for (const call of calls) assert.equal(call.at(-1).meta.authToken, 'snapshot');
  assert.equal(calls[3].at(-1).responseType, 'text');
  await assert.rejects(api.toggleAdminCoupon('1e3', 'snapshot'));
});

test('response validation requires actual active boolean and never rounds large IDs', async () => {
  const { adminCouponSchema: schema } = loader()('@/features/admin/coupons/schemas');
  assert.equal(schema.parse(sample).id, '9007199254740993');
  assert.equal(schema.safeParse({ ...sample, active: undefined, isActive: true }).success, false);
  assert.equal(schema.safeParse({ ...sample, id: 9007199254740993 }).success, false);
});

function queryHarness(role = 'ADMIN') {
  const client = new QueryClient();
  const snapshot = { userId: '10', role, token: 'snapshot' };
  const current = { user: { id: '10', role }, token: 'snapshot' };
  let expired = false;
  let mutationOptions;
  let queryOptions;
  let writes = 0;
  let failure;
  const load = loader({
    '@tanstack/react-query': {
      useQueryClient: () => client, useIsMutating: () => 0,
      useMutation: options => { mutationOptions = options; return {}; },
      useQuery: options => { queryOptions = options; return {}; },
    },
    '@/shared/auth/session.store': { useSession: { getState: () => current } },
    '@/shared/auth/jwt': { isExpired: () => expired },
    '@/features/admin/coupons/api': {
      getAdminCoupons: async () => [sample],
      toggleAdminCoupon: async () => { writes++; if (failure) throw failure; return 'OK'; },
      saveAdminCoupon: async () => { writes++; if (failure) throw failure; return sample; },
    },
  });
  const hooks = load('@/features/admin/coupons/queries');
  hooks.useCouponAction(snapshot);
  hooks.useAdminCoupons(snapshot);
  return { hooks, client, snapshot, current, mutationOptions, queryOptions,
    writes: () => writes, expire: () => { expired = true; }, fail: error => { failure = error; } };
}

test('STAFF can read but mutation is rejected; stale session and expired tokens cannot write', async () => {
  for (const role of ['STAFF', 'CUSTOMER', 'ADMIN']) {
    const h = queryHarness(role);
    assert.equal(h.queryOptions.enabled, role !== 'CUSTOMER');
    if (role === 'ADMIN') h.current.token = 'replacement';
    await assert.rejects(h.mutationOptions.mutationFn({ kind: 'toggle', id: sample.id }));
    assert.equal(h.writes(), 0);
    h.client.clear();
  }
  const h = queryHarness();
  h.expire();
  assert.equal(h.hooks.isCurrentCouponsSession(h.snapshot), false);
  await assert.rejects(h.queryOptions.queryFn({ signal: new AbortController().signal }));
  h.client.clear();
});

test('timeout never retries or pauses a toggle for replay on reconnect', async () => {
  const h = queryHarness();
  const { ApiError } = loader()('@/shared/api/errors');
  h.fail(new ApiError(0, 'timeout'));
  onlineManager.setOnline(false);
  try {
    const observer = new MutationObserver(h.client, h.mutationOptions);
    await assert.rejects(observer.mutate({ kind: 'toggle', id: sample.id }));
    assert.equal(h.writes(), 1);
    onlineManager.setOnline(true);
    await h.client.resumePausedMutations();
    assert.equal(h.writes(), 1);
    assert.equal(h.mutationOptions.retry, false);
    assert.equal(observer.getCurrentResult().isPaused, false);
  } finally {
    onlineManager.setOnline(true);
    h.client.clear();
  }
});

// Exercise the actual dialog's execute callback with deterministic React hook slots.
// This verifies request/state behavior; it does not test DOM focus or popup layout.
function dialogHarness({ write = async () => sample, read = async () => {}, toggle = true } = {}) {
  const React = require('react');
  const { ApiError } = loader()('@/shared/api/errors');
  const slots = [];
  let cursor = 0, writes = 0, reads = 0, blocked = false, current = true;
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
    },
    '@/shared/api/errors': { ApiError },
    '@/features/admin/coupons/queries': {
      isCurrentCouponsSession: () => current,
      isCouponResultUncertain: error => !(error instanceof ApiError) || error.status === 0 || error.status >= 500,
      useCouponAction: () => ({ isPending: false,
        mutateAsync: async action => { writes++; return write(action, ApiError); },
        refresh: async () => { reads++; return read(); },
      }),
    },
  });
  const { CouponActionDialog } = load('@/features/admin/coupons/components/CouponActionDialog');
  function render() {
    cursor = 0;
    return CouponActionDialog({ coupon: sample, toggle, snapshot: { role: 'ADMIN' }, blocked,
      onBlocked: () => { blocked = true; }, onNotice: text => notices.push(text) });
  }
  function find(predicate, node = render()) {
    if (!node || typeof node !== 'object') return;
    if (predicate(node)) return node;
    for (const child of React.Children.toArray(node.props?.children)) {
      const found = find(predicate, child);
      if (found) return found;
    }
  }
  return {
    find, notices, changeSession: () => { current = false; },
    submit: async () => {
      if (toggle) {
        find(node => node.props?.children === 'Xác nhận').props.onClick();
        await new Promise(setImmediate);
      } else await find(node => typeof node.props?.onSave === 'function').props.onSave({});
    },
    get writes() { return writes; }, get reads() { return reads; }, get blocked() { return blocked; },
  };
}

test('real dialog: double click sends once; successful write with failed GET remains saved and blocked', async () => {
  let finish;
  const h = dialogHarness({ write: () => new Promise(resolve => { finish = resolve; }), read: async () => { throw new Error('GET failed'); } });
  await h.submit();
  await h.submit();
  assert.equal(h.writes, 1);
  finish(sample);
  await new Promise(setImmediate);
  assert.equal(h.blocked, true);
  assert.match(h.notices.at(-1), /Đã lưu.*không gửi lại/);
  await h.submit();
  assert.equal(h.writes, 1);
});

test('real dialog: timeout locks writes even after successful GET and close/reopen', async () => {
  const h = dialogHarness({ write: async () => { throw new Error('timeout'); } });
  await h.submit();
  assert.equal(h.blocked, true);
  assert.equal(h.reads, 1);
  const dialog = () => h.find(node => typeof node.props?.onOpenChange === 'function');
  dialog().props.onOpenChange(false, { cancel() {} });
  dialog().props.onOpenChange(true, { cancel() {} });
  await h.submit();
  assert.equal(h.writes, 1);
  assert.match(h.notices[0], /GET sau timeout chưa chứng minh/);
});

test('real dialog: duplicate code 409 keeps form editable; 404 locks stale resource', async () => {
  const duplicate = dialogHarness({ toggle: false, write: async (_, ApiError) => { throw new ApiError(409, 'duplicate code'); } });
  await duplicate.submit();
  assert.equal(duplicate.blocked, false);
  assert.equal(duplicate.find(node => typeof node.props?.onSave === 'function').props.disabled, false);
  const missing = dialogHarness({ write: async (_, ApiError) => { throw new ApiError(404, 'missing'); } });
  await missing.submit();
  assert.equal(missing.blocked, true);
  assert.equal(missing.reads, 1);
});

test('real dialog: late response after a session change cannot publish success', async () => {
  let finish;
  const h = dialogHarness({ write: () => new Promise(resolve => { finish = resolve; }) });
  await h.submit();
  h.changeSession();
  finish(sample);
  await new Promise(setImmediate);
  assert.deepEqual(h.notices, []);
  assert.equal(h.blocked, false);
});

test('login redirect preserves coupon query/hash for A/M/S and rejects CUSTOMER', () => {
  const previous = global.window;
  global.window = { location: { origin: 'https://shop.test' } };
  try {
    const { getLoginDestination } = loader()('@/shared/auth/redirect');
    const target = '/admin/coupons?status=running&page=2#list';
    for (const role of ['ADMIN', 'MANAGER', 'STAFF']) assert.equal(getLoginDestination(role, target), target);
    assert.equal(getLoginDestination('CUSTOMER', target), '/');
  } finally { global.window = previous; }
});
