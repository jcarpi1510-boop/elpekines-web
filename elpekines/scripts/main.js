// Mobile Menu Toggle
const menuToggle = document.querySelector('.menu-toggle');
const mobileMenu = document.querySelector('.mobile-menu');
const closeMenu = document.querySelector('.close-menu');
const mobileLinks = document.querySelectorAll('.mobile-nav-link');

// Function to open menu
function openMenu() {
    mobileMenu.classList.add('active');
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
}

// Function to close menu
function closeMenuFunc() {
    mobileMenu.classList.remove('active');
    document.body.style.overflow = '';
}

// Event Listeners
menuToggle.addEventListener('click', openMenu);
closeMenu.addEventListener('click', closeMenuFunc);

// Close menu when clicking a link
mobileLinks.forEach(link => {
    link.addEventListener('click', closeMenuFunc);
});

// Close menu when clicking outside (optional, but good UX)
mobileMenu.addEventListener('click', (e) => {
    if (e.target === mobileMenu) {
        closeMenuFunc();
    }
});

// Sticky Header Effect
const header = document.querySelector('.header');
const hero = document.querySelector('.hero');

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

// Smooth Scroll for Anchor Links (polishing standard behavior)

// Promo Form Logic (Embedded)
const promoForm = document.querySelector('#promoForm');
const formFeedback = document.querySelector('#formFeedback');

if (promoForm) {
    promoForm.addEventListener('submit', (e) => {
        e.preventDefault();

        // Retrieve data
        const owner = document.getElementById('ownerName').value;
        const name = document.getElementById('userName').value;
        const breed = document.getElementById('petBreed').value;
        const contact = document.getElementById('userContact').value;

        // Google Apps Script Web App URL
        const scriptURL = 'https://script.google.com/macros/s/AKfycbyXNnAZ7OTR8Y-96EDkan5zwHA8r-fi1ozUOmRdOizs82yHVq0kdn1P3hcMz6UOnbr9/exec';

        // Show loading state
        const submitBtn = promoForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerText;
        submitBtn.innerText = 'Enviando...';
        submitBtn.disabled = true;

        // Send data to Google Sheets
        fetch(scriptURL, {
            method: 'POST',
            mode: 'no-cors', // Important for Google Apps Script
            headers: {
                'Content-Type': 'text/plain' // Avoids CORS preflight
            },
            body: JSON.stringify({
                owner: owner,
                name: name,
                breed: breed,
                contact: contact
            })
        })
            .then(response => {
                // Success State (With no-cors we can't read the response, so we assume success if no error)
                promoForm.style.display = 'none';
                formFeedback.style.display = 'block';
                formFeedback.innerText = `¡Gracias ${name}! Tu tarjeta digital ha sido activada. Te contactaremos pronto.`;

                // Reset form logic
                setTimeout(() => {
                    formFeedback.style.display = 'none';
                    promoForm.style.display = 'block';
                    promoForm.reset();
                    submitBtn.innerText = originalText;
                    submitBtn.disabled = false;
                }, 5000);
            })
            .catch(error => {
                console.error('Error!', error.message);
                submitBtn.innerText = originalText;
                submitBtn.disabled = false;
                alert('Hubo un error al enviar. Por favor intenta de nuevo.');
            });
    });
}

// WhatsApp Surgical Widget Logic
const waBubble = document.getElementById('waBubble');
const waWindow = document.getElementById('waWindow');

if (waBubble && waWindow) {
    waBubble.addEventListener('click', () => {
        waWindow.classList.toggle('active');
    });

    // Close when clicking outside
    document.addEventListener('click', (e) => {
        const widget = document.getElementById('waWidget');
        if (widget && !widget.contains(e.target)) {
            waWindow.classList.remove('active');
        }
    });
}

// --- ImageKit Gallery Configuration ---
// Edita este arreglo para agregar o quitar fotos.
// Usa ?tr=w-300,h-300,fo-auto,q-80 para optimización automática de ImageKit.
const galleryImages = [
  { id: 1, title: "Perrito Bañado 1", image: "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&q=80&w=400" },
  { id: 2, title: "Perrito Bañado 2", image: "https://images.unsplash.com/photo-1544568100-847a948585b9?auto=format&fit=crop&q=80&w=400" },
  { id: 3, title: "Perrito Bañado 3", image: "https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?auto=format&fit=crop&q=80&w=400" },
  { id: 4, title: "Perrito Bañado 4", image: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&q=80&w=400" },
  { id: 5, title: "Perrito Bañado 5", image: "https://images.unsplash.com/photo-1598133894008-61f7fdb8cc3a?auto=format&fit=crop&q=80&w=400" },
  { id: 6, title: "Perrito Bañado 6", image: "https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&q=80&w=400" },
  { id: 7, title: "Perrito Bañado 7", image: "https://images.unsplash.com/photo-1530281700549-e82e7bf110d6?auto=format&fit=crop&q=80&w=400" },
  { id: 8, title: "Perrito Bañado 8", image: "https://images.unsplash.com/photo-1529927066849-79b791a69825?auto=format&fit=crop&q=80&w=400" }
];

// --- Supabase Configuration (Opcional para Servicios) ---
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
let supabaseClient = null;

if (SUPABASE_URL !== 'YOUR_SUPABASE_URL' && SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY') {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// --- Premium Gallery Logic (Pure ImageKit API) ---
async function loadGallery() {
    const galleryGrid = document.getElementById('dogGallery');
    if (!galleryGrid) return;

    try {
        const response = await fetch('/api/gallery');
        if (!response.ok) throw new Error('Error al cargar galería');
        
        const dogs = await response.json();

        galleryGrid.innerHTML = '';
        if (dogs.length > 0) {
            dogs.forEach((dog, index) => {
                const card = document.createElement('div');
                card.className = 'gallery-card';
                card.style.animationDelay = `${index * 0.1}s`;
                
                card.innerHTML = `<img src="${dog.url}?tr=w-300,h-300,fo-auto,q-80" alt="${dog.title}" loading="lazy">`;
                
                card.addEventListener('click', () => {
                    window.open(dog.url, '_blank');
                });

                galleryGrid.appendChild(card);
            });
        } else {
            console.log("Galería vacía en ImageKit");
        }
    } catch (err) {
        console.error('Error cargando galería:', err);
    }
}


// --- Services Configuration ---
// Edita este arreglo para gestionar tus 3 servicios principales.
const servicesData = [
    {
        title: 'Consulta Veterinaria',
        description: 'Examen físico completo, revisión de piel, oídos, ojos y dental básica para tu mejor amigo.',
        image_url: 'Foto Veterinaria.jpeg'
    },
    {
        title: 'Vacunación y Desparasitación',
        description: 'Esquema completo de vacunas séxtuple/óctuple, antirrábica y control preventivo de parásitos.',
        image_url: 'Vacunacion Pekines.png'
    },
    {
        title: 'Peluquería Canina Completa',
        description: 'Baño profesional, corte estético según raza, limpieza de oídos y corte de uñas con trato amoroso.',
        image_url: 'Peluqueria Pekines.png'
    }
];

// --- Premium Services Logic (Administrable) ---
async function loadServices() {
    const servicesContainer = document.getElementById('servicesContainer');
    if (!servicesContainer) return;

    servicesContainer.innerHTML = '';
    
    servicesData.forEach((service, index) => {
        const card = document.createElement('div');
        card.className = 'service-card-premium';
        card.style.animationDelay = `${index * 0.1}s`;
        
        let iconClass = 'fa-stethoscope';
        if (service.title.toLowerCase().includes('vacuna')) iconClass = 'fa-syringe';
        if (service.title.toLowerCase().includes('pelu')) iconClass = 'fa-scissors';

        card.innerHTML = `
            <div class="service-img-wrapper">
                <img src="${service.image_url}" alt="${service.title}">
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

// Iniciar galería y servicios
document.addEventListener('DOMContentLoaded', () => {
    loadGallery();
    loadServices();
});
