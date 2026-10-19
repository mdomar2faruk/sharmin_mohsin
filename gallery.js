// =========================================================
// 3D Image Carousel with Touch Drag + Auto Slide
// =========================================================

const stageContainer = document.getElementById('stageContainer');
const stage = document.getElementById('stage');
const imageUpload = document.getElementById('imageUpload');
const uploadTrigger = document.getElementById('uploadTrigger');
const emptyUploadBtn = document.getElementById('emptyUploadBtn');
const emptyState = document.getElementById('emptyState');
const dotsContainer = document.getElementById('dots');
const playPauseBtn = document.getElementById('playPauseBtn');
const playPauseIcon = document.getElementById('playPauseIcon');
const clearBtn = document.getElementById('clearBtn');

// ===== State =====
let images = [];             // array of image src (dataURL)
let currentIndex = 0;
let autoPlayTimer = null;
let isAutoPlaying = true;
let isDragging = false;
let dragStartX = 0;
let dragStartIndex = 0;
let dragDeltaX = 0;
let lastMoveTime = 0;
let lastMoveX = 0;
let velocity = 0;

const AUTO_PLAY_INTERVAL = 3000; // 3s

// =========================================================
// STORAGE
// =========================================================
function saveImages() {
  try {
    localStorage.setItem('galleryImages', JSON.stringify(images));
  } catch (err) {
    console.warn('localStorage full or unavailable', err);
    alert('Storage full! Some images may not be saved.');
  }
}

function loadImages() {
  try {
    const saved = localStorage.getItem('galleryImages');
    if (saved) images = JSON.parse(saved) || [];
  } catch (err) {
    images = [];
  }
}

// =========================================================
// RENDER
// =========================================================
function renderCards() {
  // Clear stage
  stage.innerHTML = '';

  if (images.length === 0) {
    emptyState.classList.remove('hidden');
    dotsContainer.innerHTML = '';
    return;
  }

  emptyState.classList.add('hidden');

  images.forEach((src, idx) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.index = idx;

    const img = document.createElement('img');
    img.src = src;
    img.alt = 'Gallery image ' + (idx + 1);
    img.draggable = false;

    card.appendChild(img);
    stage.appendChild(card);

    // Click on side card to focus it
    card.addEventListener('click', () => {
      if (Math.abs(dragDeltaX) < 5) {
        goTo(idx);
      }
    });
  });

  renderDots();
  updateCards(false);
}

function renderDots() {
  dotsContainer.innerHTML = '';
  images.forEach((_, idx) => {
    const dot = document.createElement('div');
    dot.className = 'dot';
    dot.addEventListener('click', () => goTo(idx));
    dotsContainer.appendChild(dot);
  });
}

function updateDots() {
  const dots = dotsContainer.querySelectorAll('.dot');
  dots.forEach((dot, i) => {
    dot.classList.toggle('active', i === currentIndex);
  });
}

// =========================================================
// 3D POSITIONING
// =========================================================
function updateCards(animate = true) {
  const cards = stage.querySelectorAll('.card');
  const total = cards.length;
  if (total === 0) return;

  // Card sizes based on current screen
  const baseWidth = parseFloat(getComputedStyle(cards[0]).width);
  const gap = baseWidth * 0.55; // distance between cards

  cards.forEach((card, idx) => {
    // Calculate relative position (-N ... 0 ... +N)
    let offset = idx - currentIndex;

    // Wrap-around for infinite loop look
    const half = total / 2;
    if (offset > half) offset -= total;
    if (offset < -half) offset += total;

    const absOffset = Math.abs(offset);

    // Don't show cards too far away
    const isVisible = absOffset <= 3;

    // Transform values
    let translateX = offset * gap;
    let translateZ = -absOffset * 180;
    let rotateY = offset * -35;
    let scale = 1 - absOffset * 0.08;
    let opacity = isVisible ? Math.max(1 - absOffset * 0.28, 0) : 0;
    let zIndex = 100 - absOffset;

    // Active card special treatment
    if (offset === 0) {
      scale = 1;
      opacity = 1;
      translateZ = 0;
      rotateY = 0;
      card.classList.add('active');
    } else {
      card.classList.remove('active');
    }

    card.style.transition = animate
      ? 'transform 0.6s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.6s cubic-bezier(0.22, 1, 0.36, 1)'
      : 'none';

    card.style.transform = `
      translate3d(${translateX}px, 0, ${translateZ}px)
      rotateY(${rotateY}deg)
      scale(${scale})
    `;
    card.style.opacity = opacity;
    card.style.zIndex = zIndex;
    card.style.filter = absOffset > 0 ? `brightness(${1 - absOffset * 0.15})` : 'none';
  });

  updateDots();
}

// =========================================================
// NAVIGATION
// =========================================================
function goTo(index, animate = true) {
  if (images.length === 0) return;
  currentIndex = ((index % images.length) + images.length) % images.length;
  updateCards(animate);
  resetAutoPlay();
}

function next() {
  goTo(currentIndex + 1);
}

function prev() {
  goTo(currentIndex - 1);
}

// =========================================================
// AUTO PLAY
// =========================================================
function startAutoPlay() {
  stopAutoPlay();
  if (images.length < 2) return;
  autoPlayTimer = setInterval(() => {
    next();
  }, AUTO_PLAY_INTERVAL);
  isAutoPlaying = true;
  updatePlayPauseIcon();
}

function stopAutoPlay() {
  if (autoPlayTimer) {
    clearInterval(autoPlayTimer);
    autoPlayTimer = null;
  }
}

function resetAutoPlay() {
  if (isAutoPlaying) {
    stopAutoPlay();
    startAutoPlay();
  }
}

function updatePlayPauseIcon() {
  if (isAutoPlaying) {
    // Pause icon
    playPauseIcon.innerHTML = `
      <rect x="6" y="4" width="4" height="16" rx="1"></rect>
      <rect x="14" y="4" width="4" height="16" rx="1"></rect>
    `;
    playPauseBtn.title = 'Pause Auto Slide';
  } else {
    // Play icon
    playPauseIcon.innerHTML = `
      <polygon points="6 4 20 12 6 20 6 4"></polygon>
    `;
    playPauseBtn.title = 'Play Auto Slide';
  }
}

playPauseBtn.addEventListener('click', () => {
  if (isAutoPlaying) {
    isAutoPlaying = false;
    stopAutoPlay();
  } else {
    isAutoPlaying = true;
    startAutoPlay();
  }
  updatePlayPauseIcon();
});

// =========================================================
// IMAGE UPLOAD
// =========================================================
function handleFiles(files) {
  const fileArray = Array.from(files).filter(f => f.type.startsWith('image/'));
  if (fileArray.length === 0) return;

  let loadedCount = 0;
  const newImages = [];

  fileArray.forEach((file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      newImages.push(e.target.result);
      loadedCount++;

      if (loadedCount === fileArray.length) {
        // Append to existing images
        images = images.concat(newImages);
        saveImages();
        renderCards();

        // If this was the first batch, start autoplay
        if (images.length > 0 && isAutoPlaying) {
          startAutoPlay();
        }
      }
    };
    reader.readAsDataURL(file);
  });
}

uploadTrigger.addEventListener('click', () => imageUpload.click());
emptyUploadBtn.addEventListener('click', () => imageUpload.click());

imageUpload.addEventListener('change', (e) => {
  handleFiles(e.target.files);
  imageUpload.value = ''; // reset so same file can be re-uploaded
});

// =========================================================
// CLEAR ALL
// =========================================================
clearBtn.addEventListener('click', () => {
  if (images.length === 0) return;
  if (confirm('Delete all images from gallery?')) {
    images = [];
    currentIndex = 0;
    localStorage.removeItem('galleryImages');
    stopAutoPlay();
    renderCards();
  }
});

// =========================================================
// DRAG / SWIPE
// =========================================================
function getPointerX(e) {
  return e.touches ? e.touches[0].clientX : e.clientX;
}

function onDragStart(e) {
  if (images.length === 0) return;
  isDragging = true;
  dragStartX = getPointerX(e);
  dragStartIndex = currentIndex;
  dragDeltaX = 0;
  velocity = 0;
  lastMoveTime = Date.now();
  lastMoveX = dragStartX;

  stopAutoPlay();
  stageContainer.classList.add('dragging');
}

function onDragMove(e) {
  if (!isDragging) return;
  const x = getPointerX(e);
  dragDeltaX = x - dragStartX;

  // prevent page scroll on touch
  if (e.cancelable) e.preventDefault();

  // Calculate velocity
  const now = Date.now();
  const dt = now - lastMoveTime;
  if (dt > 0) {
    velocity = (x - lastMoveX) / dt;
  }
  lastMoveTime = now;
  lastMoveX = x;

  // Visual feedback: shift current card slightly
  const cards = stage.querySelectorAll('.card');
  const baseWidth = parseFloat(getComputedStyle(cards[0]).width);
  const shift = (dragDeltaX / baseWidth) * 300; // px shift

  // Apply temp transform to stage for smooth follow
  // (only to give feel of dragging; actual position updates after release)
  stage.style.transform = `translateX(${dragDeltaX * 0.25}px)`;
}

function onDragEnd() {
  if (!isDragging) return;
  isDragging = false;
  stageContainer.classList.remove('dragging');
  stage.style.transform = '';

  const cardWidth = parseFloat(getComputedStyle(stage.querySelector('.card')).width) || 200;
  const threshold = cardWidth * 0.25; // 25% swipe to change

  // Combine drag distance + velocity
  const effectiveDelta = dragDeltaX + velocity * 200;

  if (Math.abs(effectiveDelta) > threshold) {
    if (effectiveDelta < 0) {
      next();
    } else {
      prev();
    }
  } else {
    // snap back
    updateCards(true);
    resetAutoPlay();
  }

  dragDeltaX = 0;
}

// Touch events
stageContainer.addEventListener('touchstart', onDragStart, { passive: true });
stageContainer.addEventListener('touchmove', onDragMove, { passive: false });
stageContainer.addEventListener('touchend', onDragEnd);
stageContainer.addEventListener('touchcancel', onDragEnd);

// Mouse events (desktop)
stageContainer.addEventListener('mousedown', onDragStart);
window.addEventListener('mousemove', onDragMove);
window.addEventListener('mouseup', onDragEnd);

// =========================================================
// KEYBOARD
// =========================================================
document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight') next();
  if (e.key === 'ArrowLeft') prev();
  if (e.key === ' ') {
    e.preventDefault();
    playPauseBtn.click();
  }
});

// =========================================================
// INIT
// =========================================================
window.addEventListener('DOMContentLoaded', () => {
  loadImages();
  renderCards();

  if (images.length > 1) {
    startAutoPlay();
  } else {
    isAutoPlaying = true;
    updatePlayPauseIcon();
  }
});

// Handle window resize - reflow cards
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    updateCards(false);
  }, 150);
});