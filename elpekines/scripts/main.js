// PocketBase instance is globally available from pocketbase-config.js as window.pb
const pb = window.pb;

// --- Mobile Menu Toggle ---
const menuToggle = document.querySelector('.menu-toggle');
const mobileMenu = document.querySelector('.mobile-menu');
const closeMenu = document.querySelector('.close-menu');
const mobileLinks = document.querySelectorAll('.mobile-nav-link');

function openMenu() { if(mobileMenu) mobileMenu.classList.add('active'); document.body.style.overflow = 'hidden'; }
function closeMenuFunc() { if(mobileMenu) mobileMenu.classList.remove('active'); document.body.style.overflow = ''; }

if (menuToggle) menuToggle.addEventListener('click', openMenu);
if (closeMenu) closeMenu.addEventListener('click', closeMenuFunc);
if (mobileLinks) mobileLinks.forEach(link => link.addEventListener('click', closeMenuFunc));

// --- Header Scroll Effect ---
const header = document.querySelector('.header');
window.addEventListener('scroll', () => {
    if (!header) return;
    if (window.scrollY > 50) {
        header.style.backgroundColor = 'rgba(247, 189, 216, 0.98)';
        header.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
        header.style.padding = '10px 0';
    } else {
        header.style.backgroundColor = 'rgba(247, 189, 216, 0.95)';
        header.style.boxShadow = 'var(--shadow)';
        header.style.padding = '15px 0';
    }
});

// --- Hero Video Loading ---
function renderHeroVideo(heroDocs) {
    const container = document.getElementById('heroVideoContainer');
    if (!container) return;

    // Ordenar por 'order' descendente y priorizar el que tenga active: true
    const activeHero = heroDocs
        .sort((a, b) => (b.order || 0) - (a.order || 0))
        .find(d => d.active === true) || heroDocs[0];
    
    if (activeHero) {
        console.log("🎬 Cargando Video Hero...");
        const videoUrl = pb.files.getUrl(activeHero, activeHero.file);
        container.innerHTML = `
            <video src="${videoUrl}" autoplay muted loop playsinline poster="Logo.png" class="hero-video-fade-in"></video>
        `;
    } else {
        console.log("ℹ️ No hay video Hero activo, usando fallback.");
        // Mantener el fallback HTML que ya existe o inyectar uno si está vacío
        if (container.innerHTML.trim() === '') {
            container.innerHTML = `
                <div class="hero-fallback">
                    <img src="Logo.png" class="main-logo-hero" alt="Logo">
                </div>
            `;
        }
    }
}

// --- Dynamic Content Loading (PocketBase) ---
function renderAboutVideos(moments) {
    const container = document.getElementById('aboutVideosContainer');
    if (!container) return;

    if (!moments || moments.length === 0) {
        // Fallback placeholders if DB is empty
        container.innerHTML = `
            <div class="video-card"><video src="Logo.png" autoplay muted loop playsinline></video></div>
            <div class="video-card"><video src="Logo.png" autoplay muted loop playsinline></video></div>
            <div class="video-card"><video src="Logo.png" autoplay muted loop playsinline></video></div>
        `;
        return;
    }

    container.innerHTML = '';
    moments.forEach((doc, index) => {
        const videoUrl = pb.files.getUrl(doc, doc.file);
        const card = document.createElement('div');
        card.className = 'video-card';
        card.style.animationDelay = `${index * 0.15}s`;
        card.innerHTML = `<video src="${videoUrl}" autoplay muted loop playsinline poster="Logo.png"></video>`;
        container.appendChild(card);
    });
}

async function loadDynamicContent() {
    const galleryGrid = document.getElementById('dogGallery');
    const servicesContainer = document.getElementById('servicesContainer');

    try {
        console.log("📡 [SISTEMA] Cargando contenido desde PocketBase...");
        const response = await pb.collection('content').getFullList({
            sort: 'order',
        });
        console.log(`📦 [DATO] ${response.length} registros recibidos de PocketBase`);

        const documents = response;
        const galleryDocs = documents.filter(d => d.type === 'gallery' && d.active !== false);
        const serviceDocs = documents.filter(d => d.type === 'service' && d.active !== false);
        const momentDocs = documents.filter(d => d.type === 'moment' && d.active !== false);
        const heroDocs = documents.filter(d => d.type === 'hero-video' && d.active !== false);

        console.log(`📊 [FILTRO] Galería:${galleryDocs.length}, Servicios:${serviceDocs.length}, Momentos:${momentDocs.length}, Hero:${heroDocs.length}`);

        // 0. Render Hero Video
        renderHeroVideo(heroDocs);

        // 0.5 Render About Videos
        renderAboutVideos(momentDocs);

        // 1. Render Gallery
        const galleryContainer = document.querySelector('.gallery-preview-container');
        if (galleryGrid) {
            if (galleryDocs.length > 0) {
                galleryGrid.innerHTML = '';
                if (galleryContainer) galleryContainer.style.display = 'block';
                
                galleryDocs.forEach((doc, index) => {
                    const card = document.createElement('div');
                    card.className = 'gallery-card';
                    card.style.animationDelay = `${index * 0.1}s`;
                    const fileUrl = pb.files.getUrl(doc, doc.file);
                    
                    card.innerHTML = `<img src="${fileUrl}" alt="${doc.title}" loading="lazy">`;
                    card.addEventListener('click', () => window.open(fileUrl, '_blank'));
                    galleryGrid.appendChild(card);
                });
            } else {
                console.warn('Aviso: Galería vacía. Ocultando sección.');
                if (galleryContainer) galleryContainer.style.display = 'none';
            }
        }

        // 2. Render Premium Services
        if (servicesContainer) {
            servicesContainer.innerHTML = '';
            
            if (serviceDocs.length > 0) {
                serviceDocs.forEach((doc, index) => {
                    const card = document.createElement('div');
                    card.className = 'service-card-premium';
                    card.style.animationDelay = `${index * 0.15}s`;
                    const fileUrl = pb.files.getUrl(doc, doc.file);
                    
                    let iconClass = 'fa-stethoscope';
                    if (doc.title.toLowerCase().includes('vacuna')) iconClass = 'fa-syringe';
                    if (doc.title.toLowerCase().includes('pelu')) iconClass = 'fa-scissors';

                    card.innerHTML = `
                        <div class="service-img-wrapper">
                            <img src="${fileUrl}" alt="${doc.title}">
                            <div class="service-icon-badge"><i class="fa-solid ${iconClass}"></i></div>
                        </div>
                        <div class="service-details">
                            <h3>${doc.title}</h3>
                            <div class="service-description-detail">
                                <p>${doc.description}</p>
                            </div>
                            <a href="https://veterinariadeelpekineschile.site.agendapro.com/cl" target="_blank" class="btn-service-call">
                                <span>Agendar Hora</span>
                                <i class="fa-solid fa-calendar-check"></i>
                            </a>
                        </div>
                    `;
                    servicesContainer.appendChild(card);
                });
            } else {
                // Fallback default services if DB is empty
                const fallbacks = [
                    { title: 'Consulta Veterinaria', description: 'Atención profesional preventiva.', url: 'Foto Veterinaria.jpeg', icon: 'fa-stethoscope' },
                    { title: 'Vacunación', description: 'Esquema completo para tu mejor amigo.', url: 'Vacunacion Pekines.png', icon: 'fa-syringe' },
                    { title: 'Peluquería Canina', description: 'Baño y corte estético de lujo.', url: 'Peluqueria Pekines.png', icon: 'fa-scissors' }
                ];
                fallbacks.forEach(s => {
                    const card = document.createElement('div');
                    card.className = 'service-card-premium';
                    card.innerHTML = `
                        <div class="service-img-wrapper">
                            <img src="${s.url}" alt="${s.title}">
                            <div class="service-icon-badge"><i class="fa-solid ${s.icon}"></i></div>
                        </div>
                        <div class="service-details">
                            <h3>${s.title}</h3>
                            <div class="service-description-detail">
                                <p>${s.description}</p>
                            </div>
                            <a href="https://veterinariadeelpekineschile.site.agendapro.com/cl" target="_blank" class="btn-service-call">
                                <span>Agendar Hora</span>
                                <i class="fa-solid fa-calendar-check"></i>
                            </a>
                        </div>
                    `;
                    servicesContainer.appendChild(card);
                });
            }
        }

    } catch (error) {
        console.error('PocketBase Error (Public):', error);
    }
}

// --- Smooth Scrolling ---
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});

// --- Initialize ---
document.addEventListener('DOMContentLoaded', () => {
    loadDynamicContent();
});
