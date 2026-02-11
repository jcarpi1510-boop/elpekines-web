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
        header.style.backgroundColor = 'rgba(212, 175, 55, 0.98)';
        header.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
        header.style.padding = '10px 0';
    } else {
        header.style.backgroundColor = 'rgba(212, 175, 55, 0.95)';
        header.style.boxShadow = 'var(--shadow)';
        header.style.padding = '15px 0';
    }
});

// Smooth Scroll for Anchor Links (polishing standard behavior)
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        const targetElement = document.querySelector(targetId);

        if (targetElement) {
            const headerHeight = document.querySelector('.header').offsetHeight;
            const elementPosition = targetElement.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerHeight;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    });
});
