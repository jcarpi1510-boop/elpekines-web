// --- Configuración e Integración ---
const IMAGEKIT_PUBLIC_KEY = 'public_vBNo27Y5W/8jRCH6s9V2K71hPqY=';
const IMAGEKIT_URL_ENDPOINT = 'https://ik.imagekit.io/elpekines';

let currentPassword = localStorage.getItem('adminPass') || '';

const imagekit = new ImageKit({
    publicKey: IMAGEKIT_PUBLIC_KEY,
    urlEndpoint: IMAGEKIT_URL_ENDPOINT,
    authenticationEndpoint: '/api/admin?action=auth&password=' + encodeURIComponent(currentPassword)
});

// --- Elementos del Interfaz ---
const loginOverlay = document.getElementById('loginOverlay');
const adminContent = document.getElementById('adminContent');
const loginForm = document.getElementById('adminLoginForm'); // ID sincronizado
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
    if (currentPassword) {
        checkSession(currentPassword);
    }
    
    // Vinculación explícita para asegurar captura de Enter y Clic
    if (loginForm) {
        loginForm.addEventListener('submit', handleLoginAttempt);
    }
});

async function handleLoginAttempt(e) {
    if (e) e.preventDefault();
    
    const passInput = document.getElementById('adminPassInput');
    const pass = passInput ? passInput.value : '';
    const loader = document.getElementById('loginLoader');
    const btn = document.getElementById('btnLogin');
    const loginText = document.getElementById('loginBtnText');

    if (!pass) return;

    // Aviso local
    if (window.location.protocol === 'file:') {
        alert("⚠️ ATENCIÓN: Estás en modo local. \n\nSube los cambios a GitHub/Vercel para que la contraseña funcione.");
        return;
    }

    btn.disabled = true;
    loader.classList.remove('hidden');
    loginText.textContent = "Verificando...";

    try {
        const res = await fetch(`/api/admin?action=list&password=${encodeURIComponent(pass)}`);
        const data = await res.json();
        
        if (res.ok) {
            localStorage.setItem('adminPass', pass);
            currentPassword = pass;
            showToast('Acceso premiun concedido ✨');
            handleAuthState(true);
            renderGallery(data);
        } else {
            showToast(data.error || 'Contraseña incorrecta', 'error');
        }
    } catch (err) {
        showToast('Error de conexión con el servidor', 'error');
        console.error("Login error:", err);
    } finally {
        btn.disabled = false;
        loader.classList.add('hidden');
        loginText.textContent = "Acceder al Panel";
    }
}

async function checkSession(pass) {
    if (window.location.protocol === 'file:') return;

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

btnLogout.addEventListener('click', () => {
    handleAuthState(false);
    showToast('Sesión finalizada');
});

// --- Gestión de la Galería ---

async function fetchGallery() {
    if (!currentPassword) return;

    galleryGrid.innerHTML = `
        <div class="admin-card skeleton" style="height: 340px;"></div>
        <div class="admin-card skeleton" style="height: 340px;"></div>
        <div class="admin-card skeleton" style="height: 340px;"></div>
    `;
    
    try {
        const res = await fetch(`/api/admin?action=list&password=${encodeURIComponent(currentPassword)}`);
        if (res.ok) {
            const files = await res.json();
            renderGallery(files);
        }
    } catch (err) {
        showToast('Error al actualizar galería', 'error');
    }
}

function renderGallery(items) {
    galleryGrid.innerHTML = '';
    
    if (!items || items.length === 0) {
        galleryGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #6B7280;">No hay imágenes cargadas.</div>';
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
                <strong class="dog-name">${item.name.split('_')[1] || item.name}</strong>
                <div class="action-row">
                    <button onclick="toggleStatus('${item.fileId}', ${isActive})" class="btn-sm btn-toggle">
                        <i class="fa-solid ${isActive ? 'fa-eye-slash' : 'fa-eye'}"></i>
                        ${isActive ? 'Ocultar' : 'Mostrar'}
                    </button>
                    <button onclick="deleteImage('${item.fileId}')" class="btn-sm btn-delete">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
            </div>
        `;
        galleryGrid.appendChild(card);
    });
}

// Subida
uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const file = fileInput.files[0];
    if (!file || !currentPassword) return;

    setLoading(true);
    imagekit.options.authenticationEndpoint = '/api/admin?action=auth&password=' + encodeURIComponent(currentPassword);

    imagekit.upload({
        file: file,
        fileName: `${Date.now()}_${file.name}`,
        folder: '/galeria-perritos',
        tags: ['active']
    }, (err, result) => {
        setLoading(false);
        if (err) {
            showToast('Error en la subida', 'error');
            return;
        }
        showToast('¡Imagen subida con éxito! ✨');
        resetForm();
        fetchGallery();
    });
});

async function toggleStatus(fileId, currentIsActive) {
    const newTags = currentIsActive ? ['inactive'] : ['active'];
    const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle', password: currentPassword, fileId: fileId, tags: newTags })
    });

    if (res.ok) {
        showToast('Visibilidad actualizada');
        fetchGallery();
    } else {
        showToast('Error en el cambio', 'error');
    }
}

async function deleteImage(fileId) {
    if (!confirm('¿Eliminar permanentemente?')) return;
    const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', password: currentPassword, fileId: fileId })
    });

    if (res.ok) {
        showToast('Eliminada');
        fetchGallery();
    }
}

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
    btnText.textContent = is ? 'Subiendo...' : 'Publicar en galería';
}

function resetForm() {
    uploadForm.reset();
    previewImg.classList.add('hidden');
    dropZoneContent.classList.remove('hidden');
}

function showToast(msg, type = 'success') {
    if (!toastEl || !toastMsg) return;
    toastMsg.textContent = msg;
    toastEl.style.background = type === 'error' ? '#EF4444' : 'var(--brand-ink)';
    toastEl.classList.add('show');
    setTimeout(() => toastEl.classList.remove('show'), 3000);
}
