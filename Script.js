 (function () {
  // Only run on Book Professional page
  if (!document.body.classList.contains('book-professional')) return;

  const bpNav = document.querySelector('.bp-navbar');
  if (!bpNav) return;

  const THRESHOLD = 10; // start turning white after slight scroll
  let ticking = false;

  function applyState(scrolled) {
    if (scrolled) {
      bpNav.classList.add('bp-scrolled');
    } else {
      bpNav.classList.remove('bp-scrolled');
    }
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const scrolled = window.scrollY > THRESHOLD;
      applyState(scrolled);
      ticking = false;
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('load', onScroll, { once: true });
})();

// Home page: Get Started and Sign Up buttons
(function(){
  const getStarted = document.querySelector('.btn-get-started');
  const signUp = document.querySelector('.btn-signup');
  if (getStarted) {
    getStarted.addEventListener('click', function(){
      window.location.href = 'register.html';
    });
  }
  if (signUp) {
    signUp.addEventListener('click', function(){
      window.location.href = 'LogIn.html';
    });
  }
})();

// Book Professional: smooth scroll to Make Bookings with offset for fixed navbar
(function () {
  if (!document.body.classList.contains('book-professional')) return;
  const link = document.querySelector('.bp-nav-links a[href="#bpBookingTitle"]');
  const target = document.getElementById('bpBookingTitle');
  if (!link || !target) return;

  function getOffsetTop(el) {
    const rect = el.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    return rect.top + scrollTop;
  }

  link.addEventListener('click', (e) => {
    e.preventDefault();
    const nav = document.querySelector('.bp-navbar');
    const navH = nav ? nav.offsetHeight : 0;
    const y = getOffsetTop(target) - (navH + 8); // small extra gap
    window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
  });
})();

// Book Professional: search and results render
(function () {
  if (!document.body.classList.contains('book-professional')) return;

  const form = document.querySelector('.bp-booking__form');
  const resultsGrid = document.getElementById('bpResults');
  const emptyMsg = document.getElementById('bpResultsEmpty');
  if (!form || !resultsGrid || !emptyMsg) return;

  // Backend dataset
  const BASE = (location.protocol === 'file:') ? 'http://localhost/YourReliever/' : '';
  let professionals = [];

  async function checkAuth() {
    try {
      const r = await fetch((location.protocol === 'file:' ? 'http://localhost/YourReliever/' : '') + 'backend/api/user.php?action=full', { credentials: 'include' });
      const j = await r.json();
      return !!(j && j.success);
    } catch (_) { return false; }
  }

  function loadProfessionals(date){
    const params = new URLSearchParams();
    params.set('action','professionals');
    if (date) params.set('date', date);
    return fetch(BASE + 'backend/api/bookings.php?' + params.toString(), { credentials: 'include' })
      .then(r => r.json())
      .then(json => {
        if (json && json.success && Array.isArray(json.data)){
          professionals = json.data.map(p => {
            const cat = (p.category || p.professional_category || '').toString();
            return {
              id: String(p.user_id),
              name: p.full_name,
              category: cat || '',
              title: (cat ? cat.replace('-', ' ') : 'Professional'),
              desc: p.email || ''
            };
          });
        } else {
          professionals = [];
        }
        render(professionals);
      })
      .catch(() => { professionals = []; render([]); });
  }

  function normalize(s) {
    return (s || '').toString().toLowerCase();
  }

  function matches(item, q, cat) {
    const nq = normalize(q);
    const name = normalize(item.name);
    const title = normalize(item.title);
    const desc = normalize(item.desc);
    const inText = !nq || name.includes(nq) || title.includes(nq) || desc.includes(nq);
    const inCat = !cat || item.category === cat;
    return inText && inCat;
  }

  function initials(name) {
    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(n => n[0].toUpperCase())
      .join('');
  }

  function render(list) {
    resultsGrid.innerHTML = '';
    if (!list.length) {
      emptyMsg.hidden = false;
      return;
    }
    emptyMsg.hidden = true;
    const frag = document.createDocumentFragment();
    list.forEach(item => {
      const card = document.createElement('article');
      card.className = 'bp-card';
      card.innerHTML = `
        <div class="bp-card__header">
          <div class="bp-card__avatar" aria-hidden="true">${initials(item.name)}</div>
          <div>
            <h3 class="bp-card__name">${item.name}</h3>
            <p class="bp-card__meta">${(item.category || '').replace('-', ' ')}</p>
          </div>
        </div>
        <p class="bp-card__desc">${item.desc}</p>
        <div class="bp-card__actions">
          <button class="bp-card__book" data-id="${item.id}">Book</button>
        </div>
      `;
      frag.appendChild(card);
    });
    resultsGrid.appendChild(frag);
  }

  // Handle form submit
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const q = (formData.get('q') || '').toString();
    const category = (formData.get('category') || '').toString();
    const results = professionals.filter(p => matches(p, q, category));
    render(results);
  });

  // Book button click (event delegation)
  resultsGrid.addEventListener('click', async (e) => {
    const btn = e.target.closest('.bp-card__book');
    if (!btn) return;
    const id = btn.getAttribute('data-id');
    const pro = professionals.find(p => p.id === id);
    if (!pro) return;
    const ok = await checkAuth();
    if (!ok) { alert('Please log in to book a professional.'); return; }
    if (typeof window.bpShowBookingFor === 'function') { window.bpShowBookingFor(pro.id); }
  });

  // Initial load
  loadProfessionals('');
})();

// Carousel autoplay/loop logic
(function () {
  // Configuration
  const AUTOPLAY_INTERVAL = 2500; // ms between moves (reduced wait)
  const SELECTOR_CAROUSEL = '.carousel';
  const SELECTOR_TRACK = '.carousel__track';

  const carousel = document.querySelector(SELECTOR_CAROUSEL);
  if (!carousel) return;

  const track = carousel.querySelector(SELECTOR_TRACK);
  if (!track) return;

  let autoplayTimer = null;
  let isAnimating = false;

  function pxToNumber(px) {
    return Number(String(px).replace('px', '')) || 0;
  }

  function getStepSize() {
    // Width of the first slide + gap
    const firstSlide = track.querySelector('.carousel__slide');
    if (!firstSlide) return 0;

    const slideRect = firstSlide.getBoundingClientRect();
    const styles = getComputedStyle(track);
    const gap = pxToNumber(styles.gap);
    return Math.round(slideRect.width + gap);
  }

  function parseFirstTransitionMs(node) {
    const cs = getComputedStyle(node);
    const durs = cs.transitionDuration.split(',').map(s => s.trim());
    const delays = cs.transitionDelay.split(',').map(s => s.trim());
    const durS = durs[0] || '0s';
    const delayS = delays[0] || '0s';
    const toMs = v => (v.endsWith('ms') ? parseFloat(v) : parseFloat(v) * 1000);
    return toMs(durS) + toMs(delayS);
  }

  function moveOneStepLeft() {
    if (isAnimating) return;
    const step = getStepSize();
    if (!step) return; 

    isAnimating = true;
    track.classList.add('sliding');
    track.style.transform = `translateX(-${step}px)`;

    const handleTransitionEnd = () => {
      cleanup();
      // Move first slide to the end
      const first = track.firstElementChild;
      if (first) track.appendChild(first);

      // Snap back to 0 without flicker
      const prevTransition = track.style.transition;
      track.style.transition = 'none';
      track.style.transform = 'translateX(0)';
      // Force reflow
      void track.offsetHeight;
      // Restore transition
      track.style.transition = prevTransition;

      track.classList.remove('sliding');
      isAnimating = false;
    };

    const cleanup = () => {
      track.removeEventListener('transitionend', handleTransitionEnd);
      if (fallbackTimer) clearTimeout(fallbackTimer);
    };

    track.addEventListener('transitionend', handleTransitionEnd, { once: true });

    // Fallback in case transitionend is missed
    const ms = parseFirstTransitionMs(track) || 1000;
    const fallbackTimer = setTimeout(handleTransitionEnd, ms + 120);
  }

  function startAutoplay() {
    if (autoplayTimer) return;
    autoplayTimer = setInterval(moveOneStepLeft, AUTOPLAY_INTERVAL);
  }

  function stopAutoplay() {
    if (!autoplayTimer) return;
    clearInterval(autoplayTimer);
    autoplayTimer = null;
  }

  // Pause on hover/focus
  carousel.addEventListener('mouseenter', stopAutoplay);
  carousel.addEventListener('mouseleave', startAutoplay);
  carousel.addEventListener('focusin', stopAutoplay);
  carousel.addEventListener('focusout', startAutoplay);

  // Pause when tab hidden
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopAutoplay();
    } else {
      startAutoplay();
    }
  });

  // Respect users who prefer reduced motion
  const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (mql.matches) {
    stopAutoplay();
    track.style.transition = 'none';
    return;
  }

  // Start only after all resources (images) are loaded
  if (document.readyState === 'complete') {
    startAutoplay();
  } else {
    window.addEventListener('load', startAutoplay, { once: true });
  }
})();


// Book Professional: video mute/unmute overlay control
(function () {
  const page = document.body;
  if (!page || !page.classList.contains('book-professional')) return;

  const video = document.querySelector('.bp-video__player');
  const btn = document.querySelector('.bp-video__mute-btn');
  if (!video || !btn) return;

  function updateButton() {
    const isMuted = video.muted !== false; // treat undefined as muted for safety
    btn.setAttribute('aria-pressed', String(!isMuted));
    btn.setAttribute('aria-label', isMuted ? 'Unmute video' : 'Mute video');
    btn.title = isMuted ? 'Unmute' : 'Mute';
    btn.textContent = isMuted ? '🔇' : '🔊';
  }

  // Attempt to ensure autoplay resumes when toggling
  async function ensurePlaying() {
    try {
      if (video.paused) {
        await video.play();
      }
    } catch (e) {
      // Autoplay may be blocked; ignore
    }
  }

  btn.addEventListener('click', async () => {
    // Toggle mute state
    video.muted = !video.muted;
    updateButton();
    await ensurePlaying();
  });

  // Initialize button on load/ready
  if (document.readyState === 'complete') {
    updateButton();
  } else {
    window.addEventListener('load', updateButton, { once: true });
  }
})();

// Navbar scroll behavior (collapsed fixed nav)
(function () {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;

  const BODY_FIXED_CLASS = 'has-fixed-nav';
  const BODY_SHIFT_CLASS = 'nav-shift';
  const NAV_SCROLLED_CLASS = 'navbar--scrolled';
  const THRESHOLD = 120; // px before collapsing

  let ticking = false;

  function applyState(scrolled) {
    if (scrolled) {
      document.body.classList.add(BODY_FIXED_CLASS, BODY_SHIFT_CLASS);
      navbar.classList.add(NAV_SCROLLED_CLASS);
    } else {
      document.body.classList.remove(BODY_FIXED_CLASS, BODY_SHIFT_CLASS);
      navbar.classList.remove(NAV_SCROLLED_CLASS);
    }
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const scrolled = window.scrollY > THRESHOLD;
      applyState(scrolled);
      ticking = false;
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('load', onScroll, { once: true });
})();

// FAQ accordion behavior
(function () {
  const faq = document.querySelector('.faq');
  if (!faq) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function collapse(answerEl, btn) {
    if (!answerEl) return;
    if (prefersReduced) {
      answerEl.style.height = '0px';
      answerEl.style.opacity = '0';
    } else {
      answerEl.style.height = '0px';
      answerEl.style.opacity = '0';
    }
    if (btn) btn.setAttribute('aria-expanded', 'false');
  }

  function expand(answerEl, btn) {
    if (!answerEl) return;
    // Set to auto height by temporarily measuring scrollHeight
    const target = answerEl.scrollHeight;
    answerEl.style.height = target + 'px';
    answerEl.style.opacity = '1';
    if (btn) btn.setAttribute('aria-expanded', 'true');
  }

  // Close siblings within the same list to keep UI tidy
  function closeSiblings(currentItem) {
    const list = currentItem.parentElement;
    if (!list) return;
    list.querySelectorAll('.faq-item').forEach(item => {
      if (item === currentItem) return;
      const b = item.querySelector('.faq-question[aria-expanded="true"]');
      const a = item.querySelector('.faq-answer');
      if (b && a) collapse(a, b);
    });
  }

  faq.addEventListener('click', (e) => {
    const btn = e.target.closest('.faq-question');
    if (!btn) return;
    const item = btn.closest('.faq-item');
    const answerId = btn.getAttribute('aria-controls');
    const answerEl = answerId && document.getElementById(answerId);
    if (!answerEl) return;

    const isOpen = btn.getAttribute('aria-expanded') === 'true';
    if (isOpen) {
      collapse(answerEl, btn);
    } else {
      closeSiblings(item);
      expand(answerEl, btn);
    }
  });

  // Keep open answers sized correctly on resize
  let resizeTicking = false;
  window.addEventListener('resize', () => {
    if (resizeTicking) return;
    resizeTicking = true;
    requestAnimationFrame(() => {
      faq.querySelectorAll('.faq-question[aria-expanded="true"]').forEach(btn => {
        const answerId = btn.getAttribute('aria-controls');
        const answerEl = answerId && document.getElementById(answerId);
        if (answerEl) {
          answerEl.style.height = answerEl.scrollHeight + 'px';
        }
      });
      resizeTicking = false;
    });
  });
})();

