// --- Configuración Inicial ---
const IMAGEKIT_PUBLIC_KEY = 'YOUR_IMAGEKIT_PUBLIC_KEY';
const IMAGEKIT_URL_ENDPOINT = 'YOUR_IMAGEKIT_URL_ENDPOINT';

const imagekit = new ImageKit({
    publicKey: IMAGEKIT_PUBLIC_KEY,
    urlEndpoint: IMAGEKIT_URL_ENDPOINT,
    authenticationEndpoint: '/api/admin?action=auth&password=' + encodeURIComponent(localStorage.getItem('adminPass'))
});

// --- Elementos del DOM ---
const loginOverlay = document.getElementById('loginOverlay');
const adminContent = document.getElementById('adminContent');
const loginForm = document.getElementById('loginForm');
const btnLogout = document.getElementById('btnLogout');

const galleryGrid = document.getElementById('galleryAdminGrid');
const uploadForm = document.getElementById('uploadForm');
const fileInput = document.getElementById('imageFile');
const previewImg = document.getElementById('imagePreview');
const dropZoneText = document.querySelector('.drop-zone-text');
const btnUpload = document.getElementById('btnUpload');
const uploadLoader = document.getElementById('uploadLoader');
const btnText = document.getElementById('btnText');

// --- Inicialización ---
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
        console.error(err);
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
    const loginLoader = document.getElementById('loginLoader');
    const btnLogin = document.getElementById('btnLogin');

    btnLogin.disabled = true;
    loginLoader.classList.remove('hidden');

    try {
        const res = await fetch(`/api/admin?action=list&password=${encodeURIComponent(pass)}`);
        if (res.ok) {
            localStorage.setItem('adminPass', pass);
            showToast('Bienvenido, Jesús ✨');
            handleAuthState(true);
            const files = await res.json();
            renderGallery(files);
        } else {
            showToast('Contraseña incorrecta', 'error');
        }
    } catch (err) {
        showToast('Error de conexión', 'error');
    } finally {
        btnLogin.disabled = false;
        loginLoader.classList.add('hidden');
    }
});

btnLogout.addEventListener('click', () => {
    handleAuthState(false);
    showToast('Sesión cerrada');
});

// --- Funciones de Galería ---

async function fetchGallery() {
    const pass = localStorage.getItem('adminPass');
    if (!pass) return;

    galleryGrid.innerHTML = '<div class="admin-skeleton"></div><div class="admin-skeleton"></div>';
    
    const res = await fetch(`/api/admin?action=list&password=${encodeURIComponent(pass)}`);
    if (res.ok) {
        const files = await res.json();
        renderGallery(files);
    }
}

function renderGallery(items) {
    galleryGrid.innerHTML = '';
    
    if (items.length === 0) {
        galleryGrid.innerHTML = '<p>No hay imágenes aún.</p>';
        return;
    }

    items.forEach(item => {
        const isActive = item.tags && item.tags.includes('active');
        const card = document.createElement('div');
        card.className = 'admin-img-card';
        card.innerHTML = `
            <div class="img-container">
                <img src="${item.url}?tr=w-300,h-300" alt="${item.name}">
                <span class="status-badge ${isActive ? 'status-active' : 'status-inactive'}">
                    ${isActive ? 'Activa' : 'Inactiva'}
                </span>
            </div>
            <div class="card-actions">
                <strong>${item.name}</strong>
                <div class="action-btns">
                    <button onclick="toggleStatus('${item.fileId}', ${isActive})" class="btn-icon btn-toggle ${isActive ? 'active' : ''}">
                        <i class="fa-solid ${isActive ? 'fa-eye' : 'fa-eye-slash'}"></i>
                    </button>
                    <button onclick="deleteImage('${item.fileId}')" class="btn-icon btn-delete">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
        galleryGrid.appendChild(card);
    });
}

// Subida de archivos
uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const file = fileInput.files[0];
    const pass = localStorage.getItem('adminPass');

    if (!file || !pass) return;

    setLoading(true);

    // Actualizar endpoint de auth con el pass actual para que el SDK pueda subir
    imagekit.options.authenticationEndpoint = '/api/admin?action=auth&password=' + encodeURIComponent(pass);

    imagekit.upload({
        file: file,
        fileName: `${Date.now()}_${file.name}`,
        folder: '/galeria-perritos',
        tags: ['active'] // Subir como activa por defecto
    }, (err, result) => {
        setLoading(false);
        if (err) {
            showToast('Error al subir', 'error');
            return;
        }
        showToast('¡Subida con éxito! ✨');
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

    if (res.ok) fetchGallery();
    else showToast('No se pudo cambiar el estado', 'error');
}

async function deleteImage(fileId) {
    if (!confirm('¿Eliminar esta imagen para siempre?')) return;

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
        showToast('Imagen eliminada de ImageKit');
        fetchGallery();
    } else {
        showToast('Error al eliminar', 'error');
    }
}

// Utilidades
fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            previewImg.src = e.target.result;
            previewImg.classList.remove('hidden');
            dropZoneText.classList.add('hidden');
        };
        reader.readAsDataURL(file);
    }
});

function setLoading(is) {
    btnUpload.disabled = is;
    uploadLoader.classList.toggle('hidden', !is);
    btnText.textContent = is ? 'Subiendo...' : 'Subir e Integrar';
}

function resetForm() {
    uploadForm.reset();
    previewImg.classList.add('hidden');
    dropZoneText.classList.remove('hidden');
}

function showToast(msg, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.style.background = type === 'error' ? '#ef4444' : '#10b981';
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}
