// Content Library interactivity
(function () {
  if (!document.body.classList.contains('content-library')) return;

  const nav = document.querySelector('.cl-nav');
  const navItems = Array.from(document.querySelectorAll('.cl-nav__item'));
  const grid = document.getElementById('clGrid');
  const form = document.querySelector('.cl-search');
  const input = form ? form.querySelector('input[name="q"]') : null;
  const uploadBtn = document.querySelector('.cl-upload-btn');
  const uploadInput = document.querySelector('.cl-upload-input');
  const modal = document.querySelector('.cl-modal');
  const modalImg = modal ? modal.querySelector('.cl-modal__img') : null;

  const BASE = (location.protocol === 'file:') ? 'http://localhost/YourReliever/' : '';

  // Backend-backed datasets (fetched on demand)
  const data = { videos: [], images: [], articles: [], news: [] };

  const typeMap = {
    videos: 'video',
    images: 'image',
    articles: 'article',
    news: 'news'
  };

  // Hash navigation helpers
  function catFromHash() {
    const h = (location.hash || '').replace('#', '').toLowerCase();
    if (h === 'videos' || h === 'images' || h === 'articles' || h === 'news') return h;
    return '';
  }

  function scrollToLibrary() {
    const el = document.querySelector('.cl-section');
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const top = rect.top + (window.pageYOffset || document.documentElement.scrollTop) - 12;
    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
  }

  // Modal close handlers (top-level)
  function closeModal() {
    if (!modal) return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    if (modalImg) { modalImg.src = ''; }
  }
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target.matches('[data-modal-close]')) {
        closeModal();
      }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeModal();
    });
  }

  function fetchContent(cat, q, limit, offset){
    const type = typeMap[cat] || 'article';
    const params = new URLSearchParams();
    params.set('action','list');
    params.set('type', type);
    params.set('limit', String(limit || 12));
    params.set('offset', String(offset || 0));
    if (q) params.set('search', q);
    return fetch(BASE + 'backend/api/content.php?' + params.toString())
      .then(r => r.json())
      .then(json => {
        if (json && json.success && Array.isArray(json.data)){
          // normalize into UI-friendly structure
          data[cat] = json.data.map(row => ({
            id: row.content_id,
            name: row.title,
            length: row.duration ? (row.duration + ' min') : '',
            topic: row.content_type,
            date: (row.created_at || '').slice(0,10),
            src: row.file_path || ''
          }));
          return data[cat];
        }
        data[cat] = [];
        return [];
      })
      .catch(() => { data[cat] = []; return []; });
  }

  function normalize(v) { return String(v || '').toLowerCase(); }

  function filterItems(items, q) {
    if (!q) return items;
    const nq = normalize(q);
    return items.filter((it) => {
      // Search across common fields
      return Object.values(it).some((val) => normalize(val).includes(nq));
    });
  }

  // Helpers: support YouTube URLs for videos
  function isYouTubeUrl(url) {
    if (!url) return false;
    try {
      const u = new URL(url, location.origin);
      return /(^|\.)youtube\.com$/.test(u.hostname) || /(^|\.)youtu\.be$/.test(u.hostname);
    } catch (_) {
      return /youtu\.be\//.test(String(url)) || /youtube\.com/.test(String(url));
    }
  }

  function youTubeEmbedSrc(url) {
    try {
      const u = new URL(url, location.origin);
      let id = '';
      if ((/(^|\.)youtube\.com$/).test(u.hostname)) {
        // https://www.youtube.com/watch?v=VIDEOID or /embed/VIDEOID
        if (u.pathname.startsWith('/watch')) {
          id = u.searchParams.get('v') || '';
        } else if (u.pathname.startsWith('/embed/')) {
          id = u.pathname.split('/').pop() || '';
        }
      }
      if ((/(^|\.)youtu\.be$/).test(u.hostname)) {
        // https://youtu.be/VIDEOID
        id = u.pathname.split('/').pop() || '';
      }
      id = id.replace(/[^\w-]/g, '');
      if (!id) return '';
      return `https://www.youtube.com/embed/${id}`;
    } catch (_) {
      // Fallback: naive extraction
      const m = String(url).match(/(?:v=|youtu\.be\/)([\w-]{6,})/);
      return m ? `https://www.youtube.com/embed/${m[1]}` : '';
    }
  }

  function cardHtml(cat, item) {
    switch (cat) {
      case 'videos':
        {
          const mediaHtml = item.src
            ? (isYouTubeUrl(item.src) && youTubeEmbedSrc(item.src)
                ? `<div class=\"cl-card__media\"><iframe src=\"${youTubeEmbedSrc(item.src)}\" title=\"YouTube video\" frameborder=\"0\" allow=\"accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share\" referrerpolicy=\"strict-origin-when-cross-origin\" allowfullscreen></iframe></div>`
                : `<div class=\"cl-card__media\"><video src=\"${item.src}\" controls preload=\"metadata\"></video></div>`)
            : '';
          return `
            <article class="cl-card" data-id="${item.id}">
              ${mediaHtml}
              <h3 class="cl-card__title">${item.name}</h3>
              <p class="cl-card__meta">Length: ${item.length} • Topic: ${item.topic}</p>
              <div class="cl-card__actions">
                <button class="cl-card__save" type="button" data-id="${item.id}">Save</button>
                ${item.src ? `<button class=\"cl-card__remove\" type=\"button\" data-remove-id=\"${item.id}\">Remove</button>` : ''}
              </div>
            </article>
          `;
        }
      case 'images':
        return `
          <article class="cl-card" data-id="${item.id}">
            ${item.src ? `<div class=\"cl-card__media\"><img src=\"${item.src}\" alt=\"${item.alt || item.name}\" data-viewable="image"></div>` : ''}
            <h3 class="cl-card__title">${item.name}</h3>
            <p class="cl-card__meta">Alt: ${item.alt} • Topic: ${item.topic}</p>
            <div class="cl-card__actions">
              <button class="cl-card__save" type="button" data-id="${item.id}">Save</button>
              ${item.src ? `<button class=\"cl-card__remove\" type=\"button\" data-remove-id=\"${item.id}\">Remove</button>` : ''}
            </div>
          </article>
        `;
      case 'articles':
        return `
          <article class="cl-card" data-id="${item.id}">
            <h3 class="cl-card__title">${item.name}</h3>
            <p class="cl-card__meta">By ${item.author} • ${item.read} read</p>
            ${item.src ? `<p class=\"cl-card__meta\"><a href=\"${item.src}\" target=\"_blank\" rel=\"noopener noreferrer\">View</a> • <a href=\"${item.src}\" download>Download</a></p>` : ''}
            <div class="cl-card__actions">
              <button class="cl-card__save" type="button" data-id="${item.id}">Save</button>
              ${item.src ? `<button class=\"cl-card__remove\" type=\"button\" data-remove-id=\"${item.id}\">Remove</button>` : ''}
            </div>
          </article>
        `;
      case 'news':
        return `
          <article class="cl-card" data-id="${item.id}">
            <h3 class="cl-card__title">${item.name}</h3>
            <p class="cl-card__meta">Date: ${item.date}</p>
            ${item.src ? `<p class=\"cl-card__meta\"><a href=\"${item.src}\" target=\"_blank\" rel=\"noopener noreferrer\">View</a> • <a href=\"${item.src}\" download>Download</a></p>` : ''}
            <div class="cl-card__actions">
              <button class="cl-card__save" type="button" data-id="${item.id}">Save</button>
              ${item.src ? `<button class=\"cl-card__remove\" type=\"button\" data-remove-id=\"${item.id}\">Remove</button>` : ''}
            </div>
          </article>
        `;
      default:
        return '';
    }
  }

  function render(cat, q = '') {
    if (!grid) return;
    // fetch from backend and then render
    grid.innerHTML = `<p style="text-align:center;">Loading...</p>`;
    fetchContent(cat, q, 12, 0).then(() => {
      const items = data[cat] || [];
      const filtered = filterItems(items, q);
      if (!filtered.length) {
        grid.innerHTML = `<p style="text-align:center;">No results found.</p>`;
        return;
      }

      grid.innerHTML = filtered.map((it) => cardHtml(cat, it)).join('');
    });
  }

  function setActive(cat) {
    navItems.forEach((li) => {
      li.classList.toggle('is-active', li.dataset.cat === cat);
    });
  }

  // Active category state (respect URL hash first)
  let activeCat = catFromHash() || 'videos';
  setActive(activeCat);
  render(activeCat, '');

  // React to hash changes (e.g., top navbar links)
  window.addEventListener('hashchange', () => {
    const target = catFromHash();
    if (!target || target === activeCat) return;
    handleActivate(target);
    scrollToLibrary();
  });

  // Hover/focus/click to switch category
  function handleActivate(cat) {
    activeCat = cat;
    setActive(cat);
    render(cat, input ? input.value : '');
  }

  if (nav) {
    nav.addEventListener('mouseover', (e) => {
      const li = e.target.closest('.cl-nav__item');
      if (!li) return;
      handleActivate(li.dataset.cat);
    });
    nav.addEventListener('focusin', (e) => {
      const li = e.target.closest('.cl-nav__item');
      if (!li) return;
      handleActivate(li.dataset.cat);
    });
    nav.addEventListener('click', (e) => {
      const li = e.target.closest('.cl-nav__item');
      if (!li) return;
      handleActivate(li.dataset.cat);
    });
  }

  // Search behavior
  if (form && input) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      render(activeCat, input.value || '');
    });
    input.addEventListener('input', () => {
      render(activeCat, input.value || '');
    });
  }

  // Upload behavior
  function setAcceptByCategory(cat) {
    switch (cat) {
      case 'videos':
        uploadInput.accept = 'video/*';
        break;
      case 'images':
        uploadInput.accept = 'image/*';
        break;
      case 'articles':
        uploadInput.accept = '.pdf,.doc,.docx,.txt';
        break;
      case 'news':
        uploadInput.accept = '.pdf,.doc,.docx,.txt';
        break;
      default:
        uploadInput.removeAttribute('accept');
    }
  }

  function addMockFromFile(cat, file) {
    // Local preview only; backend upload not implemented here
    const name = file.name.replace(/\.[^/.]+$/, '');
    const src = URL.createObjectURL(file);
    (data[cat] = data[cat] || []).unshift({ id: Date.now(), name, topic: 'Uploaded', src, uploaded: true });
  }

  // Remove handler using event delegation
  if (grid) {
    grid.addEventListener('click', (e) => {
      const removeBtn = e.target.closest('.cl-card__remove');
      if (removeBtn) {
        const id = removeBtn.getAttribute('data-remove-id');
        const list = data[activeCat];
        if (!Array.isArray(list)) return;
        const idx = list.findIndex((it) => it.id === id);
        if (idx >= 0) {
          const [removed] = list.splice(idx, 1);
          if (removed && removed.src) {
            try { URL.revokeObjectURL(removed.src); } catch (_) { /* ignore */ }
          }
          render(activeCat, input ? input.value : '');
        }
        return;
      }
      const saveBtn = e.target.closest('.cl-card__save');
      if (saveBtn) {
        const cid = Number(saveBtn.getAttribute('data-id')) || 0;
        if (!cid) return;
        fetch(BASE + 'backend/api/content.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ action: 'save', content_id: cid })
        })
        .then(r => r.json())
        .then(j => {
          if (j && j.success) {
            saveBtn.textContent = 'Saved';
            saveBtn.disabled = true;
          } else {
            alert((j && j.message) ? j.message : 'Failed to save');
          }
        })
        .catch(() => alert('Network error'));
      }

      // Image view (lightbox)
      const imgEl = e.target.closest('.cl-card__media img[data-viewable="image"]');
      if (imgEl && modal && modalImg) {
        modalImg.src = imgEl.getAttribute('src') || '';
        modalImg.alt = imgEl.getAttribute('alt') || '';
        modal.classList.add('is-open');
        modal.setAttribute('aria-hidden', 'false');
        return;
      }
    });
  }

  function openPicker() {
    if (!uploadInput) return;
    setAcceptByCategory(activeCat);
    uploadInput.value = '';
    uploadInput.click();
  }

  if (uploadBtn && uploadInput) {
    uploadBtn.addEventListener('click', openPicker);
    uploadInput.addEventListener('change', () => {
      const file = uploadInput.files && uploadInput.files[0];
      if (!file) return;
      // Upload to backend
      const fd = new FormData();
      fd.append('file', file);
      fd.append('type', typeMap[activeCat] || 'article');
      fetch(BASE + 'backend/api/upload.php', {
        method: 'POST',
        body: fd,
        credentials: 'include'
      })
      .then(r => r.json())
      .then(json => {
        if (json && json.success) {
          // Prepend to dataset then re-render
          const item = {
            id: json.content_id,
            name: json.title,
            length: '',
            topic: typeMap[activeCat] || 'article',
            date: new Date().toISOString().slice(0,10),
            src: json.file_path
          };
          (data[activeCat] = data[activeCat] || []).unshift(item);
          render(activeCat, input ? input.value : '');
        } else {
          alert((json && json.message) ? json.message : 'Upload failed');
        }
      })
      .catch(() => alert('Network error during upload'));
    });
  }
})();
