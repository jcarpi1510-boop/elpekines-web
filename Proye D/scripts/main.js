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
