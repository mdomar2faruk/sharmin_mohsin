// =========================================================
// FULL-SCREEN IMAGE VIEWER
// =========================================================
// Global module — can be used from anywhere
// Just call: ImageViewer.open(imagesArray, startIndex, options)
// =========================================================

const ImageViewer = (function () {
  'use strict';

  // ===== State =====
  let images = [];
  let currentIndex = 0;
  let options = {};                // { onDelete(index), onUpdate(newImages) }
  let viewerEl = null;
  let imgWrap = null;
  let imgEl = null;
  let stageEl = null;
  let loaderEl = null;
  let counterEl = null;

  // Zoom/pan
  let scale = 1;
  let minScale = 1;
  let maxScale = 5;
  let tx = 0, ty = 0;
  let pinchStartDist = 0;
  let pinchStartScale = 1;
  let panStartX = 0, panStartY = 0;
  let panStartTx = 0, panStartTy = 0;
  let isPanning = false;

  // Swipe
  let swipeStartX = 0;
  let swipeStartY = 0;
  let swipeDeltaX = 0;
  let isSwiping = false;
  let isPinching = false;

  // Double tap
  let lastTapTime = 0;

  // UI auto-hide
  let uiHideTimer = null;

  // Zoom indicator
  let zoomIndicatorEl = null;
  let zoomIndicatorTimer = null;

  // =========================================================
  // BUILD DOM (once)
  // =========================================================
  function buildDOM() {
    if (viewerEl) return;

    viewerEl = document.createElement('div');
    viewerEl.className = 'image-viewer';
    viewerEl.innerHTML = `
      <!-- TOP BAR -->
      <div class="viewer-topbar">
        <button class="viewer-close" id="ivCloseBtn" aria-label="Close">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        <div class="viewer-counter" id="ivCounter">1 / 1</div>
        <button class="viewer-icon-btn" id="ivRotateBtn" aria-label="Rotate">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="23 4 23 10 17 10"></polyline>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
          </svg>
        </button>
      </div>

      <!-- ZOOM INDICATOR -->
      <div class="viewer-zoom-indicator" id="ivZoomInd">1.0x</div>

      <!-- STAGE -->
      <div class="viewer-stage" id="ivStage">
        <div class="viewer-loader" id="ivLoader"></div>
        <div class="viewer-img-wrap" id="ivImgWrap">
          <img id="ivImg" alt="Viewer image" draggable="false">
        </div>
      </div>

      <!-- BOTTOM BAR -->
      <div class="viewer-bottombar">
        <button class="viewer-action edit-action" id="ivEditBtn" aria-label="Edit">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
        </button>

        <button class="viewer-action download-action" id="ivDownloadBtn" aria-label="Download">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
        </button>

        <button class="viewer-action delete-action" id="ivDeleteBtn" aria-label="Delete">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      </div>

      <!-- CONFIRM DELETE -->
      <div class="viewer-confirm" id="ivConfirm">
        <div class="confirm-box">
          <div class="confirm-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </div>
          <h3>Delete Image?</h3>
          <p>This action cannot be undone.</p>
          <div class="confirm-actions">
            <button class="confirm-btn cancel" id="ivConfirmCancel">Cancel</button>
            <button class="confirm-btn delete" id="ivConfirmDelete">Delete</button>
          </div>
        </div>
      </div>

      <!-- TOAST -->
      <div class="viewer-toast" id="ivToast">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        <span id="ivToastText">Done</span>
      </div>
    `;

    document.body.appendChild(viewerEl);

    // Cache elements
    stageEl      = document.getElementById('ivStage');
    imgWrap      = document.getElementById('ivImgWrap');
    imgEl        = document.getElementById('ivImg');
    loaderEl     = document.getElementById('ivLoader');
    counterEl    = document.getElementById('ivCounter');
    zoomIndicatorEl = document.getElementById('ivZoomInd');

    // Attach handlers
    document.getElementById('ivCloseBtn').addEventListener('click', close);
    document.getElementById('ivDeleteBtn').addEventListener('click', askDelete);
    document.getElementById('ivDownloadBtn').addEventListener('click', downloadCurrent);
    document.getElementById('ivEditBtn').addEventListener('click', editCurrent);
    document.getElementById('ivRotateBtn').addEventListener('click', rotateCurrent);
    document.getElementById('ivConfirmCancel').addEventListener('click', hideConfirm);
    document.getElementById('ivConfirmDelete').addEventListener('click', confirmDelete);

    attachGestureHandlers();
  }

  // =========================================================
  // OPEN / CLOSE
  // =========================================================
  function open(imgs, startIndex = 0, opts = {}) {
    buildDOM();

    images = [...imgs];  // copy
    currentIndex = Math.max(0, Math.min(startIndex, images.length - 1));
    options = opts;

    if (images.length === 0) {
      console.warn('ImageViewer.open called with empty array');
      return;
    }

    viewerEl.classList.add('show');
    document.body.style.overflow = 'hidden';

    loadImage(currentIndex);
    scheduleUIHide();
  }

  function close() {
    if (!viewerEl) return;
    viewerEl.classList.remove('show');
    document.body.style.overflow = '';
    resetZoom();
    hideConfirm();
    if (uiHideTimer) clearTimeout(uiHideTimer);

    // Notify parent if images changed
    if (options.onUpdate) {
      options.onUpdate(images);
    }
  }

  // =========================================================
  // LOAD IMAGE
  // =========================================================
  function loadImage(index) {
    if (images.length === 0) {
      close();
      return;
    }

    currentIndex = ((index % images.length) + images.length) % images.length;

    loaderEl.classList.add('show');
    imgEl.style.opacity = 0;

    const src = images[currentIndex];

    // Preload
    const preload = new Image();
    preload.onload = () => {
      imgEl.src = src;
      imgEl.onload = () => {
        loaderEl.classList.remove('show');
        imgEl.style.opacity = 1;
        resetZoom();
      };
    };
    preload.onerror = () => {
      loaderEl.classList.remove('show');
    };
    preload.src = src;

    updateCounter();
    imgEl.style.transition = 'opacity 0.25s ease';
  }

  function updateCounter() {
    counterEl.textContent = `${currentIndex + 1} / ${images.length}`;
  }

  // =========================================================
  // NAVIGATE
  // =========================================================
  function next() {
    if (images.length <= 1) return;
    loadImage(currentIndex + 1);
  }

  function prev() {
    if (images.length <= 1) return;
    loadImage(currentIndex - 1);
  }

  // =========================================================
  // ZOOM / PAN
  // =========================================================
  function resetZoom() {
    scale = 1;
    tx = 0;
    ty = 0;
    applyTransform(false);
  }

  function applyTransform(animate = true) {
    if (!imgWrap) return;
    if (animate) {
      imgWrap.classList.remove('no-transition');
    } else {
      imgWrap.classList.add('no-transition');
    }
    imgWrap.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
  }

  function showZoomIndicator() {
    if (!zoomIndicatorEl) return;
    zoomIndicatorEl.textContent = scale.toFixed(1) + 'x';
    zoomIndicatorEl.classList.add('show');
    if (zoomIndicatorTimer) clearTimeout(zoomIndicatorTimer);
    zoomIndicatorTimer = setTimeout(() => {
      zoomIndicatorEl.classList.remove('show');
    }, 900);
  }

  // Clamp pan so image doesn't fly off
  function clampPan() {
    if (scale <= 1) {
      tx = 0;
      ty = 0;
      return;
    }
    const rect = stageEl.getBoundingClientRect();
    const maxTx = (rect.width  * (scale - 1)) / 2;
    const maxTy = (rect.height * (scale - 1)) / 2;
    tx = Math.max(-maxTx, Math.min(maxTx, tx));
    ty = Math.max(-maxTy, Math.min(maxTy, ty));
  }

  // =========================================================
  // GESTURE HANDLERS
  // =========================================================
  function attachGestureHandlers() {
    // ===== Touch events =====
    stageEl.addEventListener('touchstart', onTouchStart, { passive: false });
    stageEl.addEventListener('touchmove',  onTouchMove,  { passive: false });
    stageEl.addEventListener('touchend',   onTouchEnd,   { passive: false });
    stageEl.addEventListener('touchcancel', onTouchEnd,  { passive: false });

    // ===== Mouse events (desktop) =====
    stageEl.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    // ===== Mouse wheel zoom (desktop) =====
    stageEl.addEventListener('wheel', onWheel, { passive: false });

    // ===== Double click =====
    stageEl.addEventListener('dblclick', onDoubleTap);

    // ===== Keyboard =====
    document.addEventListener('keydown', onKeyDown);
  }

  function getDistance(t1, t2) {
    const dx = t1.clientX - t2.clientX;
    const dy = t1.clientY - t2.clientY;
    return Math.hypot(dx, dy);
  }

  // ===== TOUCH START =====
  function onTouchStart(e) {
    e.stopPropagation();

    if (e.touches.length === 2) {
      // Pinch zoom start
      isPinching = true;
      pinchStartDist = getDistance(e.touches[0], e.touches[1]);
      pinchStartScale = scale;
      isSwiping = false;
      return;
    }

    if (e.touches.length === 1) {
      const t = e.touches[0];

      // Double-tap detection
      const now = Date.now();
      if (now - lastTapTime < 300) {
        onDoubleTap();
        lastTapTime = 0;
        return;
      }
      lastTapTime = now;

      // If zoomed in — start panning
      if (scale > 1) {
        isPanning = true;
        panStartX = t.clientX;
        panStartY = t.clientY;
        panStartTx = tx;
        panStartTy = ty;
      } else {
        // Otherwise — start swipe
        isSwiping = true;
        swipeStartX = t.clientX;
        swipeStartY = t.clientY;
        swipeDeltaX = 0;
      }
    }

    showUI();
  }

  // ===== TOUCH MOVE =====
  function onTouchMove(e) {
    if (isPinching && e.touches.length === 2) {
      e.preventDefault();
      const dist = getDistance(e.touches[0], e.touches[1]);
      if (pinchStartDist > 0) {
        scale = Math.max(minScale, Math.min(maxScale, (dist / pinchStartDist) * pinchStartScale));
        clampPan();
        applyTransform(false);
        showZoomIndicator();
      }
      return;
    }

    if (isPanning && e.touches.length === 1) {
      e.preventDefault();
      const t = e.touches[0];
      tx = panStartTx + (t.clientX - panStartX);
      ty = panStartTy + (t.clientY - panStartY);
      clampPan();
      applyTransform(false);
      return;
    }

    if (isSwiping && e.touches.length === 1 && scale === 1) {
      const t = e.touches[0];
      swipeDeltaX = t.clientX - swipeStartX;

      // Visual drag feedback
      imgWrap.classList.add('no-transition');
      imgWrap.style.transform = `translateX(${swipeDeltaX}px) scale(1)`;
      imgWrap.style.opacity = String(Math.max(0.4, 1 - Math.abs(swipeDeltaX) / 500));
    }
  }

  // ===== TOUCH END =====
  function onTouchEnd(e) {
    if (e.touches.length === 0) {
      if (isPinching) {
        isPinching = false;

        // Snap back if zoom < 1
        if (scale < 1.05) {
          scale = 1;
          tx = 0;
          ty = 0;
        }
        applyTransform(true);
      }

      if (isPanning) {
        isPanning = false;
      }

      if (isSwiping) {
        isSwiping = false;
        const threshold = 60;

        if (swipeDeltaX > threshold && currentIndex > 0) {
          // Swipe right → previous
          animateSwipeOut('right', () => prev());
        } else if (swipeDeltaX < -threshold && currentIndex < images.length - 1) {
          // Swipe left → next
          animateSwipeOut('left', () => next());
        } else {
          // Snap back
          imgWrap.classList.remove('no-transition');
          imgWrap.style.transform = 'translateX(0) scale(1)';
          imgWrap.style.opacity = '1';
        }
        swipeDeltaX = 0;
      }
    }
  }

  function animateSwipeOut(direction, callback) {
    imgWrap.classList.remove('no-transition');
    imgWrap.style.transition = 'transform 0.28s ease, opacity 0.28s ease';

    const targetX = direction === 'right' ? window.innerWidth : -window.innerWidth;
    imgWrap.style.transform = `translateX(${targetX}px) scale(0.9)`;
    imgWrap.style.opacity = '0';

    setTimeout(() => {
      // Reset to center instantly
      imgWrap.classList.add('no-transition');
      imgWrap.style.transform = 'translateX(0) scale(1)';
      imgWrap.style.opacity = '1';

      callback();

      // Remove no-transition after next frame
      requestAnimationFrame(() => {
        imgWrap.classList.remove('no-transition');
        imgWrap.style.transition = '';
      });
    }, 280);
  }

  // ===== MOUSE (DESKTOP) =====
  function onMouseDown(e) {
    if (scale > 1) {
      isPanning = true;
      panStartX = e.clientX;
      panStartY = e.clientY;
      panStartTx = tx;
      panStartTy = ty;
      stageEl.classList.add('grabbing');
    } else {
      isSwiping = true;
      swipeStartX = e.clientX;
      swipeStartY = e.clientY;
      swipeDeltaX = 0;
    }
  }

  function onMouseMove(e) {
    if (isPanning) {
      tx = panStartTx + (e.clientX - panStartX);
      ty = panStartTy + (e.clientY - panStartY);
      clampPan();
      applyTransform(false);
    } else if (isSwiping) {
      swipeDeltaX = e.clientX - swipeStartX;
      imgWrap.classList.add('no-transition');
      imgWrap.style.transform = `translateX(${swipeDeltaX}px) scale(1)`;
      imgWrap.style.opacity = String(Math.max(0.4, 1 - Math.abs(swipeDeltaX) / 500));
    }
  }

  function onMouseUp() {
    stageEl.classList.remove('grabbing');

    if (isPanning) {
      isPanning = false;
    }

    if (isSwiping) {
      isSwiping = false;
      const threshold = 60;
      if (swipeDeltaX > threshold && currentIndex > 0) {
        animateSwipeOut('right', () => prev());
      } else if (swipeDeltaX < -threshold && currentIndex < images.length - 1) {
        animateSwipeOut('left', () => next());
      } else {
        imgWrap.classList.remove('no-transition');
        imgWrap.style.transform = 'translateX(0) scale(1)';
        imgWrap.style.opacity = '1';
      }
      swipeDeltaX = 0;
    }
  }

  // ===== WHEEL ZOOM (desktop) =====
  function onWheel(e) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.15 : 0.15;
    scale = Math.max(minScale, Math.min(maxScale, scale + delta));
    if (scale <= 1) {
      tx = 0;
      ty = 0;
    } else {
      clampPan();
    }
    applyTransform(false);
    showZoomIndicator();
  }

  // ===== DOUBLE TAP / CLICK =====
  function onDoubleTap() {
    if (scale > 1) {
      scale = 1;
      tx = 0;
      ty = 0;
    } else {
      scale = 2.5;
      tx = 0;
      ty = 0;
    }
    applyTransform(true);
    showZoomIndicator();
  }

  // ===== KEYBOARD =====
  function onKeyDown(e) {
    if (!viewerEl || !viewerEl.classList.contains('show')) return;

    if (e.key === 'Escape') close();
    if (e.key === 'ArrowRight') next();
    if (e.key === 'ArrowLeft') prev();
    if (e.key === '+' || e.key === '=') {
      scale = Math.min(maxScale, scale + 0.3);
      applyTransform(true);
    }
    if (e.key === '-') {
      scale = Math.max(minScale, scale - 0.3);
      if (scale <= 1) { tx = 0; ty = 0; }
      applyTransform(true);
    }
    if (e.key === '0') resetZoom();
  }

  // =========================================================
  // UI AUTO-HIDE
  // =========================================================
  function showUI() {
    if (!viewerEl) return;
    viewerEl.classList.remove('hide-ui');
    scheduleUIHide();
  }

  function scheduleUIHide() {
    if (uiHideTimer) clearTimeout(uiHideTimer);
    uiHideTimer = setTimeout(() => {
      if (viewerEl && viewerEl.classList.contains('show') && scale <= 1) {
        viewerEl.classList.add('hide-ui');
      }
    }, 3500);
  }

  // =========================================================
  // DELETE
  // =========================================================
  function askDelete() {
    document.getElementById('ivConfirm').classList.add('show');
  }

  function hideConfirm() {
    document.getElementById('ivConfirm').classList.remove('show');
  }

  function confirmDelete() {
    hideConfirm();

    if (images.length === 0) return;

    // Remove from local array
    images.splice(currentIndex, 1);

    // Notify parent
    if (options.onDelete) {
      options.onDelete(currentIndex);
    }

    if (images.length === 0) {
      close();
      return;
    }

    // Adjust index
    if (currentIndex >= images.length) {
      currentIndex = images.length - 1;
    }

    loadImage(currentIndex);
    showToast('Image deleted');
  }

  // =========================================================
  // DOWNLOAD
  // =========================================================
  function downloadCurrent() {
    if (images.length === 0) return;
    const src = images[currentIndex];

    const a = document.createElement('a');
    a.href = src;
    a.download = `image_${currentIndex + 1}_${Date.now()}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    showToast('Downloaded');
  }

  // =========================================================
  // EDIT (placeholder — hook for future)
  // =========================================================
  function editCurrent() {
    if (images.length === 0) return;

    // This is a hook — you can integrate an editor here
    if (options.onEdit) {
      options.onEdit(currentIndex, images[currentIndex]);
    } else {
      showToast('Edit coming soon');
    }
  }

  // =========================================================
  // ROTATE
  // =========================================================
  let rotation = 0;

  function rotateCurrent() {
    rotation = (rotation + 90) % 360;
    imgEl.style.transition = 'transform 0.3s ease';
    imgEl.style.transform = `rotate(${rotation}deg)`;
  }

  // =========================================================
  // TOAST
  // =========================================================
  function showToast(text) {
    const toast = document.getElementById('ivToast');
    const txt   = document.getElementById('ivToastText');
    if (!toast) return;

    txt.textContent = text;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 1600);
  }

  // =========================================================
  // PUBLIC API
  // =========================================================
  return {
    open,
    close,
    next,
    prev,
    get index() { return currentIndex; },
    get images() { return [...images]; }
  };
})();