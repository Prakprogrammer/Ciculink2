/* ============================================================
   CIRCULINK — Shared Script
   ============================================================ */

/* ── Nav scroll ── */
const nav = document.getElementById('nav');
if (nav) {
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });
}

/* ── Mobile menu ── */
const hamburger  = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');

function openMenu() {
  mobileMenu.classList.add('open');
  document.body.style.overflow = 'hidden';
  hamburger.setAttribute('aria-expanded', 'true');
  const s = hamburger.querySelectorAll('span');
  s[0].style.cssText = 'transform:rotate(45deg) translate(5px,5px)';
  s[1].style.cssText = 'opacity:0;transform:scaleX(0)';
  s[2].style.cssText = 'transform:rotate(-45deg) translate(5px,-5px)';
}
function closeMenu() {
  mobileMenu && mobileMenu.classList.remove('open');
  document.body.style.overflow = '';
  hamburger && hamburger.setAttribute('aria-expanded', 'false');
  hamburger && hamburger.querySelectorAll('span').forEach(s => s.style.cssText = '');
}
window.closeMenu = closeMenu;

hamburger && hamburger.addEventListener('click', () => {
  mobileMenu.classList.contains('open') ? closeMenu() : openMenu();
});

/* ── Scroll reveal ── */
const revealObs = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('revealed');
      revealObs.unobserve(e.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.reveal, .reveal-r').forEach(el => revealObs.observe(el));

/* ── How It Works tabs ── */
const tabBtns  = document.querySelectorAll('.tab-btn');
const tabPanes = document.querySelectorAll('.tab-pane');
tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const target = btn.dataset.tab;
    tabBtns.forEach(b  => b.classList.remove('tab-btn--on'));
    tabPanes.forEach(p => p.classList.remove('tab-pane--on'));
    btn.classList.add('tab-btn--on');
    const pane = document.querySelector(`[data-pane="${target}"]`);
    if (pane) {
      pane.classList.add('tab-pane--on');
      pane.querySelectorAll('.reveal').forEach(el => {
        el.classList.remove('revealed');
        setTimeout(() => el.classList.add('revealed'), 60);
      });
    }
  });
});

/* ── Animated counters ── */
function animateNum(el) {
  const target = parseInt(el.dataset.target, 10);
  const dur    = 1800;
  const steps  = 50;
  const inc    = target / steps;
  let cur = 0, tick = 0;
  const id = setInterval(() => {
    cur += inc; tick++;
    el.textContent = Math.floor(cur).toLocaleString();
    if (tick >= steps) { el.textContent = target.toLocaleString(); clearInterval(id); }
  }, dur / steps);
}
const counterObs = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) { animateNum(e.target); counterObs.unobserve(e.target); }
  });
}, { threshold: 0.5 });
document.querySelectorAll('[data-target]').forEach(el => counterObs.observe(el));

/* ── Hero parallax (subtle) ── */
const cardStack = document.querySelector('.card-stack');
if (cardStack) {
  document.addEventListener('mousemove', e => {
    const x = (e.clientX / window.innerWidth  - .5) * 14;
    const y = (e.clientY / window.innerHeight - .5) * 10;
    const cards = cardStack.querySelectorAll('.h-card');
    const mult = [1, .6, .3];
    cards.forEach((c, i) => {
      const base = i === 0 ? 'rotate(2deg)' : i === 1 ? 'rotate(-3deg)' : 'rotate(-7deg)';
      c.style.transform = `${base} translate(${x*mult[i]}px,${y*mult[i]}px)`;
    });
  }, { passive: true });
}

/* ── Favourite toggle ── */
document.querySelectorAll('.lcard__fav').forEach(btn => {
  btn.addEventListener('click', e => {
    e.stopPropagation();
    btn.classList.toggle('saved');
  });
});

/* ── Smooth anchor scrolling ── */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const id = a.getAttribute('href');
    if (id === '#') return;
    const el = document.querySelector(id);
    if (!el) return;
    e.preventDefault();
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 80, behavior: 'smooth' });
    closeMenu();
  });
});

/* ── Filter panel mobile (marketplace) ── */
function openFilterPanel() {
  const fp = document.getElementById('filterPanel');
  const fo = document.getElementById('filterOverlay');
  fp && fp.classList.add('mobile-open');
  fo && fo.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeFilterPanel() {
  const fp = document.getElementById('filterPanel');
  const fo = document.getElementById('filterOverlay');
  fp && fp.classList.remove('mobile-open');
  fo && fo.classList.remove('open');
  document.body.style.overflow = '';
}
window.openFilterPanel  = openFilterPanel;
window.closeFilterPanel = closeFilterPanel;

/* ── Filter section accordion ── */
document.querySelectorAll('.fs-toggle').forEach(btn => {
  btn.addEventListener('click', () => {
    const sec = btn.nextElementSibling;
    const isOpen = btn.classList.contains('open');
    btn.classList.toggle('open');
    sec && sec.classList.toggle('open');
  });
});

/* ── View toggle (marketplace) ── */
document.querySelectorAll('.view-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('view-btn--on'));
    btn.classList.add('view-btn--on');
    const grid = document.getElementById('listingsGrid');
    if (grid) grid.classList.toggle('list-view', btn.dataset.view === 'list');
  });
});
