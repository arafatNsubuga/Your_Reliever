// Chat Forum: fixed navbar scroll behavior (like Book Professional)
(function () {
  if (!document.body.classList.contains('chat-forum')) return;

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

// Chat Forum: search and render mock forums
(function () {
  if (!document.body.classList.contains('chat-forum')) return;

  const form = document.querySelector('.forum-search');
  const grid = document.querySelector('.cf-cards');
  const topicsToggle = document.getElementById('cfTopicsToggle');
  const topicsMenu = document.getElementById('cfTopicsMenu');
  if (!form || !grid) return;

  const BASE = (location.protocol === 'file:') ? 'http://localhost/YourReliever/' : '';

  // Backend dataset
  let forums = [];

  function loadForums(q){
    const params = new URLSearchParams();
    params.set('action','list');
    params.set('active','1');
    return fetch(BASE + 'backend/api/forum.php?' + params.toString(), { credentials: 'include' })
      .then(r => r.json())
      .then(json => {
        if (json && json.success && Array.isArray(json.data)){
          forums = json.data.map(f => ({
            id: f.forum_id,
            name: f.forum_name,
            topic: f.topic || '',
            group: f.group_name || '',
            members: Number(f.member_count || 0)
          }));
        } else {
          forums = [];
        }
        const list = filterForums(q);
        render(list);
        populateTopicsMenu(list);
      })
      .catch(() => { forums = []; render([]); });
  }

  function filterForums(q){
    const nq = (q || '').toString().toLowerCase();
    if (!nq) return forums.slice();
    return forums.filter(f => (
      (f.name||'').toLowerCase().includes(nq) ||
      (f.topic||'').toLowerCase().includes(nq) ||
      (f.group||'').toLowerCase().includes(nq) ||
      String(f.members).includes(nq)
    ));
  }

  function render(list) {
    grid.innerHTML = '';
    if (!list.length) {
      const p = document.createElement('p');
      p.textContent = 'No forums found for your search.';
      p.style.textAlign = 'center';
      p.style.margin = '10px 0 0';
      grid.appendChild(p);
      return;
    }

    const frag = document.createDocumentFragment();
    list.forEach(f => {
      const article = document.createElement('article');
      article.className = 'cf-card';
      article.innerHTML = `
        <h3 class="cf-card__name">${f.name}</h3>
        <ul class="cf-card__meta">
          <li><strong>Topic:</strong> ${f.topic}</li>
          <li><strong>Group:</strong> ${f.group}</li>
          <li><strong>Members:</strong> ${f.members}</li>
        </ul>
        <div class="cf-card__actions">
          <button class="cf-card__join" type="button" data-id="${f.id}">Join</button>
        </div>
      `;
      frag.appendChild(article);
    });
    grid.appendChild(frag);
  }

  // Populate Topics dropdown
  function getForumNamesFromDOM() {
    return Array.from(document.querySelectorAll('.cf-card__name')).map(el => el.textContent.trim()).filter(Boolean);
  }

  function populateTopicsMenu(list) {
    if (!topicsMenu) return;
    const names = (Array.isArray(list) && list.length)
      ? list.map(f => f.name).filter(Boolean)
      : getForumNamesFromDOM();
    topicsMenu.innerHTML = '';
    names.slice(0, 20).forEach(name => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = '#';
      a.textContent = name;
      a.addEventListener('click', (e) => {
        e.preventDefault();
        closeMenu();
        scrollToForum(name);
      });
      li.appendChild(a);
      topicsMenu.appendChild(li);
    });
    if (topicsMenu.children.length === 0) {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = '#';
      a.textContent = 'No topics available';
      a.style.pointerEvents = 'none';
      a.style.opacity = '0.7';
      li.appendChild(a);
      topicsMenu.appendChild(li);
    }
  }

  function openMenu() {
    if (!topicsMenu || !topicsToggle) return;
    topicsMenu.hidden = false;
    topicsToggle.setAttribute('aria-expanded', 'true');
  }
  function closeMenu() {
    if (!topicsMenu || !topicsToggle) return;
    topicsMenu.hidden = true;
    topicsToggle.setAttribute('aria-expanded', 'false');
  }
  function toggleMenu(e) {
    if (e) e.preventDefault();
    if (!topicsMenu) return;
    if (topicsMenu.hidden) openMenu(); else closeMenu();
  }

  function scrollToForum(name) {
    const cards = Array.from(document.querySelectorAll('.cf-card'));
    const card = cards.find(c => {
      const el = c.querySelector('.cf-card__name');
      return el && el.textContent.trim() === name;
    });
    if (card) {
      card.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // brief highlight
      const prev = card.style.boxShadow;
      card.style.boxShadow = '0 0 0 3px rgba(111,179,255,0.6)';
      setTimeout(() => { card.style.boxShadow = prev; }, 1200);
    }
  }

  // Wire dropdown interactions
  if (topicsToggle) {
    topicsToggle.addEventListener('click', toggleMenu);
  }
  document.addEventListener('click', (e) => {
    if (!topicsMenu || topicsMenu.hidden) return;
    const within = e.target.closest('.cf-topics');
    if (!within) closeMenu();
  });

  // Initial load
  loadForums('');

  // Handle search submit
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const q = (fd.get('q') || '').toString();
    render(filterForums(q));
  });

  // Optional: live filtering as user types
  const input = form.querySelector('input[name="q"]');
  if (input) {
    input.addEventListener('input', () => {
      const q = input.value || '';
      render(filterForums(q));
    });
  }

  // Join forum handler
  grid.addEventListener('click', (e) => {
    const btn = e.target.closest('.cf-card__join');
    if (!btn) return;
    const forumId = btn.getAttribute('data-id');
    // Try to capture forum name from the card for redirect context
    const card = btn.closest('.cf-card');
    const nameEl = card ? card.querySelector('.cf-card__name') : null;
    const forumName = nameEl ? nameEl.textContent.trim() : 'Chat Room';
    fetch(BASE + 'backend/api/forum.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ action: 'join', forum_id: Number(forumId) })
    })
    .then(r => r.json())
    .then(json => {
      if (json && json.success) {
        // Redirect to chat room after successful join
        const params = new URLSearchParams();
        params.set('forum_id', String(forumId));
        params.set('forum_name', forumName);
        window.location.href = 'ChatRoom.html?' + params.toString();
      } else {
        alert((json && json.message) ? json.message : 'Failed to join forum');
      }
    })
    .catch(() => alert('Network error'));
  });
})();
