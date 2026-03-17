(function(){
  if (!document.body.classList.contains('chat-room')) return;
  function qs(s){return document.querySelector(s)}
  function on(el, ev, fn){ if(el) el.addEventListener(ev, fn); }
  function getParam(name){ const u=new URL(location.href); return u.searchParams.get(name) }
  var BASE = (location.protocol === 'file:') ? 'http://localhost/YourReliever/' : '';

  var forumId = Number(getParam('forum_id')||0);
  var forumName = getParam('forum_name') || 'Chat Room';
  var forumAvatar = getParam('forum_avatar') || '';
  if (forumName) { document.title = forumName + ' — Your Reliever'; }
  var roomTitle = qs('#roomTitle'); if(roomTitle) roomTitle.textContent = forumName;
  var roomMeta = qs('#roomMeta'); if(roomMeta) roomMeta.textContent = 'Forum #' + forumId + ' • Real-time chat';
  var roomAvatar = qs('#roomAvatar'); if(roomAvatar){ roomAvatar.src = forumAvatar || roomAvatar.getAttribute('src') || 'Images/logo.png'; }
  var list = qs('#chatMessages');
  var form = qs('#chatForm');
  var input = qs('#chatInput');
  var sinceId = 0;
  var polling = false;
  var myUserId = 0;
  var ws, wsOpen = false, joined = false;

  // Dark mode for chat room
  (function(){
    var key = 'chatroom_darkmode';
    var pref = localStorage.getItem(key);
    if (pref === '1') { document.body.classList.add('dark-mode'); }
    var btn = qs('#chatDarkToggle');
    on(btn, 'click', function(){
      var onDark = document.body.classList.toggle('dark-mode');
      localStorage.setItem(key, onDark ? '1' : '0');
      if (btn) btn.textContent = onDark ? 'Light' : 'Dark';
    });
    if (btn) btn.textContent = document.body.classList.contains('dark-mode') ? 'Light' : 'Dark';
  })();

  function maybeJoin(){
    if (wsOpen && !joined && forumId && myUserId && ws && ws.readyState === 1) {
      try { ws.send(JSON.stringify({ type:'join', forum_id: forumId, user_id: myUserId })); joined = true; } catch(e){}
    }
  }

  function fmtTime(ts){
    try {
      var d = ts ? new Date(ts.replace(' ','T')) : new Date();
      return d.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
    } catch (e) { return ''; }
  }

  function renderMessage(m){
    var isMine = Number(m.user_id) === Number(myUserId);
    var wrap = document.createElement('div');
    wrap.className = 'chat-message ' + (isMine ? 'from-me' : 'from-others');
    var name = isMine ? 'You' : (m.full_name || ('User '+m.user_id));
    var time = fmtTime(m.created_at || '');
    wrap.innerHTML = '<div class="bubble">' +
      '<div class="meta"><span class="author">'+ name +'</span><span class="timestamp">'+ time +'</span></div>' +
      '<div class="content"></div>' +
    '</div>';
    wrap.querySelector('.content').textContent = m.content;
    list.appendChild(wrap);
  }

  function scrollToBottom(){ list.scrollTop = list.scrollHeight; }

  function loadMessages(){
    if (polling) return; polling = true;
    var url = BASE + 'backend/api/messages.php?forum_id=' + forumId + (sinceId>0?('&since_id='+sinceId):'');
    fetch(url, { credentials: 'include' })
      .then(function(r){return r.json()})
      .then(function(j){
        if (!j || !j.success || !Array.isArray(j.data)) return;
        if (j.data.length){
          j.data.forEach(function(m){ renderMessage(m); sinceId = Math.max(sinceId, Number(m.message_id)||0); });
          scrollToBottom();
        }
      })
      .catch(function(){ /* ignore */ })
      .finally(function(){ polling = false; });
  }

  function loop(){ if (!wsOpen || !joined) { loadMessages(); } setTimeout(loop, 2500); }

  function initWS(){
    try {
      var wsProto = (location.protocol === 'https:') ? 'wss' : 'ws';
      var host = (location.hostname && location.hostname !== 'localhost') ? location.hostname : '127.0.0.1';
      var port = 8080; // match backend/ws/server.php
      ws = new WebSocket(wsProto + '://' + host + ':' + port);
      ws.onopen = function(){ wsOpen = true; maybeJoin(); };
      ws.onmessage = function(ev){
        try {
          var msg = JSON.parse(ev.data);
          if (msg.type === 'message' && msg.data) { renderMessage(msg.data); scrollToBottom(); }
        } catch(e) {}
      };
      ws.onclose = function(){ wsOpen = false; joined = false; };
      ws.onerror = function(){ wsOpen = false; joined = false; };
    } catch (e) { wsOpen = false; }
  }

  if (form) {
    form.addEventListener('submit', function(e){
      e.preventDefault();
      var text = (input && input.value) ? input.value.trim() : '';
      if (!text) return;
      if (wsOpen && ws && ws.readyState === 1) {
        ws.send(JSON.stringify({ type:'message', content: text }));
        input.value = '';
      } else {
        fetch(BASE + 'backend/api/messages.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ forum_id: forumId, message_type: 'text', content: text })
        })
        .then(function(r){return r.json()})
        .then(function(j){ if (j && j.success){ input.value=''; loadMessages(); } else { alert((j&&j.message)||'Failed to send'); } })
        .catch(function(){ alert('Network error'); });
      }
    });
  }

  // fetch current user to know which messages are mine, then init WS and polling
  fetch(BASE + 'backend/api/user.php?action=full', { credentials: 'include' })
    .then(function(r){ return r.ok ? r.json() : null; })
    .then(function(j){ if (j && j.success && j.user) { myUserId = Number(j.user.user_id||0); } })
    .finally(function(){
      initWS();
      loadMessages();
      loop();
      // retry joining a few times in case ws opens after user id loads
      var tries = 0; (function retry(){ tries++; maybeJoin(); if (!joined && tries < 10) setTimeout(retry, 500); })();
    });
})();
