// --- Mobile Menu Toggle ---
const menuToggle = document.querySelector('.menu-toggle');
const mobileMenu = document.querySelector('.mobile-menu');
const closeMenu = document.querySelector('.close-menu');
const mobileLinks = document.querySelectorAll('.mobile-nav-link');

function openMenu() { mobileMenu.classList.add('active'); document.body.style.overflow = 'hidden'; }
function closeMenuFunc() { mobileMenu.classList.remove('active'); document.body.style.overflow = ''; }

if (menuToggle) menuToggle.addEventListener('click', openMenu);
if (closeMenu) closeMenu.addEventListener('click', closeMenuFunc);
mobileLinks.forEach(link => link.addEventListener('click', closeMenuFunc));

// --- Header Scroll Effect ---
const header = document.querySelector('.header');
window.addEventListener('scroll', () => {
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

// --- Dynamic Content Loading (Gallery & Services) ---
const aboutVideos = [
    {
        id: 1,
        title: "Peluquería Canina",
        src: "https://ik.imagekit.io/v9p6v3z7f/Video1.mp4" // Placeholder, user will replace
    },
    {
        id: 2,
        title: "Atención Veterinaria",
        src: "https://ik.imagekit.io/v9p6v3z7f/Video2.mp4" // Placeholder, user will replace
    },
    {
        id: 3,
        title: "Baño Relax",
        src: "https://ik.imagekit.io/v9p6v3z7f/Video3.mp4" // Placeholder, user will replace
    }
];

function renderAboutVideos() {
    const container = document.getElementById('aboutVideosContainer');
    if (!container) return;

    container.innerHTML = '';
    aboutVideos.forEach((video, index) => {
        const card = document.createElement('div');
        card.className = 'video-card';
        card.style.animationDelay = `${index * 0.15}s`;
        card.innerHTML = `
            <video 
                src="${video.src}" 
                autoplay 
                muted 
                loop 
                playsinline
                poster="Logo.png">
            </video>
        `;
        container.appendChild(card);
    });
}

async function loadDynamicContent() {
    const galleryGrid = document.getElementById('dogGallery');
    const servicesContainer = document.getElementById('servicesContainer');

    try {
        const response = await fetch('/api/gallery');
        if (!response.ok) throw new Error('Error al cargar datos');
        
        const data = await response.json();
        const { gallery, services } = data;

        // 1. Render Gallery
        const galleryContainer = document.querySelector('.gallery-preview-container');
        if (galleryGrid) {
            if (gallery && gallery.length > 0) {
                galleryGrid.innerHTML = '';
                if (galleryContainer) galleryContainer.style.display = 'block';
                
                gallery.forEach((dog, index) => {
                    const card = document.createElement('div');
                    card.className = 'gallery-card';
                    card.style.animationDelay = `${index * 0.1}s`;
                    card.innerHTML = `<img src="${dog.url}?tr=w-300,h-300,fo-auto,q-80" alt="${dog.title}" loading="lazy">`;
                    card.addEventListener('click', () => window.open(dog.url, '_blank'));
                    galleryGrid.appendChild(card);
                });
            } else {
                console.warn('Aviso: Galería vacía en API. Ocultando sección.');
                if (galleryContainer) galleryContainer.style.display = 'none';
            }
        }

        // 2. Render Premium Services
        if (servicesContainer) {
            servicesContainer.innerHTML = '';
            
            // Si no hay servicios en ImageKit, usamos los por defecto para no romper el home
            const finalServices = (services && services.length > 0) ? services : [
                { title: 'Consulta Veterinaria', description: 'Atención profesional preventiva.', url: 'Foto Veterinaria.jpeg' },
                { title: 'Vacunación', description: 'Esquema completo para tu mejor amigo.', url: 'Vacunacion Pekines.png' },
                { title: 'Peluquería Canina', description: 'Baño y corte estético de lujo.', url: 'Peluqueria Pekines.png' }
            ];

            finalServices.forEach((service, index) => {
                const card = document.createElement('div');
                card.className = 'service-card-premium';
                card.style.animationDelay = `${index * 0.1}s`;
                
                let iconClass = 'fa-stethoscope';
                if (service.title.toLowerCase().includes('vacuna')) iconClass = 'fa-syringe';
                if (service.title.toLowerCase().includes('pelu')) iconClass = 'fa-scissors';

                card.innerHTML = `
                    <div class="service-img-wrapper">
                        <img src="${service.url}?tr=w-600,h-600,fo-auto" alt="${service.title}">
                        <div class="service-icon-badge"><i class="fa-solid ${iconClass}"></i></div>
                    </div>
                    <div class="service-details">
                        <h3>${service.title}</h3>
                        <div class="service-description-detail">
                            <p>${service.description}</p>
                        </div>
                        <a href="https://veterinariadeelpekineschile.site.agendapro.com/cl" target="_blank"
                            class="btn btn-gold shine-effect">Reservar ahora</a>
                    </div>
                `;
                servicesContainer.appendChild(card);
            });
        }
    } catch (err) {
        console.error('Error cargando contenido dinámico:', err);
    }
}

// --- WhatsApp Widget ---
const waBubble = document.getElementById('waBubble');
const waWindow = document.getElementById('waWindow');
if (waBubble && waWindow) {
    waBubble.addEventListener('click', () => waWindow.classList.toggle('active'));
    document.addEventListener('click', (e) => {
        if (!document.getElementById('waWidget').contains(e.target)) waWindow.classList.remove('active');
    });
}

// Iniciar todo
document.addEventListener('DOMContentLoaded', () => {
    loadDynamicContent();
    renderAboutVideos();
});
