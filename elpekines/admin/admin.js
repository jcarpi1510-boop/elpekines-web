// --- Configuración e Integración Boutique ---
const IMAGEKIT_PUBLIC_KEY = 'public_vBNo27Y5W/8jRCH6s9V2K71hPqY=';
const IMAGEKIT_URL_ENDPOINT = 'https://ik.imagekit.io/elpekines';

let currentPassword = localStorage.getItem('adminPass') || '';

const imagekit = new ImageKit({
    publicKey: IMAGEKIT_PUBLIC_KEY,
    urlEndpoint: IMAGEKIT_URL_ENDPOINT,
    authenticationEndpoint: '/api/admin?action=auth&password=' + encodeURIComponent(currentPassword)
});

// --- Elementos Dashboard ---
const loginOverlay = document.getElementById('loginOverlay');
const adminContent = document.getElementById('adminContent');
const loginForm = document.getElementById('adminLoginForm');
const btnLogout = document.getElementById('btnLogout');

const galleryGrid = document.getElementById('galleryAdminGrid');
const servicesContainer = document.getElementById('servicesEditorContainer');
const uploadForm = document.getElementById('uploadForm');
const fileInput = document.getElementById('imageFile');
const previewImg = document.getElementById('imagePreview');
const btnUpload = document.getElementById('btnUpload');
const uploadLoader = document.getElementById('uploadLoader');

// --- Control de Sesión ---
document.addEventListener('DOMContentLoaded', () => {
    if (currentPassword) checkSession(currentPassword);
    if (loginForm) loginForm.addEventListener('submit', handleLoginAttempt);
});

async function handleLoginAttempt(e) {
    if (e) e.preventDefault();
    const pass = document.getElementById('adminPassInput').value;
    if (!pass) return;

    setLoginLoading(true);
    try {
        const res = await fetch(`/api/admin?action=list&password=${encodeURIComponent(pass)}`);
        const data = await res.json();
        
        if (res.ok) {
            localStorage.setItem('adminPass', pass);
            currentPassword = pass;
            showToast('Acceso premiun concedido ✨');
            handleAuthState(true);
            refreshAllData(data);
        } else {
            showToast(data.error || 'Contraseña incorrecta', 'error');
        }
    } catch (err) {
        showToast('Error de conexión', 'error');
    } finally {
        setLoginLoading(false);
    }
}

async function checkSession(pass) {
    try {
        const res = await fetch(`/api/admin?action=list&password=${encodeURIComponent(pass)}`);
        if (res.ok) {
            handleAuthState(true);
            const data = await res.json();
            refreshAllData(data);
        } else {
            handleAuthState(false);
        }
    } catch (err) { handleAuthState(false); }
}

function handleAuthState(isAuth) {
    loginOverlay.classList.toggle('hidden', isAuth);
    adminContent.classList.toggle('hidden', !isAuth);
    if (!isAuth) localStorage.removeItem('adminPass');
}

btnLogout.addEventListener('click', () => { handleAuthState(false); showToast('Sesión finalizada'); });

// --- TABS ---
function switchTab(tabId) {
    document.getElementById('galleryTab').classList.toggle('hidden', tabId !== 'galleryTab');
    document.getElementById('servicesTab').classList.toggle('hidden', tabId !== 'servicesTab');
    
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.onclick.toString().includes(tabId));
    });
}

// --- DATOS ---

async function refreshAllData(preloadedFiles = null) {
    const files = preloadedFiles || await fetchFiles();
    if (!files) return;
    renderGallery(files.filter(f => f.tags && f.tags.includes('active')));
    renderServices(files);
}

async function fetchFiles() {
    try {
        const res = await fetch(`/api/admin?action=list&password=${encodeURIComponent(currentPassword)}`);
        return res.ok ? await res.json() : null;
    } catch (err) { return null; }
}

// --- RENDER GALERÍA ---
function renderGallery(items) {
    galleryGrid.innerHTML = '';
    if (!items.length) { galleryGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 40px;">No hay fotos activas.</p>'; return; }

    items.forEach(item => {
        const card = document.createElement('div');
        card.className = 'admin-card';
        card.innerHTML = `
            <div class="card-image">
                <img src="${item.url}?tr=w-500,h-400,fo-auto" alt="${item.name}">
                <span class="badge-tag tag-active">Activa</span>
            </div>
            <div class="card-body">
                <strong class="dog-name">${item.name.split('_')[1] || item.name}</strong>
                <div class="action-row">
                    <button onclick="deleteImage('${item.fileId}')" class="btn-sm btn-delete"><i class="fa-solid fa-trash-can"></i> Eliminar</button>
                </div>
            </div>
        `;
        galleryGrid.appendChild(card);
    });
}

// --- RENDER SERVICIOS ---
function renderServices(files) {
    servicesContainer.innerHTML = '';
    
    [1, 2, 3].forEach(num => {
        const file = files.find(f => f.tags && f.tags.includes(`service_${num}`));
        const card = document.createElement('div');
        card.className = 'service-editor-card';
        
        const defTitle = num === 1 ? 'Veterinaria' : (num === 2 ? 'Vacunación' : 'Peluquería');
        const title = file?.customMetadata?.title || defTitle;
        const desc = file?.customMetadata?.description || 'Descripción del servicio...';
        const imgUrl = file?.url || '../Logo.png';

        card.innerHTML = `
            <h4 style="margin-bottom: 15px; color: var(--brand-gold);">Slot #${num}: ${defTitle}</h4>
            <div class="form-group">
                <label>Foto del Servicio</label>
                <img src="${imgUrl}" class="service-img-preview-mini" id="serviceImg_${num}" onclick="triggerServiceFile(${num})">
                <input type="file" id="serviceFileInput_${num}" style="display:none" onchange="handleServiceFile(${num})">
            </div>
            <div class="form-group">
                <label>Título Boutique</label>
                <input type="text" id="serviceTitle_${num}" value="${title}" placeholder="Ej: Peluquería Canina Premium">
            </div>
            <div class="form-group">
                <label>Descripción corta</label>
                <textarea id="serviceDesc_${num}" rows="3" placeholder="Describe el servicio...">${desc}</textarea>
            </div>
            <button class="btn-gold" onclick="saveService(${num}, '${file?.fileId || ''}')" id="btnSaveService_${num}">
                <span>Guardar Cambios</span>
            </button>
        `;
        servicesContainer.appendChild(card);
    });
}

// --- ACCIONES SERVICIOS ---
function triggerServiceFile(num) { document.getElementById(`serviceFileInput_${num}`).click(); }

function handleServiceFile(num) {
    const file = document.getElementById(`serviceFileInput_${num}`).files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => document.getElementById(`serviceImg_${num}`).src = e.target.result;
        reader.readAsDataURL(file);
    }
}

async function saveService(num, oldFileId) {
    const btn = document.getElementById(`btnSaveService_${num}`);
    const title = document.getElementById(`serviceTitle_${num}`).value;
    const desc = document.getElementById(`serviceDesc_${num}`).value;
    const file = document.getElementById(`serviceFileInput_${num}`).files[0];

    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Guardando...';

    try {
        // Si hay una foto nueva, la subimos primero y borramos la vieja
        let finalFileId = oldFileId;
        if (file) {
            const uploadRes = await imagekit.upload({
                file: file,
                fileName: `service_${num}_${Date.now()}`,
                folder: '/galeria-perritos',
                tags: [`service_${num}`],
                customMetadata: { title, description: desc }
            });
            finalFileId = uploadRes.fileId;
            // Borrar foto vieja si existe
            if (oldFileId) await fetch(`/api/admin?action=delete&password=${encodeURIComponent(currentPassword)}&fileId=${oldFileId}`);
        } else if (oldFileId) {
            // Solo actualizar texto
            await fetch('/api/admin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    action: 'update', 
                    password: currentPassword, 
                    fileId: oldFileId, 
                    tags: [`service_${num}`],
                    customMetadata: { title, description: desc }
                })
            });
        }
        
        showToast('Servicio actualizado con éxito ✨');
        refreshAllData();
    } catch (err) {
        showToast('Error al guardar', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<span>Guardar Cambios</span>';
    }
}

// --- SUBIDA GALERÍA ---
uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const file = fileInput.files[0];
    if (!file) return;

    setLoading(true);
    imagekit.options.authenticationEndpoint = `/api/admin?action=auth&password=${encodeURIComponent(currentPassword)}`;

    imagekit.upload({
        file: file,
        fileName: `${Date.now()}_${file.name}`,
        folder: '/galeria-perritos',
        tags: ['active']
    }, (err) => {
        setLoading(false);
        if (err) return showToast('Error en la subida', 'error');
        showToast('¡Foto publicada! 🐾');
        resetGalleryForm();
        refreshAllData();
    });
});

async function deleteImage(fileId) {
    if (!confirm('¿Eliminar de la galería?')) return;
    const res = await fetch(`/api/admin?action=delete&password=${encodeURIComponent(currentPassword)}&fileId=${fileId}`);
    if (res.ok) { showToast('Foto eliminada'); refreshAllData(); }
}

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            previewImg.src = e.target.result;
            previewImg.classList.remove('hidden');
            document.getElementById('dropZoneContent').classList.add('hidden');
        };
        reader.readAsDataURL(file);
    }
});

// --- UTILS ---
function setLoading(is) {
    btnUpload.disabled = is;
    uploadLoader.classList.toggle('hidden', !is);
    document.getElementById('btnText').textContent = is ? 'Publicando...' : 'Publicar en Galería';
}

function setLoginLoading(is) {
    document.getElementById('btnLogin').disabled = is;
    document.getElementById('loginLoader').classList.toggle('hidden', !is);
    document.getElementById('loginBtnText').textContent = is ? 'Verificando...' : 'Acceder al Panel';
}

function resetGalleryForm() {
    uploadForm.reset();
    previewImg.classList.add('hidden');
    document.getElementById('dropZoneContent').classList.remove('hidden');
}

function showToast(msg, type = 'success') {
    const t = document.getElementById('toast');
    document.getElementById('toastMsg').textContent = msg;
    t.style.background = type === 'error' ? '#EF4444' : 'var(--brand-ink)';
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
}
