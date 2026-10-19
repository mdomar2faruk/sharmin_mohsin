// =========================================================
// ELEMENTS
// =========================================================
const menuBtn = document.getElementById('menuBtn');
const logoutBtn = document.getElementById('logoutBtn');
const drawer = document.getElementById('drawer');
const drawerClose = document.getElementById('drawerClose');
const drawerOverlay = document.getElementById('drawerOverlay');
const headerUserName = document.getElementById('headerUserName');
const welcomeName = document.getElementById('welcomeName');
const welcomeAvatar = document.getElementById('welcomeAvatar');

// ===== Image slider =====
const imageSlider = document.getElementById('heroSlider');
const imageEmpty  = document.getElementById('heroEmpty');
const imageDots   = document.getElementById('imageDots');
const imagePrev   = document.getElementById('imagePrev');
const imageNext   = document.getElementById('imageNext');
const imageUploadBtn = document.getElementById('imageUploadBtn');
const imageDeleteBtn = document.getElementById('imageDeleteBtn');
const imageInput  = document.getElementById('imageInput');

// Video
const videoPlayer = document.getElementById('videoPlayer');
const videoEmpty = document.getElementById('videoEmpty');
const videoUploadBtn = document.getElementById('videoUploadBtn');
const videoDeleteBtn = document.getElementById('videoDeleteBtn');
const videoInput = document.getElementById('videoInput');
const videoPrev = document.getElementById('videoPrev');
const videoNext = document.getElementById('videoNext');

// Featured Section
const featuredHero = document.getElementById('featuredHero');
const featuredHeroEmpty = document.getElementById('featuredHeroEmpty');
const featuredPrev = document.getElementById('featuredPrev');
const featuredNext = document.getElementById('featuredNext');
const featuredUploadBtn = document.getElementById('featuredUploadBtn');
const featuredDeleteBtn = document.getElementById('featuredDeleteBtn');
const featuredInput = document.getElementById('featuredInput');
const thumbnailStrip = document.getElementById('thumbnailStrip');
const thumbnailWrapper = document.getElementById('thumbnailWrapper');

// =========================================================
// Supabase Upload Helper
// =========================================================
async function uploadToSupabase(file, bucketName) {
  const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
  
  const { data, error } = await window.supabaseClient.storage
    .from(bucketName)
    .upload(fileName, file);

  if (error) {
    console.error('Upload error:', error);
    throw error;
  }

  const { data: publicUrlData } = window.supabaseClient.storage
    .from(bucketName)
    .getPublicUrl(fileName);

  return publicUrlData.publicUrl;
}

// =========================================================
// INIT
// =========================================================
window.addEventListener('DOMContentLoaded', () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  if (!user.email) {
    window.location.href = 'index.html';
    return;
  }

  const rawName = user.email.split('@')[0];
  const displayName = rawName.charAt(0).toUpperCase() + rawName.slice(1);

  if (headerUserName) headerUserName.textContent = displayName;
  if (welcomeName) welcomeName.textContent = displayName;

  loadProfileData();
  loadImages();
  loadVideo();
  loadFeatured();
  loadAlbumsPreview();
  loadRotatingHero();
});

// =========================================================
// DRAWER (Sidebar)
// =========================================================
function openDrawer() {
  drawer.classList.add('open');
  drawerOverlay.classList.add('show');
}

function closeDrawer() {
  drawer.classList.remove('open');
  drawerOverlay.classList.remove('show');
}

menuBtn.addEventListener('click', openDrawer);
drawerClose.addEventListener('click', closeDrawer);
drawerOverlay.addEventListener('click', closeDrawer);

// =========================================================
// LOGOUT
// =========================================================
logoutBtn.addEventListener('click', () => {
  if (confirm('Are you sure you want to logout?')) {
    localStorage.removeItem('user');
    window.location.href = 'index.html';
  }
});

// =========================================================
// ================== IMAGE SLIDER =========================
// =========================================================
let sliderImages = [];
let sliderIndex = 0;
let sliderTimer = null;
const SLIDE_INTERVAL = 3500;

function renderSlides() {
  imageSlider.querySelectorAll('.slide').forEach(el => el.remove());
  imageDots.innerHTML = '';

  if (sliderImages.length === 0) {
    imageEmpty.classList.remove('hidden');
    stopSliderAuto();
    return;
  }

  imageEmpty.classList.add('hidden');

  sliderImages.forEach((src, i) => {
    const slide = document.createElement('div');
    slide.className = 'slide' + (i === 0 ? ' active' : '');

    const img = document.createElement('img');
    img.src = src;
    img.alt = 'Slide ' + (i + 1);
    img.draggable = false;

    slide.appendChild(img);
    imageSlider.appendChild(slide);

    const dot = document.createElement('div');
    dot.className = 'hero-dot' + (i === 0 ? ' active' : '');
    dot.addEventListener('click', () => goToSlide(i));
    imageDots.appendChild(dot);
  });

  sliderIndex = 0;
  updateSlideView();
  startSliderAuto();
}

function updateSlideView() {
  const slides = imageSlider.querySelectorAll('.slide');
  const dots = imageDots.querySelectorAll('.hero-dot');

  slides.forEach((s, i) => s.classList.toggle('active', i === sliderIndex));
  dots.forEach((d, i) => d.classList.toggle('active', i === sliderIndex));
}

function goToSlide(index) {
  if (sliderImages.length === 0) return;
  sliderIndex = ((index % sliderImages.length) + sliderImages.length) % sliderImages.length;
  updateSlideView();
  resetSliderAuto();
}

function nextSlide() { goToSlide(sliderIndex + 1); }
function prevSlide() { goToSlide(sliderIndex - 1); }

function startSliderAuto() {
  stopSliderAuto();
  if (sliderImages.length < 2) return;
  sliderTimer = setInterval(() => {
    sliderIndex = (sliderIndex + 1) % sliderImages.length;
    updateSlideView();
  }, SLIDE_INTERVAL);
}

function stopSliderAuto() {
  if (sliderTimer) {
    clearInterval(sliderTimer);
    sliderTimer = null;
  }
}

function resetSliderAuto() {
  stopSliderAuto();
  startSliderAuto();
}

imagePrev.addEventListener('click', (e) => {
  e.stopPropagation();
  prevSlide();
});

imageNext.addEventListener('click', (e) => {
  e.stopPropagation();
  nextSlide();
});

imageUploadBtn.addEventListener('click', () => imageInput.click());

imageInput.addEventListener('change', async (e) => {
  const files = Array.from(e.target.files).filter(f => f.type.startsWith('image/'));
  if (files.length === 0) return;
  
  for (const file of files) {
    try {
      const imageUrl = await uploadToSupabase(file, 'images');
      sliderImages.push(imageUrl);
    } catch (err) { alert('ছবি আপলোড ব্যর্থ!'); }
  }
  saveImages();
  renderSlides();
  imageInput.value = '';
});

imageDeleteBtn.addEventListener('click', () => {
  if (sliderImages.length === 0) {
    alert('No images to delete!');
    return;
  }
  if (!confirm('Delete the current image?')) return;

  sliderImages.splice(sliderIndex, 1);
  if (sliderIndex >= sliderImages.length) {
    sliderIndex = Math.max(0, sliderImages.length - 1);
  }
  saveImages();
  renderSlides();
});

function saveImages() {
  try {
    localStorage.setItem('dashboardSliderImages', JSON.stringify(sliderImages));
  } catch (err) {
    console.warn('Storage full', err);
  }
}

function loadImages() {
  try {
    const saved = localStorage.getItem('dashboardSliderImages');
    if (saved) sliderImages = JSON.parse(saved) || [];
    renderSlides();
  } catch (err) {
    sliderImages = [];
    renderSlides();
  }
}

let touchStartX = 0;
imageSlider.addEventListener('touchstart', (e) => {
  touchStartX = e.touches[0].clientX;
}, { passive: true });

imageSlider.addEventListener('touchend', (e) => {
  const dx = e.changedTouches[0].clientX - touchStartX;
  if (Math.abs(dx) > 40) {
    if (dx < 0) nextSlide();
    else prevSlide();
  }
});

// =========================================================
// ====================== VIDEO ============================
// =========================================================
let savedVideos = [];
let currentVideoIndex = 0;
const MAX_VIDEOS = 3;

videoUploadBtn.addEventListener('click', () => {
  if (savedVideos.length >= MAX_VIDEOS) {
    alert(`আপনি সর্বোচ্চ ${MAX_VIDEOS} টি ভিডিও আপলোড করতে পারবেন!`);
    return;
  }
  videoInput.click();
});

videoInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file || !file.type.startsWith('video/')) return;

  // সাইজ চেক (৫০ মেগাবাইট)
  const MAX_SIZE = 50 * 1024 * 1024; 
  if (file.size > MAX_SIZE) {
    alert('ভিডিওটি ৫০ মেগাবাইটের চেয়ে বড়! ছোট ভিডিও আপলোড করুন।');
    videoInput.value = '';
    return;
  }

  try {
    const videoUrl = await uploadToSupabase(file, 'videos');
    savedVideos.push(videoUrl);
    currentVideoIndex = savedVideos.length - 1;
    saveVideos();
    renderVideo();
  } catch (err) {
    console.error(err);
    alert('ভিডিও আপলোড ব্যর্থ হয়েছে!');
  }

  videoInput.value = '';
});

function renderVideo() {
  if (savedVideos.length === 0) {
    videoEmpty.classList.remove('hidden');
    videoPlayer.style.display = 'none';
    if (videoPrev) videoPrev.style.display = 'none';
    if (videoNext) videoNext.style.display = 'none';
    videoPlayer.removeAttribute('src');
    videoPlayer.load();
    return;
  }

  videoEmpty.classList.add('hidden');
  videoPlayer.style.display = 'block';
  videoPlayer.src = savedVideos[currentVideoIndex];
  videoPlayer.load();

  if (savedVideos.length > 1) {
    if (videoPrev) videoPrev.style.display = 'flex';
    if (videoNext) videoNext.style.display = 'flex';
  } else {
    if (videoPrev) videoPrev.style.display = 'none';
    if (videoNext) videoNext.style.display = 'none';
  }
}

if (videoPrev) {
  videoPrev.addEventListener('click', (e) => {
    e.stopPropagation();
    if (savedVideos.length <= 1) return;
    currentVideoIndex = (currentVideoIndex - 1 + savedVideos.length) % savedVideos.length;
    renderVideo();
  });
}

if (videoNext) {
  videoNext.addEventListener('click', (e) => {
    e.stopPropagation();
    if (savedVideos.length <= 1) return;
    currentVideoIndex = (currentVideoIndex + 1) % savedVideos.length;
    renderVideo();
  });
}

videoDeleteBtn.addEventListener('click', () => {
  if (savedVideos.length === 0) {
    alert('ডিলিট করার জন্য কোনো ভিডিও নেই!');
    return;
  }
  if (!confirm('আপনি কি বর্তমান ভিডিওটি ডিলিট করতে চান?')) return;

  savedVideos.splice(currentVideoIndex, 1);
  if (currentVideoIndex >= savedVideos.length) {
    currentVideoIndex = Math.max(0, savedVideos.length - 1);
  }
  
  saveVideos();
  renderVideo();
});

function saveVideos() {
  try {
    localStorage.setItem('dashboardVideos', JSON.stringify(savedVideos));
  } catch (err) {
    console.warn('Storage full', err);
    alert('স্টোরেজ ফুল! ভিডিওটি সেভ করা যাচ্ছে না।');
  }
}

function loadVideo() {
  try {
    const saved = localStorage.getItem('dashboardVideos');
    if (saved) {
      savedVideos = JSON.parse(saved) || [];
      currentVideoIndex = savedVideos.length - 1;
    }
    renderVideo();
  } catch (err) {
    savedVideos = [];
    renderVideo();
  }
}

// =========================================================
// PROFILE PICTURE
// =========================================================
const profileInput = document.getElementById('profileInput');
const profileUploadBtn = document.getElementById('profileUploadBtn');

if (profileInput) {
  profileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith('image/')) return;

    try {
      const imageUrl = await uploadToSupabase(file, 'images');
      
      if (welcomeAvatar) {
        welcomeAvatar.innerHTML = `<img src="${imageUrl}" alt="Profile">`;
      }
      
      const saved = JSON.parse(localStorage.getItem('dashboardProfile') || '{}');
      saved.avatar = imageUrl;
      localStorage.setItem('dashboardProfile', JSON.stringify(saved));
      localStorage.setItem('dashboardProfilePic', imageUrl);
      
      alert('Profile picture updated successfully!');
      
    } catch (err) {
      alert('প্রোফাইল ছবি আপলোড ব্যর্থ হয়েছে!');
    }
    profileInput.value = '';
  });
}

function loadProfileData() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const saved = JSON.parse(localStorage.getItem('dashboardProfile') || '{}');

  const defaultName = user.email ? user.email.split('@')[0] : 'User';
  const name = saved.name || (defaultName.charAt(0).toUpperCase() + defaultName.slice(1));

  if (welcomeName) welcomeName.textContent = name;
  if (headerUserName) headerUserName.textContent = name;

  const avatar = saved.avatar || localStorage.getItem('dashboardProfilePic');
  if (avatar && welcomeAvatar) {
    welcomeAvatar.innerHTML = `<img src="${avatar}" alt="Profile">`;
  }
}

// =========================================================
// ============== FEATURED SECTION (Hero + Strip) ==========
// =========================================================
let featuredImages = [];
let featuredIndex = 0;

let stripOffset = 0;
const stripSpeed = 0.5; 
let stripAnimId = null;
let isStripPaused = false;
let stripLoopWidth = 0; 

let stripDragStartX = 0;
let stripDragStartOffset = 0;
let wasDragging = false;

let featuredHeroTimer = null;
const FEATURED_HERO_INTERVAL = 4000;

function renderFeatured() {
  featuredHero.querySelectorAll('.featured-slide').forEach(el => el.remove());

  if (featuredImages.length === 0) {
    featuredHeroEmpty.classList.remove('hidden');
    thumbnailStrip.innerHTML = '';
    stopStripAnimation();
    stopFeaturedHeroAuto();
    return;
  }

  featuredHeroEmpty.classList.add('hidden');

  featuredImages.forEach((src, i) => {
    const slide = document.createElement('div');
    slide.className = 'featured-slide' + (i === 0 ? ' active' : '');
    const img = document.createElement('img');
    img.src = src;
    img.alt = 'Featured ' + (i + 1);
    img.draggable = false;
    slide.appendChild(img);
    featuredHero.appendChild(slide);
  });

  thumbnailStrip.innerHTML = '';
  
  const buildThumbs = () => {
    featuredImages.forEach((src, i) => {
      const card = document.createElement('div');
      card.className = 'thumb-card' + (i === 0 ? ' active' : '');
      card.dataset.index = i;
      const img = document.createElement('img');
      img.src = src;
      img.alt = 'Thumb ' + (i + 1);
      img.draggable = false;
      card.appendChild(img);

      card.addEventListener('click', () => {
        if (!wasDragging) goToFeatured(i);
      });

      thumbnailStrip.appendChild(card);
    });
  };

  buildThumbs();
  buildThumbs(); 

  setTimeout(() => {
    const currentWidth = thumbnailStrip.scrollWidth / 2;
    const screenWidth = window.innerWidth;
    
    if (currentWidth > 0 && currentWidth < screenWidth) {
      const copiesNeeded = Math.ceil(screenWidth / currentWidth) + 1;
      for (let c = 0; c < copiesNeeded; c++) {
        buildThumbs();
      }
    }

    featuredIndex = 0;
    updateFeaturedView();
    resetStrip();
    startStripAnimation();
    resetFeaturedHeroAuto();
  }, 50);
}

function updateFeaturedView() {
  const slides = featuredHero.querySelectorAll('.featured-slide');
  const thumbs = thumbnailStrip.querySelectorAll('.thumb-card');

  slides.forEach((s, i) => s.classList.toggle('active', i === featuredIndex));
  thumbs.forEach((t) => {
    t.classList.toggle('active', parseInt(t.dataset.index) === featuredIndex);
  });
}

function goToFeatured(index) {
  if (featuredImages.length === 0) return;
  featuredIndex = ((index % featuredImages.length) + featuredImages.length) % featuredImages.length;
  updateFeaturedView();
}

function nextFeatured() { goToFeatured(featuredIndex + 1); }
function prevFeatured() { goToFeatured(featuredIndex - 1); }

function startStripAnimation() {
  if (stripAnimId) return;

  const step = () => {
    if (!isStripPaused && featuredImages.length > 0) {
      const cards = thumbnailStrip.querySelectorAll('.thumb-card');
      if (cards.length > 0) {
        const firstSet = Array.from(cards).slice(0, featuredImages.length);
        
        if (stripLoopWidth === 0) {
           stripLoopWidth = firstSet.reduce((sum, el) => sum + el.offsetWidth + 10, 0); 
        }

        stripOffset += stripSpeed;

        if (stripLoopWidth > 0 && stripOffset >= stripLoopWidth) {
          stripOffset -= stripLoopWidth;
        }

        thumbnailStrip.style.transform = `translateX(${-stripOffset}px)`;
      }
    }
    stripAnimId = requestAnimationFrame(step);
  };

  stripAnimId = requestAnimationFrame(step);
}

function stopStripAnimation() {
  if (stripAnimId) {
    cancelAnimationFrame(stripAnimId);
    stripAnimId = null;
  }
}

function resetStrip() {
  stripOffset = 0;
  stripLoopWidth = 0;
  thumbnailStrip.style.transform = 'translateX(0)';
}

thumbnailWrapper.addEventListener('mouseenter', () => { isStripPaused = true; });
thumbnailWrapper.addEventListener('mouseleave', () => { isStripPaused = false; });

thumbnailWrapper.addEventListener('touchstart', (e) => {
  isStripPaused = true;
  stripDragStartX = e.touches[0].clientX;
  stripDragStartOffset = stripOffset;
  wasDragging = false;
}, { passive: true });

thumbnailWrapper.addEventListener('touchmove', (e) => {
  const dx = e.touches[0].clientX - stripDragStartX;
  if (Math.abs(dx) > 5) wasDragging = true;
  stripOffset = stripDragStartOffset - dx;
  thumbnailStrip.style.transform = `translateX(${-stripOffset}px)`;
}, { passive: true });

thumbnailWrapper.addEventListener('touchend', () => {
  setTimeout(() => { wasDragging = false; }, 100);
  setTimeout(() => { isStripPaused = false; }, 400);
}, { passive: true });

thumbnailWrapper.addEventListener('touchcancel', () => {
  wasDragging = false;
  isStripPaused = false;
}, { passive: true });

thumbnailWrapper.addEventListener('mousedown', (e) => {
  stripDragStartX = e.clientX;
  stripDragStartOffset = stripOffset;
  wasDragging = false;
  isStripPaused = true;
  thumbnailStrip.classList.add('dragging');

  const onMove = (ev) => {
    const dx = ev.clientX - stripDragStartX;
    if (Math.abs(dx) > 5) wasDragging = true;
    stripOffset = stripDragStartOffset - dx;
    thumbnailStrip.style.transform = `translateX(${-stripOffset}px)`;
  };

  const onUp = () => {
    window.removeEventListener('mousemove', onMove);
    window.removeEventListener('mouseup', onUp);
    thumbnailStrip.classList.remove('dragging');
    setTimeout(() => { wasDragging = false; }, 100);
    setTimeout(() => { isStripPaused = false; }, 400);
  };

  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onUp);
});

featuredUploadBtn.addEventListener('click', () => featuredInput.click());

featuredInput.addEventListener('change', async (e) => {
  const files = Array.from(e.target.files).filter(f => f.type.startsWith('image/'));
  if (files.length === 0) return;
  for (const file of files) {
    try {
      const imageUrl = await uploadToSupabase(file, 'images');
      featuredImages.push(imageUrl);
    } catch (err) { alert('আপলোড ব্যর্থ!'); }
  }
  saveFeatured();
  renderFeatured();
  featuredInput.value = '';
});

featuredPrev.addEventListener('click', (e) => {
  e.stopPropagation();
  prevFeatured();
});

featuredNext.addEventListener('click', (e) => {
  e.stopPropagation();
  nextFeatured();
});

function saveFeatured() {
  try {
    localStorage.setItem('dashboardFeaturedImages', JSON.stringify(featuredImages));
  } catch (err) {
    console.warn('Storage full', err);
  }
}

function loadFeatured() {
  try {
    const saved = localStorage.getItem('dashboardFeaturedImages');
    if (saved) featuredImages = JSON.parse(saved) || [];
    renderFeatured();
  } catch (err) {
    featuredImages = [];
    renderFeatured();
  }
}

function startFeaturedHeroAuto() {
  stopFeaturedHeroAuto();
  if (featuredImages.length < 2) return;
  featuredHeroTimer = setInterval(() => {
    nextFeatured();
  }, FEATURED_HERO_INTERVAL);
}

function stopFeaturedHeroAuto() {
  if (featuredHeroTimer) {
    clearInterval(featuredHeroTimer);
    featuredHeroTimer = null;
  }
}

function resetFeaturedHeroAuto() {
  if (featuredImages.length >= 2) {
    stopFeaturedHeroAuto();
    startFeaturedHeroAuto();
  }
}

window.addEventListener('load', () => {
  setTimeout(() => {
    startStripAnimation();
  }, 500);
});

window.addEventListener('resize', () => {
  stripLoopWidth = 0;
});

// =========================================================
// ALBUMS PREVIEW (Dashboard)
// =========================================================
const dashboardAlbumsStrip = document.getElementById('dashboardAlbumsStrip');
const dashboardAlbumsEmpty = document.getElementById('dashboardAlbumsEmpty');
const dashboardAlbumCount = document.getElementById('dashboardAlbumCount');

function loadAlbumsPreview() {
  let albums = [];
  try {
    albums = JSON.parse(localStorage.getItem('galleryAlbums') || '[]');
  } catch (err) {
    albums = [];
  }

  if (dashboardAlbumCount) {
    dashboardAlbumCount.textContent = `${albums.length} ${albums.length === 1 ? 'album' : 'albums'}`;
  }

  if (!dashboardAlbumsStrip) return;

  if (albums.length === 0) {
    dashboardAlbumsStrip.innerHTML = '';
    dashboardAlbumsStrip.style.display = 'none';
    if (dashboardAlbumsEmpty) dashboardAlbumsEmpty.classList.remove('hidden');
    return;
  }

  if (dashboardAlbumsEmpty) dashboardAlbumsEmpty.classList.add('hidden');
  dashboardAlbumsStrip.style.display = 'flex';
  dashboardAlbumsStrip.innerHTML = '';

  albums.forEach(album => {
    const card = document.createElement('a');
    card.className = 'album-mini-card';
    card.href = 'albums.html';
    card.dataset.albumId = album.id;

    const thumb = document.createElement('div');
    thumb.className = 'album-mini-thumb';

    if (album.images && album.images.length > 0) {
      const img = document.createElement('img');
      img.src = album.images[album.images.length - 1];
      img.alt = album.name;
      img.draggable = false;
      thumb.appendChild(img);
    } else {
      thumb.innerHTML = `
        <svg class="mini-placeholder" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
        </svg>
      `;
    }

    const badge = document.createElement('div');
    badge.className = 'album-mini-badge';
    badge.textContent = `${album.images ? album.images.length : 0}`;
    thumb.appendChild(badge);

    const name = document.createElement('div');
    name.className = 'album-mini-name';
    name.textContent = album.name;

    card.appendChild(thumb);
    card.appendChild(name);

    dashboardAlbumsStrip.appendChild(card);
  });
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight') nextSlide();
  if (e.key === 'ArrowLeft') prevSlide();
  if (e.key === 'Escape') closeDrawer();
});

window.addEventListener('pageshow', () => {
  if (typeof loadAlbumsPreview === 'function') {
    loadAlbumsPreview();
  }
});

document.addEventListener('visibilitychange', () => {
  if (!document.hidden && typeof loadAlbumsPreview === 'function') {
    loadAlbumsPreview();
  }
});

// =========================================================
// 🌈 ROTATING BORDER HERO BANNER
// =========================================================
const rotatingSlider = document.getElementById('rotatingSlider');
const rotatingEmpty = document.getElementById('rotatingEmpty');
const rotatingDots = document.getElementById('rotatingDots');
const rotatingPrev = document.getElementById('rotatingPrev');
const rotatingNext = document.getElementById('rotatingNext');
const rotatingUploadBtn = document.getElementById('rotatingUploadBtn');
const rotatingDeleteBtn = document.getElementById('rotatingDeleteBtn');
const rotatingInput = document.getElementById('rotatingInput');

let rotatingImages = [];
let rotatingIndex = 0;
let rotatingTimer = null;
const ROTATING_INTERVAL = 3500;

function renderRotating() {
  rotatingSlider.querySelectorAll('.rotating-slide').forEach(el => el.remove());
  rotatingDots.innerHTML = '';

  if (rotatingImages.length === 0) {
    rotatingEmpty.classList.remove('hidden');
    stopRotatingAuto();
    return;
  }

  rotatingEmpty.classList.add('hidden');

  rotatingImages.forEach((src, i) => {
    const slide = document.createElement('div');
    slide.className = 'rotating-slide' + (i === 0 ? ' active' : '');

    const img = document.createElement('img');
    img.src = src;
    img.alt = 'Rotating ' + (i + 1);
    img.draggable = false;

    slide.appendChild(img);
    rotatingSlider.appendChild(slide);

    const dot = document.createElement('div');
    dot.className = 'rotating-dot' + (i === 0 ? ' active' : '');
    dot.addEventListener('click', () => goToRotating(i));
    rotatingDots.appendChild(dot);
  });

  rotatingIndex = 0;
  updateRotatingView();
  startRotatingAuto();
}

function updateRotatingView() {
  const slides = rotatingSlider.querySelectorAll('.rotating-slide');
  const dots = rotatingDots.querySelectorAll('.rotating-dot');
  slides.forEach((s, i) => s.classList.toggle('active', i === rotatingIndex));
  dots.forEach((d, i) => d.classList.toggle('active', i === rotatingIndex));
}

function goToRotating(index) {
  if (rotatingImages.length === 0) return;
  rotatingIndex = ((index % rotatingImages.length) + rotatingImages.length) % rotatingImages.length;
  updateRotatingView();
  resetRotatingAuto();
}

function nextRotating() { goToRotating(rotatingIndex + 1); }
function prevRotating() { goToRotating(rotatingIndex - 1); }

function startRotatingAuto() {
  stopRotatingAuto();
  if (rotatingImages.length < 2) return;
  rotatingTimer = setInterval(() => {
    rotatingIndex = (rotatingIndex + 1) % rotatingImages.length;
    updateRotatingView();
  }, ROTATING_INTERVAL);
}

function stopRotatingAuto() {
  if (rotatingTimer) {
    clearInterval(rotatingTimer);
    rotatingTimer = null;
  }
}

function resetRotatingAuto() {
  stopRotatingAuto();
  startRotatingAuto();
}

rotatingPrev.addEventListener('click', (e) => {
  e.stopPropagation();
  prevRotating();
});

rotatingNext.addEventListener('click', (e) => {
  e.stopPropagation();
  nextRotating();
});

rotatingUploadBtn.addEventListener('click', () => rotatingInput.click());

rotatingInput.addEventListener('change', async (e) => {
  const files = Array.from(e.target.files).filter(f => f.type.startsWith('image/'));
  if (files.length === 0) return;
  for (const file of files) {
    try {
      const imageUrl = await uploadToSupabase(file, 'images');
      rotatingImages.push(imageUrl);
    } catch (err) { alert('আপলোড ব্যর্থ!'); }
  }
  saveRotating();
  renderRotating();
  rotatingInput.value = '';
});

rotatingDeleteBtn.addEventListener('click', () => {
  if (rotatingImages.length === 0) {
    alert('No images to delete!');
    return;
  }
  if (!confirm('Delete the current rotating image?')) return;

  rotatingImages.splice(rotatingIndex, 1);
  if (rotatingIndex >= rotatingImages.length) {
    rotatingIndex = Math.max(0, rotatingImages.length - 1);
  }
  saveRotating();
  renderRotating();
});

function saveRotating() {
  try {
    localStorage.setItem('dashboardRotatingImages', JSON.stringify(rotatingImages));
  } catch (err) {
    console.warn('Storage full', err);
  }
}

function loadRotatingHero() {
  try {
    const saved = localStorage.getItem('dashboardRotatingImages');
    if (saved) rotatingImages = JSON.parse(saved) || [];
    renderRotating();
  } catch (err) {
    rotatingImages = [];
    renderRotating();
  }
}

let rotatingTouchStartX = 0;
rotatingSlider.addEventListener('touchstart', (e) => {
  rotatingTouchStartX = e.touches[0].clientX;
}, { passive: true });

rotatingSlider.addEventListener('touchend', (e) => {
  const dx = e.changedTouches[0].clientX - rotatingTouchStartX;
  if (Math.abs(dx) > 40) {
    if (dx < 0) nextRotating();
    else prevRotating();
  }
});