const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { MemoryRouter } = require('react-router');
const root = path.resolve(__dirname, '..');

function loader(mocks = {}) {
  const cache = new Map();
  function load(name, parent = path.join(root, 'src/index.ts')) {
    const resolved = name.startsWith('@/') ? path.join(root, 'src', name.slice(2))
      : name.startsWith('.') ? path.resolve(path.dirname(parent), name) : null;
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

const dates = loader()('@/features/admin/dashboard/dateRange');
const range = { startDate: '2026-11-01', endDate: '2026-11-27' };

test('date-only validation: same day, 365-day boundary, leap year and invalid input', () => {
  for (const input of [range, { startDate: '2024-02-29', endDate: '2024-02-29' },
    { startDate: '2024-01-01', endDate: '2024-12-31' }]) {
    assert.equal(dates.validateDateRange(input), null);
  }
  for (const input of [
    { startDate: '2024-01-01', endDate: '2025-01-01' },
    { startDate: '2026-02-29', endDate: '2026-03-01' },
    { startDate: '2026-11-28', endDate: '2026-11-27' },
    { startDate: '', endDate: range.endDate },
    { startDate: '0000-01-01', endDate: range.endDate },
    { startDate: '2026-11-01T00:00:00Z', endDate: range.endDate },
  ]) assert.equal(typeof dates.validateDateRange(input), 'string');
});

test('presets include today and cross month/year; today follows Vietnam midnight', () => {
  assert.deepEqual(dates.presetDateRange('7days', '2026-01-03'), { startDate: '2025-12-28', endDate: '2026-01-03' });
  assert.deepEqual(dates.presetDateRange('30days', '2024-03-01'), { startDate: '2024-02-01', endDate: '2024-03-01' });
  assert.deepEqual(dates.presetDateRange('month', '2026-01-03'), { startDate: '2026-01-01', endDate: '2026-01-03' });
  assert.equal(dates.vietnamToday(new Date('2026-11-26T17:00:00Z')), '2026-11-27');
});

test('URL round trip preserves range and invalid deep links remain invalid', () => {
  assert.deepEqual(dates.parseDateRange(dates.serializeDateRange(range)), range);
  assert.deepEqual(dates.parseDateRange(new URLSearchParams(), '2026-11-27'), { startDate: '2026-10-29', endDate: '2026-11-27' });
  assert.ok(dates.validateDateRange(dates.parseDateRange(new URLSearchParams('startDate=bad'))));
});

test('GET sends date strings unchanged, auth snapshot and AbortSignal; invalid input never dispatches', async () => {
  const calls = [];
  const overview = { stats: null, revenueChart: [], orderStatusDistribution: [], lowStockAlerts: [] };
  const api = loader({ '@/shared/api/client': { api: { get: async (...args) => { calls.push(args); return { data: overview }; } } } })('@/features/admin/dashboard/api');
  const signal = new AbortController().signal;
  assert.equal(await api.getAdminDashboard(range, signal, 'token'), overview);
  assert.equal(calls[0][0], '/api/admin/dashboard');
  assert.deepEqual(calls[0][1], { params: range, signal, meta: { authToken: 'token', noPublicRetry: true } });
  await assert.rejects(api.getAdminDashboard({ ...range, startDate: 'bad' }, signal, 'token'));
  assert.equal(calls.length, 1);
});

function queryHarness(role = 'ADMIN', input = range) {
  const snapshot = { userId: '9007199254740993', role, token: 'snapshot' };
  const current = { user: { id: snapshot.userId, role }, token: snapshot.token };
  let options, expired = false, reads = 0;
  let read = async () => ({ stats: null });
  const hooks = loader({
    '@tanstack/react-query': { useQuery: value => { options = value; return {}; } },
    '@/shared/auth/session.store': { useSession: { getState: () => current } },
    '@/shared/auth/jwt': { isExpired: () => expired },
    '@/features/admin/dashboard/api': { getAdminDashboard: async () => { reads++; return read(); } },
  })('@/features/admin/dashboard/queries');
  hooks.useAdminDashboard(input, snapshot);
  return { hooks, snapshot, current, options, reads: () => reads, expire: () => { expired = true; }, setRead: value => { read = value; } };
}

test('query isolates user/role/range, excludes token; A/M allowed, STAFF/CUSTOMER denied', async () => {
  for (const role of ['ADMIN', 'MANAGER', 'STAFF', 'CUSTOMER']) {
    const h = queryHarness(role);
    assert.equal(h.options.enabled, ['ADMIN', 'MANAGER'].includes(role));
    assert.equal(h.options.retry, false);
    assert.deepEqual(h.options.queryKey, ['admin', h.snapshot.userId, role, 'dashboard', range]);
    assert.equal(h.options.queryKey.includes('snapshot'), false);
    if (!h.options.enabled) {
      await assert.rejects(h.options.queryFn({ signal: new AbortController().signal }));
      assert.equal(h.reads(), 0);
    }
  }
  assert.equal(queryHarness('ADMIN', { ...range, startDate: 'bad' }).options.enabled, false);
});

test('expired or switched sessions block dispatch; late or aborted responses cannot publish', async () => {
  for (const change of [h => h.expire(), h => { h.current.token = 'new'; }, h => { h.current.user.id = '20'; }]) {
    const h = queryHarness();
    change(h);
    await assert.rejects(h.options.queryFn({ signal: new AbortController().signal }));
    assert.equal(h.reads(), 0);
  }
  const h = queryHarness();
  h.setRead(async () => { h.current.user.role = 'CUSTOMER'; return {}; });
  await assert.rejects(h.options.queryFn({ signal: new AbortController().signal }));
  h.current.user.role = 'ADMIN';
  const controller = new AbortController();
  h.setRead(async () => { controller.abort(); return {}; });
  await assert.rejects(h.options.queryFn({ signal: controller.signal }));
});

test('login fallback and deep links respect role; allowed destinations retain search/hash', () => {
  global.window = { location: { origin: 'http://localhost:5173' } };
  try {
    const { getLoginDestination: destination } = loader()('@/shared/auth/redirect');
    for (const role of ['ADMIN', 'MANAGER']) {
      assert.equal(destination(role), '/admin/dashboard');
      assert.equal(destination(role, '/admin/dashboard?startDate=2026-11-01#chart'), '/admin/dashboard?startDate=2026-11-01#chart');
      assert.equal(destination(role, '/admin/users/123'), '/admin/users/123');
    }
    assert.equal(destination('STAFF', '/admin/dashboard'), '/admin/orders');
    assert.equal(destination('CUSTOMER', '/admin/dashboard'), '/');
    assert.equal(destination('ADMIN', '//evil.example'), '/admin/dashboard');
  } finally { delete global.window; }
});

test('charts expose text, null/zero/empty states and one table row per backend day', () => {
  const { DashboardCharts } = loader()('@/features/admin/dashboard/components/DashboardCharts');
  const render = props => renderToStaticMarkup(React.createElement(DashboardCharts, props));
  const empty = render({ points: [], distribution: [] });
  assert.match(empty, /Không có dữ liệu/);
  const html = render({ points: [
    { date: '2026-11-01', revenue: 0, orderCount: 0 },
    { date: '2026-11-02', revenue: null, orderCount: null },
  ], distribution: [{ status: 'PENDING', count: 1 }] });
  assert.equal((html.match(/<tbody>.*?<\/tbody>/s)[0].match(/<tr/g) || []).length, 2);
  assert.match(html, /Chờ xác nhận/);
  assert.match(html, /1 đơn/);
  assert.match(html, /<td[^>]*>—<\/td>/);
  assert.doesNotMatch(html, /NaN|Infinity/);
});

test('low stock link encodes SKU and keeps Long ID string intact', () => {
  const { LowStockTable } = loader()('@/features/admin/dashboard/components/LowStockTable');
  const html = renderToStaticMarkup(React.createElement(MemoryRouter, null,
    React.createElement(LowStockTable, { items: [{ productVariantId: '9007199254740993', sku: 'SKU +&/01', productName: null, quantity: 0 }] })));
  assert.match(html, /keyword=SKU\+%2B%26%2F01/);
  assert.match(html, /maxQuantity=10/);
  assert.match(html, />0</);
});

test('page renders initial loading, 403, stale refresh and null values without turning missing totals into zero', () => {
  const snapshot = { userId: '10', role: 'ADMIN', token: 'snapshot' };
  function render(query, entry = '/admin/dashboard') {
    const { DashboardPage } = loader({
      '@/shared/auth/guards': { RequireRole: ({ children }) => children },
      '@/features/admin/dashboard/queries': { useDashboardSession: () => snapshot, useAdminDashboard: () => query },
    })('@/features/admin/dashboard/pages/DashboardPage');
    return renderToStaticMarkup(React.createElement(MemoryRouter, { initialEntries: [entry] }, React.createElement(DashboardPage)));
  }
  assert.match(render({ isPending: true }), /Đang tải dashboard/);
  assert.match(render({ isError: true, error: new Error('403 Forbidden') }), /403 Forbidden/);
  const html = render({ data: { stats: null, revenueChart: null, orderStatusDistribution: null, lowStockAlerts: null }, isFetching: true });
  assert.match(html, /Đang cập nhật số liệu/);
  assert.match(html, /aria-busy="true"/);
  assert.match(html, />—<\/p>/);
  assert.match(html, /Không có cảnh báo tồn kho/);
  assert.match(render({ isError: true, error: new Error('Network'), data: { stats: null } }), /dữ liệu đã tải trước đó/);
  const invalid = render({ isPending: true }, '/admin/dashboard?startDate=bad&endDate=2026-11-27');
  assert.match(invalid, /Chọn lại khoảng ngày/);
  assert.doesNotMatch(invalid, /Đang tải dashboard/);
});
