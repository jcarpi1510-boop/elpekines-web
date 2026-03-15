// safety check: Ensure centralized config is loaded
if (typeof window.APPWRITE_CONFIG === 'undefined') {
    console.error("❌ ERROR CRÍTICO: No se pudo cargar appwrite-config.js");
}

// Appwrite constants from appwrite-config.js
// Usamos var para que sea verdaderamente global al script y fácil de depurar
var { ENDPOINT: APPWRITE_ENDPOINT, PROJECT: APPWRITE_PROJECT, BUCKET_ID, DATABASE_ID, COLLECTION_ID } = window.APPWRITE_CONFIG || {};

console.log("🔧 [DEBUG] Config Activa en Admin:", window.APPWRITE_CONFIG);

// Elementos (Selección diferida para mayor seguridad)
let loginOverlay, adminContent, loginForm, btnLogout, btnLogin;
let galleryGrid, servicesContainer, videosContainer, heroPreviewContainer, uploadForm, fileInput, previewImg, btnUpload, uploadLoader;
let heroUploadForm, heroFileInput, heroFilePreview, btnHeroUpload, heroUploadLoader;

// --- Robustez Global ---
window.onerror = function(msg, url, line) {
    console.error(`🔴 CRASH ADMIN: ${msg} en ${url}:${line}`);
    // No bloqueamos, pero dejamos registro
    return false;
};

// --- Control de Sesión ---
document.addEventListener('DOMContentLoaded', async () => {
    console.log("🚀 [SISTEMA] Iniciando Panel Admin...");
    
    // Fail-Safe: Quitar el cargador si Appwrite tarda demasiado
    const failSafeTimeout = setTimeout(() => {
        console.warn("⚠️ [SISTEMA] Fail-safe activado: Forzando visibilidad del panel");
        removeGlobalLoader();
    }, 5000);

    try {
        bindElements();
        
        // Listeners básicos
        if (loginForm) loginForm.addEventListener('submit', handleLoginAttempt);
        if (btnLogout) btnLogout.addEventListener('click', handleLogout);

        // Verificación de Conectividad y Sesión
        if (typeof account !== 'undefined') {
            console.log("📡 Verificando conexión con Appwrite...");
            await checkSession();
        } else {
            console.error("❌ SDK de Appwrite no disponible");
            showToast('Error: SDK de Appwrite no cargado. Revisa tu conexión.', 'error');
            removeGlobalLoader();
        }

        // Vincular eventos de formularios
        if (uploadForm) uploadForm.onsubmit = handleGalleryUpload;
        if (fileInput) fileInput.addEventListener('change', handleFilePreview);
        if (heroUploadForm) heroUploadForm.onsubmit = handleHeroUpload;
        if (heroFileInput) heroFileInput.addEventListener('change', handleHeroFilePreview);

    } catch (error) {
        console.error("❌ Error de inicialización:", error);
        showToast('Falla de sistema: ' + error.message, 'error');
        removeGlobalLoader();
    } finally {
        clearTimeout(failSafeTimeout);
        // El loader se quita normalmente dentro de handleAuthState si hay sesión,
        // o aquí si algo falló antes de llegar ahí.
        setTimeout(removeGlobalLoader, 500); 
    }
});

function removeGlobalLoader() {
    const gLoader = document.getElementById('globalLoader');
    if (gLoader) {
        gLoader.classList.add('fade-out');
        setTimeout(() => gLoader.classList.add('hidden'), 500);
    }
}

function bindElements() {
    try {
        loginOverlay = document.getElementById('loginOverlay');
        adminContent = document.getElementById('adminContent');
        loginForm = document.getElementById('adminLoginForm');
        btnLogout = document.getElementById('btnLogout');
        btnLogin = document.getElementById('btnLogin'); // Keep existing line
        btnHeroUpload = document.getElementById('btnHeroUpload');
        heroUploadLoader = document.getElementById('heroUploadLoader');
        heroPreviewContainer = document.getElementById('heroVideoPreviewContainer');
        heroUploadForm = document.getElementById('heroUploadForm');
        heroFileInput = document.getElementById('heroVideoFile');
        heroFilePreview = document.getElementById('heroFilePreview');

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

// --- Control de Sesión con Appwrite ---
async function handleAuthState(isLoggedIn) {
    if (loginOverlay) loginOverlay.classList.toggle('hidden', isLoggedIn);
    if (adminContent) adminContent.classList.toggle('hidden', !isLoggedIn);
    
    if (isLoggedIn) {
        console.log("🔓 Panel desbloqueado");
        refreshAllData();
    }
}

async function handleLoginAttempt(e) {
    if (e) e.preventDefault();
    const emailInput = document.getElementById('adminEmailInput');
    const passInput = document.getElementById('adminPassInput');
    
    if (!emailInput || !passInput) return;
    
    const email = emailInput.value.trim();
    const password = passInput.value.trim();
    
    setLoginLoading(true);
    try {
        console.log("📡 Intentando login en Appwrite para:", email);
        await account.createEmailPasswordSession(email, password);
        console.log("✅ Sesión creada exitosamente");
        showToast('¡Bienvenido, Jesús! 🐾');
        handleAuthState(true);
    } catch (error) {
        console.error("❌ [LOGIN_FAIL]", error);
        let msg = error.message;
        if (error.code === 401) msg = "Credenciales incorrectas o Proyecto mal configurado.";
        if (error.code === 0) msg = "No hay conexión con Appwrite. Revisa tu internet o el Endpoint.";
        
        showToast('Error: ' + msg, 'error');
    } finally {
        setLoginLoading(false);
    }
}

async function checkSession() {
    try {
        // Usamos la utilidad centralizada de auth.js
        const user = await getActiveSession();
        
        if (user) {
            console.log("✅ Sesión activa:", user.email);
            handleAuthState(true);
        } else {
            console.log("ℹ️ Sin sesión activa");
            handleAuthState(false);
        }
    } catch (error) {
        console.error("❌ Error inesperado en checkSession:", error);
        handleAuthState(false);
    }
}

async function handleLogout() {
    if (!confirm('¿Cerrar sesión?')) return;
    try {
        await account.deleteSession('current');
        console.log("👋 Sesión cerrada");
        showToast('Sesión finalizada');
        setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
        console.error("❌ Error al cerrar sesión:", error);
        window.location.reload();
    }
}

// --- TABS ---
function switchTab(tabId) {
    const gTab = document.getElementById('galleryTab');
    const sTab = document.getElementById('servicesTab');
    const vTab = document.getElementById('videosTab');
    const hTab = document.getElementById('heroTab');
    
    if (gTab) gTab.classList.toggle('hidden', tabId !== 'galleryTab');
    if (sTab) sTab.classList.toggle('hidden', tabId !== 'servicesTab');
    if (vTab) vTab.classList.toggle('hidden', tabId !== 'videosTab');
    if (hTab) hTab.classList.toggle('hidden', tabId !== 'heroTab');
    
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('onclick')?.includes(tabId));
    });
}

// --- DATOS ---
async function refreshAllData() {
    try {
        console.log("📡 [SISTEMA] Refrescando datos...");
        const response = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [
            Query.orderDesc('order'),
            Query.limit(100)
        ]);
        const documents = response.documents;
        
        // Renderizado no bloqueante (prioridad visual)
        renderGallery(documents.filter(d => d.type === 'gallery'));
        renderServices(documents.filter(d => d.type === 'service'));
        renderVideos(documents.filter(d => d.type === 'moment'));
        
        // El video hero se renderiza al final o con un pequeño delay para no bloquear el resto
        setTimeout(() => {
            renderHeroVideo(documents.filter(d => d.type === 'hero-video'));
        }, 100);

    } catch (error) {
        console.error("❌ Error al cargar datos de Appwrite:", error);
        showToast('Error al sincronizar datos con el servidor.', 'error');
        // Fallback: Si falla la carga, limpiar spinners para que el usuario pueda intentar de nuevo
        if (galleryGrid) galleryGrid.innerHTML = '<p style="text-align:center; padding:20px;">Error al cargar galería. Reintenta recargando la página.</p>';
    }
}

async function deleteImage(docId, fileId) {
    if (!confirm('¿Eliminar de la galería?')) return;
    try {
        // 1. Borrar documento
        await databases.deleteDocument(DATABASE_ID, COLLECTION_ID, docId);
        // 2. Borrar archivo
        await storage.deleteFile(BUCKET_ID, fileId);
        
        showToast('Foto eliminada');
        refreshAllData();
    } catch (error) {
        console.error("❌ Error al eliminar:", error);
        showToast('Error al eliminar', 'error');
    }
}

// --- RENDER GALERÍA ---
function renderGallery(items) {
    if (!galleryGrid) return;
    galleryGrid.innerHTML = '';
    if (!items.length) { galleryGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 40px;">No hay fotos activas.</p>'; return; }

    items.forEach(item => {
        const card = document.createElement('div');
        card.className = 'admin-card';
        const fileUrl = `${APPWRITE_ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${item.fileId}/view?project=${APPWRITE_PROJECT}`;
        
        card.innerHTML = `
            <div class="card-image">
                <img src="${fileUrl}" alt="${item.title}">
                <span class="badge-tag tag-active">Activa</span>
            </div>
            <div class="card-body">
                <strong class="dog-name">${item.title}</strong>
                <div class="action-row">
                    <button onclick="deleteImage('${item.$id}', '${item.fileId}')" class="btn-sm btn-delete"><i class="fa-solid fa-trash-can"></i> Eliminar</button>
                </div>
            </div>
        `;
        galleryGrid.appendChild(card);
    });
}

// --- RENDER SERVICIOS ---
function renderServices(docs) {
    if (!servicesContainer) return;
    servicesContainer.innerHTML = '';
    
    [1, 2, 3].forEach(num => {
        const doc = docs.find(d => d.type === 'service' && d.order === num);
        const card = document.createElement('div');
        card.className = 'service-editor-card';
        
        const defTitle = num === 1 ? 'Veterinaria' : (num === 2 ? 'Vacunación' : 'Peluquería');
        const title = doc?.title || defTitle;
        const desc = doc?.description || 'Descripción del servicio...';
        const imgUrl = doc?.fileId ? `${APPWRITE_ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${doc.fileId}/view?project=${APPWRITE_PROJECT}` : '../Logo.png';

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
            <button class="btn-gold" onclick="saveService(${num}, '${doc?.$id || ''}', '${doc?.fileId || ''}')" id="btnSaveService_${num}">
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

window.saveService = async (num, docId, oldFileId) => {
    const btn = document.getElementById(`btnSaveService_${num}`);
    const title = document.getElementById(`serviceTitle_${num}`).value;
    const desc = document.getElementById(`serviceDesc_${num}`).value;
    const file = document.getElementById(`serviceFileInput_${num}`).files[0];

    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Guardando...';

    try {
        let fileId = oldFileId;
        if (file) {
            const uploaded = await storage.createFile(BUCKET_ID, ID.unique(), file);
            fileId = uploaded.$id;
            if (oldFileId) await storage.deleteFile(BUCKET_ID, oldFileId);
        }

        const data = { type: 'service', fileId, title, description: desc, order: num };

        if (docId) {
            await databases.updateDocument(DATABASE_ID, COLLECTION_ID, docId, data);
        } else {
            await databases.createDocument(DATABASE_ID, COLLECTION_ID, ID.unique(), data);
        }

        showToast('Servicio actualizado ✨');
        refreshAllData();
    } catch (err) { console.error(err); showToast('Error al guardar', 'error'); }
    finally { btn.disabled = false; btn.innerHTML = '<span>Guardar Cambios</span>'; }
};

// --- RENDER VIDEOS MOMENTOS ---
function renderVideos(docs) {
    if (!videosContainer) return;
    videosContainer.innerHTML = '';
    
    [1, 2, 3].forEach(num => {
        const doc = docs.find(d => d.type === 'moment' && d.order === num);
        const card = document.createElement('div');
        card.className = 'service-editor-card';
        
        const videoUrl = doc?.fileId ? `${APPWRITE_ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${doc.fileId}/view?project=${APPWRITE_PROJECT}` : '';

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
            <button class="btn-gold" onclick="saveVideo(${num}, '${doc?.$id || ''}', '${doc?.fileId || ''}')" id="btnSaveVideo_${num}">
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

window.saveVideo = async (num, docId, oldFileId) => {
    const btn = document.getElementById(`btnSaveVideo_${num}`);
    const file = document.getElementById(`videoFileInput_${num}`).files[0];

    if (!file && !docId) {
        showToast('Selecciona un video primero', 'error');
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Subiendo...';

    try {
        let fileId = oldFileId;
        if (file) {
            const uploaded = await storage.createFile(BUCKET_ID, ID.unique(), file);
            fileId = uploaded.$id;
            if (oldFileId) await storage.deleteFile(BUCKET_ID, oldFileId);
        }

        const data = { type: 'moment', fileId, order: num };

        if (docId) {
            await databases.updateDocument(DATABASE_ID, COLLECTION_ID, docId, data);
        } else {
            await databases.createDocument(DATABASE_ID, COLLECTION_ID, ID.unique(), data);
        }

        showToast(`¡Video #${num} actualizado! 🐾🎬`);
        refreshAllData();
    } catch (err) {
        console.error("Error al subir video:", err);
        showToast('Error al subir video', 'error'); 
    }
    finally { btn.disabled = false; btn.innerHTML = `<span>Guardar Video #${num}</span>`; }
};

async function handleGalleryUpload(e) {
    if (e) e.preventDefault();
    console.log("📤 [TRAZA] Iniciando subida a Appwrite...");
    
    const file = fileInput ? fileInput.files[0] : null;
    if (!file) {
        showToast('Selecciona una imagen primero', 'error');
        return false;
    }
    
    setLoading(true);
    try {
        // 1. Subir archivo a Storage
        console.log("📡 [TRAZA] Subiendo archivo a Storage...");
        const uploadedFile = await storage.createFile(BUCKET_ID, ID.unique(), file);
        const fileId = uploadedFile.$id;
        
        // Generar URL directa (Appwrite)
        const fileUrl = `${APPWRITE_ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${fileId}/view?project=${APPWRITE_PROJECT}`;

        // 2. Crear documento en Database
        console.log("📡 [TRAZA] Registrando en base de datos...");
        await databases.createDocument(DATABASE_ID, COLLECTION_ID, ID.unique(), {
            type: 'gallery',
            fileId: fileId,
            title: file.name,
            description: 'Foto de la galería',
            active: true,
            order: Date.now()
        });

        console.log("✅ [TRAZA] Proceso Appwrite completo");
        showToast('¡Foto publicada! 🐾');
        resetGalleryForm();
        refreshAllData();
    } catch (err) {
        console.error("❌ [TRAZA] Error en proceso Appwrite:", err);
        showToast('Error en la subida: ' + err.message, 'error');
    } finally {
        setLoading(false);
    }
    return false;
}

// --- HERO VIDEO LOGIC ---
function renderHeroVideo(docs) {
    if (!heroPreviewContainer) return;
    heroPreviewContainer.innerHTML = '';
    
    // El video activo es el que tiene la fecha más reciente o activo:true
    const activeDoc = docs
        .sort((a, b) => (b.order || 0) - (a.order || 0))
        .find(d => d.active === true) || docs[0];
    
    if (!activeDoc) {
        heroPreviewContainer.innerHTML = '<p style="text-align: center; padding: 20px; background: #fffbe6; border: 1px dashed #ffe58f; border-radius: 12px; color: #856404;">No hay video del Hero configurado. Se usará el logo por defecto.</p>';
        return;
    }

    const videoUrl = `${APPWRITE_ENDPOINT}/storage/buckets/${BUCKET_ID}/files/${activeDoc.fileId}/view?project=${APPWRITE_PROJECT}`;
    
    heroPreviewContainer.innerHTML = `
        <div style="background: #000; border-radius: 16px; overflow: hidden; position: relative; aspect-ratio: 16/9; box-shadow: 0 10px 30px rgba(0,0,0,0.15);">
            <video src="${videoUrl}" style="width: 100%; height: 100%; object-fit: cover;" autoplay muted loop playsinline></video>
            <div style="position: absolute; bottom: 15px; left: 15px; background: rgba(0,0,0,0.6); color: white; padding: 5px 12px; border-radius: 20px; font-size: 0.75rem;">
                <i class="fa-solid fa-check-circle"></i> Video Actual Activo
            </div>
        </div>
    `;
}

function handleHeroFilePreview(e) {
    const file = e.target.files[0];
    if (file) {
        if (!file.type.startsWith('video/')) {
            showToast('El archivo debe ser un video', 'error');
            heroFileInput.value = '';
            return;
        }
        
        if (heroFilePreview) {
            heroFilePreview.src = URL.createObjectURL(file);
            heroFilePreview.classList.remove('hidden');
        }
        const drop = document.getElementById('heroDropZoneContent');
        if (drop) drop.classList.add('hidden');
    }
}

async function handleHeroUpload(e) {
    if (e) e.preventDefault();
    const file = heroFileInput ? heroFileInput.files[0] : null;
    
    if (!file) {
        showToast('Selecciona un video primero', 'error');
        return false;
    }

    setHeroLoading(true);
    try {
        console.log("📡 [SISTEMA] Subiendo nuevo video Hero...");
        
        // 1. Subir a Storage
        const uploaded = await storage.createFile(BUCKET_ID, ID.unique(), file);
        const fileId = uploaded.$id;

        // 2. Buscar videos previos del hero para desactivarlos
        const response = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [
            Query.equal('type', 'hero-video')
        ]);
        
        // Desactivar todos los previos de este tipo
        for (const doc of response.documents) {
            await databases.updateDocument(DATABASE_ID, COLLECTION_ID, doc.$id, { active: false });
        }

        // 3. Crear nuevo registro activo
        await databases.createDocument(DATABASE_ID, COLLECTION_ID, ID.unique(), {
            type: 'hero-video',
            fileId: fileId,
            title: 'Video Hero Principal',
            description: 'Video split-screen del hero',
            active: true,
            order: Date.now()
        });

        showToast('¡Video Hero actualizado con éxito! ✨');
        resetHeroForm();
        refreshAllData();
    } catch (error) {
        console.error("❌ Error al actualizar hero:", error);
        showToast('Error: ' + error.message, 'error');
    } finally {
        setHeroLoading(false);
    }
    return false;
}

function setHeroLoading(is) {
    if (btnHeroUpload) btnHeroUpload.disabled = is;
    if (heroUploadLoader) heroUploadLoader.classList.toggle('hidden', !is);
    const bt = document.getElementById('btnHeroText');
    if (bt) bt.textContent = is ? 'Subiendo video...' : 'Actualizar Video Principal';
}

function resetHeroForm() {
    if (heroUploadForm) heroUploadForm.reset();
    if (heroFilePreview) {
        heroFilePreview.src = '';
        heroFilePreview.classList.add('hidden');
    }
    const drop = document.getElementById('heroDropZoneContent');
    if (drop) drop.classList.remove('hidden');
}

function handleFilePreview(e) {
    const file = e.target.files[0];
    if (file) {
        console.log("📸 [TRAZA] Generando vista previa...");
        const reader = new FileReader();
        reader.onload = (e) => {
            if (previewImg) {
                previewImg.src = e.target.result;
                previewImg.classList.remove('hidden');
            }
            const drop = document.getElementById('dropZoneContent');
            if (drop) drop.classList.add('hidden');
        };
        reader.readAsDataURL(file);
    }
}

    // Eliminamos la función obsoleta fetch-based

// --- MANEJO DE IMÁGENES ---

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
