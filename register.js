// Registration page behavior
(function(){
  function $(sel){return document.querySelector(sel)}
  var BASE = (location.protocol === 'file:') ? 'http://localhost/YourReliever/' : '';

  // Password visibility toggle - main password
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

  // Password visibility toggle - confirm password
  var pwToggleConfirm = $('#pw-toggle-confirm');
  if(pwToggleConfirm){
    pwToggleConfirm.addEventListener('click', function(){
      var pw = $('#confirm-password');
      if(!pw) return;
      if(pw.type === 'password'){
        pw.type = 'text';
        pwToggleConfirm.setAttribute('aria-label','Hide password');
      } else {
        pw.type = 'password';
        pwToggleConfirm.setAttribute('aria-label','Show password');
      }
    });
  }

  // Close button - return to home or previous page
  var closeBtn = $('#register-close');
  if(closeBtn){
    closeBtn.addEventListener('click', function(){
      // Navigate to home page or go back
      window.location.href = 'index.html'; // Change to your home page
    });
  }

  // Form submission
  var form = $('#register-form');
  if(form){
    form.addEventListener('submit', function(e){
      e.preventDefault();
      
      // Get form values
      var fullname = $('#fullname');
      var email = $('#email');
      var password = $('#password');
      var confirmPassword = $('#confirm-password');
      var terms = $('#terms');
      
      // Reset previous error states
      fullname.classList.remove('error');
      email.classList.remove('error');
      password.classList.remove('error');
      confirmPassword.classList.remove('error');

      var isValid = true;

      // Validation: Full name
      if(!fullname.value.trim()){
        fullname.classList.add('error');
        isValid = false;
      }

      // Validation: Email
      var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if(!email.value || !emailPattern.test(email.value)){
        email.classList.add('error');
        isValid = false;
      }

      // Validation: Password strength
      if(password.value.length < 8){
        password.classList.add('error');
        isValid = false;
      }

      // Validation: Password match
      if(password.value !== confirmPassword.value){
        confirmPassword.classList.add('error');
        isValid = false;
      }

      // Validation: Terms acceptance
      if(!terms.checked){
        isValid = false;
      }

      if(!isValid){
        alert('Please fill in all fields correctly and accept the terms.');
        return;
      }

      // Success: Process registration
      console.log('Registration submitted:', {
        fullname: fullname.value,
        email: email.value,
        password: '****' // Don't log actual password
      });

      fetch(BASE + 'backend/api/auth.php', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          action: 'register',
          fullname: fullname.value,
          email: email.value,
          password: password.value
        })
      })
      .then(function(res){ return res.json(); })
      .then(function(data){
        if (data && data.success) {
          alert('Account created successfully! You can now log in.');
          window.location.href = 'LogIn.html';
        } else {
          alert((data && data.message) ? data.message : 'Registration failed. Please try again.');
        }
      })
      .catch(function(err){
        console.error('Registration error:', err);
        alert('Network error. Please try again.');
      });
    });

    // Real-time validation feedback
    var confirmPassword = $('#confirm-password');
    var password = $('#password');
    
    if(confirmPassword && password){
      confirmPassword.addEventListener('input', function(){
        if(confirmPassword.value && password.value !== confirmPassword.value){
          confirmPassword.classList.add('error');
        } else {
          confirmPassword.classList.remove('error');
        }
      });
    }
  }
})();
