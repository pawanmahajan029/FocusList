// Counter Animation for Stats
function animateCounter(element, target, duration = 2000) {
    let start = 0;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
        start += increment;
        if (start >= target) {
            element.textContent = target;
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(start);
        }
    }, 16);
}

// Observer for triggering animations
const observerOptions = {
    threshold: 0.2,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            // Stats
            if (entry.target.classList.contains('stat-number')) {
                const target = parseInt(entry.target.getAttribute('data-target'));
                animateCounter(entry.target, target);
                observer.unobserve(entry.target);
            }
            // Timeline items fade in
            if (entry.target.classList.contains('timeline-item')) {
                entry.target.style.opacity = 1;
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);
            }
        }
    });
}, observerOptions);

// Observe stats
document.querySelectorAll('.stat-number').forEach(el => observer.observe(el));

// Observe timeline items (Initial state set here to fade in)
document.querySelectorAll('.timeline-item').forEach(el => {
    el.style.opacity = 0;
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'all 0.6s ease';
    observer.observe(el);
});

// SMOOTH SCROLLING WITH OFFSET
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();

        // Close mobile menu if open
        const navMenu = document.querySelector('.nav-menu');
        const hamburger = document.querySelector('.hamburger');
        navMenu.classList.remove('active');
        hamburger.classList.remove('active');

        // Scroll logic
        const targetId = this.getAttribute('href');
        const targetElement = document.querySelector(targetId);

        if (targetElement) {
            const headerOffset = 80; // Height of your fixed navbar
            const elementPosition = targetElement.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

            window.scrollTo({
                top: offsetPosition,
                behavior: "smooth"
            });
        }
    });
});

// NAVBAR BACKGROUND & MOBILE MENU TOGGLE
const navbar = document.querySelector('.navbar');
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');

// Scroll effect
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.style.background = 'rgba(10, 10, 10, 0.95)';
        navbar.style.boxShadow = '0 5px 20px rgba(0,0,0,0.5)';
    } else {
        navbar.style.background = 'rgba(20, 20, 20, 0.8)';
        navbar.style.boxShadow = 'none';
    }
});

// Mobile Menu Click
hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');

    // Animate the hamburger lines
    const spans = hamburger.querySelectorAll('span');
    if (hamburger.classList.contains('active')) {
        spans[0].style.transform = 'rotate(45deg) translate(5px, 6px)';
        spans[1].style.opacity = '0';
        spans[2].style.transform = 'rotate(-45deg) translate(5px, -6px)';
    } else {
        spans[0].style.transform = 'none';
        spans[1].style.opacity = '1';
        spans[2].style.transform = 'none';
    }
});

// 3D TILT EFFECT
document.querySelectorAll('[data-tilt]').forEach(card => {
    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = (y - centerY) / 15;
        const rotateY = (centerX - x) / 15;

        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-10px)`;
    });

    card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateY(0)';
    });
});

// OPTIMIZED PARTICLE SYSTEM (Throttled for performance)
const hero = document.querySelector('.hero');
let lastParticleTime = 0;

hero.addEventListener('mousemove', (e) => {
    const now = Date.now();
    if (now - lastParticleTime < 50) return; // Only create particle every 50ms
    lastParticleTime = now;

    const particle = document.createElement('div');
    particle.style.position = 'absolute';
    particle.style.width = Math.random() * 5 + 2 + 'px';
    particle.style.height = particle.style.width;
    particle.style.background = `rgba(167, 139, 250, ${Math.random()})`;
    particle.style.borderRadius = '50%';
    particle.style.left = e.clientX + 'px';
    particle.style.top = (e.clientY + window.scrollY - hero.getBoundingClientRect().top) + 'px'; // Correct positioning
    particle.style.pointerEvents = 'none';
    particle.style.transition = 'all 1s ease';

    hero.appendChild(particle);

    // Animate and remove
    requestAnimationFrame(() => {
        particle.style.transform = `translate(${Math.random() * 100 - 50}px, ${Math.random() * 100 - 50}px) scale(0)`;
        particle.style.opacity = 0;
    });

    setTimeout(() => {
        particle.remove();
    }, 1000);
});

// PARALLAX EFFECT FOR BACKGROUNDS
window.addEventListener('scroll', () => {
    const scroll = window.pageYOffset;
    document.querySelectorAll('.quote-section').forEach(el => {
        el.style.backgroundPosition = `center ${scroll * 0.5}px`;
    });
});

console.log('%c SuccessPath Loaded', 'color: #a78bfa; font-size: 16px; font-weight: bold;');
