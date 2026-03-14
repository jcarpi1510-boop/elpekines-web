// --- Configuración e Integración ---
const IMAGEKIT_PUBLIC_KEY = 'public_vBNo27Y5W/8jRCH6s9V2K71hPqY=';
const IMAGEKIT_URL_ENDPOINT = 'https://ik.imagekit.io/elpekines';

const imagekit = new ImageKit({
    publicKey: IMAGEKIT_PUBLIC_KEY,
    urlEndpoint: IMAGEKIT_URL_ENDPOINT,
    authenticationEndpoint: '/api/admin?action=auth&password=' + encodeURIComponent(localStorage.getItem('adminPass'))
});

// --- Elementos del Interfaz ---
const loginOverlay = document.getElementById('loginOverlay');
const adminContent = document.getElementById('adminContent');
const loginForm = document.getElementById('loginForm');
const btnLogout = document.getElementById('btnLogout');

const galleryGrid = document.getElementById('galleryAdminGrid');
const uploadForm = document.getElementById('uploadForm');
const fileInput = document.getElementById('imageFile');
const previewImg = document.getElementById('imagePreview');
const dropZoneContent = document.getElementById('dropZoneContent');
const btnUpload = document.getElementById('btnUpload');
const uploadLoader = document.getElementById('uploadLoader');
const btnText = document.getElementById('btnText');
const toastEl = document.getElementById('toast');
const toastMsg = document.getElementById('toastMsg');

// --- Control de Sesión ---
document.addEventListener('DOMContentLoaded', () => {
    const savedPass = localStorage.getItem('adminPass');
    if (savedPass) {
        checkSession(savedPass);
    }
});

async function checkSession(pass) {
    try {
        const res = await fetch(`/api/admin?action=list&password=${encodeURIComponent(pass)}`);
        if (res.ok) {
            handleAuthState(true);
            const files = await res.json();
            renderGallery(files);
        } else {
            handleAuthState(false);
        }
    } catch (err) {
        handleAuthState(false);
    }
}

function handleAuthState(isAuth) {
    if (isAuth) {
        loginOverlay.classList.add('hidden');
        adminContent.classList.remove('hidden');
    } else {
        loginOverlay.classList.remove('hidden');
        adminContent.classList.add('hidden');
        localStorage.removeItem('adminPass');
    }
}

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const pass = document.getElementById('adminPassword').value;
    const loader = document.getElementById('loginLoader');
    const btn = document.getElementById('btnLogin');

    btn.disabled = true;
    loader.classList.remove('hidden');

    try {
        const res = await fetch(`/api/admin?action=list&password=${encodeURIComponent(pass)}`);
        if (res.ok) {
            localStorage.setItem('adminPass', pass);
            showToast('Acceso premiun concedido ✨');
            handleAuthState(true);
            const files = await res.json();
            renderGallery(files);
        } else {
            showToast('Identificación incorrecta', 'error');
        }
    } catch (err) {
        showToast('Error de conexión', 'error');
    } finally {
        btn.disabled = false;
        loader.classList.add('hidden');
    }
});

btnLogout.addEventListener('click', () => {
    handleAuthState(false);
    showToast('Sesión finalizada con éxito');
});

// --- Gestión de la Galería (UI Logic) ---

async function fetchGallery() {
    const pass = localStorage.getItem('adminPass');
    if (!pass) return;

    // Loading Skeletons
    galleryGrid.innerHTML = `
        <div class="admin-card skeleton" style="height: 340px;"></div>
        <div class="admin-card skeleton" style="height: 340px;"></div>
        <div class="admin-card skeleton" style="height: 340px;"></div>
    `;
    
    try {
        const res = await fetch(`/api/admin?action=list&password=${encodeURIComponent(pass)}`);
        if (res.ok) {
            const files = await res.json();
            renderGallery(files);
        }
    } catch (err) {
        showToast('Error al sincronizar galería', 'error');
    }
}

function renderGallery(items) {
    galleryGrid.innerHTML = '';
    
    if (items.length === 0) {
        galleryGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #6B7280;">No hay imágenes cargadas en el sistema todavía.</div>';
        return;
    }

    items.forEach(item => {
        const isActive = item.tags && item.tags.includes('active');
        const card = document.createElement('div');
        card.className = 'admin-card';
        card.innerHTML = `
            <div class="card-image">
                <img src="${item.url}?tr=w-500,h-400,fo-auto" alt="${item.name}" loading="lazy">
                <div class="img-overlay">
                    <span class="badge-tag ${isActive ? 'tag-active' : 'tag-inactive'}">
                        ${isActive ? 'Activa' : 'Oculta'}
                    </span>
                </div>
            </div>
            <div class="card-body">
                <strong class="dog-name">${item.name.replace(/\.[^/.]+$/, "").split('_')[1] || item.name}</strong>
                <div class="action-row">
                    <button onclick="toggleStatus('${item.fileId}', ${isActive})" class="btn-sm btn-toggle" title="Cambiar visibilidad">
                        <i class="fa-solid ${isActive ? 'fa-eye-slash' : 'fa-eye'}"></i>
                        ${isActive ? 'Ocultar' : 'Mostrar'}
                    </button>
                    <button onclick="deleteImage('${item.fileId}')" class="btn-sm btn-delete" title="Borrar permanentemente">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
            </div>
        `;
        galleryGrid.appendChild(card);
    });
}

// Subida Boutique
uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const file = fileInput.files[0];
    const pass = localStorage.getItem('adminPass');

    if (!file || !pass) return;

    setLoading(true);
    imagekit.options.authenticationEndpoint = '/api/admin?action=auth&password=' + encodeURIComponent(pass);

    imagekit.upload({
        file: file,
        fileName: `${Date.now()}_${file.name}`,
        folder: '/galeria-perritos',
        tags: ['active']
    }, (err, result) => {
        setLoading(false);
        if (err) {
            showToast('Falla en la subida a ImageKit', 'error');
            return;
        }
        showToast('¡Imagen integrada con éxito! ✨');
        resetForm();
        fetchGallery();
    });
});

async function toggleStatus(fileId, currentIsActive) {
    const pass = localStorage.getItem('adminPass');
    const newTags = currentIsActive ? ['inactive'] : ['active'];

    const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            action: 'toggle',
            password: pass,
            fileId: fileId,
            tags: newTags
        })
    });

    if (res.ok) {
        showToast('Estado de visibilidad actualizado');
        fetchGallery();
    } else {
        showToast('No se pudo procesar la acción', 'error');
    }
}

async function deleteImage(fileId) {
    if (!confirm('¿Seguro que desea eliminar esta fotografía permanentemente?')) return;

    const pass = localStorage.getItem('adminPass');
    const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            action: 'delete',
            password: pass,
            fileId: fileId
        })
    });

    if (res.ok) {
        showToast('Imagen eliminada definitivamente');
        fetchGallery();
    } else {
        showToast('Error al intentar eliminar', 'error');
    }
}

// Visual Utilities
fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            previewImg.src = e.target.result;
            previewImg.classList.remove('hidden');
            dropZoneContent.classList.add('hidden');
        };
        reader.readAsDataURL(file);
    }
});

function setLoading(is) {
    btnUpload.disabled = is;
    uploadLoader.classList.toggle('hidden', !is);
    btnText.textContent = is ? 'Publicando...' : 'Publicar en galería';
}

function resetForm() {
    uploadForm.reset();
    previewImg.classList.add('hidden');
    dropZoneContent.classList.remove('hidden');
}

function showToast(msg, type = 'success') {
    toastMsg.textContent = msg;
    toastEl.style.background = type === 'error' ? '#EF4444' : 'var(--brand-ink)';
    toastEl.classList.add('show');
    setTimeout(() => toastEl.classList.remove('show'), 4000);
}
