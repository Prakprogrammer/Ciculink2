/* ============================================================
   CIRCULINK — Cart, Detail Modal & Checkout
   ============================================================ */

const CART_KEY = 'circulink_cart';

/* ── LocalStorage helpers ── */
function getCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
  catch { return []; }
}
function saveCart(items) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  _updateAllCartUI();
}

/* ── Cart CRUD ── */
function addToCart(item) {
  const cart = getCart();
  const existing = cart.find(i => i.id === item.id);
  if (existing) {
    existing.qty += item.minOrder;
  } else {
    cart.push({ ...item });
  }
  saveCart(cart);
  _showToast('Added to cart — ' + item.name.split(' ').slice(0, 4).join(' '));
}
window.addToCart = addToCart;

function removeFromCart(id) {
  saveCart(getCart().filter(i => i.id !== id));
}
window.removeFromCart = removeFromCart;

function clearCart() {
  saveCart([]);
}
window.clearCart = clearCart;

function cartStepQty(id, step) {
  const cart = getCart();
  const item = cart.find(i => i.id === id);
  if (!item) return;
  const next = item.qty + step;
  if (next < item.minOrder) { removeFromCart(id); return; }
  item.qty = next;
  saveCart(cart);
}
window.cartStepQty = cartStepQty;

function getCartCount()  { return getCart().length; }
function getCartTotal()  { return getCart().reduce((s, i) => s + i.price * i.qty, 0); }

/* ── Inject all cart/modal HTML once ── */
function _injectHTML() {
  if (document.getElementById('cartSidebar')) return;
  document.body.insertAdjacentHTML('beforeend', `
<!-- Cart overlay -->
<div class="cart-overlay" id="cartOverlay"></div>

<!-- Cart sidebar -->
<aside class="cart-sidebar" id="cartSidebar" role="dialog" aria-label="Shopping cart">
  <div class="cart-head">
    <div class="cart-head__title">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
      <strong>Your Cart</strong>
    </div>
    <button class="cart-close" onclick="closeCart()" aria-label="Close cart">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>
  </div>
  <div class="cart-body" id="cartBody"></div>
  <div class="cart-footer" id="cartFooter" style="display:none">
    <div class="cart-total-row">
      <span>Estimated Total</span>
      <strong id="cartTotal">$0.00</strong>
    </div>
    <p class="cart-note">Prices per metre. Seller confirms availability &amp; shipping after quote request.</p>
    <button class="btn btn--primary" style="width:100%;justify-content:center" id="checkoutBtn">Request Quote →</button>
    <button class="btn btn--ghost" style="width:100%;justify-content:center;margin-top:8px" onclick="clearCart()">Clear Cart</button>
  </div>
</aside>

<!-- Product detail modal -->
<div class="detail-modal" id="detailModal" role="dialog" aria-modal="true">
  <div class="dm-panel">
    <button class="dm-close" onclick="closeDetail()" aria-label="Close">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>
    <div class="dm-swatch fab-cotton">
      <span class="dm-badge lcard__badge badge--new" style="display:none"></span>
    </div>
    <div class="dm-content">
      <h3 class="dm-title"></h3>
      <p class="dm-desc"></p>
      <div class="dm-price-row">
        <div class="dm-price"></div>
        <span class="dm-avail"></span>
      </div>
      <div class="dm-specs"></div>
      <div class="dm-order-row">
        <div class="dm-qty-wrap">
          <button class="ci-qty-btn" onclick="dmStep(-1)">−</button>
          <input type="number" class="dm-qty" id="dmQtyInput" min="1" value="10"/>
          <button class="ci-qty-btn" onclick="dmStep(1)">+</button>
          <span class="dm-qty-min"></span>
        </div>
        <button class="btn btn--primary dm-atc" id="dmAtcBtn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
          Add to Cart
        </button>
      </div>
      <div class="dm-seller">
        <div class="sel-av sel-av--a dm-seller-av"></div>
        <div>
          <span class="dm-seller-name"></span>
          <span class="dm-rating sel-rating"></span>
        </div>
        <span class="dm-verified">✓ Verified Seller</span>
      </div>
    </div>
  </div>
</div>

<!-- Checkout / quote request modal -->
<div class="checkout-modal" id="checkoutModal" role="dialog" aria-modal="true">
  <div class="cm-panel">
    <button class="dm-close" onclick="closeCheckout()" aria-label="Close">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>
    <div class="cm-header">
      <span class="eyebrow">Almost there</span>
      <h2>Request a Quote</h2>
      <p>We'll forward your enquiry to the sellers. They'll confirm availability, lead times, and exact pricing within 24–48 hours.</p>
    </div>
    <div class="cm-cart-summary" id="cmCartSummary"></div>
    <form class="cm-form" id="checkoutForm">
      <div class="cm-row">
        <div class="cm-field">
          <label>Full Name *</label>
          <input type="text" placeholder="Your name" required/>
        </div>
        <div class="cm-field">
          <label>Business Email *</label>
          <input type="email" placeholder="you@company.com" required/>
        </div>
      </div>
      <div class="cm-field">
        <label>Company / Label</label>
        <input type="text" placeholder="Your brand or company name"/>
      </div>
      <div class="cm-field">
        <label>Notes (optional)</label>
        <textarea placeholder="Special requirements, flexibility on quantity, timeline…" rows="3"></textarea>
      </div>
      <button type="submit" class="btn btn--primary btn--lg" style="width:100%;justify-content:center;margin-top:4px">
        Send Quote Request →
      </button>
    </form>
  </div>
</div>

<!-- Order success banner -->
<div class="order-success" id="orderSuccess">
  <div class="os-inner">
    <div class="os-icon">✓</div>
    <strong>Quote Request Sent!</strong>
    <p>Sellers will respond within 24–48 hours.</p>
  </div>
</div>

<!-- Cart toast -->
<div class="cart-toast" id="cartToast"></div>
`);
}

/* ── Cart sidebar open/close ── */
function openCart() {
  document.getElementById('cartSidebar')?.classList.add('open');
  document.getElementById('cartOverlay')?.classList.add('open');
  document.body.style.overflow = 'hidden';
  _renderCartBody();
}
function closeCart() {
  document.getElementById('cartSidebar')?.classList.remove('open');
  document.getElementById('cartOverlay')?.classList.remove('open');
  document.body.style.overflow = '';
}
window.openCart  = openCart;
window.closeCart = closeCart;

/* ── Render cart sidebar body ── */
function _renderCartBody() {
  const body   = document.getElementById('cartBody');
  const footer = document.getElementById('cartFooter');
  if (!body) return;
  const cart = getCart();

  if (cart.length === 0) {
    body.innerHTML = `
      <div class="cart-empty">
        <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
        <p>Your cart is empty</p>
        <a href="marketplace.html" class="btn btn--primary btn--sm" onclick="closeCart()" style="justify-content:center">Browse Listings</a>
      </div>`;
    if (footer) footer.style.display = 'none';
    return;
  }

  body.innerHTML = cart.map(item => `
    <div class="cart-item">
      <div class="ci-swatch ${item.fabClass}"></div>
      <div class="ci-info">
        <p class="ci-name">${item.name}</p>
        <p class="ci-meta">${item.type}${item.cert && item.cert !== 'none' ? ' · ' + item.cert.toUpperCase() : ''}</p>
        <p class="ci-seller-small">${item.seller}</p>
        <div class="ci-controls">
          <div class="ci-qty-wrap">
            <button class="ci-qty-btn" onclick="cartStepQty('${_esc(item.id)}', -${item.minOrder})">−</button>
            <span class="ci-qty-val">${item.qty}m</span>
            <button class="ci-qty-btn" onclick="cartStepQty('${_esc(item.id)}', ${item.minOrder})">+</button>
          </div>
          <span class="ci-price">$${(item.price * item.qty).toFixed(2)}</span>
          <button class="ci-remove" onclick="removeFromCart('${_esc(item.id)}')" aria-label="Remove item">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      </div>
    </div>`).join('');

  if (footer) {
    footer.style.display = 'block';
    const totalEl = document.getElementById('cartTotal');
    if (totalEl) totalEl.textContent = '$' + getCartTotal().toFixed(2);
  }
}

/* ── Update badge counts across page ── */
function _updateAllCartUI() {
  const count = getCartCount();
  document.querySelectorAll('.cart-badge').forEach(el => {
    el.textContent = count;
    el.style.display = count > 0 ? 'flex' : 'none';
  });
  // If sidebar is open, re-render it
  if (document.getElementById('cartSidebar')?.classList.contains('open')) {
    _renderCartBody();
  }
}

/* ── Toast ── */
function _showToast(msg) {
  const t = document.getElementById('cartToast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._tid);
  t._tid = setTimeout(() => t.classList.remove('show'), 2800);
}

/* ── Quick-add from card (no modal) ── */
function quickAddToCart(card) {
  const name      = card.querySelector('h4')?.textContent || '';
  const type      = card.querySelector('.lc-type')?.textContent || '';
  const certEl    = card.querySelector('.lc-cert');
  const seller    = card.querySelector('.lc-seller span')?.textContent || '';
  const fabImgEl  = card.querySelector('.lcard__img');
  const fabClass  = fabImgEl ? [...fabImgEl.classList].find(c => c.startsWith('fab-')) || '' : '';
  const price     = parseFloat(card.dataset.price || 0);
  const minOrder  = parseInt(card.dataset.minorder || 10);
  const id        = card.dataset.name || name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  addToCart({
    id,
    name,
    type,
    price,
    qty: minOrder,
    minOrder,
    seller,
    cert:      card.dataset.cert      || '',
    condition: card.dataset.condition || '',
    fabClass,
  });
}
window.quickAddToCart = quickAddToCart;

/* ── Detail modal ── */
let _dmMinOrder = 10;
let _dmStep     = 5;

function openDetail(card) {
  const modal = document.getElementById('detailModal');
  if (!modal) return;

  const name      = card.querySelector('h4')?.textContent || '';
  const desc      = card.querySelector('.lc-desc')?.textContent || '';
  const priceText = card.querySelector('.lc-price strong')?.textContent || '';
  const qtyText   = card.querySelector('.lc-qty')?.textContent || '';
  const type      = card.querySelector('.lc-type')?.textContent || '';
  const certEl    = card.querySelector('.lc-cert');
  const cert      = certEl ? certEl.textContent : '';
  const seller    = card.querySelector('.lc-seller span')?.textContent || '';
  const rating    = card.querySelector('.sel-rating')?.textContent || '';
  const badgeEl   = card.querySelector('.lcard__badge');
  const badge     = badgeEl ? badgeEl.textContent : '';

  const fabImgEl  = card.querySelector('.lcard__img');
  const fabClass  = fabImgEl ? [...fabImgEl.classList].find(c => c.startsWith('fab-')) || 'fab-cotton' : 'fab-cotton';
  const fabStyle  = fabImgEl?.getAttribute('style') || '';

  const price     = parseFloat(card.dataset.price || 0);
  const minOrder  = parseInt(card.dataset.minorder || 5);
  const gsm       = card.dataset.gsm || '';
  const condRaw   = card.dataset.condition || '';
  const certRaw   = card.dataset.cert || '';
  const locRaw    = card.dataset.location || '';
  const id        = card.dataset.name || name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  _dmMinOrder = minOrder;
  _dmStep     = Math.max(1, minOrder);

  const condLabel = { deadstock:'Deadstock', surplus:'Surplus', 'end-of-roll':'End-of-Roll', sample:'Sample Stock', seconds:'Seconds' };
  const locLabel  = { singapore:'Singapore', india:'India', indonesia:'Indonesia', myanmar:'Myanmar', sea:'South-East Asia', europe:'Europe' };

  // Update swatch
  const swatch = modal.querySelector('.dm-swatch');
  swatch.className = 'dm-swatch ' + fabClass;
  if (fabStyle) swatch.style.cssText = fabStyle;

  // Badge
  const dmBadge = modal.querySelector('.dm-badge');
  if (badge) { dmBadge.textContent = badge; dmBadge.style.display = ''; }
  else         { dmBadge.style.display = 'none'; }

  modal.querySelector('.dm-title').textContent    = name;
  modal.querySelector('.dm-desc').textContent     = desc;
  modal.querySelector('.dm-price').innerHTML      = `<strong>${priceText}</strong><span> / metre</span>`;
  modal.querySelector('.dm-avail').textContent    = qtyText + ' available';
  modal.querySelector('.dm-seller-name').textContent = seller;
  modal.querySelector('.dm-rating').textContent   = rating;

  modal.querySelector('.dm-specs').innerHTML = `
    <div class="dm-spec"><span>Fabric</span><strong>${type}</strong></div>
    ${cert ? `<div class="dm-spec"><span>Certification</span><strong>${cert}</strong></div>` : ''}
    ${gsm  ? `<div class="dm-spec"><span>Weight</span><strong>${gsm} gsm</strong></div>` : ''}
    <div class="dm-spec"><span>Condition</span><strong>${condLabel[condRaw] || condRaw}</strong></div>
    <div class="dm-spec"><span>Origin</span><strong>${locLabel[locRaw] || locRaw}</strong></div>
    <div class="dm-spec"><span>Min. Order</span><strong>${minOrder}m</strong></div>
  `;

  const qtyInput = document.getElementById('dmQtyInput');
  if (qtyInput) { qtyInput.min = minOrder; qtyInput.value = minOrder; }
  modal.querySelector('.dm-qty-min').textContent = `Min. ${minOrder}m`;

  // Wire up Add to Cart
  document.getElementById('dmAtcBtn').onclick = () => {
    const orderQty = Math.max(minOrder, parseInt(document.getElementById('dmQtyInput')?.value || minOrder));
    addToCart({
      id, name, type, price,
      qty: orderQty,
      minOrder,
      seller,
      cert:      certRaw,
      condition: condRaw,
      fabClass,
    });
    closeDetail();
    openCart();
  };

  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeDetail() {
  document.getElementById('detailModal')?.classList.remove('open');
  document.body.style.overflow = '';
}
window.openDetail  = openDetail;
window.closeDetail = closeDetail;

window.dmStep = function(dir) {
  const input = document.getElementById('dmQtyInput');
  if (!input) return;
  const min = parseInt(input.min) || _dmMinOrder;
  input.value = Math.max(min, (parseInt(input.value) || min) + dir * _dmStep);
};

/* ── Checkout modal ── */
function openCheckout() {
  const modal = document.getElementById('checkoutModal');
  if (!modal) return;
  // Render cart summary inside checkout
  const summary = document.getElementById('cmCartSummary');
  if (summary) {
    const cart = getCart();
    summary.innerHTML = `
      <div class="cm-summary-list">
        ${cart.map(i => `
          <div class="cm-summary-item">
            <div class="ci-swatch ci-swatch--sm ${i.fabClass}"></div>
            <span>${i.name}</span>
            <span class="cm-si-qty">${i.qty}m</span>
            <span class="cm-si-price">$${(i.price * i.qty).toFixed(2)}</span>
          </div>`).join('')}
        <div class="cm-summary-total">
          <strong>Total</strong><strong>$${getCartTotal().toFixed(2)}</strong>
        </div>
      </div>`;
  }
  modal.classList.add('open');
}
function closeCheckout() {
  document.getElementById('checkoutModal')?.classList.remove('open');
}
window.openCheckout  = openCheckout;
window.closeCheckout = closeCheckout;

/* ── Inject "View Details" + "Add to Cart" buttons into every listing card ── */
function _injectCardActions() {
  document.querySelectorAll('.lcard').forEach(card => {
    if (card.querySelector('.lc-actions')) return; // already done
    const body = card.querySelector('.lcard__body');
    if (!body) return;
    const div = document.createElement('div');
    div.className = 'lc-actions';
    div.innerHTML = `
      <button class="btn btn--sm btn--outline lca-detail" onclick="openDetail(this.closest('.lcard'))">Details</button>
      <button class="btn btn--sm btn--primary  lca-atc"    onclick="quickAddToCart(this.closest('.lcard'))">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
        Add to Cart
      </button>`;
    body.appendChild(div);
  });
}

/* ── Helper: escape string for inline onclick ── */
function _esc(s) { return s.replace(/'/g, "\\'"); }

/* ── Init on DOM ready ── */
document.addEventListener('DOMContentLoaded', () => {
  _injectHTML();
  _updateAllCartUI();
  _injectCardActions();

  // Cart overlay closes sidebar
  document.getElementById('cartOverlay')?.addEventListener('click', closeCart);

  // Detail modal backdrop closes it
  document.getElementById('detailModal')?.addEventListener('click', e => {
    if (e.target === document.getElementById('detailModal')) closeDetail();
  });

  // Checkout modal backdrop closes it
  document.getElementById('checkoutModal')?.addEventListener('click', e => {
    if (e.target === document.getElementById('checkoutModal')) closeCheckout();
  });

  // Checkout button in cart sidebar
  document.getElementById('checkoutBtn')?.addEventListener('click', () => {
    closeCart();
    openCheckout();
  });

  // Checkout form submit
  document.getElementById('checkoutForm')?.addEventListener('submit', e => {
    e.preventDefault();
    closeCheckout();
    clearCart();
    const success = document.getElementById('orderSuccess');
    if (success) {
      success.classList.add('open');
      setTimeout(() => success.classList.remove('open'), 4500);
    }
  });
});
