// =========================================================
// PROFILE PAGE
// =========================================================

const avatarPreview = document.getElementById('avatarPreview');
const avatarBtn = document.getElementById('avatarBtn');
const avatarInput = document.getElementById('avatarInput');
const profileForm = document.getElementById('profileForm');
const profileName = document.getElementById('profileName');
const profileBio = document.getElementById('profileBio');

let avatarDataUrl = '';

// =========================================================
// LOAD EXISTING PROFILE
// =========================================================
window.addEventListener('DOMContentLoaded', () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (!user.email) {
    window.location.href = 'index.html';
    return;
  }

  const saved = JSON.parse(localStorage.getItem('dashboardProfile') || '{}');

  const defaultName = user.email.split('@')[0];
  const displayName = saved.name || (defaultName.charAt(0).toUpperCase() + defaultName.slice(1));

  profileName.value = displayName;
  profileBio.value = saved.bio || '';

  if (saved.avatar) {
    avatarDataUrl = saved.avatar;
    setAvatarPreview(saved.avatar);
  } else {
    const oldPic = localStorage.getItem('dashboardProfilePic');
    if (oldPic) {
      avatarDataUrl = oldPic;
      setAvatarPreview(oldPic);
    }
  }
});

// =========================================================
// AVATAR PREVIEW
// =========================================================
function setAvatarPreview(src) {
  avatarPreview.innerHTML = `
    <img src="${src}" alt="Avatar">
    <button class="avatar-camera-btn" id="avatarBtn" aria-label="Change Photo">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
        <circle cx="12" cy="13" r="4"></circle>
      </svg>
    </button>
  `;

  const newBtn = avatarPreview.querySelector('.avatar-camera-btn');
  newBtn.addEventListener('click', () => avatarInput.click());
}

// =========================================================
// AVATAR UPLOAD
// =========================================================
avatarBtn.addEventListener('click', () => avatarInput.click());

avatarInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file || !file.type.startsWith('image/')) return;

  if (file.size > 2 * 1024 * 1024) {
    alert('Image is larger than 2MB. Please choose a smaller one.');
    avatarInput.value = '';
    return;
  }

  const reader = new FileReader();
  reader.onload = (ev) => {
    avatarDataUrl = ev.target.result;
    setAvatarPreview(avatarDataUrl);
  };
  reader.readAsDataURL(file);

  avatarInput.value = '';
});

// =========================================================
// SAVE PROFILE
// =========================================================
profileForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const name = profileName.value.trim();
  const bio = profileBio.value.trim();

  if (!name) {
    alert('Please enter your display name');
    profileName.focus();
    return;
  }

  const profile = {
    name: name,
    bio: bio,
    avatar: avatarDataUrl,
    updatedAt: new Date().toISOString()
  };

  try {
    localStorage.setItem('dashboardProfile', JSON.stringify(profile));
    if (avatarDataUrl) {
      localStorage.setItem('dashboardProfilePic', avatarDataUrl);
    }
    showToast('Profile saved successfully!');
  } catch (err) {
    console.error(err);
    alert('Storage full! Could not save profile.');
  }
});

// =========================================================
// TOAST
// =========================================================
function showToast(message) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
    <span>${message}</span>
  `;
  document.body.appendChild(toast);

  void toast.offsetWidth;
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 2000);
}