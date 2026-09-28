


const sb = window.DemoStore;

let allOrders          = [];
let pickupsMap         = {};   // order_id -> pickup record
let engravingMap       = {};   // order_id -> engraving details
let repairMap          = {};   // order_id -> repair details
let imagesMap          = {};   // order_id -> [order_images rows, sorted]
let catalogItemsMap    = {};   // order_id -> [order_catalog_items rows, sorted by sort_order]
let catalogDetailsMap  = {};   // order_id -> single legacy catalog_order_details row (fallback for old single-model orders)
let orderItemsMap      = {};   // order_id -> [order_items rows, sorted] (repair/engraving multi-item)
let activeTab      = 'current';
let searchQuery    = '';
let filters        = {
  status:         'all',
  orderType:      'all',
  creationMonth:  'all',
  creationYear:   'all',
  receivedMonth:  'all',
  receivedYear:   'all'
};

const VIEW_KEY = 'tracking_demo_orders_view_v1';
let viewMode   = 'cards';
let activeOrderId       = null;
let pendingDeleteId     = null;
let pendingPickupOrderId = null;
let pendingStatusVal    = null;
let editMode            = false;

const MONTH_NAMES_AR = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];

function orderTypeAr(t) {
  return { engraving:'حفر', repair:'تصليح', catalog:'صورة من الكتالوج', renewal:'تجديد' }[t] || t;
}

const isRenewalOrder = (t) => t === 'renewal';
function statusAr(s) {
  return { in_progress:'قيد التنفيذ', completed:'مكتملة' }[s] || s;
}
function typeBadgeClass(t) {
  return { engraving:'badge-engraving', repair:'badge-repair', catalog:'badge-catalog', renewal:'badge-renewal' }[t] || 'badge-engraving';
}





function pad2(n) { return String(n).padStart(2, '0'); }
function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
}
function formatDateTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}
function safeStr(v) { return v || '—'; }

function fullNum(o)  { return String((o && o.order_number) || (o && o.id) || ''); }
function shortNum(o) {
  const n = fullNum(o);
  return /^[0-9]{11,}$/.test(n) ? n.slice(8) : n.slice(-4);   // slice(8) = past DDMMYYYY
}

async function loadAll() {
  const container = document.getElementById('orders-list');

  const timeoutId = setTimeout(() => {
    if (container && container.querySelector('.skeleton-card')) {
      container.innerHTML = buildEmptyState('⚠️', 'انتهت مهلة الاتصال', 'تحقق من اتصالك بالإنترنت ثم أعد تحميل الصفحة');
    }
  }, 12000);

  try {
    const [ordersRes, pickupsRes, engravingRes, repairRes, imagesRes, catalogItemsRes, catalogDetailsRes, orderItemsRes] = await Promise.all([
      sb.from('orders').select('*').order('created_at', { ascending: false }),
      sb.from('order_pickups').select('*'),
      sb.from('engraving_order_details').select('*'),
      sb.from('repair_order_details').select('*'),
      sb.from('order_images').select('*').order('sort_order', { ascending: true }),
      sb.from('order_catalog_items').select('*').order('sort_order', { ascending: true }),
      sb.from('catalog_order_details').select('*'),
      sb.from('order_items').select('*').order('sort_order', { ascending: true })
    ]);

    clearTimeout(timeoutId);

    if (ordersRes.error)         throw ordersRes.error;
    if (pickupsRes.error)        throw pickupsRes.error;
    if (engravingRes.error)      throw engravingRes.error;
    if (repairRes.error)         throw repairRes.error;
    if (imagesRes.error)         throw imagesRes.error;
    if (catalogItemsRes.error)   throw catalogItemsRes.error;
    if (catalogDetailsRes.error) throw catalogDetailsRes.error;
    if (orderItemsRes.error)     throw orderItemsRes.error;

    allOrders = ordersRes.data || [];

    pickupsMap = {};
    (pickupsRes.data || []).forEach(p => { pickupsMap[p.order_id] = p; });

    engravingMap = {};
    (engravingRes.data || []).forEach(e => { engravingMap[e.order_id] = e; });

    repairMap = {};
    (repairRes.data || []).forEach(r => { repairMap[r.order_id] = r; });

    imagesMap = {};
    (imagesRes.data || []).forEach(img => {
      (imagesMap[img.order_id] = imagesMap[img.order_id] || []).push(img);
    });

    catalogItemsMap = {};
    (catalogItemsRes.data || []).forEach(it => {
      (catalogItemsMap[it.order_id] = catalogItemsMap[it.order_id] || []).push(it);
    });

    catalogDetailsMap = {};
    (catalogDetailsRes.data || []).forEach(d => { catalogDetailsMap[d.order_id] = d; });

    orderItemsMap = {};
    (orderItemsRes.data || []).forEach(it => {
      (orderItemsMap[it.order_id] = orderItemsMap[it.order_id] || []).push(it);
    });

    populateDateDropdowns();
    renderOrders();
  } catch (err) {
    clearTimeout(timeoutId);
    console.error(err);
    if (container) container.innerHTML = buildEmptyState('⚠️', 'خطأ في التحميل: ' + (err.message || 'تعذر الاتصال'), 'تحقق من الاتصال وأعد المحاولة');
  }
}

function populateDateDropdowns() {
  const creationMonths = new Set();
  const creationYears  = new Set();
  const receivedMonths = new Set();
  const receivedYears  = new Set();

  allOrders.forEach(o => {
    if (o.created_at) {
      const d = new Date(o.created_at);
      creationMonths.add(d.getMonth() + 1);
      creationYears.add(d.getFullYear());
    }
  });

  Object.values(pickupsMap).forEach(p => {
    if (p.received_at) {
      const d = new Date(p.received_at);
      receivedMonths.add(d.getMonth() + 1);
      receivedYears.add(d.getFullYear());
    }
  });

  fillMonthSelect('filter-creation-month', [...creationMonths].sort((a,b)=>a-b));
  fillYearSelect('filter-creation-year',   [...creationYears].sort((a,b)=>b-a));
  fillMonthSelect('filter-received-month', [...receivedMonths].sort((a,b)=>a-b));
  fillYearSelect('filter-received-year',   [...receivedYears].sort((a,b)=>b-a));
}

function fillMonthSelect(id, months) {
  const sel = document.getElementById(id);
  const cur = sel.value;

  while (sel.options.length > 1) sel.remove(1);
  months.forEach(m => {
    const opt = document.createElement('option');
    opt.value = m;
    opt.textContent = MONTH_NAMES_AR[m - 1];
    sel.appendChild(opt);
  });
  if (cur !== 'all') sel.value = cur;
}

function fillYearSelect(id, years) {
  const sel = document.getElementById(id);
  const cur = sel.value;
  while (sel.options.length > 1) sel.remove(1);
  years.forEach(y => {
    const opt = document.createElement('option');
    opt.value = y;
    opt.textContent = y;
    sel.appendChild(opt);
  });
  if (cur !== 'all') sel.value = cur;
}


function matchesSearch(o, q) {
  const pickup = pickupsMap[o.id];
  return (
    (o.order_number || '').toLowerCase().includes(q) ||
    (o.customer_name_snapshot || '').toLowerCase().includes(q) ||
    (o.customer_phone_snapshot || '').toLowerCase().includes(q) ||
    orderTypeAr(o.order_type).toLowerCase().includes(q) ||
    (pickup && (pickup.recipient_name || '').toLowerCase().includes(q)) ||
    (pickup && (pickup.recipient_phone || '').toLowerCase().includes(q))
  );
}

function getFilteredOrders() {
  const isReceived = activeTab === 'received';

  let list = allOrders.filter(o => {
    const received = !!pickupsMap[o.id];
    return isReceived ? received : !received;
  });

  if (searchQuery.trim()) {
    const q = searchQuery.trim().toLowerCase();
    list = list.filter(o => matchesSearch(o, q));
  }

  if (filters.status !== 'all') {
    list = list.filter(o => o.status === filters.status);
  }

  if (filters.orderType !== 'all') {
    list = list.filter(o => o.order_type === filters.orderType);
  }

  if (filters.creationMonth !== 'all') {
    list = list.filter(o => {
      if (!o.created_at) return false;
      return (new Date(o.created_at).getMonth() + 1) === parseInt(filters.creationMonth);
    });
  }
  if (filters.creationYear !== 'all') {
    list = list.filter(o => {
      if (!o.created_at) return false;
      return new Date(o.created_at).getFullYear() === parseInt(filters.creationYear);
    });
  }

  if (isReceived && filters.receivedMonth !== 'all') {
    list = list.filter(o => {
      const p = pickupsMap[o.id];
      if (!p || !p.received_at) return false;
      return (new Date(p.received_at).getMonth() + 1) === parseInt(filters.receivedMonth);
    });
  }
  if (isReceived && filters.receivedYear !== 'all') {
    list = list.filter(o => {
      const p = pickupsMap[o.id];
      if (!p || !p.received_at) return false;
      return new Date(p.received_at).getFullYear() === parseInt(filters.receivedYear);
    });
  }

  return list;
}

function renderOrders() {
  if (viewMode === 'table') { renderOrdersTable(); return; }

  const list = getFilteredOrders();
  const container = document.getElementById('orders-list');
  const countEl   = document.getElementById('results-count');
  countEl.textContent = `${list.length} طلبية`;

  if (list.length === 0) {
    container.innerHTML = buildEmptyState(
      activeTab === 'received' ? '📦' : '📋',
      activeTab === 'received' ? 'لا توجد طلبيات مستلمة' : 'لا توجد طلبيات حالية',
      (searchQuery || filters.status !== 'all' || filters.orderType !== 'all') ? 'جرّب تغيير معايير البحث أو الفلتر' : 'ستظهر الطلبيات هنا عند إضافتها'
    );
    return;
  }

  container.innerHTML = list.map((o, i) =>
    activeTab === 'current' ? buildCurrentCard(o, i) : buildReceivedCard(o, i)
  ).join('');
}

function tableOrders() {



  const list = allOrders.slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const q = searchQuery.trim().toLowerCase();
  return q ? list.filter(o => matchesSearch(o, q)) : list;
}


function waNumber(phone) {
  let d = String(phone == null ? '' : phone).replace(/\D/g, '');
  if (!d) return '';
  if (d.startsWith('00'))  d = d.slice(2);      // 00972… → 972…
  if (d.startsWith('972')) return d;
  if (d.startsWith('0'))   return '972' + d.slice(1);
  return d;                                      // already international
}
function telHref(phone) {
  const d = waNumber(phone);
  return d ? '+' + d : '';
}

function priceLabel(v) {
  if (v === null || v === undefined || v === '') return 'لم يُحدد بعد';
  const n = Number(v);
  return isFinite(n) ? n.toFixed(2) + ' ₪' : String(v);
}

function orderPrice(o) {
  const raw = (o.price != null) ? o.price
            : (o.total_price != null) ? o.total_price
            : null;
  if (raw === null || raw === '') return '<span class="otbl-price-empty">—</span>';
  const n = Number(raw);
  if (!isFinite(n)) return `<span class="otbl-price">${escHtml(String(raw))}</span>`;

  return `<span class="otbl-price">${n.toFixed(2)} ₪</span>`;
}

function buildOrderRow(o) {
  const pickup   = pickupsMap[o.id];
  const received = !!pickup;
  const phone    = o.customer_phone_snapshot || '';


  const statusBadge = o.status === 'completed'
    ? '<span class="badge otbl-badge-lg badge-completed">مكتملة</span>'
    : '<span class="badge otbl-badge-lg badge-in-progress">قيد التنفيذ</span>';

  const recvBadge = received
    ? '<span class="badge badge-received">✅ نعم</span>'
    : '<span class="badge badge-awaiting">⏳ لا</span>';

  const recvTitle = received
    ? `المستلم: ${pickup.recipient_name || '—'}${pickup.received_at ? ' · ' + formatDate(pickup.received_at) : ''}`
    : 'اضغط لتأكيد الاستلام';

  return `<tr id="row-${o.id}">
    <td><span class="otbl-num" dir="ltr"># ${escHtml(fullNum(o))}</span></td>
    <td><span class="otbl-date" dir="ltr">${formatDate(o.created_at)}</span></td>
    <td><span class="otbl-name" title="${escHtml(o.customer_name_snapshot || '')}">${escHtml(o.customer_name_snapshot || '—')}</span></td>
    <td>${phone
          ? `<button type="button" class="otbl-phone" dir="ltr" title="اتصال أو واتساب"
                     onclick="openContactModal('${o.id}')">${escHtml(phone)}</button>`
          : '<span class="otbl-muted">—</span>'}</td>
    <td><span class="badge otbl-badge-lg ${typeBadgeClass(o.order_type)}">${escHtml(orderTypeAr(o.order_type))}</span></td>
    <td><button type="button" class="otbl-cellbtn" title="اضغط لتغيير الحالة"
                onclick="openStatusModal('${o.id}')">${statusBadge}</button></td>
    <td>${o.whatsapp_enabled
          ? '<span class="badge badge-whatsapp">📲 مفعّل</span>'
          : '<span class="badge badge-whatsapp-off">📵 غير مفعّل</span>'}</td>
    <td>${received
          ? `<span class="otbl-cellstatic" title="${escHtml(recvTitle)}">${recvBadge}</span>`
          : `<button type="button" class="otbl-cellbtn" title="${escHtml(recvTitle)}"
                     onclick="openPickupModal('${o.id}')">${recvBadge}</button>`}</td>
    <td>${orderPrice(o)}</td>
    <td>
      
      <div class="otbl-actions">
        <button class="btn-action btn-details otbl-btn" onclick="openDetails('${o.id}')">🔍 تفاصيل</button>
        <button type="button" class="otbl-x" title="حذف الطلبية" aria-label="حذف الطلبية"
                onclick="openDeleteModal('${o.id}')">✕</button>
      </div>
    </td>
  </tr>`;
}

function renderOrdersTable() {
  const list      = tableOrders();
  const container = document.getElementById('orders-list');
  const countEl   = document.getElementById('results-count');
  countEl.textContent = `${list.length} طلبية`;

  if (list.length === 0) {
    container.innerHTML = buildEmptyState('📋', 'لا توجد طلبيات',
      searchQuery ? 'جرّب تغيير كلمة البحث' : 'ستظهر الطلبيات هنا عند إضافتها');
    return;
  }

  container.innerHTML = `<div class="otbl-wrap">
    <table class="otbl">
      <thead>
        <tr>
          <th>رقم الطلبية</th>
          <th>تاريخ الإنشاء</th>
          <th>اسم العميل</th>
          <th>رقم الهاتف</th>
          <th>نوع الطلبية</th>
          <th>الحالة</th>
          <th>تتبع واتساب</th>
          <th>الاستلام</th>
          <th>السعر</th>
          <th>إجراءات</th>
        </tr>
      </thead>
      <tbody>${list.map(buildOrderRow).join('')}</tbody>
    </table>
  </div>`;
}

function setViewMode(mode, skipRender) {
  viewMode = mode === 'table' ? 'table' : 'cards';
  try { localStorage.setItem(VIEW_KEY, viewMode); } catch (e) {}

  const isTable = viewMode === 'table';
  document.getElementById('vt-cards').classList.toggle('active', !isTable);
  document.getElementById('vt-table').classList.toggle('active',  isTable);
  document.getElementById('vt-cards').setAttribute('aria-pressed', String(!isTable));
  document.getElementById('vt-table').setAttribute('aria-pressed', String(isTable));

  const tabs   = document.getElementById('tabs-container');
  const filter = document.getElementById('filter-panel');
  if (tabs)   tabs.style.display   = isTable ? 'none' : '';
  if (filter) filter.style.display = isTable ? 'none' : '';

  const container = document.getElementById('orders-list');
  if (container) container.style.display = isTable ? 'block' : '';

  const wrapper = document.querySelector('.page-wrapper');
  if (wrapper) wrapper.classList.toggle('table-mode', isTable);

  if (!skipRender) renderOrders();
}

function initViewMode() {
  let saved = null;
  try { saved = localStorage.getItem(VIEW_KEY); } catch (e) {}
  setViewMode(saved === 'table' ? 'table' : 'cards', true);
}

function buildEmptyState(icon, title, sub) {
  return `<div class="empty-state">
    <div class="empty-icon">${icon}</div>
    <div class="empty-title">${title}</div>
    <div class="empty-sub">${sub}</div>
  </div>`;
}

function buildCurrentCard(o, idx) {
  const typeBadge = `<span class="badge ${typeBadgeClass(o.order_type)}">${orderTypeAr(o.order_type)}</span>`;
  const statusBadge = o.status === 'completed'
    ? `<span class="badge badge-completed">مكتملة</span>`
    : `<span class="badge badge-in-progress">قيد التنفيذ</span>`;
  const waBadge = o.whatsapp_enabled
    ? `<span class="badge badge-whatsapp">📲 واتساب</span>`
    : `<span class="badge badge-whatsapp-off">📵 واتساب</span>`;
  const awaitBadge = `<span class="badge badge-awaiting">⏳ بانتظار الاستلام</span>`;
  const imgHtml = o.image_url
    ? `<img src="${escHtml(o.image_url)}" alt="صورة" class="card-thumbnail" onclick="openImagePreview('${escHtml(o.image_url)}')" />`
    : '';

  return `<div class="order-card" id="card-${o.id}" style="animation-delay:${idx * 0.05}s">
    <div class="card-header">
      <span class="badge badge-order-num"># ${shortNum(o)}</span>
      ${typeBadge}
      ${statusBadge}
      ${waBadge}
      ${awaitBadge}
    </div>
    <div class="card-info">
      <div class="card-text">
        <div class="card-customer-name">${escHtml(o.customer_name_snapshot || '—')}</div>
        <div class="card-customer-phone">📞 ${escHtml(o.customer_phone_snapshot || '—')}</div>
        <div class="card-date">🗓️ ${formatDate(o.created_at)}</div>
      </div>
      ${imgHtml}
    </div>
    <div class="card-actions">
      <button class="btn-action btn-details" onclick="openDetails('${o.id}')">🔍 عرض التفاصيل</button>
      <button class="btn-action btn-status"  onclick="openStatusModal('${o.id}')">🔄 تغيير الحالة</button>
      <button class="btn-action btn-print"   onclick="printOrder('${o.id}')">🖨️ معاينة ملصق</button><a class="btn-action demo-track-link" href="track.html?order=${encodeURIComponent(o.id)}">تتبّع الزبون</a>
      <button class="btn-action btn-pickup"  onclick="openPickupModal('${o.id}')">✅ تم الاستلام</button>
      <button class="btn-action btn-delete"  onclick="openDeleteModal('${o.id}')">🗑️ حذف</button>
    </div>
  </div>`;
}

function buildReceivedCard(o, idx) {
  const pickup = pickupsMap[o.id] || {};
  const typeBadge = `<span class="badge ${typeBadgeClass(o.order_type)}">${orderTypeAr(o.order_type)}</span>`;
  const waBadge = o.whatsapp_enabled
    ? `<span class="badge badge-whatsapp">📲 واتساب</span>`
    : `<span class="badge badge-whatsapp-off">📵 واتساب</span>`;
  const imgHtml = o.image_url
    ? `<img src="${escHtml(o.image_url)}" alt="صورة" class="card-thumbnail" onclick="openImagePreview('${escHtml(o.image_url)}')" />`
    : '';
  const notesHtml = pickup.notes
    ? `<div style="font-size:0.8rem;color:var(--text-muted);margin-top:4px;">📝 ${escHtml(pickup.notes)}</div>`
    : '';

  return `<div class="order-card" id="card-${o.id}" style="animation-delay:${idx * 0.05}s">
    <div class="card-header">
      <span class="badge badge-order-num"># ${shortNum(o)}</span>
      ${typeBadge}
      <span class="badge badge-received">✅ تم الاستلام</span>
      ${waBadge}
    </div>
    <div class="card-info">
      <div class="card-text">
        <div class="card-customer-name">${escHtml(o.customer_name_snapshot || '—')}</div>
        <div class="card-customer-phone">📞 ${escHtml(o.customer_phone_snapshot || '—')}</div>
        <div class="card-date">📅 أُنشئت: ${formatDate(o.created_at)}</div>
        <div class="card-date" style="margin-top:2px;">📥 استُلمت: ${formatDateTime(pickup.received_at)}</div>
        <div class="card-recipient">👤 المستلم: ${escHtml(pickup.recipient_name || '—')} | 📞 ${escHtml(pickup.recipient_phone || '—')}</div>
        ${notesHtml}
      </div>
      ${imgHtml}
    </div>
    <div class="card-actions">
      <button class="btn-action btn-details" onclick="openDetails('${o.id}')">🔍 عرض التفاصيل</button>
      <button class="btn-action btn-print"   onclick="printOrder('${o.id}')">🖨️ معاينة ملصق</button><a class="btn-action demo-track-link" href="track.html?order=${encodeURIComponent(o.id)}">تتبّع الزبون</a>
      <button class="btn-action btn-delete"  onclick="openDeleteModal('${o.id}')">🗑️ حذف</button>
    </div>
  </div>`;
}

function escHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#39;');
}

function switchTab(tab) {
  activeTab = tab;
  document.getElementById('tab-current').classList.toggle('active',  tab === 'current');
  document.getElementById('tab-received').classList.toggle('active', tab === 'received');
  document.getElementById('received-date-row').style.display = tab === 'received' ? 'flex' : 'none';
  renderOrders();
}

function onSearchInput(val) {
  searchQuery = val;
  renderOrders();
}

function setFilter(key, val) {
  filters[key] = val;

  const groupMap = { status: 'filter-status-group', orderType: 'filter-type-group' };
  if (groupMap[key]) {
    document.querySelectorAll(`#${groupMap[key]} .pill`).forEach(p => {
      p.classList.toggle('active', p.dataset.val === val);
    });
  }

  renderOrders();
}

function openDetails(orderId) {
  activeOrderId = orderId;
  editMode = false;
  const o = allOrders.find(x => x.id === orderId);
  if (!o) return;

  const isReceived = !!pickupsMap[orderId];

  document.getElementById('details-modal-title').textContent = `طلبية # ${fullNum(o)}`;


  document.getElementById('details-edit-btn').style.display    = isReceived ? 'none' : '';
  document.getElementById('details-save-btn').style.display    = 'none';
  document.getElementById('details-cancel-btn').style.display  = 'none';

  renderDetailsView(o, isReceived);
  openModal('details-modal');
}

function renderDetailsView(o, isReceived) {
  const eng    = engravingMap[o.id];
  const rep    = repairMap[o.id];
  const pickup = pickupsMap[o.id];

  let html = '';

  html += `<div class="detail-section">
    <div class="detail-section-title">معلومات الطلبية</div>
    ${dr('رقم الطلبية',       fullNum(o))}
    ${/* رمز تتبّع العميل — يُعطى للعميل ليفتح صفحة /track إن فقد رسالة SMS */''}
    ${dr('رمز التتبّع التجريبي', o.tracking_code)}<div class="detail-row"><a class="demo-track-link" href="track.html?order=${encodeURIComponent(o.id)}">فتح صفحة الزبون لتتبّع هذه الطلبية ←</a></div>
    ${dr('نوع الطلبية',       orderTypeAr(o.order_type))}
    ${dr('الحالة',            statusAr(o.status))}
    ${dr('واتساب',            o.whatsapp_enabled ? 'مفعّل' : 'غير مفعّل')}
    ${dr('تاريخ الإنشاء',     formatDateTime(o.created_at))}
    ${dr('آخر تحديث',         formatDateTime(o.updated_at))}
    ${o.notes ? dr('ملاحظات الطلبية', o.notes) : ''}
    
    <div class="detail-row">
      <span class="detail-key">السعر</span>
      <span class="detail-val price-val" id="price-detail-${o.id}">${priceLabel(o.price)}</span>
    </div>
    <button class="btn-price" type="button" onclick="openPriceModal('${o.id}')">
      <span>💰</span> تعديل السعر
    </button>
  </div>`;

  html += `<div class="detail-section">
    <div class="detail-section-title">معلومات العميل</div>
    ${dr('الاسم',   o.customer_name_snapshot)}
    ${dr('الهاتف',  o.customer_phone_snapshot)}
  </div>`;

  html += buildCatalogSection(o);
  html += buildPiecesSection(o, eng, rep).html;
  html += buildLegacyImageSection(o, rep);




  const shownUrls = new Set((imagesMap[o.id] || []).map(img => img.image_url));
  let galleryImgs = (imagesMap[o.id] || []).filter(img => !img.item_id);
  if (galleryImgs.length === 0 && o.image_url && !shownUrls.has(o.image_url)) {
    galleryImgs.push({ image_url: o.image_url });
  }
  if (galleryImgs.length > 0) {
    const isGallery = galleryImgs.length > 1;
    const title = isGallery ? `صور الطلبية (${galleryImgs.length})` : 'صورة الطلبية';
    const body = isGallery
      ? `<div class="order-img-gallery">
           ${galleryImgs.map(img => `
             <div class="order-img-thumb" onclick="openImagePreview('${escHtml(img.image_url)}')">
               <img src="${escHtml(img.image_url)}" alt="صورة الطلبية" loading="lazy" />
             </div>
           `).join('')}
         </div>`
      : `<img src="${escHtml(galleryImgs[0].image_url)}" class="detail-image" alt="صورة الطلبية" onclick="openImagePreview('${escHtml(galleryImgs[0].image_url)}')" style="cursor:zoom-in" />`;
    html += `<div class="detail-section">
      <div class="detail-section-title">${title}</div>
      ${body}
    </div>`;
  }

  if (isReceived && pickup) {
    html += `<div class="detail-section">
      <div class="detail-section-title">معلومات الاستلام</div>
      ${dr('المستلم',        pickup.recipient_name)}
      ${dr('هاتف المستلم',   pickup.recipient_phone)}
      ${dr('تاريخ الاستلام', formatDateTime(pickup.received_at))}
      ${pickup.notes ? dr('ملاحظات الاستلام', pickup.notes) : ''}
    </div>`;
  }

  if (isReceived) {
    html += `<div class="no-edit-notice">🔒 لا يمكن تعديل الطلبية بعد تأكيد الاستلام</div>`;
  }

  document.getElementById('details-modal-body').innerHTML = html;
}

function buildCatalogSection(o) {
  if (o.order_type !== 'catalog') return '';
  let html = '';
  {
    const items = catalogItemsMap[o.id] || [];
    const legacy = catalogDetailsMap[o.id]; // may exist for old orders or custom-image orders

    let renderItems = [];
    if (items.length > 0) {
      renderItems = items;
    } else if (legacy && !legacy.is_custom_image && (legacy.model_name_snapshot || legacy.model_number_snapshot)) {
      renderItems = [{
        catalog_model_id:      legacy.model_id,
        model_name_snapshot:   legacy.model_name_snapshot,
        model_number_snapshot: legacy.model_number_snapshot,
        image_url_snapshot:    legacy.image_url,
        quantity:              1,
        gold_karat:            legacy.gold_karat,
        gold_weight:           legacy.gold_weight,
        notes:                 legacy.notes,
        _legacy:               true
      }];
    }

    if (renderItems.length > 0) {
      html += `<div class="detail-section">
        <div class="detail-section-title">
          الموديلات من الكتالوج
          <span class="catalog-items-count">${renderItems.length}</span>
        </div>
        <div class="catalog-items-list">
          ${renderItems.map(it => `
            <div class="catalog-item-card">
              <div class="catalog-item-thumb">
                ${it.image_url_snapshot
                  ? `<img src="${escHtml(it.image_url_snapshot)}" alt="${escHtml(it.model_name_snapshot || '')}" onclick="openImagePreview('${escHtml(it.image_url_snapshot)}')" />`
                  : '<span class="catalog-item-thumb-ph">—</span>'}
              </div>
              <div class="catalog-item-meta">
                <div class="catalog-item-name">${escHtml(it.model_name_snapshot || '—')}</div>
                <div class="catalog-item-num">رقم الموديل: <strong>${escHtml(it.model_number_snapshot || '—')}</strong></div>
                <div class="catalog-item-chips">
                  <span class="catalog-item-qty">× ${it.quantity}</span>
                  ${it.gold_karat  ? `<span class="catalog-item-chip">عيار ${escHtml(it.gold_karat)}</span>` : ''}
                  ${it.gold_weight ? `<span class="catalog-item-chip">${escHtml(it.gold_weight)} غ</span>` : ''}
                </div>
                ${it.notes ? `<div class="catalog-item-notes">📝 ${escHtml(it.notes)}</div>` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      </div>`;
    } else if (legacy && legacy.is_custom_image) {

      html += `<div class="detail-section">
        <div class="detail-section-title">طلبية صورة مخصصة</div>
        ${dr('عيار الذهب/ فضة', legacy.gold_karat)}
        ${dr('الوزن',     legacy.gold_weight ? legacy.gold_weight + ' غ' : null)}
        ${legacy.notes ? dr('ملاحظات', legacy.notes) : ''}
      </div>`;
    }
  }
  return html;
}

function buildPiecesSection(o, eng, rep) {
  const orderItems = orderItemsMap[o.id] || [];   // already sorted by sort_order
  const imgsByItem = {};
  (imagesMap[o.id] || []).forEach(img => {
    if (img.item_id) (imgsByItem[img.item_id] = imgsByItem[img.item_id] || []).push(img);
  });

  if (orderItems.length > 0) {
    const title = o.order_type === 'engraving' ? 'قطع الحفر'
                : o.order_type === 'repair'    ? 'قطع التصليح'
                : o.order_type === 'renewal'   ? 'قطع التجديد'
                : 'القطع المضافة';
    return {
      html: `<div class="detail-section">
        <div class="detail-section-title">${title} <span class="catalog-items-count">${orderItems.length}</span></div>
        ${orderItems.map((it, i) => renderOrderItemCard(it, i + 1, o.order_type, imgsByItem[it.id] || [])).join('')}
      </div>`,
      renderedCards: true
    };
  }

  if (o.order_type === 'engraving' || o.order_type === 'repair') {
    const legacy = o.order_type === 'engraving' ? eng : rep;
    if (legacy) {
      return {
        html: `<div class="detail-section">
          <div class="detail-section-title">${o.order_type === 'engraving' ? 'تفاصيل الحفر' : 'تفاصيل التصليح'}</div>
          ${dr('نوع القطعة',   legacy.item_type)}
          ${dr('نوع المجوهرة', legacy.jewelry_type)}
          ${dr('عيار الذهب/ فضة', legacy.gold_karat)}
          ${dr('وزن الذهب',    legacy.gold_weight ? legacy.gold_weight + ' غ' : null)}
          ${o.order_type === 'engraving' ? dr('نص الحفر', legacy.engraving_text) : dr('وصف المشكلة', legacy.problem_description)}
          ${legacy.notes ? dr('ملاحظات', legacy.notes) : ''}
        </div>`,
        renderedCards: false
      };
    }
  }
  return { html: '', renderedCards: false };
}

function buildLegacyImageSection(o, rep) {
  if (o.order_type !== 'repair' || !rep || !rep.image_url) return '';
  if ((imagesMap[o.id] || []).some(img => img.image_url === rep.image_url)) return '';
  return `<div class="detail-section">
    <div class="detail-section-title">صورة التصليح</div>
    <img src="${escHtml(rep.image_url)}" class="detail-image" alt="صورة التصليح"
         onclick="openImagePreview('${escHtml(rep.image_url)}')" style="cursor:zoom-in" />
  </div>`;
}

function renderOrderItemCard(item, n, orderType, imgs) {
  const imgsHtml = (imgs && imgs.length)
    ? `<div class="order-img-gallery oi-imgs">
         ${imgs.map(img => `
           <div class="order-img-thumb" onclick="openImagePreview('${escHtml(img.image_url)}')">
             <img src="${escHtml(img.image_url)}" alt="صورة القطعة" loading="lazy" />
           </div>`).join('')}
       </div>`
    : '';

  if (isRenewalOrder(orderType)) {
    return `<div class="oi-card">
    <div class="oi-card-hdr"><span class="oi-badge">القطعة ${n}</span></div>
    ${imgsHtml}
    ${dr('عيار الذهب/ فضة', item.gold_karat)}
    ${dr('الوزن', item.gold_weight ? item.gold_weight + ' غ' : null)}
    ${item.notes ? dr('ملاحظات', item.notes) : ''}
  </div>`;
  }

  const typeField = orderType === 'engraving'
    ? dr('نص الحفر', item.engraving_text)
    : dr('وصف المشكلة', item.problem_description);
  return `<div class="oi-card">
    <div class="oi-card-hdr"><span class="oi-badge">القطعة ${n}</span></div>
    ${imgsHtml}
    ${dr('نوع القطعة', item.item_type)}
    ${dr('عيار الذهب/ فضة', item.gold_karat)}
    ${dr('الوزن', item.gold_weight ? item.gold_weight + ' غ' : null)}
    ${typeField}
    ${item.notes ? dr('ملاحظات', item.notes) : ''}
  </div>`;
}

function dr(label, value) {
  if (value == null || value === '' || value === '—' || value === undefined) return '';
  return `<div class="detail-row">
    <span class="detail-key">${escHtml(label)}</span>
    <span class="detail-val">${escHtml(String(value))}</span>
  </div>`;
}

const PIECES_ID = 'orderPieces';

function enterEditMode() {
  if (!activeOrderId) return;
  const o = allOrders.find(x => x.id === activeOrderId);
  if (!o) return;
  if (pickupsMap[o.id]) { showToast('لا يمكن تعديل الطلبية بعد تأكيد الاستلام', 'warning'); return; }

  editMode = true;
  document.getElementById('details-edit-btn').style.display   = 'none';
  document.getElementById('details-save-btn').style.display   = '';
  document.getElementById('details-cancel-btn').style.display = '';

  const eng = engravingMap[activeOrderId];
  const rep = repairMap[activeOrderId];

  let html = '';

  html += `<div id="editOrderDateHost"></div>`;

  html += `<div class="detail-section">
    <div class="detail-section-title">معلومات الطلبية</div>
    ${dr('رقم الطلبية', fullNum(o))}
    ${dr('نوع الطلبية', orderTypeAr(o.order_type))}
    ${dr('الاسم',       o.customer_name_snapshot)}
    ${dr('الهاتف',      o.customer_phone_snapshot)}
    ${o.notes ? dr('ملاحظات الطلبية', o.notes) : ''}
    <div class="no-edit-notice" style="margin-top:10px">
      ℹ️ يمكنك تعديل تاريخ الإنشاء والقطع وصورها وإضافة قطع جديدة — بيانات العميل والحالة والاستلام تبقى كما هي
    </div>
  </div>`;

  html += buildCatalogSection(o);

  html += `<div class="detail-section">
    <div class="detail-section-title">${piecesTitle(o)}</div>
    <div id="orderPiecesHost"></div>
  </div>`;

  document.getElementById('details-modal-body').innerHTML = html;

  OrderDateField.mount('#editOrderDateHost', {
    id:         'editOrderDate',
    variant:    'admin',
    value:      o.created_at,          // التاريخ المحفوظ للطلبية، ليس تاريخ اليوم
    hintPrefix: 'تاريخ إنشاء الطلبية:',
    showToday:  false
  });

  OrderPieceForm.mount('#orderPiecesHost', {
    id:        PIECES_ID,
    variant:   'admin',
    orderType: o.order_type,
    items:     buildEditableItems(o, eng, rep),
    toast:     (m) => showToast(m, 'warning')
  });
}

function piecesTitle(o) {
  return o.order_type === 'engraving' ? 'قطع الحفر'
       : o.order_type === 'repair'    ? 'قطع التصليح'
       : o.order_type === 'renewal'   ? 'قطع التجديد'
       : 'القطع';
}

function buildEditableItems(o, eng, rep) {
  const imgs = imagesMap[o.id] || [];
  const rows = orderItemsMap[o.id] || [];
  const pick = (img) => ({ id: img.id, image_url: img.image_url, storage_path: img.storage_path });

  const legacyPhoto = (o.order_type === 'repair' && rep && rep.image_url &&
                       !imgs.some(i => i.image_url === rep.image_url))
    ? [{ id: OrderPieceForm.LEGACY_IMG, image_url: rep.image_url, storage_path: null }]
    : [];

  if (rows.length) {
    return rows.map((it, idx) => ({
      id:                  it.id,
      item_type:           it.item_type,
      gold_karat:          it.gold_karat,
      gold_weight:         it.gold_weight,
      notes:               it.notes,
      problem_description: it.problem_description,
      engraving_text:      it.engraving_text,
      images:             imgs.filter(img => img.item_id === it.id).map(pick).concat(idx === 0 ? legacyPhoto : [])
    }));
  }

  const legacy = o.order_type === 'engraving' ? eng : (o.order_type === 'repair' ? rep : null);
  if (legacy) {
    return [{
      legacy:              true,
      item_type:           legacy.item_type || legacy.jewelry_type || null,
      gold_karat:          legacy.gold_karat,
      gold_weight:         legacy.gold_weight,
      notes:               legacyNotes(legacy),
      problem_description: legacy.problem_description,
      engraving_text:      legacy.engraving_text,
      images:              imgs.filter(img => !img.item_id).map(pick).concat(legacyPhoto)
    }];
  }
  return [];
}

function legacyNotes(l) {
  return (l.item_type && l.jewelry_type)
    ? [l.notes, `نوع المجوهرة: ${l.jewelry_type}`].filter(Boolean).join(' — ')
    : (l.notes || null);
}

function cancelEditMode() {
  editMode = false;
  OrderPieceForm.destroy(PIECES_ID);
  document.getElementById('details-edit-btn').style.display   = '';
  document.getElementById('details-save-btn').style.display   = 'none';
  document.getElementById('details-cancel-btn').style.display = 'none';

  const o = allOrders.find(x => x.id === activeOrderId);
  if (o) renderDetailsView(o, !!pickupsMap[o.id]);
}

function exitEditMode(o) {
  editMode = false;
  OrderPieceForm.destroy(PIECES_ID);
  document.getElementById('details-edit-btn').style.display   = '';
  document.getElementById('details-save-btn').style.display   = 'none';
  document.getElementById('details-cancel-btn').style.display = 'none';
  renderDetailsView(o, !!pickupsMap[o.id]);
  renderOrders();
}

async function saveEditMode() {
  if (!activeOrderId) return;
  const o = allOrders.find(x => x.id === activeOrderId);
  if (!o) return;

  const missing = OrderPieceForm.validate(PIECES_ID);
  if (missing.length) {
    OrderPieceForm.markMissing(PIECES_ID, missing);
    showToast('أكمل حقول القطعة الجديدة: ' + missing.map(m => m.label).join('، '), 'warning');
    return;
  }

  const existing  = OrderPieceForm.collectExisting(PIECES_ID);
  const newPieces = OrderPieceForm.collect(PIECES_ID);

  const saveBtn = document.getElementById('details-save-btn');
  saveBtn.disabled = true;
  saveBtn.innerHTML = '<span class="spinner"></span>';

  try {
    const isEng        = o.order_type === 'engraving';
    const legacyTable  = isEng ? 'engraving_order_details' : 'repair_order_details';
    const deletedUrls  = new Set();     // images that no longer exist → may free the thumbnail
    let firstNewImageUrl = null;

    for (const ex of existing) {
      if (ex.deleted) {
        const rows = (imagesMap[o.id] || []).filter(img => ex.legacy ? !img.item_id : img.item_id === ex.id);
        rows.forEach(r => deletedUrls.add(r.image_url));
        await deleteImageRows(rows.map(r => r.id), rows.map(r => r.storage_path));

        if (ex.legacy) {
          const { error } = await sb.from(legacyTable).delete().eq('order_id', o.id);
          if (error) throw error;
          if (isEng) delete engravingMap[o.id]; else delete repairMap[o.id];
          if (o.image_url) deletedUrls.add(o.image_url);   // that photo was this piece's
        } else {
          const { error } = await sb.from('order_items').delete().eq('id', ex.id);
          if (error) throw error;
        }
        continue;
      }

      let itemId = ex.id;

      if (ex.legacy) {


        const needsRow = ex.changed || ex.files.length || ex.removedImageIds.length ||
                         ex.removedLegacyField || newPieces.length;
        if (!needsRow) continue;

        const { data: row, error } = await sb.from('order_items')
          .insert(Object.assign({ order_id: o.id, sort_order: 0 }, ex.fields))
          .select('id').single();
        if (error) throw error;
        itemId = row.id;

        const keepIds = ex.keptImages.filter(i => i.id && i.id !== OrderPieceForm.LEGACY_IMG).map(i => i.id);
        if (keepIds.length) {
          const { error: tagErr } = await sb.from('order_images').update({ item_id: itemId }).in('id', keepIds);
          if (tagErr) throw tagErr;
        }
      } else if (ex.changed) {
        const { error } = await sb.from('order_items').update(ex.fields).eq('id', ex.id);
        if (error) throw error;
      }

      if (ex.removedImageIds.length) {
        await deleteImageRows(ex.removedImageIds, ex.removedPaths);
      }
      ex.removedImageUrls.forEach(u => deletedUrls.add(u));
      if (ex.removedLegacyField) {
        const { error } = await sb.from(legacyTable).update({ image_url: null }).eq('order_id', o.id);
        if (error) throw error;
        const map = isEng ? engravingMap : repairMap;
        if (map[o.id]) map[o.id].image_url = null;
      }

      if (ex.files.length && itemId) {
        const uploaded = await uploadFiles(ex.files, ex.keptCount);
        await insertImageRows(o.id, itemId, uploaded, ex.keptCount);
        if (!firstNewImageUrl && uploaded.length) firstNewImageUrl = uploaded[0].url;
      }
    }

    if (newPieces.length) {
      await migrateLegacyPieceIfNeeded(o);
      let sort = (orderItemsMap[o.id] || []).length + existing.filter(e => e.legacy && !e.deleted).length;

      for (const piece of newPieces) {

        const uploaded = await uploadFiles(piece.files, 0);

        const { data: itemRow, error: itErr } = await sb.from('order_items').insert({
          order_id:            o.id,
          sort_order:          sort++,
          item_type:           piece.item_type,
          gold_karat:          piece.gold_karat,
          gold_weight:         piece.gold_weight,
          notes:               piece.notes,
          problem_description: piece.problem_description,
          engraving_text:      piece.engraving_text
        }).select('id').single();
        if (itErr) throw itErr;

        if (uploaded.length) {
          await insertImageRows(o.id, itemRow.id, uploaded, 0);
          if (!firstNewImageUrl) firstNewImageUrl = uploaded[0].url;
        }
      }
    }

    await reloadOrderPieces(o.id);

    const orderUpdate = {
      created_at: OrderDateField.has('editOrderDate')
        ? OrderDateField.toISOString('editOrderDate', o.created_at)
        : o.created_at,
      updated_at: new Date().toISOString()
    };

    const imgsNow = imagesMap[o.id] || [];
    let thumb = o.image_url;
    if (thumb && deletedUrls.has(thumb)) thumb = imgsNow.length ? imgsNow[0].image_url : null;
    if (!thumb && firstNewImageUrl) thumb = firstNewImageUrl;
    if (thumb !== o.image_url) orderUpdate.image_url = thumb;

    const { error: orderErr } = await sb.from('orders').update(orderUpdate).eq('id', o.id);
    if (orderErr) throw orderErr;

    Object.assign(o, orderUpdate);

    allOrders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    exitEditMode(o);

    const parts = [];
    if (newPieces.length) parts.push(`أضيفت ${newPieces.length} قطعة`);
    const delCount = existing.filter(e => e.deleted).length;
    if (delCount) parts.push(`حُذفت ${delCount} قطعة`);
    showToast(parts.length ? 'تم حفظ التغييرات — ' + parts.join(' · ') : 'تم حفظ التغييرات بنجاح', 'success');

  } catch (err) {
    console.error(err);
    showToast('حدث خطأ أثناء الحفظ: ' + (err.message || ''), 'error');

    await reloadOrderPieces(o.id);
    exitEditMode(o);
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = 'حفظ';
  }
}

async function uploadFiles(files, startSort) {
  const uploaded = [];
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const ext  = (file.name.split('.').pop() || 'jpg').toLowerCase();
    const path = `orders/${Date.now()}_${(startSort || 0) + i}_${Math.random().toString(36).slice(2)}.${ext}`;
    const { error: upErr } = await sb.storage
      .from('order-images').upload(path, file, { cacheControl: '3600', upsert: false });
    if (upErr) throw new Error('فشل رفع الصورة: ' + upErr.message);
    const { data: urlData } = sb.storage.from('order-images').getPublicUrl(path);
    uploaded.push({ path, url: urlData?.publicUrl ?? null });
  }
  return uploaded;
}

async function insertImageRows(orderId, itemId, uploaded, startSort) {
  if (!uploaded.length) return;
  const rows = uploaded.map((u, i) => ({
    order_id:     orderId,
    item_id:      itemId,
    image_url:    u.url,
    storage_path: u.path,
    sort_order:   (startSort || 0) + i
  }));
  const { error } = await sb.from('order_images').insert(rows);
  if (error) throw error;
}

async function deleteImageRows(ids, paths) {
  const rowIds = (ids || []).filter(Boolean);
  if (rowIds.length) {
    const { error } = await sb.from('order_images').delete().in('id', rowIds);
    if (error) throw error;
  }
  const files = (paths || []).filter(Boolean);
  if (files.length) {
    const { error } = await sb.storage.from('order-images').remove(files);
    if (error) console.warn('storage remove failed:', error);
  }
}

async function migrateLegacyPieceIfNeeded(o) {
  if ((orderItemsMap[o.id] || []).length > 0) return;
  const isEng  = o.order_type === 'engraving';
  const legacy = isEng ? engravingMap[o.id] : (o.order_type === 'repair' ? repairMap[o.id] : null);
  if (!legacy) return;

  const { data: itemRow, error } = await sb.from('order_items').insert({
    order_id:            o.id,
    sort_order:          0,
    item_type:           legacy.item_type || legacy.jewelry_type || null,
    gold_karat:          legacy.gold_karat  || null,
    gold_weight:         legacy.gold_weight ?? null,
    notes:               legacyNotes(legacy),
    problem_description: isEng ? null : (legacy.problem_description || null),
    engraving_text:      isEng ? (legacy.engraving_text || null) : null
  }).select('id').single();
  if (error) throw error;

  const orphanIds = (imagesMap[o.id] || []).filter(img => !img.item_id).map(img => img.id);
  if (orphanIds.length) {
    const { error: upErr } = await sb.from('order_images').update({ item_id: itemRow.id }).in('id', orphanIds);
    if (upErr) throw upErr;
  }

  orderItemsMap[o.id] = [{ id: itemRow.id, order_id: o.id, sort_order: 0 }];   // refreshed right after
}

async function reloadOrderPieces(orderId) {
  const [itemsRes, imgsRes] = await Promise.all([
    sb.from('order_items').select('*').eq('order_id', orderId).order('sort_order', { ascending: true }),
    sb.from('order_images').select('*').eq('order_id', orderId).order('sort_order', { ascending: true })
  ]);
  if (!itemsRes.error) orderItemsMap[orderId] = itemsRes.data || [];
  if (!imgsRes.error)  imagesMap[orderId]     = imgsRes.data || [];
}

function openStatusModal(orderId) {
  activeOrderId   = orderId;
  pendingStatusVal = null;
  const o = allOrders.find(x => x.id === orderId);
  if (!o) return;

  document.getElementById('status-opt-inprogress').className = 'status-option' + (o.status === 'in_progress' ? ' selected-in-progress' : '');
  document.getElementById('status-opt-completed').className  = 'status-option' + (o.status === 'completed'   ? ' selected-completed'   : '');
  pendingStatusVal = o.status;

  openModal('status-modal');
}

function selectStatus(val) {
  pendingStatusVal = val;
  document.getElementById('status-opt-inprogress').className = 'status-option' + (val === 'in_progress' ? ' selected-in-progress' : '');
  document.getElementById('status-opt-completed').className  = 'status-option' + (val === 'completed'   ? ' selected-completed'   : '');
}

async function saveStatus() {
  if (!activeOrderId || !pendingStatusVal) return;
  const btn = document.getElementById('status-save-btn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>';

  try {
    const { error } = await sb.from('orders')
      .update({ status: pendingStatusVal, updated_at: new Date().toISOString() })
      .eq('id', activeOrderId);
    if (error) throw error;

    const idx = allOrders.findIndex(x => x.id === activeOrderId);
    if (idx > -1) allOrders[idx].status = pendingStatusVal;

    closeModal('status-modal');
    renderOrders();
    showToast('تم تحديث الحالة بنجاح', 'success');
  } catch (err) {
    console.error(err);
    showToast('خطأ أثناء تحديث الحالة: ' + (err.message || ''), 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'حفظ';
  }
}

let pendingPriceOrderId = null;

function openPriceModal(orderId) {
  const o = allOrders.find(x => x.id === orderId);
  if (!o) return;
  pendingPriceOrderId = orderId;

  const input = document.getElementById('price-input');
  input.value = (o.price === null || o.price === undefined || o.price === '')
    ? '' : Number(o.price).toFixed(2);
  document.getElementById('price-current').textContent = priceLabel(o.price);

  openModal('price-modal');
  setTimeout(() => { input.focus(); input.select(); }, 220);
}

async function savePrice() {
  const orderId = pendingPriceOrderId;
  if (!orderId) return;
  const o = allOrders.find(x => x.id === orderId);
  if (!o) return;

  const input = document.getElementById('price-input');
  const raw   = input.value.trim();

  let next = null;                       // empty ⇒ clear back to NULL
  if (raw !== '') {
    const n = parseFloat(raw);
    if (!isFinite(n) || n < 0) {
      showToast('أدخل سعراً صحيحاً (رقم أكبر من أو يساوي صفر)', 'warning');
      input.focus();
      return;
    }
    next = Math.round(n * 100) / 100;    // match numeric(12,2)
  }

  const btn = document.getElementById('price-save-btn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>';

  try {

    const { error } = await sb.from('orders')
      .update({ price: next, updated_at: new Date().toISOString() })
      .eq('id', orderId);
    if (error) throw error;

    o.price      = next;
    o.updated_at = new Date().toISOString();

    closeModal('price-modal');
    renderOrders();                      // the السعر column picks it up at once

    const cell = document.getElementById('price-detail-' + orderId);
    if (cell) cell.textContent = priceLabel(next);

    showToast(next === null ? 'تم مسح السعر' : 'تم تحديث السعر إلى ' + priceLabel(next), 'success');
  } catch (err) {
    console.error(err);
    showToast('خطأ أثناء تحديث السعر: ' + (err.message || ''), 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'حفظ';
    pendingPriceOrderId = null;
  }
}

function openPickupModal(orderId) {
  pendingPickupOrderId = orderId;
  const o = allOrders.find(x => x.id === orderId);


  document.getElementById('pickup-recipient-name').value  = (o && o.customer_name_snapshot)  || '';
  document.getElementById('pickup-recipient-phone').value = (o && o.customer_phone_snapshot) || '';
  document.getElementById('pickup-notes').value           = '';
  openModal('pickup-modal');
}

async function confirmPickup() {
  const recipientName  = document.getElementById('pickup-recipient-name').value.trim();
  const recipientPhone = document.getElementById('pickup-recipient-phone').value.trim();
  const notes          = document.getElementById('pickup-notes').value.trim();

  if (!recipientName)  { showToast('اسم المستلم مطلوب', 'warning'); return; }
  if (!recipientPhone) { showToast('هاتف المستلم مطلوب', 'warning'); return; }

  const btn = document.getElementById('pickup-confirm-btn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>';

  try {
    const o = allOrders.find(x => x.id === pendingPickupOrderId);
    if (!o) throw new Error('الطلبية غير موجودة');

    const payload = {
      order_id:        pendingPickupOrderId,
      customer_id:     o.customer_id || null,
      recipient_name:  recipientName,
      recipient_phone: recipientPhone,
      notes:           notes || null,
      received_at:     new Date().toISOString()
    };

    const { data, error } = await sb.from('order_pickups').insert(payload).select().single();
    if (error) {

      if (error.code === '23505') {
        showToast('هذه الطلبية تم تأكيد استلامها مسبقاً', 'warning');
        closeModal('pickup-modal');
        await loadAll();
        return;
      }
      throw error;
    }

    pickupsMap[pendingPickupOrderId] = data;
    closeModal('pickup-modal');
    renderOrders();
    showToast('تم تأكيد الاستلام بنجاح', 'success');
  } catch (err) {
    console.error(err);
    showToast('خطأ أثناء تأكيد الاستلام: ' + (err.message || ''), 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'تأكيد الاستلام';
  }
}

function openDeleteModal(orderId) {
  pendingDeleteId = orderId;
  openModal('delete-modal');
}

async function confirmDelete() {
  if (!pendingDeleteId) return;
  const btn = document.getElementById('delete-confirm-btn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span>';

  try {
    const id = pendingDeleteId;

    await sb.from('order_pickups').delete().eq('order_id', id);
    await sb.from('order_images').delete().eq('order_id', id);
    await sb.from('engraving_order_details').delete().eq('order_id', id);
    await sb.from('repair_order_details').delete().eq('order_id', id);

    const { error } = await sb.from('orders').delete().eq('id', id);
    if (error) throw error;

    allOrders    = allOrders.filter(o => o.id !== id);
    delete pickupsMap[id];
    delete engravingMap[id];
    delete repairMap[id];
    delete imagesMap[id];

    closeModal('delete-modal');
    renderOrders();
    showToast('تم حذف الطلبية بنجاح', 'success');
  } catch (err) {
    console.error(err);
    showToast('خطأ أثناء الحذف: ' + (err.message || ''), 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'نعم، احذف';
    pendingDeleteId = null;
  }
}

let pendingContact = { tel: '', wa: '' };

function openContactModal(orderId) {
  const o = allOrders.find(x => x.id === orderId);
  if (!o) return;
  const raw = o.customer_phone_snapshot || '';
  pendingContact = { tel: telHref(raw), wa: waNumber(raw) };

  if (!pendingContact.wa) { showToast('لا يوجد رقم هاتف لهذه الطلبية', 'warning'); return; }

  document.getElementById('contact-name').textContent   = o.customer_name_snapshot || '—';
  document.getElementById('contact-number').textContent = raw;
  openModal('contact-modal');
}

function contactCall() { closeModal('contact-modal'); DemoUI.notice('محاكاة فقط — لا يُجرى اتصال أو إرسال رسائل.');
}

function contactWhatsapp() { closeModal('contact-modal'); DemoUI.notice('محاكاة فقط — لا يُجرى اتصال أو إرسال رسائل.');
}

function printOrder(orderId) {
  const order = allOrders.find(o => o.id === orderId);
  if (order) DemoUI.print(order);
}

function openWhatsapp(orderId) {
  const order = allOrders.find(o => o.id === orderId);
  if (order) DemoUI.message(order);
}

function openImagePreview(url) {
  const win = window.open(url, '_blank');
  if (!win) showToast('تعذر فتح الصورة', 'warning');
}

function openModal(id) {
  const el = document.getElementById(id);
  el.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal(id) {
  const el = document.getElementById(id);
  el.classList.remove('open');
  document.body.style.overflow = '';
}

function handleOverlayClick(e, modalId) {
  if (e.target === document.getElementById(modalId)) {
    closeModal(modalId);
  }
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    ['details-modal','status-modal','pickup-modal','delete-modal'].forEach(closeModal);
  }
});

function showToast(msg, type = 'info') {
  const icons = { success:'✅', error:'❌', warning:'⚠️', info:'ℹ️' };
  const container = document.getElementById('toast-container');
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.innerHTML = `<span class="toast-icon">${icons[type]||'ℹ️'}</span><span class="toast-msg">${escHtml(msg)}</span>`;
  container.appendChild(el);

  setTimeout(() => {
    el.classList.add('dismiss');
    setTimeout(() => el.remove(), 350);
  }, 3500);
}


function focusOrderFromUrl() {
  let focusId = null;
  try { focusId = new URLSearchParams(window.location.search).get('focus'); } catch (e) { return; }
  if (!focusId) return;

  try { history.replaceState(null, '', window.location.pathname); } catch (e) {}

  const o = allOrders.find(x => x.id === focusId);
  if (!o) { showToast('تعذّر العثور على الطلبية المطلوبة', 'error'); return; }


  const el  = document.getElementById('card-' + focusId) || document.getElementById('row-' + focusId);
  if (!el) return;
  const cls = el.tagName === 'TR' ? 'otbl-focus' : 'order-focus';

  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  el.classList.add(cls);
  setTimeout(() => el.classList.remove(cls), 4500);
}

(async () => {
  initViewMode();          // restore the saved display mode before the first render
  await loadAll();
  focusOrderFromUrl();
})();
