// Login page behavior
(function(){
  function $(sel){return document.querySelector(sel)}
  var BASE = (location.protocol === 'file:') ? 'http://localhost/YourReliever/' : '';

  var pwToggle = $('#pw-toggle');
  if(pwToggle){
    pwToggle.addEventListener('click', function(){
      var pw = $('#password');
      if(!pw) return;
      if(pw.type === 'password'){
        pw.type = 'text';
        pwToggle.setAttribute('aria-label','Hide password');
      } else {
        pw.type = 'password';
        pwToggle.setAttribute('aria-label','Show password');
      }
    });
  }

  var form = $('#login-form');
  if(form){
    form.addEventListener('submit', function(e){
      e.preventDefault();
      var email = $('#email');
      var pw = $('#password');
      if(!email.value || !pw.value){
        alert('Please enter both email and password');
        return;
      }
      fetch(BASE + 'backend/api/auth.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          email: email.value,
          password: pw.value
        })
      })
      .then(function(res){ return res.json(); })
      .then(function(data){
        if (data && data.success) {
          window.location.href = 'profile.html';
        } else {
          alert((data && data.message) ? data.message : 'Login failed. Please try again.');
        }
      })
      .catch(function(err){
        console.error('Login error:', err);
        alert('Network error. Please try again.');
      });
    });
  }

  var demo = $('#demo');
  if(demo){ demo.addEventListener('click', function(){ window.location.href='Index.html'; }); }

  var closeBtn = $('#login-close');
  if(closeBtn){ closeBtn.addEventListener('click', function(){ window.location.href='Index.html'; }); }
})();
