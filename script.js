// ===== Elements =====
const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const togglePassword = document.getElementById('togglePassword');
const bgImageInput = document.getElementById('bgImage');

// ===== Password Show/Hide =====
togglePassword.addEventListener('click', () => {
  const isPassword = passwordInput.type === 'password';
  passwordInput.type = isPassword ? 'text' : 'password';

  if (isPassword) {
    togglePassword.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
        <line x1="1" y1="1" x2="23" y2="23"></line>
      </svg>
    `;
  } else {
    togglePassword.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
        <circle cx="12" cy="12" r="3"></circle>
      </svg>
    `;
  }
});

// ===== Form Submit - Login & Redirect =====
loginForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email || !password) {
    alert('Please fill in all fields!');
    return;
  }

  // ✅ Save user info in localStorage (demo login)
  localStorage.setItem('user', JSON.stringify({
    email: email,
    loginTime: new Date().toISOString()
  }));

  // ✅ Redirect to Dashboard
  window.location.href = 'dashboard.html';
});

// ===== Background Image Upload =====
bgImageInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    alert('Please upload a valid image file!');
    return;
  }

  const reader = new FileReader();
  reader.onload = (event) => {
    document.body.style.backgroundImage = `url('${event.target.result}')`;
    try {
      localStorage.setItem('loginBgImage', event.target.result);
    } catch (err) {
      console.warn('Image too large for localStorage');
    }
  };
  reader.readAsDataURL(file);
});

// ===== Load Saved Background =====
window.addEventListener('DOMContentLoaded', () => {
  const savedBg = localStorage.getItem('loginBgImage');
  if (savedBg) {
    document.body.style.backgroundImage = `url('${savedBg}')`;
  }
});