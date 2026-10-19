// =========================================================
// ALBUMS PAGE — Folder-based Image Manager
// =========================================================

const MAX_PER_ALBUM = 100;

// ===== Elements =====
const albumsGrid = document.getElementById('albumsGrid');
const albumsEmpty = document.getElementById('albumsEmpty');
const albumCountText = document.getElementById('albumCountText');
const newAlbumBtn = document.getElementById('newAlbumBtn');
const emptyCreateBtn = document.getElementById('emptyCreateBtn');

const albumModal = document.getElementById('albumModal');
const albumNameInput = document.getElementById('albumNameInput');
const modalCancelBtn = document.getElementById('modalCancelBtn');
const modalCreateBtn = document.getElementById('modalCreateBtn');

const albumViewer = document.getElementById('albumViewer');
const viewerBackBtn = document.getElementById('viewerBackBtn');
const viewerAlbumName = document.getElementById('viewerAlbumName');
const viewerAlbumCount = document.getElementById('viewerAlbumCount');
const viewerBody = document.getElementById('viewerBody');
const viewerAddBtn = document.getElementById('viewerAddBtn');
const albumImageInput = document.getElementById('albumImageInput');

// ===== State =====
let albums = [];              // [{ id, name, images: [url, ...], createdAt }]
let currentAlbumId = null;    // album currently open in viewer

// =========================================================
// Supabase Upload Helper
// =========================================================
async function uploadToSupabase(file) {
  const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
  
  const { data, error } = await window.supabaseClient.storage
    .from('images')
    .upload(fileName, file);

  if (error) {
    console.error('Upload error:', error);
    throw error;
  }

  const { data: publicUrlData } = window.supabaseClient.storage
    .from('images')
    .getPublicUrl(fileName);

  return publicUrlData.publicUrl;
}

// =========================================================
// STORAGE
// =========================================================
function saveAlbums() {
  try {
    localStorage.setItem('galleryAlbums', JSON.stringify(albums));
  } catch (err) {
    console.warn('Storage full', err);
    alert('Storage is full! Some images may not be saved.');
  }
}

function loadAlbums() {
  try {
    const raw = localStorage.getItem('galleryAlbums');
    albums = raw ? JSON.parse(raw) : [];
  } catch (err) {
    albums = [];
  }
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

  loadAlbums();
  renderAlbums();
});

// =========================================================
// RENDER — Albums Grid
// =========================================================
function renderAlbums() {
  albumsGrid.innerHTML = '';

  if (albums.length === 0) {
    albumsEmpty.classList.remove('hidden');
    albumsGrid.style.display = 'none';
    albumCountText.textContent = '0 albums';
    return;
  }

  albumsEmpty.classList.add('hidden');
  albumsGrid.style.display = 'grid';
  albumCountText.textContent = `${albums.length} ${albums.length === 1 ? 'album' : 'albums'}`;

  albums.forEach(album => {
    const card = document.createElement('div');
    card.className = 'album-card';

    // ===== Preview =====
    const preview = document.createElement('div');
    preview.className = 'album-preview';

    if (album.images.length > 0) {
      const img = document.createElement('img');
      img.src = album.images[album.images.length - 1]; // latest image as cover
      img.alt = album.name;
      img.draggable = false;
      preview.appendChild(img);
    } else {
      preview.innerHTML = `
        <svg class="placeholder-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
        </svg>
      `;
    }

    // ===== Count badge =====
    const badge = document.createElement('div');
    badge.className = 'album-count-badge';
    badge.textContent = `${album.images.length} / ${MAX_PER_ALBUM}`;
    preview.appendChild(badge);

    // ===== Delete album button =====
    const delBtn = document.createElement('button');
    delBtn.className = 'album-delete-btn';
    delBtn.setAttribute('aria-label', 'Delete album');
    delBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    `;
    delBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteAlbum(album.id);
    });
    preview.appendChild(delBtn);

    // ===== Footer =====
    const footer = document.createElement('div');
    footer.className = 'album-footer';
    footer.innerHTML = `
      <div class="album-name">${escapeHtml(album.name)}</div>
      <div class="album-meta">${album.images.length} images</div>
    `;

    card.appendChild(preview);
    card.appendChild(footer);

    card.addEventListener('click', () => openAlbumViewer(album.id));

    albumsGrid.appendChild(card);
  });
}

// =========================================================
// CREATE ALBUM
// =========================================================
function openCreateModal() {
  albumNameInput.value = '';
  albumModal.classList.add('show');
  setTimeout(() => albumNameInput.focus(), 100);
}

function closeCreateModal() {
  albumModal.classList.remove('show');
}

newAlbumBtn.addEventListener('click', openCreateModal);
emptyCreateBtn.addEventListener('click', openCreateModal);
modalCancelBtn.addEventListener('click', closeCreateModal);

albumModal.addEventListener('click', (e) => {
  if (e.target === albumModal) closeCreateModal();
});

albumNameInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    createAlbum();
  }
  if (e.key === 'Escape') closeCreateModal();
});

modalCreateBtn.addEventListener('click', createAlbum);

function createAlbum() {
  const name = albumNameInput.value.trim();
  if (!name) {
    albumNameInput.focus();
    return;
  }

  const newAlbum = {
    id: 'album_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
    name: name,
    images: [],
    createdAt: new Date().toISOString()
  };

  albums.push(newAlbum);
  saveAlbums();
  renderAlbums();
  closeCreateModal();
}

// =========================================================
// DELETE ALBUM
// =========================================================
function deleteAlbum(id) {
  const album = albums.find(a => a.id === id);
  if (!album) return;

  if (!confirm(`Delete album "${album.name}" and all ${album.images.length} images?`)) return;

  albums = albums.filter(a => a.id !== id);
  saveAlbums();
  renderAlbums();

  if (currentAlbumId === id) {
    closeAlbumViewer();
  }
}

// =========================================================
// ALBUM VIEWER
// =========================================================
function openAlbumViewer(id) {
  const album = albums.find(a => a.id === id);
  if (!album) return;

  currentAlbumId = id;
  viewerAlbumName.textContent = album.name;
  viewerAlbumCount.textContent = `${album.images.length} / ${MAX_PER_ALBUM} images`;

  renderViewerImages(album);
  albumViewer.classList.add('show');
}

function closeAlbumViewer() {
  albumViewer.classList.remove('show');
  currentAlbumId = null;
  renderAlbums(); 
}

viewerBackBtn.addEventListener('click', closeAlbumViewer);

function renderViewerImages(album) {
  viewerBody.innerHTML = '';

  if (album.images.length === 0) {
    viewerBody.innerHTML = `
      <div class="viewer-empty">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          <circle cx="8.5" cy="8.5" r="1.5"></circle>
          <polyline points="21 15 16 10 5 21"></polyline>
        </svg>
        <p>No images in this album yet</p>
      </div>
    `;
    return;
  }

  album.images.forEach((src, index) => {
    const tile = document.createElement('div');
    tile.className = 'viewer-img';
    tile.style.cursor = 'pointer';
    tile.style.position = 'relative';
    tile.style.zIndex = '1';

    const img = document.createElement('img');
    img.src = src;
    img.alt = `${album.name} - ${index + 1}`;
    img.draggable = false;
    img.style.pointerEvents = 'none';   
    img.style.userSelect = 'none';
    img.style.webkitUserDrag = 'none';

    tile.appendChild(img);

    tile.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      openImageViewer(album.id, index);
    });

    tile.addEventListener('touchend', function (e) {
      if (e.cancelable) e.preventDefault();
      e.stopPropagation();
      openImageViewer(album.id, index);
    }, { passive: false });

    viewerBody.appendChild(tile);
  });
}

// =========================================================
// DELETE IMAGE FROM ALBUM
// =========================================================
function deleteImageFromAlbum(albumId, index) {
  const album = albums.find(a => a.id === albumId);
  if (!album) return;

  if (!confirm('Delete this image?')) return;

  album.images.splice(index, 1);
  saveAlbums();

  viewerAlbumCount.textContent = `${album.images.length} / ${MAX_PER_ALBUM} images`;
  renderViewerImages(album);
}

// =========================================================
// ADD IMAGES TO ALBUM
// =========================================================
viewerAddBtn.addEventListener('click', () => albumImageInput.click());

albumImageInput.addEventListener('change', async (e) => {
  const files = Array.from(e.target.files).filter(f => f.type.startsWith('image/'));
  if (files.length === 0) return;

  const originalBtnHTML = viewerAddBtn.innerHTML;
  viewerAddBtn.innerHTML = `<span style="font-size:12px; color:white;">...</span>`;

  const newImageUrls = [];
  for (const file of files) {
    try {
      const imageUrl = await uploadToSupabase(file);
      newImageUrls.push(imageUrl);
    } catch (err) { alert('কিছু ছবি আপলোড হয়নি!'); }
  }
  
  distributeImages(newImageUrls);
  saveAlbums();

  if (currentAlbumId) {
    const album = albums.find(a => a.id === currentAlbumId);
    if (album) {
      viewerAlbumCount.textContent = `${album.images.length} / ${MAX_PER_ALBUM} images`;
      renderViewerImages(album);
    }
  }
  
  renderAlbums();
  albumImageInput.value = '';
  
  viewerAddBtn.innerHTML = originalBtnHTML;
});

function distributeImages(dataUrls) {
  if (albums.length === 0) {
    albums.push({
      id: 'album_' + Date.now() + '_auto',
      name: 'Auto Album',
      images: [],
      createdAt: new Date().toISOString()
    });
  }

  let queue = [...dataUrls];
  let safety = 0;

  const startIdx = currentAlbumId
    ? albums.findIndex(a => a.id === currentAlbumId)
    : 0;

  let idx = startIdx < 0 ? 0 : startIdx;

  while (queue.length > 0 && safety < 1000) {
    safety++;
    const album = albums[idx];

    const space = MAX_PER_ALBUM - album.images.length;
    if (space > 0) {
      const take = Math.min(space, queue.length);
      album.images.push(...queue.splice(0, take));
    }

    if (album.images.length >= MAX_PER_ALBUM) {
      idx++;

      if (idx >= albums.length) {
        if (queue.length > 0) {
          albums.push({
            id: 'album_' + Date.now() + '_' + albums.length,
            name: 'Album ' + (albums.length + 1),
            images: [],
            createdAt: new Date().toISOString()
          });
        } else {
          break;
        }
      }
    } else {
      if (queue.length === 0) break;
      idx++;
      if (idx >= albums.length) {
        albums.push({
          id: 'album_' + Date.now() + '_' + albums.length,
          name: 'Album ' + (albums.length + 1),
          images: [],
          createdAt: new Date().toISOString()
        });
      }
    }
  }
}

// =========================================================
// FULL-SCREEN VIEWER (integration)
// =========================================================
function openImageViewer(albumId, startIndex = 0) {
  const album = albums.find(a => a.id === albumId);
  if (!album || album.images.length === 0) return;

  ImageViewer.open(album.images, startIndex, {
    onDelete: (index) => {
      album.images.splice(index, 1);
      saveAlbums();
      viewerAlbumCount.textContent = `${album.images.length} / ${MAX_PER_ALBUM} images`;
      renderViewerImages(album);
      renderAlbums();
    },
    onUpdate: () => {
      renderViewerImages(album);
      renderAlbums();
    },
    onEdit: (index, src) => {
      console.log('Edit requested for image', index);
    }
  });
}

// =========================================================
// HELPERS
// =========================================================
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}