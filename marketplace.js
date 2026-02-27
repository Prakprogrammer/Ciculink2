/* ============================================================
   CIRCULINK — Marketplace Filter Logic
   ============================================================ */

const state = {
  search:    '',
  types:     new Set(),
  certs:     new Set(),
  conditions:new Set(),
  colors:    new Set(),
  location:  '',
  minOrder:  '',
  priceMin:  0,
  priceMax:  100,
  gsmMin:    50,
  gsmMax:    500,
  sortBy:    'newest'
};

/* ── Get all cards ── */
const allCards = () => Array.from(document.querySelectorAll('#listingsGrid .lcard'));

/* ── Update results count ── */
function updateCount() {
  const visible = allCards().filter(c => !c.classList.contains('hidden')).length;
  const el = document.getElementById('visibleCount');
  if (el) el.textContent = visible;
  const nr = document.getElementById('noResults');
  if (nr) nr.style.display = visible === 0 ? 'block' : 'none';
}

/* ── Apply all filters ── */
function applyFilters() {
  allCards().forEach(card => {
    const name      = (card.dataset.name      || '').toLowerCase();
    const type      = (card.dataset.type      || '');
    const price     = parseFloat(card.dataset.price || 0);
    const cert      = (card.dataset.cert      || '').toLowerCase();
    const condition = (card.dataset.condition || '');
    const color     = (card.dataset.color     || '');
    const gsm       = parseInt(card.dataset.gsm || 0);
    const location  = (card.dataset.location  || '');
    const minOrder  = parseInt(card.dataset.minorder || 0);

    let show = true;

    // Search
    if (state.search && !name.includes(state.search.toLowerCase())) show = false;

    // Type (any selected must match)
    if (show && state.types.size > 0 && !state.types.has(type)) show = false;

    // Price range
    if (show && (price < state.priceMin || price > state.priceMax)) show = false;

    // GSM range
    if (show && gsm > 0 && (gsm < state.gsmMin || gsm > state.gsmMax)) show = false;

    // Certifications (any of selected certs must appear in card's cert list)
    if (show && state.certs.size > 0) {
      const cardCerts = cert.split(',').map(c => c.trim());
      const match = [...state.certs].some(c => c === 'none' ? cardCerts.includes('none') || cert === '' : cardCerts.includes(c));
      if (!match) show = false;
    }

    // Condition
    if (show && state.conditions.size > 0 && !state.conditions.has(condition)) show = false;

    // Color
    if (show && state.colors.size > 0 && !state.colors.has(color)) show = false;

    // Location
    if (show && state.location && location !== state.location) show = false;

    // Min order (filter value = "buyer wants up to X metres" so minorder must be <= filter value)
    if (show && state.minOrder && minOrder > parseInt(state.minOrder)) show = false;

    card.classList.toggle('hidden', !show);
  });

  sortCards();
  updateCount();
  renderChips();
  updateFilterBadge();
}

/* ── Sort visible cards ── */
function sortCards() {
  const grid = document.getElementById('listingsGrid');
  if (!grid) return;
  const cards = allCards();
  const sort  = state.sortBy;

  cards.sort((a, b) => {
    const pa = parseFloat(a.dataset.price || 0);
    const pb = parseFloat(b.dataset.price || 0);
    const qa = parseInt(a.querySelector('.lc-qty')?.textContent?.replace(/[^0-9]/g,'') || 0);
    const qb = parseInt(b.querySelector('.lc-qty')?.textContent?.replace(/[^0-9]/g,'') || 0);
    if (sort === 'price-low')  return pa - pb;
    if (sort === 'price-high') return pb - pa;
    if (sort === 'qty-high')   return qb - qa;
    return 0; // newest = DOM order
  });

  cards.forEach(c => grid.appendChild(c));
}

/* ── Render active filter chips ── */
function renderChips() {
  const container = document.getElementById('activeChips');
  if (!container) return;
  container.innerHTML = '';

  const add = (label, removeCallback) => {
    const chip = document.createElement('span');
    chip.className = 'chip';
    chip.innerHTML = `${label} <span class="chip-x" role="button" tabindex="0" aria-label="Remove filter">✕</span>`;
    chip.querySelector('.chip-x').addEventListener('click', removeCallback);
    chip.querySelector('.chip-x').addEventListener('keydown', e => e.key === 'Enter' && removeCallback());
    container.appendChild(chip);
  };

  if (state.search) add(`"${state.search}"`, () => { state.search = ''; document.getElementById('searchInput').value = ''; applyFilters(); });
  state.types.forEach(v      => add(typeName(v),       () => { state.types.delete(v);      uncheckBox('type',      v); applyFilters(); }));
  state.certs.forEach(v      => add(certName(v),       () => { state.certs.delete(v);      uncheckBox('cert',      v); applyFilters(); }));
  state.conditions.forEach(v => add(condName(v),       () => { state.conditions.delete(v); uncheckBox('condition', v); applyFilters(); }));
  state.colors.forEach(v     => add('Colour: '+v,      () => { state.colors.delete(v);     document.querySelector(`.swatch[data-color="${v}"]`)?.classList.remove('selected'); applyFilters(); }));
  if (state.location) add('Location: '+state.location, () => { state.location = ''; document.getElementById('locationFilter').value = ''; applyFilters(); });
  if (state.minOrder) add('Min order ≤ '+state.minOrder+'m', () => { state.minOrder = ''; document.getElementById('minOrderFilter').value = ''; applyFilters(); });
  if (state.priceMin > 0 || state.priceMax < 100) add(`$${state.priceMin}–$${state.priceMax}/m`, () => { state.priceMin = 0; state.priceMax = 100; document.getElementById('priceMin').value = 0; document.getElementById('priceMax').value = 100; updateSlider('price'); applyFilters(); });
  if (state.gsmMin > 50 || state.gsmMax < 500) add(`${state.gsmMin}–${state.gsmMax} gsm`, () => { state.gsmMin = 50; state.gsmMax = 500; document.getElementById('gsmMin').value = 50; document.getElementById('gsmMax').value = 500; updateSlider('gsm'); applyFilters(); });
}

/* ── Label helpers ── */
const typeLabels = { 'cotton':'Cotton','organic-cotton':'Organic Cotton','linen':'Linen','wool':'Wool/Merino','silk':'Silk','cashmere':'Cashmere','hemp':'Hemp','bamboo':'Bamboo/Modal','polyester':'Recycled Polyester','nylon':'Nylon','viscose':'Viscose','tencel':'Tencel','denim':'Denim','blend':'Blends' };
const certLabels = { 'gots':'GOTS','oeko-tex':'OEKO-TEX','grs':'GRS','rws':'RWS','bci':'BCI','bluesign':'Bluesign','none':'Uncertified' };
const condLabels = { 'deadstock':'Deadstock','surplus':'Surplus','end-of-roll':'End-of-Roll','sample':'Sample Stock','seconds':'Seconds' };
const typeName = v => typeLabels[v] || v;
const certName = v => certLabels[v] || v;
const condName = v => condLabels[v] || v;

function uncheckBox(name, val) {
  const el = document.querySelector(`input[name="${name}"][value="${val}"]`);
  if (el) el.checked = false;
}

/* ── Filter badge count (mobile) ── */
function updateFilterBadge() {
  const count = state.types.size + state.certs.size + state.conditions.size + state.colors.size +
    (state.location ? 1 : 0) + (state.minOrder ? 1 : 0) + (state.search ? 1 : 0) +
    (state.priceMin > 0 || state.priceMax < 100 ? 1 : 0) +
    (state.gsmMin > 50 || state.gsmMax < 500 ? 1 : 0);
  const badge = document.getElementById('filterBadge');
  if (badge) { badge.textContent = count; badge.style.display = count > 0 ? 'flex' : 'none'; }
}

/* ── Clear all ── */
document.getElementById('clearAllFilters')?.addEventListener('click', () => {
  state.search = ''; state.types.clear(); state.certs.clear(); state.conditions.clear();
  state.colors.clear(); state.location = ''; state.minOrder = '';
  state.priceMin = 0; state.priceMax = 100; state.gsmMin = 50; state.gsmMax = 500;

  const input = document.getElementById('searchInput'); if (input) input.value = '';
  document.querySelectorAll('#filterPanel input[type="checkbox"]').forEach(cb => cb.checked = false);
  document.querySelectorAll('.swatch').forEach(s => s.classList.remove('selected'));
  const loc = document.getElementById('locationFilter'); if (loc) loc.value = '';
  const mo  = document.getElementById('minOrderFilter'); if (mo)  mo.value  = '';
  document.getElementById('priceMin').value = 0; document.getElementById('priceMax').value = 100;
  document.getElementById('gsmMin').value   = 50; document.getElementById('gsmMax').value  = 500;
  updateSlider('price'); updateSlider('gsm');
  applyFilters();
});
window.clearAllFilters = () => document.getElementById('clearAllFilters')?.click();

/* ── Search ── */
const searchInput = document.getElementById('searchInput');
const searchBtn   = document.getElementById('searchBtn');
function doSearch() { state.search = searchInput.value.trim(); applyFilters(); }
searchInput?.addEventListener('input',  () => { if (searchInput.value === '') { state.search = ''; applyFilters(); } });
searchInput?.addEventListener('keydown', e => e.key === 'Enter' && doSearch());
searchBtn?.addEventListener('click', doSearch);

/* ── Checkbox filters ── */
document.querySelectorAll('input[name="type"]').forEach(cb => {
  cb.addEventListener('change', () => { cb.checked ? state.types.add(cb.value) : state.types.delete(cb.value); applyFilters(); });
});
document.querySelectorAll('input[name="cert"]').forEach(cb => {
  cb.addEventListener('change', () => { cb.checked ? state.certs.add(cb.value) : state.certs.delete(cb.value); applyFilters(); });
});
document.querySelectorAll('input[name="condition"]').forEach(cb => {
  cb.addEventListener('change', () => { cb.checked ? state.conditions.add(cb.value) : state.conditions.delete(cb.value); applyFilters(); });
});

/* ── Colour swatches ── */
document.querySelectorAll('.swatch').forEach(sw => {
  sw.addEventListener('click', () => {
    const c = sw.dataset.color;
    if (sw.classList.contains('selected')) {
      sw.classList.remove('selected'); state.colors.delete(c);
    } else {
      sw.classList.add('selected'); state.colors.add(c);
    }
    applyFilters();
  });
});

/* ── Location & min order selects ── */
document.getElementById('locationFilter')?.addEventListener('change', e => { state.location = e.target.value; applyFilters(); });
document.getElementById('minOrderFilter')?.addEventListener('change', e => { state.minOrder = e.target.value; applyFilters(); });

/* ── Sort ── */
document.getElementById('sortBy')?.addEventListener('change', e => { state.sortBy = e.target.value; applyFilters(); });

/* ── Range Sliders ── */
function updateSlider(key) {
  const lo  = document.getElementById(key + 'Min');
  const hi  = document.getElementById(key + 'Max');
  const fill = document.getElementById(key + 'Fill');
  const lblLo = document.getElementById(key + 'MinLbl');
  const lblHi = document.getElementById(key + 'MaxLbl');
  if (!lo || !hi) return;

  let loVal = parseFloat(lo.value);
  let hiVal = parseFloat(hi.value);
  const min = parseFloat(lo.min);
  const max = parseFloat(lo.max);

  // Prevent crossing
  if (loVal > hiVal) { if (document.activeElement === lo) lo.value = hiVal; else hi.value = loVal; }
  loVal = parseFloat(lo.value); hiVal = parseFloat(hi.value);

  const pctLo = ((loVal - min) / (max - min)) * 100;
  const pctHi = ((hiVal - min) / (max - min)) * 100;
  if (fill) { fill.style.left = pctLo + '%'; fill.style.right = (100 - pctHi) + '%'; }

  if (key === 'price') {
    if (lblLo) lblLo.textContent = '$' + loVal;
    if (lblHi) lblHi.textContent = hiVal >= 100 ? '$100+' : '$' + hiVal;
    state.priceMin = loVal; state.priceMax = hiVal;
  } else if (key === 'gsm') {
    if (lblLo) lblLo.textContent = loVal + ' gsm';
    if (lblHi) lblHi.textContent = hiVal + ' gsm';
    state.gsmMin = loVal; state.gsmMax = hiVal;
  }
}

['price', 'gsm'].forEach(key => {
  const lo = document.getElementById(key + 'Min');
  const hi = document.getElementById(key + 'Max');
  if (lo) lo.addEventListener('input', () => { updateSlider(key); applyFilters(); });
  if (hi) hi.addEventListener('input', () => { updateSlider(key); applyFilters(); });
  updateSlider(key); // init
});

/* ── Init ── */
updateCount();
