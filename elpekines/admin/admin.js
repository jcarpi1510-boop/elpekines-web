// --- CONFIGURACIÓN E IDENTIDAD ---
const IMAGEKIT_PUBLIC_KEY = 'public_vBNo27Y5W/8jRCH6s9V2K71hPqY=';
const IMAGEKIT_URL_ENDPOINT = 'https://ik.imagekit.io/elpekines';

const imagekit = new ImageKit({
    publicKey: IMAGEKIT_PUBLIC_KEY,
    urlEndpoint: IMAGEKIT_URL_ENDPOINT,
    authenticationEndpoint: '/api/admin?action=auth&password=' + encodeURIComponent(localStorage.getItem('adminPass'))
});

// --- ELEMENTOS DEL DOM ---
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

// --- INICIALIZACIÓN ---
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
    showToast('Sesión cerrada con éxito');
});

// --- GESTIÓN DE GALERÍA ---

async function fetchGallery() {
    const pass = localStorage.getItem('adminPass');
    if (!pass) return;

    // Show luxury skeleton states
    galleryGrid.innerHTML = `
        <div class="skeleton-card"></div>
        <div class="skeleton-card"></div>
        <div class="skeleton-card"></div>
    `;
    
    try {
        const res = await fetch(`/api/admin?action=list&password=${encodeURIComponent(pass)}`);
        if (res.ok) {
            const files = await res.json();
            renderGallery(files);
        }
    } catch (err) {
        showToast('Error al actualizar la vista', 'error');
    }
}

function renderGallery(items) {
    galleryGrid.innerHTML = '';
    
    if (items.length === 0) {
        galleryGrid.innerHTML = '<div class="admin-header"><p>Su catálogo está vacío actualmente.</p></div>';
        return;
    }

    items.forEach(item => {
        const isActive = item.tags && item.tags.includes('active');
        const card = document.createElement('div');
        card.className = 'admin-img-card';
        card.innerHTML = `
            <div class="img-container">
                <img src="${item.url}?tr=w-400,h-400,fo-auto" alt="${item.name}" loading="lazy">
                <span class="status-badge ${isActive ? 'status-active' : 'status-inactive'}">
                    ${isActive ? 'Activa' : 'Oculta'}
                </span>
            </div>
            <div class="card-info">
                <strong>${item.name.replace(/\.[^/.]+$/, "").slice(-15)}</strong>
                <div class="action-btns">
                    <button onclick="toggleStatus('${item.fileId}', ${isActive})" class="btn-action btn-toggle ${isActive ? 'active' : ''}" title="Alternar Estado">
                        <i class="fa-solid ${isActive ? 'fa-eye' : 'fa-eye-slash'}"></i> 
                        ${isActive ? 'Ocultar' : 'Mostrar'}
                    </button>
                    <button onclick="deleteImage('${item.fileId}')" class="btn-action btn-delete" title="Eliminar definitivamente">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
            </div>
        `;
        galleryGrid.appendChild(card);
    });
}

// Subida de archivos (Secure Bridge)
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
            showToast('La subida ha fallado', 'error');
            return;
        }
        showToast('¡Obra integrada con éxito! ✨');
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
        showToast('No se pudo procesar el cambio', 'error');
    }
}

async function deleteImage(fileId) {
    if (!confirm('¿Confirma que desea eliminar permanentemente esta imagen de su catálogo boutique?')) return;

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
        showToast('No se pudo completar la eliminación', 'error');
    }
}

// Preview Logic
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
    btnText.textContent = is ? 'Publicando...' : 'Publicar en Galería';
}

function resetForm() {
    uploadForm.reset();
    previewImg.classList.add('hidden');
    dropZoneContent.classList.remove('hidden');
}

function showToast(msg, type = 'success') {
    toastMsg.textContent = msg;
    toastEl.style.background = type === 'error' ? '#ef4444' : 'var(--luxury-primary)';
    toastEl.classList.add('show');
    setTimeout(() => toastEl.classList.remove('show'), 4000);
}
