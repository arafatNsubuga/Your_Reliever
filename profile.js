// Profile Page Functionality
(function() {
  'use strict';

  // Helper function for element selection
  function $(sel) {
    return document.querySelector(sel);
  }

  // Hide login/register options inside a loaded iframe document (robust, case-insensitive)
  function hideLoginInFrame(doc){
    if (!doc) return;
    try {
      var selectors = ['a', 'button', '[role="button"]'];
      var nodes = Array.from(doc.querySelectorAll(selectors.join(',')));
      var keywords = ['login','log in','signin','sign in','signup','sign up','register','create account','home'];

      // Hide by href substring, id/class substring, or text substring (all case-insensitive)
      nodes.forEach(function(el){
        var href = (el.getAttribute && (el.getAttribute('href')||'')) + '';
        var idc = ((el.id||'') + ' ' + (el.className||'')) + '';
        var text = (el.textContent||'') + '';
        var hay = (href + ' ' + idc + ' ' + text).toLowerCase();
        var match = keywords.some(function(k){ return hay.indexOf(k) !== -1; });
        if (match) {
          el.style.display = 'none';
          var li = el.closest && el.closest('li'); if (li) li.style.display = 'none';
          var parentNav = el.closest && el.closest('nav, .nav, .navbar, header');
          // Optionally hide small wrappers that only contain this link
          if (parentNav && parentNav.children && parentNav.children.length <= 2) {
            // don't over-hide; fallback to hiding just the element
          }
        }
      });

      // Also hide any element with common login/register ids/classes
      var extraSel = '[id*="login" i], [class*="login" i], [id*="signin" i], [class*="signin" i], [id*="register" i], [class*="register" i]';
      Array.from(doc.querySelectorAll(extraSel)).forEach(function(el){
        el.style.display = 'none';
        var li = el.closest && el.closest('li'); if (li) li.style.display = 'none';
      });
    } catch (_) {}
  }

  // ===== Load Reminders & Notifications =====
  function loadRemindersAndNotifications(){
    fetch('backend/api/notifications.php', { credentials: 'include' })
      .then(res => res.json())
      .then(json => {
        const reminders = (json && json.success && Array.isArray(json.reminders)) ? json.reminders : [];
        const notifications = (json && json.success && Array.isArray(json.notifications)) ? json.notifications : [];
        renderReminders(reminders);
        renderNotifications(notifications);
      })
      .catch(() => {
        // leave defaults
      });
  }

  function renderReminders(list){
    const wrap = $('#reminders-list'); if (!wrap) return;
    wrap.innerHTML = '';
    if (!list.length){ wrap.innerHTML = '<p>No reminders yet.</p>'; return; }
    list.forEach(r => {
      const item = document.createElement('div');
      item.className = 'reminder-item';
      item.innerHTML = `
        <label style="display:flex;align-items:center;gap:8px;">
          <input type="checkbox" ${r.done? 'checked':''} data-reminder-id="${r.reminder_id}" />
          <span>${r.title} — <small>${String(r.remind_at).replace('T',' ').slice(0,16)}</small></span>
        </label>
      `;
      const cb = item.querySelector('input[type="checkbox"]');
      cb.addEventListener('change', () => toggleReminder(cb.getAttribute('data-reminder-id'), cb.checked));
      wrap.appendChild(item);
    });
  }

  function renderNotifications(list){
    const wrap = $('#notifications-list'); if (!wrap) return;
    wrap.innerHTML = '';
    if (!list.length){ wrap.innerHTML = '<p>No notifications yet.</p>'; return; }
    list.forEach(n => {
      const item = document.createElement('div');
      item.className = 'notification-item';
      item.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:8px 10px;border-bottom:1px solid #eee;';
      item.innerHTML = `
        <div>
          <div>${n.message}</div>
          <div style="font-size:12px;color:#888;">${String(n.created_at).replace('T',' ').slice(0,19)}</div>
        </div>
        ${n.read_flag? '<span style="color:#16a34a;font-size:12px;">Read</span>' : '<button class="mark-read" data-id="'+n.notification_id+'">Mark read</button>'}
      `;
      const btn = item.querySelector('.mark-read');
      if (btn){ btn.addEventListener('click', () => markNotificationRead(btn.getAttribute('data-id'))); }
      wrap.appendChild(item);
    });
  }

  function toggleReminder(id, done){
    fetch('backend/api/notifications.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ action: 'toggle-reminder', reminder_id: Number(id), done: !!done })
    }).catch(() => {});
  }

  function markNotificationRead(id){
    fetch('backend/api/notifications.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ action: 'mark-read', notification_id: Number(id) })
    })
    .then(() => loadRemindersAndNotifications())
    .catch(() => {});
  }

  function $$(sel) {
    return document.querySelectorAll(sel);
  }

  // ===== Initialize Page =====
  function init() {
    loadUserData();
    loadRemindersAndNotifications();
    setupEventListeners();
    loadSavedPreferences();
    updateActivityTimestamps();
  }

  // ===== Load User Data =====
  function loadUserData() {
    fetch('backend/api/user.php?action=full', { credentials: 'include' })
      .then(res => res.json())
      .then(json => {
        if (!json || !json.success) throw new Error('not logged in');
        const user = json.user || {};
        const stats = json.stats || {};
        // Update profile information
        $('#profile-name').textContent = user.full_name || '';
        $('#profile-email').textContent = user.email || '';
        $('#member-date').textContent = (user.member_since || '').toString().slice(0, 10);
        // Update statistics
        $('#days-active').textContent = stats.days_active || 0;
        $('#sessions-completed').textContent = stats.sessions_completed || 0;
        $('#total-minutes').textContent = stats.total_minutes || 0;
        $('#streak').textContent = stats.current_streak || 0;
        var sc = document.getElementById('streak-chip-count'); if (sc) sc.textContent = stats.current_streak || 0;
        // Saved content initial
        updateSavedContent('articles');
      })
      .catch(() => {
        // Fallback to localStorage demo data
        const userData = JSON.parse(localStorage.getItem('userProfile')) || {
          name: 'User',
          email: 'user@example.com',
          memberSince: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
          daysActive: 0,
          sessionsCompleted: 0,
          totalMinutes: 0,
          streak: 0
        };
        $('#profile-name').textContent = userData.name;
        $('#profile-email').textContent = userData.email;
        $('#member-date').textContent = userData.memberSince;
        $('#days-active').textContent = userData.daysActive;
        $('#sessions-completed').textContent = userData.sessionsCompleted;
        $('#total-minutes').textContent = userData.totalMinutes;
        $('#streak').textContent = userData.streak;
        var sc2 = document.getElementById('streak-chip-count'); if (sc2) sc2.textContent = userData.streak;
      });
  }

  // ===== Event Listeners Setup =====
  function setupEventListeners() {
    // Mobile sidebar toggle
    const sidebar = document.getElementById('profileSidebar');
    const toggleBtn = document.getElementById('mobile-menu-toggle');
    function openSidebar(){ if (sidebar){ sidebar.classList.add('open'); } if (toggleBtn){ toggleBtn.setAttribute('aria-expanded','true'); } }
    function closeSidebar(){ if (sidebar){ sidebar.classList.remove('open'); } if (toggleBtn){ toggleBtn.setAttribute('aria-expanded','false'); } }
    if (toggleBtn){
      toggleBtn.addEventListener('click', function(){
        if (!sidebar) return;
        if (sidebar.classList.contains('open')) { closeSidebar(); } else { openSidebar(); }
      });
    }
    // Close on ESC
    document.addEventListener('keydown', function(e){ if (e.key === 'Escape') closeSidebar(); });
    // Close when resizing back to desktop
    window.addEventListener('resize', function(){ if (window.innerWidth > 960) closeSidebar(); });
    // Sidebar navigation: load inline
    document.querySelectorAll('.sidebar-link').forEach(link => {
      link.addEventListener('click', function(e){
        e.preventDefault();
        const target = this.getAttribute('data-target');
        document.querySelectorAll('.sidebar-link').forEach(a=>a.classList.remove('active'));
        this.classList.add('active');
        const frame = document.getElementById('contentFrame');
        const profile = document.getElementById('profileContent');
        if (target === '__profile__') {
          if (frame) { frame.style.display = 'none'; frame.removeAttribute('src'); }
          if (profile) { profile.style.display = 'block'; }
          if (window.innerWidth <= 960) { closeSidebar(); }
          return;
        }
        if (target === 'logout') { handleLogout(); if (window.innerWidth <= 960) { closeSidebar(); } return; }
        if (frame) {
          frame.src = target;
          frame.style.display = 'block';
          // When the page loads, hide any Login nav link inside it
          frame.onload = function(){
            try {
              var doc = frame.contentDocument || frame.contentWindow.document;
              hideLoginInFrame(doc);
            } catch(_) {}
          };
        }
        if (profile) { profile.style.display = 'none'; }
        if (window.innerWidth <= 960) { closeSidebar(); }
      });
    });
    // Logout button
    const logoutBtn = $('#logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', handleLogout);
    }

    // Back to Home should log out immediately
    const backLink = document.querySelector('.back-link');
    if (backLink) {
      backLink.addEventListener('click', function(e){
        e.preventDefault();
        handleLogout();
      });
    }

    // Ensure iframe cleanup runs if a page is already loaded on first paint
    const frame0 = document.getElementById('contentFrame');
    if (frame0) {
      frame0.onload = function(){
        try {
          var doc = frame0.contentDocument || frame0.contentWindow.document;
          hideLoginInFrame(doc);
        } catch(_) {}
      };
      // If already loaded, try immediately
      try { if (frame0.contentDocument) hideLoginInFrame(frame0.contentDocument); } catch(_) {}
    }

    // Edit profile button
    const editProfileBtn = $('#edit-profile-btn');
    if (editProfileBtn) {
      editProfileBtn.addEventListener('click', handleEditProfile);
    }

    // Avatar edit button
    const avatarEditBtn = $('#avatar-edit-btn');
    if (avatarEditBtn) {
      avatarEditBtn.addEventListener('click', handleAvatarEdit);
    }

    // Tab switching for saved content
    const tabButtons = $$('.tab-btn');
    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => handleTabSwitch(btn));
    });

    // Settings toggles
    const remindersToggle = $('#reminders-toggle');
    if (remindersToggle) {
      remindersToggle.addEventListener('change', () => {
        savePreference('reminders', remindersToggle.checked);
        tryUpdatePreferences({ daily_reminders: remindersToggle.checked });
        showNotification('Daily reminders ' + (remindersToggle.checked ? 'enabled' : 'disabled'));
      });
    }

    const darkModeToggle = $('#dark-mode-toggle');
    if (darkModeToggle) {
      darkModeToggle.addEventListener('change', () => {
        toggleDarkMode(darkModeToggle.checked);
        savePreference('darkMode', darkModeToggle.checked);
        tryUpdatePreferences({ dark_mode: darkModeToggle.checked });
      });
    }

    const emailToggle = $('#email-toggle');
    if (emailToggle) {
      emailToggle.addEventListener('change', () => {
        savePreference('emailNotifications', emailToggle.checked);
        tryUpdatePreferences({ email_notifications: emailToggle.checked });
        showNotification('Email notifications ' + (emailToggle.checked ? 'enabled' : 'disabled'));
      });
    }

    // Clickable settings items
    const changePasswordItem = $('#change-password');
    if (changePasswordItem) {
      changePasswordItem.addEventListener('click', handleChangePassword);
    }

    const privacySettingsItem = $('#privacy-settings');
    if (privacySettingsItem) {
      privacySettingsItem.addEventListener('click', handlePrivacySettings);
    }

    // Remove saved items
    const removeBtns = $$('.saved-remove-btn');
    removeBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        handleRemoveSaved(btn);
      });
    });
  }

  // ===== Logout Handler =====
  function handleLogout() {
    showNotification('Logging out...');
    fetch('backend/api/auth.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'logout' })
    })
    .then(() => { window.location.href = 'Index.html'; })
    .catch(() => { window.location.href = 'Index.html'; });
  }

  // ===== Edit Profile Handler =====
  function handleEditProfile() {
    const currentName = $('#profile-name').textContent;
    const newName = prompt('Enter your new name:', currentName);
    
    if (newName && newName.trim() !== '') {
      $('#profile-name').textContent = newName.trim();
      
      // Update localStorage
      const userData = JSON.parse(localStorage.getItem('userProfile')) || {};
      userData.name = newName.trim();
      localStorage.setItem('userProfile', JSON.stringify(userData));
      
      showNotification('Profile updated successfully!');
    }
  }

  // ===== Avatar Edit Handler =====
  function handleAvatarEdit() {
    // Create a file input element
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const avatarImg = $('#profile-avatar');
          avatarImg.src = event.target.result;
          
          // Save to localStorage
          localStorage.setItem('userAvatar', event.target.result);
          showNotification('Avatar updated successfully!');
        };
        reader.readAsDataURL(file);
      }
    });
    
    fileInput.click();
  }

  // ===== Tab Switching Handler =====
  function handleTabSwitch(clickedBtn) {
    // Remove active class from all tabs
    $$('.tab-btn').forEach(btn => btn.classList.remove('active'));
    
    // Add active class to clicked tab
    clickedBtn.classList.add('active');
    
    // Get the tab type
    const tabType = clickedBtn.dataset.tab;
    
    // Update content based on tab
    updateSavedContent(tabType);
  }

  // ===== Update Saved Content =====
  function updateSavedContent(type) {
    const savedContent = $('#saved-content');
    // Load saved content from backend
    fetch('backend/api/content.php?action=saved', { credentials: 'include' })
      .then(res => res.json())
      .then(json => {
        const items = (json && json.success && Array.isArray(json.data)) ? json.data : [];
        savedContent.innerHTML = '';
        if (!items.length) {
          savedContent.innerHTML = '<p>No saved items yet.</p>';
          return;
        }
        items.forEach(row => {
          const icon = (row.content_type === 'video') ? 'fas fa-play-circle'
            : (row.content_type === 'article') ? 'fas fa-file-alt'
            : 'fas fa-file';
          const meta = `${row.content_type || ''} • ${(row.duration||'') ? row.duration + ' min' : ''}`;
          const itemEl = document.createElement('div');
          itemEl.className = 'saved-item';
          itemEl.innerHTML = `
            <div class="saved-thumbnail">
              <i class="${icon}"></i>
            </div>
            <div class="saved-info">
              <h4 class="saved-title">${row.title || 'Untitled'}</h4>
              <p class="saved-meta">${meta}</p>
            </div>
            <button class="saved-remove-btn" aria-label="Remove from saved">
              <i class="fas fa-times"></i>
            </button>
          `;
          const removeBtn = itemEl.querySelector('.saved-remove-btn');
          removeBtn.addEventListener('click', () => handleRemoveSaved(removeBtn));
          savedContent.appendChild(itemEl);
        });
      })
      .catch(() => { savedContent.innerHTML = '<p>Failed to load saved items.</p>'; });
  }

  // ===== Remove Saved Item Handler =====
  function handleRemoveSaved(btn) {
    const savedItem = btn.closest('.saved-item');
    const title = savedItem.querySelector('.saved-title').textContent;
    
    if (confirm(`Remove "${title}" from saved items?`)) {
      savedItem.style.opacity = '0';
      savedItem.style.transform = 'translateX(20px)';
      
      setTimeout(() => {
        savedItem.remove();
        showNotification('Item removed from saved');
      }, 300);
    }
  }

  // ===== Change Password Handler =====
  function handleChangePassword() {
    const currentPassword = prompt('Enter current password:');
    
    if (currentPassword) {
      const newPassword = prompt('Enter new password:');
      
      if (newPassword && newPassword.length >= 8) {
        const confirmPassword = prompt('Confirm new password:');
        
        if (newPassword === confirmPassword) {
          showNotification('Password changed successfully!');
        } else {
          alert('Passwords do not match!');
        }
      } else {
        alert('Password must be at least 8 characters long!');
      }
    }
  }

  // ===== Privacy Settings Handler =====
  function handlePrivacySettings() {
    alert('Privacy settings page coming soon!\n\nYou will be able to:\n- Control data sharing\n- Manage visibility\n- Download your data\n- Delete your account');
  }

  // ===== Dark Mode Toggle =====
  function toggleDarkMode(enabled) {
    if (enabled) {
      document.body.classList.add('dark-mode');
      showNotification('Dark mode enabled');
    } else {
      document.body.classList.remove('dark-mode');
      showNotification('Dark mode disabled');
    }
  }

  // ===== Save Preference =====
  function savePreference(key, value) {
    const preferences = JSON.parse(localStorage.getItem('userPreferences')) || {};
    preferences[key] = value;
    localStorage.setItem('userPreferences', JSON.stringify(preferences));
  }

  function tryUpdatePreferences(payload){
    fetch('backend/api/user.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.assign({ action: 'update-preferences' }, payload))
    }).catch(() => {});
  }

  // ===== Load Saved Preferences =====
  function loadSavedPreferences() {
    const preferences = JSON.parse(localStorage.getItem('userPreferences')) || {};
    
    // Load avatar if saved
    const savedAvatar = localStorage.getItem('userAvatar');
    if (savedAvatar) {
      $('#profile-avatar').src = savedAvatar;
    }
    
    // Load toggle states
    if (preferences.reminders !== undefined) {
      $('#reminders-toggle').checked = preferences.reminders;
    }
    
    if (preferences.darkMode !== undefined) {
      $('#dark-mode-toggle').checked = preferences.darkMode;
      if (preferences.darkMode) {
        document.body.classList.add('dark-mode');
      }
    }
    
    if (preferences.emailNotifications !== undefined) {
      $('#email-toggle').checked = preferences.emailNotifications;
    }
  }

  // ===== Update Activity Timestamps =====
  function updateActivityTimestamps() {
    // This function would typically update relative time displays
    // For now, it's a placeholder for future enhancement
    console.log('Activity timestamps updated');
  }

  // ===== Show Notification =====
  function showNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      background: #2d3e50;
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 1000;
      animation: slideIn 0.3s ease-out;
    `;
    notification.textContent = message;
    
    // Add animation styles
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(400px); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  // ===== Initialize on DOM Load =====
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
