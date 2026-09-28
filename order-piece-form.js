
(function () {
  'use strict';
  if (window.OrderPieceForm) return;

  const MAX_IMAGES   = 8;
  const MAX_IMG_SIZE = 5 * 1024 * 1024;      // ٥ ميجابايت لكل صورة
  const MAX_TOTAL    = 20;                   // نفس الحد الأقصى في create_order.html
  const KARAT_OPTS   = ['24','22','21','18','14','9','925'];   // 925 = فضة
  const LEGACY_IMG   = '__legacyField';      // صورة قديمة محفوظة على صف التفاصيل نفسه
  const instances    = {};

  const CLASSES = {
    admin:  { group:'form-group', label:'form-label', input:'edit-input', select:'edit-select', textarea:'edit-textarea' },
    create: { group:'fg',         label:'flabel',     input:'finput',     select:'fselect',     textarea:'ftextarea' }
  };

  const CSS = `
.opf-block { border:1px solid rgba(150,116,28,0.28); border-radius:14px; padding:14px;
             margin-bottom:12px; background:rgba(150,116,28,0.1); transition:opacity .2s, background .2s; }
.opf-block-hdr { display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:12px; }
.opf-badge { display:inline-block; font-size:0.72rem; font-weight:800; color:var(--c-on-gold);
             background:linear-gradient(135deg, var(--gold-light,#F0D878), var(--gold,#D4AF37));
             padding:4px 12px; border-radius:999px; letter-spacing:0.02em; }
.opf-rm { background:rgba(224,80,80,0.12); border:1px solid rgba(224,80,80,0.3); color:var(--c-red);
          border-radius:10px; padding:5px 12px; font-size:0.72rem; font-weight:700;
          cursor:pointer; font-family:inherit; white-space:nowrap; }
.opf-rm:hover { background:rgba(224,80,80,0.2); }

.opf-confirm { display:none; align-items:center; gap:8px; flex-wrap:wrap;
               background:rgba(224,80,80,0.10); border:1px solid rgba(224,80,80,0.30);
               border-radius:12px; padding:10px 12px; margin-bottom:12px; }
.opf-confirm.on { display:flex; }
.opf-confirm-tx { font-size:0.8rem; color:var(--text,var(--c-ink)); flex:1; }
.opf-yes { background:#A32019; border:1px solid #8A1B15; color:#fff;
           border-radius:10px; padding:6px 12px; font-size:0.75rem; font-weight:700; cursor:pointer; font-family:inherit; }
.opf-no  { background:rgba(255,255,255,0.82); border:1px solid rgba(150,116,28,0.35); color:var(--c-gold-ink);
           border-radius:10px; padding:6px 12px; font-size:0.75rem; font-weight:700; cursor:pointer; font-family:inherit; }

.opf-block.opf-deleted { opacity:.55; background:rgba(224,80,80,0.06); border-color:rgba(224,80,80,0.30); }
.opf-block.opf-deleted .opf-body { display:none; }
.opf-del-note { display:none; align-items:center; gap:10px; font-size:0.8rem; color:var(--c-red); font-weight:700; }
.opf-block.opf-deleted .opf-del-note { display:flex; }
.opf-undo { background:rgba(150,116,28,0.2); border:1px solid rgba(150,116,28,0.37); color:var(--c-gold-ink);
            border-radius:10px; padding:5px 12px; font-size:0.72rem; font-weight:700; cursor:pointer; font-family:inherit; }

.opf-sec { margin-bottom:14px; }
.opf-slabel { font-size:0.72rem; font-weight:700; color:var(--c-gold-ink);
              letter-spacing:0.05em; margin-bottom:8px; }

.opf-zone { border:2px dashed rgba(150,116,28,0.25); border-radius:14px; background:rgba(150,116,28,0.1);
            padding:24px 14px; text-align:center; cursor:pointer; transition:all .22s ease; }
.opf-zone:hover { border-color:rgba(150,116,28,0.52); background:rgba(150,116,28,0.16); }
.opf-zone.filled { padding:12px; border-style:solid; border-color:rgba(150,116,28,0.47);
                   cursor:default; text-align:right; }
.opf-ph { display:flex; flex-direction:column; align-items:center; gap:7px; pointer-events:none; }
.opf-ph-ico  { font-size:30px; opacity:.5; }
.opf-ph-main { font-size:0.85rem; color:var(--c-muted); font-weight:600; }
.opf-ph-sub  { font-size:0.75rem; color:var(--c-muted); }

.opf-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; }
@media (min-width:560px) { .opf-grid { grid-template-columns:repeat(4,1fr); } }
.opf-tile { position:relative; aspect-ratio:1/1; border-radius:12px; overflow:hidden;
            background:rgba(150,116,28,0.1); border:1px solid rgba(150,116,28,0.22); }
.opf-tile img { width:100%; height:100%; object-fit:cover; display:block; }
.opf-tile-rm { position:absolute; top:5px; right:5px; width:24px; height:24px; border-radius:50%;
               background:rgba(42,33,26,0.58); border:1px solid rgba(224,80,80,.6); color:#fff;
               font-size:12px; line-height:1; display:flex; align-items:center; justify-content:center;
               cursor:pointer; padding:0; }
.opf-tile-rm:hover { background:rgba(224,80,80,.9); }
.opf-tile-badge { position:absolute; bottom:5px; right:5px; background:rgba(255,253,245,0.93);
                  border:1px solid rgba(150,116,28,0.42); color:var(--c-gold-ink);
                  font-size:10px; font-weight:700; padding:2px 7px; border-radius:999px;
                  pointer-events:none; }
.opf-tile-badge.new { border-color:rgba(37,211,102,.5); color:var(--c-wa); }
.opf-add-tile { aspect-ratio:1/1; border-radius:12px; background:rgba(150,116,28,0.1);
                border:2px dashed rgba(150,116,28,0.35); display:flex; flex-direction:column;
                align-items:center; justify-content:center; gap:3px; cursor:pointer;
                color:var(--c-muted); font-size:0.72rem; font-weight:600; }
.opf-add-tile:hover { background:rgba(150,116,28,0.16); border-color:rgba(150,116,28,0.52); color:var(--c-gold-ink); }
.opf-add-tile .opf-add-ico { font-size:20px; line-height:1; }
.opf-count { font-size:0.72rem; color:var(--text-muted,var(--c-muted)); margin-top:8px; text-align:center; }
.opf-count-num { color:var(--c-gold-ink); font-weight:700; }

.opf-grid2 { display:grid; grid-template-columns:1fr 1fr; gap:10px; }

.opf-add-btn { width:100%; padding:12px; margin-top:4px; background:rgba(150,116,28,0.13);
               border:1.5px dashed rgba(150,116,28,0.42); border-radius:14px; color:var(--c-gold-ink);
               font-family:inherit; font-size:0.88rem; font-weight:700; cursor:pointer;
               display:flex; align-items:center; justify-content:center; gap:8px;
               transition:background .2s, border-color .2s; }
.opf-add-btn:hover { background:rgba(150,116,28,0.2); border-color:rgba(150,116,28,0.7); }

.opf-err { border-color:var(--c-red) !important; background:rgba(224,80,80,.08) !important;
           box-shadow:0 0 0 3px rgba(224,80,80,.10); }
`;

  function injectCSS() {
    if (document.getElementById('opf-style')) return;
    const s = document.createElement('style');
    s.id = 'opf-style';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function notify(inst, msg) {
    if (typeof inst.toast === 'function') inst.toast(msg);
    else if (typeof window.showToast === 'function') window.showToast(msg, 'warning');
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function mount(host, opts) {
    opts = opts || {};
    const el = typeof host === 'string' ? document.querySelector(host) : host;
    if (!el) return null;
    injectCSS();

    const id   = opts.id || 'pieces';
    const inst = {
      id,
      host:      el,
      orderType: opts.orderType || null,
      variant:   opts.variant || 'admin',
      cls:       Object.assign({}, CLASSES[opts.variant] || CLASSES.admin, opts.classes || {}),
      toast:     opts.toast,
      pieces:    []                       // كل البطاقات: القائمة أولاً ثم الجديدة
    };

    el.innerHTML = `
      <div class="opf-list" id="${id}-list"></div>
      <button type="button" class="opf-add-btn" id="${id}-add">
        <span>➕</span> ${opts.addLabel || 'إضافة قطعة جديدة'}
      </button>`;
    inst.listEl = el.querySelector(`#${id}-list`);
    el.querySelector(`#${id}-add`).addEventListener('click', () => addPiece(id));

    instances[id] = inst;

    (opts.items || []).forEach(item => addBlock(inst, item));
    renumber(inst);
    return inst;
  }

  const existingCount = (inst) => inst.pieces.filter(p => !p.isNew).length;
  const liveCount     = (inst) => inst.pieces.filter(p => !p.deleted).length;

  const isRenewal = (inst) => inst.orderType === 'renewal';

  function typeSpecificHtml(inst, item) {
    const c = inst.cls;
    if (inst.orderType === 'engraving') {
      return `<div class="${c.group}">
        <label class="${c.label}">نص الحفر</label>
        <input class="${c.input} opf-eng" type="text" placeholder="أدخل النص المراد حفره" value="${esc(item.engraving_text)}" />
      </div>`;
    }
    if (inst.orderType === 'repair') {
      return `<div class="${c.group}">
        <label class="${c.label}">وصف المشكلة</label>
        <textarea class="${c.textarea} opf-prob" placeholder="اشرح المشكلة أو التلف الموجود بالقطعة...">${esc(item.problem_description)}</textarea>
      </div>`;
    }
    return '';   // كتالوج / أنواع أخرى: لا حقول إضافية
  }

  function addBlock(inst, item) {
    item = item || {};
    const isNew = !item.id && !item.legacy;
    const c     = inst.cls;

    const wrap = document.createElement('div');
    wrap.className = 'opf-block';
    wrap.innerHTML = `
      <div class="opf-block-hdr">
        <span class="opf-badge opf-title"></span>
        <span class="opf-del-note">
          <span>🗑 سيتم حذف هذه القطعة عند الحفظ</span>
          <button type="button" class="opf-undo">تراجع</button>
        </span>
        <button type="button" class="opf-rm">${isNew ? '🗑 حذف' : '🗑 حذف القطعة'}</button>
      </div>
      <div class="opf-confirm">
        <span class="opf-confirm-tx">هل تريد حذف هذه القطعة وصورها؟</span>
        <button type="button" class="opf-yes">نعم، احذف</button>
        <button type="button" class="opf-no">إلغاء</button>
      </div>
      <div class="opf-body">
        <div class="opf-sec">
          <div class="opf-slabel">📷 صور القطعة</div>
          <div class="opf-zone">
            <div class="opf-ph">
              <span class="opf-ph-ico">📸</span>
              <span class="opf-ph-main">أضف صور للقطعة</span>
              <span class="opf-ph-sub">حتى ٨ صور — حجم كل صورة ٥ ميجابايت كحد أقصى</span>
            </div>
            <div class="opf-grid" style="display:none"></div>
          </div>
          <div class="opf-count" style="display:none"><span class="opf-count-num">0</span> / ${MAX_IMAGES} صور</div>
          <input type="file" class="opf-file" accept="image/*" multiple style="display:none" />
        </div>
        ${isRenewal(inst) ? '' : `
        <div class="${c.group}">
          <label class="${c.label}">نوع القطعة</label>
          <input class="${c.input} opf-type" type="text" placeholder="خاتم، سوار، قلادة، تعليقة..." value="${esc(item.item_type)}" />
        </div>`}
        <div class="opf-grid2">
          <div class="${c.group}">
            <label class="${c.label}">الوزن (غ)</label>
            <input class="${c.input} opf-weight" type="number" placeholder="0.00" min="0" step="0.01" value="${item.gold_weight == null ? '' : esc(item.gold_weight)}" />
          </div>
          <div class="${c.group}">
            <label class="${c.label}">عيار الذهب/ فضة</label>
            <select class="${c.select} opf-karat">
              <option value="">العيار</option>
              ${KARAT_OPTS.map(k => `<option value="${k}"${String(item.gold_karat || '') === k ? ' selected' : ''}>${k}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="${c.group}">
          <label class="${c.label}">ملاحظات</label>
          <textarea class="${c.textarea} opf-notes" placeholder="أي تفاصيل إضافية...">${esc(item.notes)}</textarea>
        </div>
        ${typeSpecificHtml(inst, item)}
      </div>`;

    inst.listEl.appendChild(wrap);

    const st = {
      el:       wrap,
      id:       item.id || null,
      legacy:   !!item.legacy,
      isNew:    isNew,
      deleted:  false,
      files:    [],
      imgs:     (item.images || []).slice(),   // الصور المحفوظة التي ما زالت موجودة
      removed:  [],                            // الصور المحفوظة التي حُذفت
      zone:     wrap.querySelector('.opf-zone'),
      ph:       wrap.querySelector('.opf-ph'),
      grid:     wrap.querySelector('.opf-grid'),
      cntBox:   wrap.querySelector('.opf-count'),
      cntNum:   wrap.querySelector('.opf-count-num'),
      fileEl:   wrap.querySelector('.opf-file'),
      titleEl:  wrap.querySelector('.opf-title'),
      typeEl:   wrap.querySelector('.opf-type'),
      weightEl: wrap.querySelector('.opf-weight'),
      karatEl:  wrap.querySelector('.opf-karat'),
      notesEl:  wrap.querySelector('.opf-notes'),
      engEl:    wrap.querySelector('.opf-eng'),
      probEl:   wrap.querySelector('.opf-prob'),
      confirmEl: wrap.querySelector('.opf-confirm')
    };

    st.original = readFields(st);
    inst.pieces.push(st);

    st.zone.addEventListener('click', () => triggerFile(inst, st));
    st.fileEl.addEventListener('change', (e) => filesChosen(inst, st, e));

    wrap.querySelector('.opf-rm').addEventListener('click', () => {
      if (st.isNew) { dropBlock(inst, st); return; }
      st.confirmEl.classList.add('on');
    });
    wrap.querySelector('.opf-no').addEventListener('click', () => st.confirmEl.classList.remove('on'));
    wrap.querySelector('.opf-yes').addEventListener('click', () => {
      st.confirmEl.classList.remove('on');
      st.deleted = true;
      wrap.classList.add('opf-deleted');
      wrap.querySelector('.opf-rm').style.display = 'none';
    });
    wrap.querySelector('.opf-undo').addEventListener('click', () => {
      st.deleted = false;
      wrap.classList.remove('opf-deleted');
      wrap.querySelector('.opf-rm').style.display = '';
    });

    renderGrid(inst, st);
    return st;
  }

  function addPiece(id) {
    const inst = instances[id];
    if (!inst) return null;
    if (liveCount(inst) >= MAX_TOTAL) {
      notify(inst, `الحد الأقصى ${MAX_TOTAL} قطعة للطلبية`);
      return null;
    }
    const st = addBlock(inst, {});
    renumber(inst);
    st.el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return st;
  }

  function dropBlock(inst, st) {
    const i = inst.pieces.indexOf(st);
    if (i > -1) inst.pieces.splice(i, 1);
    st.el.remove();
    renumber(inst);
  }

  function renumber(inst) {
    const total = existingCount(inst);
    let n = 0, k = 0;
    inst.pieces.forEach(st => {
      if (st.isNew) { st.titleEl.textContent = `القطعة ${total + (++k)} (جديدة)`; }
      else          { st.titleEl.textContent = `القطعة ${++n}`; }
    });
  }

  function readFields(st) {
    return {
      item_type:           st.typeEl ? (st.typeEl.value.trim() || null) : null,
      gold_karat:          st.karatEl ? (st.karatEl.value || null) : null,
      gold_weight:         !st.weightEl || st.weightEl.value === '' ? null : (parseFloat(st.weightEl.value) || null),
      notes:               st.notesEl.value.trim() || null,
      problem_description: st.probEl ? (st.probEl.value.trim() || null) : null,
      engraving_text:      st.engEl  ? (st.engEl.value.trim()  || null) : null
    };
  }

  function imgTotal(st) { return st.imgs.length + st.files.length; }

  function triggerFile(inst, st) {
    if (st.deleted) return;
    if (imgTotal(st) >= MAX_IMAGES) { notify(inst, `الحد الأقصى ${MAX_IMAGES} صور`); return; }
    st.fileEl.click();
  }

  function filesChosen(inst, st, e) {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length) return;

    const remaining = MAX_IMAGES - imgTotal(st);
    if (files.length > remaining) notify(inst, `يمكنك إضافة ${remaining} صور فقط (الحد الأقصى ${MAX_IMAGES})`);

    let added = 0;
    for (const file of files.slice(0, Math.max(remaining, 0))) {
      if (!file.type.startsWith('image/')) { notify(inst, 'أحد الملفات ليس صورة'); continue; }
      if (file.size > MAX_IMG_SIZE)        { notify(inst, `"${file.name}" يتجاوز ٥ ميجابايت`); continue; }
      st.files.push(file);
      added++;
    }
    if (added > 0) renderGrid(inst, st);
  }

  function removeSavedImage(inst, st, index) {
    const img = st.imgs[index];
    if (!img) return;
    st.imgs.splice(index, 1);
    st.removed.push(img);
    renderGrid(inst, st);
  }

  function renderGrid(inst, st) {
    const total = imgTotal(st);
    if (total === 0) {
      st.zone.classList.remove('filled');
      st.ph.style.display     = '';
      st.grid.style.display   = 'none';
      st.grid.innerHTML       = '';
      st.cntBox.style.display = 'none';
      return;
    }

    st.zone.classList.add('filled');
    st.ph.style.display     = 'none';
    st.grid.style.display   = 'grid';
    st.cntBox.style.display = '';
    st.cntNum.textContent   = total;
    st.grid.innerHTML       = '';

    st.imgs.forEach((img, i) => {
      const tile = document.createElement('div');
      tile.className = 'opf-tile opf-saved';
      tile.innerHTML = `
        <img src="${esc(img.image_url)}" alt="صورة محفوظة" loading="lazy" />
        <button type="button" class="opf-tile-rm" aria-label="حذف الصورة">✕</button>
        ${i === 0 ? '<span class="opf-tile-badge">رئيسية</span>' : ''}`;
      tile.querySelector('.opf-tile-rm').addEventListener('click', (ev) => {
        ev.stopPropagation();
        removeSavedImage(inst, st, i);
      });
      st.grid.appendChild(tile);
    });

    st.files.forEach((file, i) => {
      const tile = document.createElement('div');
      tile.className = 'opf-tile opf-fresh';
      tile.innerHTML = `
        <img alt="صورة جديدة" />
        <button type="button" class="opf-tile-rm" aria-label="حذف الصورة">✕</button>
        <span class="opf-tile-badge new">جديدة</span>`;
      tile.querySelector('.opf-tile-rm').addEventListener('click', (ev) => {
        ev.stopPropagation();
        st.files.splice(i, 1);
        renderGrid(inst, st);
      });
      st.grid.appendChild(tile);
      const reader = new FileReader();
      reader.onload = ev => { tile.querySelector('img').src = ev.target.result; };
      reader.readAsDataURL(file);
    });

    if (total < MAX_IMAGES) {
      const add = document.createElement('div');
      add.className = 'opf-add-tile';
      add.innerHTML = '<span class="opf-add-ico">＋</span><span>إضافة صورة</span>';
      add.addEventListener('click', (ev) => { ev.stopPropagation(); triggerFile(inst, st); });
      st.grid.appendChild(add);
    }
  }

  function count(id)    { return instances[id] ? instances[id].pieces.filter(p => p.isNew && !p.deleted).length : 0; }
  function hasPending(id) {
    const inst = instances[id];
    if (!inst) return false;
    return inst.pieces.some(st =>
      (st.isNew && !st.deleted) || st.deleted || st.files.length || st.removed.length ||
      JSON.stringify(readFields(st)) !== JSON.stringify(st.original));
  }

  function collect(id) {
    const inst = instances[id];
    if (!inst) return [];
    return inst.pieces.filter(st => st.isNew && !st.deleted).map(st =>
      Object.assign(readFields(st), { files: st.files.slice() }));
  }

  function collectExisting(id) {
    const inst = instances[id];
    if (!inst) return [];
    return inst.pieces.filter(st => !st.isNew).map(st => {
      const fields = readFields(st);
      return {
        id:              st.id,
        legacy:          st.legacy,
        deleted:         st.deleted,
        fields:          fields,
        changed:         JSON.stringify(fields) !== JSON.stringify(st.original),
        files:           st.files.slice(),
        keptCount:       st.imgs.length,
        keptImages:      st.imgs.slice(),
        removedImageIds: st.removed.filter(r => r.id && r.id !== LEGACY_IMG).map(r => r.id),
        removedPaths:    st.removed.map(r => r.storage_path).filter(Boolean),
        removedImageUrls: st.removed.map(r => r.image_url).filter(Boolean),
        removedLegacyField: st.removed.some(r => r.id === LEGACY_IMG)
      };
    });
  }

  function validate(id) {
    const inst = instances[id];
    if (!inst) return [];
    const missing = [];
    const total = existingCount(inst);
    let k = 0;
    inst.pieces.forEach(st => {
      if (!st.isNew || st.deleted) return;
      const n = total + (++k);
      const req = [
        [st.typeEl,   `نوع القطعة (القطعة ${n})`],
        [st.weightEl, `الوزن (القطعة ${n})`],
        [st.karatEl,  `عيار الذهب/ فضة (القطعة ${n})`]
      ];
      if (inst.orderType === 'engraving') req.push([st.engEl,  `نص الحفر (القطعة ${n})`]);
      if (inst.orderType === 'repair')    req.push([st.probEl, `وصف المشكلة (القطعة ${n})`]);
      req.forEach(([el, label]) => { if (el && !el.value.trim()) missing.push({ el, label }); });
    });
    return missing;
  }

  function markMissing(id, list) {
    const inst = instances[id];
    if (!inst) return;
    inst.host.querySelectorAll('.opf-err').forEach(el => el.classList.remove('opf-err'));
    (list || []).forEach(({ el }) => {
      el.classList.add('opf-err');
      const clear = () => el.classList.remove('opf-err');
      el.addEventListener('input',  clear, { once: true });
      el.addEventListener('change', clear, { once: true });
    });
    if (list && list.length) list[0].el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function destroy(id) {
    delete instances[id];
  }

  window.OrderPieceForm = {
    mount, addPiece, collect, collectExisting, validate, markMissing, count, hasPending, destroy,
    has: (id) => !!instances[id],
    LEGACY_IMG, MAX_IMAGES, MAX_IMG_SIZE, MAX_TOTAL
  };
})();
