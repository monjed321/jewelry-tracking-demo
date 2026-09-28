
(function () {
  'use strict';
  if (window.OrderDateField) return;

  const pad2 = (n) => String(n).padStart(2, '0');
  const instances = {};          // id → instance

  const CLASSES = {
    create: { section:'fsec', title:'slabel', grid:'odf-grid', group:'fg', label:'flabel', select:'fselect' },
    admin:  { section:'detail-section', title:'detail-section-title', grid:'odf-grid', group:'form-group', label:'form-label', select:'edit-select' }
  };

  const CSS = `
.odf-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:11px; }
.odf-hint { margin-top:9px; font-size:11.5px; font-weight:600; color:var(--c-gold-ink);
            opacity:.85; direction:rtl; display:flex; align-items:center; gap:6px; }
.odf-today { background:rgba(150,116,28,0.16); border:1px solid rgba(150,116,28,0.35);
             color:var(--c-gold-ink); border-radius:9px; padding:3px 10px;
             font-family:inherit; font-size:11px; font-weight:700; cursor:pointer; }
.odf-today:hover { background:rgba(150,116,28,0.25); }
`;

  function injectCSS() {
    if (document.getElementById('odf-style')) return;
    const s = document.createElement('style');
    s.id = 'odf-style';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  const daysInMonth = (y, m) => new Date(y, m, 0).getDate();   // m = 1..12

  function toParts(value) {
    if (!value) return null;
    if (value instanceof Date) {
      if (isNaN(value)) return null;
      return { year: value.getFullYear(), month: value.getMonth() + 1, day: value.getDate() };
    }
    const s = String(value);

    const plain = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (plain) return { year:+plain[1], month:+plain[2], day:+plain[3] };
    const d = new Date(s);
    if (isNaN(d)) return null;
    return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() };
  }

  function mount(host, opts) {
    opts = opts || {};
    const el = typeof host === 'string' ? document.querySelector(host) : host;
    if (!el) return null;

    injectCSS();

    const id    = opts.id || 'orderDate';
    const cls   = Object.assign({}, CLASSES[opts.variant] || CLASSES.create, opts.classes || {});
    const label = opts.label || '🗓️ تاريخ إنشاء الطلبية';
    const now   = new Date();
    const back  = opts.yearsBack    == null ? 6 : opts.yearsBack;
    const fwd   = opts.yearsForward == null ? 1 : opts.yearsForward;

    let years = '';
    for (let y = now.getFullYear() + fwd; y >= now.getFullYear() - back; y--) {
      years += `<option value="${y}">${y}</option>`;
    }
    let months = '';
    for (let m = 1; m <= 12; m++) months += `<option value="${m}">${pad2(m)}</option>`;

    el.innerHTML = `
      <div class="${cls.section}" data-odf-id="${id}">
        <div class="${cls.title}">${label}</div>
        <div class="${cls.grid}">
          <div class="${cls.group}">
            <label class="${cls.label}" for="${id}-day">يوم</label>
            <select class="${cls.select}" id="${id}-day"></select>
          </div>
          <div class="${cls.group}">
            <label class="${cls.label}" for="${id}-month">شهر</label>
            <select class="${cls.select}" id="${id}-month">${months}</select>
          </div>
          <div class="${cls.group}">
            <label class="${cls.label}" for="${id}-year">سنة</label>
            <select class="${cls.select}" id="${id}-year">${years}</select>
          </div>
        </div>
        <div class="odf-hint">
          <span id="${id}-hint"></span>
          ${opts.showToday === false ? '' : `<button type="button" class="odf-today" id="${id}-todaybtn">اليوم</button>`}
        </div>
      </div>`;

    const inst = {
      id,
      root:    el.querySelector(`[data-odf-id="${id}"]`),
      daySel:  el.querySelector(`#${id}-day`),
      monSel:  el.querySelector(`#${id}-month`),
      yearSel: el.querySelector(`#${id}-year`),
      hintEl:  el.querySelector(`#${id}-hint`),
      hintPrefix: opts.hintPrefix || 'ستُسجَّل الطلبية بتاريخ'
    };
    instances[id] = inst;

    inst.monSel.addEventListener('change',  () => { rebuildDays(inst); updateHint(inst); });
    inst.yearSel.addEventListener('change', () => { rebuildDays(inst); updateHint(inst); });
    inst.daySel.addEventListener('change',  () => updateHint(inst));
    el.querySelector(`#${id}-todaybtn`)?.addEventListener('click', () => setToday(id));

    setValue(id, opts.value || new Date());
    return inst;
  }

  function rebuildDays(inst) {
    const y    = +inst.yearSel.value || new Date().getFullYear();
    const m    = +inst.monSel.value  || (new Date().getMonth() + 1);
    const max  = daysInMonth(y, m);
    const want = +inst.daySel.value || 1;

    let html = '';
    for (let d = 1; d <= max; d++) html += `<option value="${d}">${pad2(d)}</option>`;
    inst.daySel.innerHTML = html;
    inst.daySel.value = String(Math.min(want, max));
  }

  function updateHint(inst) {
    const p = getParts(inst.id);
    if (!p || !inst.hintEl) return;
    inst.hintEl.textContent =
      `${inst.hintPrefix} ${pad2(p.day)}/${pad2(p.month)}/${p.year}`;
  }

  function ensureYear(inst, year) {
    if ([...inst.yearSel.options].some(o => +o.value === year)) return;
    const opt = document.createElement('option');
    opt.value = String(year);
    opt.textContent = String(year);
    const after = [...inst.yearSel.options].find(o => +o.value < year);
    inst.yearSel.insertBefore(opt, after || null);
  }

  function setValue(id, value) {
    const inst = instances[id];
    if (!inst) return;
    const p = toParts(value) || toParts(new Date());
    ensureYear(inst, p.year);
    inst.yearSel.value = String(p.year);
    inst.monSel.value  = String(p.month);
    rebuildDays(inst);
    inst.daySel.value = String(Math.min(p.day, daysInMonth(p.year, p.month)));
    updateHint(inst);
  }

  function setToday(id) { setValue(id, new Date()); }

  function getParts(id) {
    const inst = instances[id];
    if (!inst) return null;
    const year  = +inst.yearSel.value;
    const month = +inst.monSel.value;
    const day   = +inst.daySel.value;
    if (!year || !month || !day) return null;
    return { year, month, day };
  }

  function getDateOnly(id) {
    const p = getParts(id);
    return p ? `${p.year}-${pad2(p.month)}-${pad2(p.day)}` : null;
  }

  function formatShort(id) {
    const p = getParts(id);
    return p ? `${pad2(p.day)}/${pad2(p.month)}/${p.year}` : '';
  }

  function toISOString(id, baseISO) {
    const p = getParts(id);
    if (!p) return new Date().toISOString();
    const base = baseISO ? new Date(baseISO) : null;
    const t    = (base && !isNaN(base)) ? base : new Date();
    const d    = new Date(
      p.year, p.month - 1, p.day,
      t.getHours(), t.getMinutes(), t.getSeconds(), t.getMilliseconds()
    );
    return d.toISOString();
  }

  window.OrderDateField = {
    mount, setValue, setToday, getParts, getDateOnly, formatShort, toISOString,
    has: (id) => !!instances[id]
  };
})();
