// --- Configuración e Integración Boutique (Ultra-Robust Edition) ---
console.log("🚀 [SISTEMA] Iniciando Panel Admin V3.1...");
const IMAGEKIT_PUBLIC_KEY = 'public_7/aJSThn/m100WILssPm9pLrwSo=';
const IMAGEKIT_URL_ENDPOINT = 'https://ik.imagekit.io/15vvxh7w1';

let currentPassword = localStorage.getItem('adminPass') || '';
let imagekit = null;

// Inicialización segura de ImageKit
try {
    if (typeof ImageKit !== 'undefined') {
        imagekit = new ImageKit({
            publicKey: IMAGEKIT_PUBLIC_KEY,
            urlEndpoint: IMAGEKIT_URL_ENDPOINT,
            authenticationEndpoint: '/api/admin?action=auth&password=' + encodeURIComponent(currentPassword)
        });
        console.log("✅ ImageKit SDK inicializado");
    } else {
        console.warn("⚠️ SDK de ImageKit no detectado. Las subidas podrían fallar.");
    }
} catch (e) {
    console.error("❌ Error al inicializar ImageKit:", e);
}

// Elementos (Selección diferida para mayor seguridad)
let loginOverlay, adminContent, loginForm, btnLogout, btnLogin;
let galleryGrid, servicesContainer, videosContainer, uploadForm, fileInput, previewImg, btnUpload, uploadLoader;

// --- Robustez Global ---
window.onerror = function(msg, url, line) {
    console.error(`🔴 CRASH ADMIN: ${msg} en ${url}:${line}`);
    // No bloqueamos, pero dejamos registro
    return false; 
};

// --- Control de Sesión ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("🚀 [TRAZA] Iniciando carga de scripts...");
    
    try {
        // Vincular elementos de la UI
        bindElements();
        console.log("✅ [TRAZA] Elementos vinculados correctamente");
        
        // Adjuntar eventos de forma explícita
        if (loginForm) {
            loginForm.addEventListener('submit', handleLoginAttempt);
        }

        if (btnLogout) {
            btnLogout.addEventListener('click', () => {
                handleAuthState(false);
                showToast('Sesión finalizada');
                setTimeout(() => window.location.reload(), 1000);
            });
        }

        if (currentPassword) {
            console.log("🔑 [TRAZA] Sesión previa detectada, validando...");
            checkSession(currentPassword);
        }

    } catch (error) {
        console.error("❌ [TRAZA] Error crítico durante la inicialización:", error);
    } finally {
        // ELIMINAR CARGADOR SIEMPRE (Fail-safe)
        const gLoader = document.getElementById('globalLoader');
        if (gLoader) {
            setTimeout(() => {
                gLoader.classList.add('fade-out');
                setTimeout(() => gLoader.classList.add('hidden'), 500);
            }, 300);
        }
    }
});

function bindElements() {
    try {
        loginOverlay = document.getElementById('loginOverlay');
        adminContent = document.getElementById('adminContent');
        loginForm = document.getElementById('adminLoginForm');
        btnLogout = document.getElementById('btnLogout');
        btnLogin = document.getElementById('btnLogin');

        galleryGrid = document.getElementById('galleryAdminGrid');
        servicesContainer = document.getElementById('servicesEditorContainer');
        videosContainer = document.getElementById('videosEditorContainer');
        uploadForm = document.getElementById('uploadForm');
        fileInput = document.getElementById('imageFile');
        previewImg = document.getElementById('imagePreview');
        btnUpload = document.getElementById('btnUpload');
        uploadLoader = document.getElementById('uploadLoader');
    } catch (e) {
        console.warn("⚠️ Advertencia: Algunos elementos no se encontraron en el DOM", e);
    }
}

async function handleLoginAttempt(e) {
    if (e) e.preventDefault();
    console.log("🎯 Intento de login iniciado...");

    const passInput = document.getElementById('adminPassInput');
    const pass = passInput ? passInput.value : '';
    
    if (!pass) {
        showToast('Por favor ingresa la contraseña', 'error');
        return;
    }

    // Alerta de modo local
    if (window.location.protocol === 'file:') {
        alert("⚠️ MODO LOCAL DETECTADO:\nEl login solo funciona cuando subes los cambios a Vercel/GitHub.");
        return;
    }

    setLoginLoading(true);
    try {
        console.log("📡 Llamando a la API de validación...");
        const res = await fetch(`/api/admin?action=list&password=${encodeURIComponent(pass)}`);
        
        if (res.ok) {
            const data = await res.json();
            localStorage.setItem('adminPass', pass);
            currentPassword = pass;
            
            // Actualizar auth endpoint de ImageKit
            if (imagekit) imagekit.options.authenticationEndpoint = '/api/admin?action=auth&password=' + encodeURIComponent(pass);
            
            showToast('Acceso premiun concedido ✨');
            handleAuthState(true);
            refreshAllData(data);
        } else {
            const errData = await res.json();
            showToast(errData.error || 'Contraseña incorrecta', 'error');
            console.warn("❌ Login rechazado:", errData.error);
        }
    } catch (err) {
        showToast('Falla de red o servidor', 'error');
        console.error("❌ Error en fetch login:", err);
    } finally {
        setLoginLoading(false);
    }
}

async function checkSession(pass) {
    if (window.location.protocol === 'file:') return;
    try {
        const res = await fetch(`/api/admin?action=list&password=${encodeURIComponent(pass)}`);
        if (res.ok) {
            const data = await res.json();
            handleAuthState(true);
            refreshAllData(data);
        } else {
            handleAuthState(false);
        }
    } catch (err) { handleAuthState(false); }
}

function handleAuthState(isAuth) {
    if (loginOverlay) loginOverlay.classList.toggle('hidden', isAuth);
    if (adminContent) adminContent.classList.toggle('hidden', !isAuth);
    if (!isAuth) localStorage.removeItem('adminPass');
}

// --- TABS ---
function switchTab(tabId) {
    const gTab = document.getElementById('galleryTab');
    const sTab = document.getElementById('servicesTab');
    const vTab = document.getElementById('videosTab');
    if (gTab) gTab.classList.toggle('hidden', tabId !== 'galleryTab');
    if (sTab) sTab.classList.toggle('hidden', tabId !== 'servicesTab');
    if (vTab) vTab.classList.toggle('hidden', tabId !== 'videosTab');
    
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('onclick')?.includes(tabId));
    });
}

// --- DATOS ---
async function refreshAllData(preloadedFiles = null) {
    const files = preloadedFiles || await fetchFiles();
    if (!files) return;
    renderGallery(files.filter(f => f.tags && f.tags.includes('active')));
    renderServices(files);
    renderVideos(files);
}

async function fetchFiles() {
    if (!currentPassword) return null;
    try {
        const res = await fetch(`/api/admin?action=list&password=${encodeURIComponent(currentPassword)}`);
        return res.ok ? await res.json() : null;
    } catch (err) { return null; }
}

// --- RENDER GALERÍA ---
function renderGallery(items) {
    if (!galleryGrid) return;
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
    if (!servicesContainer) return;
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
                <input type="text" id="serviceTitle_${num}" value="${title}">
            </div>
            <div class="form-group">
                <label>Descripción corta</label>
                <textarea id="serviceDesc_${num}" rows="3">${desc}</textarea>
            </div>
            <button class="btn-gold" onclick="saveService(${num}, '${file?.fileId || ''}')" id="btnSaveService_${num}">
                <span>Guardar Cambios</span>
            </button>
        `;
        servicesContainer.appendChild(card);
    });
}

// Acciones Servicios
window.triggerServiceFile = (num) => { document.getElementById(`serviceFileInput_${num}`).click(); };
window.handleServiceFile = (num) => {
    const file = document.getElementById(`serviceFileInput_${num}`).files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => document.getElementById(`serviceImg_${num}`).src = e.target.result;
        reader.readAsDataURL(file);
    }
};

window.saveService = async (num, oldFileId) => {
    const btn = document.getElementById(`btnSaveService_${num}`);
    const title = document.getElementById(`serviceTitle_${num}`).value;
    const desc = document.getElementById(`serviceDesc_${num}`).value;
    const file = document.getElementById(`serviceFileInput_${num}`).files[0];

    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Guardando...';

    try {
        if (file) {
            const uploadRes = await imagekit.upload({
                file: file,
                fileName: `service_${num}_${Date.now()}`,
                folder: '/galeria-perritos',
                tags: [`service_${num}`],
                customMetadata: { title, description: desc }
            });
            if (oldFileId) await fetch(`/api/admin?action=delete&password=${encodeURIComponent(currentPassword)}&fileId=${oldFileId}`);
        } else if (oldFileId) {
            await fetch('/api/admin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    action: 'update', password: currentPassword, fileId: oldFileId, 
                    tags: [`service_${num}`], customMetadata: { title, description: desc }
                })
            });
        }
        showToast('Servicio actualizado ✨');
        refreshAllData();
    } catch (err) { showToast('Error al guardar', 'error'); }
    finally { btn.disabled = false; btn.innerHTML = '<span>Guardar Cambios</span>'; }
};

// --- RENDER VIDEOS MOMENTOS ---
function renderVideos(files) {
    if (!videosContainer) return;
    videosContainer.innerHTML = '';
    
    [1, 2, 3].forEach(num => {
        const file = files.find(f => f.tags && f.tags.includes(`moment_${num}`));
        const card = document.createElement('div');
        card.className = 'service-editor-card';
        
        const videoUrl = file?.url || '';

        card.innerHTML = `
            <h4 style="margin-bottom: 15px; color: var(--brand-gold);">Slot Video #${num}</h4>
            <div class="form-group">
                <label>Video (Preview)</label>
                <div style="position: relative; height: 160px; background: #000; border-radius: 14px; overflow: hidden; margin-bottom: 15px; border: 1px solid #E5E7EB;">
                    <video src="${videoUrl}" id="videoPrev_${num}" style="width: 100%; height: 100%; object-fit: cover;" muted loop playsinline onclick="triggerVideoFile(${num})"></video>
                    <div style="position: absolute; inset: 0; display: ${videoUrl ? 'none' : 'flex'}; align-items: center; justify-content: center; color: #fff; cursor: pointer;" onclick="triggerVideoFile(${num})">
                        <i class="fa-solid fa-play-circle" style="font-size: 2rem;"></i>
                    </div>
                </div>
                <input type="file" id="videoFileInput_${num}" accept="video/*" style="display:none" onchange="handleVideoFile(${num})">
            </div>
            <button class="btn-gold" onclick="saveVideo(${num}, '${file?.fileId || ''}')" id="btnSaveVideo_${num}">
                <span>Guardar Video #${num}</span>
            </button>
        `;
        videosContainer.appendChild(card);
        const vid = document.getElementById(`videoPrev_${num}`);
        if (videoUrl) vid.play().catch(() => {});
    });
}

window.triggerVideoFile = (num) => { document.getElementById(`videoFileInput_${num}`).click(); };
window.handleVideoFile = (num) => {
    const file = document.getElementById(`videoFileInput_${num}`).files[0];
    if (file) {
        const vid = document.getElementById(`videoPrev_${num}`);
        vid.src = URL.createObjectURL(file);
        vid.play().catch(() => {});
        showToast('Video listo para subir 🎬');
    }
};

window.saveVideo = async (num, oldFileId) => {
    const btn = document.getElementById(`btnSaveVideo_${num}`);
    const file = document.getElementById(`videoFileInput_${num}`).files[0];

    if (!file && !oldFileId) {
        showToast('Selecciona un video primero', 'error');
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Subiendo...';

    try {
        if (file) {
            console.log(`🎬 Subiendo video ${num} a ImageKit...`);
            const uploadRes = await imagekit.upload({
                file: file,
                fileName: `moment_${num}_${Date.now()}`,
                folder: '/galeria-perritos',
                tags: [`moment_${num}`]
            });
            if (oldFileId) await fetch(`/api/admin?action=delete&password=${encodeURIComponent(currentPassword)}&fileId=${oldFileId}`);
            showToast(`¡Video #${num} actualizado! 🐾🎬`);
            refreshAllData();
        } else {
          showToast('No hay cambios que guardar', 'info');
        }
    } catch (err) {
        console.error("Error al subir video:", err);
        showToast('Error al subir video (Max 100MB)', 'error'); 
    }
    finally { btn.disabled = false; btn.innerHTML = `<span>Guardar Video #${num}</span>`; }
};

// --- SUBIDA GALERÍA ---
if (uploadForm) {
    uploadForm.onsubmit = async (e) => {
        if (e) e.preventDefault();
        console.log("📤 Iniciando proceso de subida a ImageKit...");
        
        const file = fileInput.files[0];
        if (!file) {
            showToast('Selecciona una imagen primero', 'error');
            return false;
        }
        
        if (!imagekit) {
            showToast('Error: SDK de imágenes no listo', 'error');
            return false;
        }

        setLoading(true);
        // Actualizar credenciales justo antes de subir
        imagekit.options.authenticationEndpoint = `/api/admin?action=auth&password=${encodeURIComponent(currentPassword)}`;

        try {
            imagekit.upload({
                file: file,
                fileName: `${Date.now()}_${file.name.replace(/\s/g, '_')}`,
                folder: '/galeria-perritos',
                tags: ['active']
            }, (err, result) => {
                setLoading(false);
                if (err) {
                    console.error("❌ Error ImageKit:", err);
                    return showToast('Error en la subida: ' + (err.message || 'Verifica tu conexión'), 'error');
                }
                console.log("✅ Subida exitosa:", result);
                showToast('¡Foto publicada! 🐾');
                resetGalleryForm();
                refreshAllData();
            });
        } catch (fatal) {
            setLoading(false);
            console.error("❌ Error Fatal en Upload:", fatal);
            showToast('Error crítico al procesar imagen', 'error');
        }
        return false;
    };
}

window.deleteImage = async (fileId) => {
    if (!confirm('¿Eliminar de la galería?')) return;
    const res = await fetch(`/api/admin?action=delete&password=${encodeURIComponent(currentPassword)}&fileId=${fileId}`);
    if (res.ok) { showToast('Foto eliminada'); refreshAllData(); }
};

if (fileInput) {
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
}

// --- UTILS ---
function setLoading(is) {
    if (btnUpload) btnUpload.disabled = is;
    if (uploadLoader) uploadLoader.classList.toggle('hidden', !is);
    const bt = document.getElementById('btnText');
    if (bt) bt.textContent = is ? 'Publicando...' : 'Publicar en Galería';
}

function setLoginLoading(is) {
    if (btnLogin) btnLogin.disabled = is;
    const loader = document.getElementById('loginLoader');
    const text = document.getElementById('loginBtnText');
    if (loader) loader.classList.toggle('hidden', !is);
    if (text) text.textContent = is ? 'Verificando...' : 'Acceder al Panel';
}

function resetGalleryForm() {
    if (uploadForm) uploadForm.reset();
    if (previewImg) previewImg.classList.add('hidden');
    const drop = document.getElementById('dropZoneContent');
    if (drop) drop.classList.remove('hidden');
}

function showToast(msg, type = 'success') {
    const t = document.getElementById('toast');
    const m = document.getElementById('toastMsg');
    if (!t || !m) return;
    m.textContent = msg;
    t.style.background = type === 'error' ? '#EF4444' : 'var(--brand-ink)';
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
}

window.switchTab = switchTab;
window.handleLoginAttempt = handleLoginAttempt;
console.log("💎 Sistema Admin El Pekinés V3.0 Cargado");
