/* =========================================
   MAIN APP LOGIC
   ========================================= */

document.addEventListener('DOMContentLoaded', () => {
    initNavbar();
    initSmoothScroll();
    initHeroSlider();
});

/* --- Navbar Toggle (Mobile) --- */
function initNavbar() {
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('nav-menu');
    const navbar = document.getElementById('navbar');

    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            hamburger.classList.toggle('is-active');
            
            // Toggle icon loop if there is an icon
            const icon = hamburger.querySelector('i');
            if (icon) {
                if (navMenu.classList.contains('active')) {
                    icon.classList.remove('fa-bars');
                    icon.classList.add('fa-times');
                } else {
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                }
            }
        });

        // Close menu when clicking a link
        navMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                hamburger.classList.remove('is-active');
                const icon = hamburger.querySelector('i');
                if (icon) {
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                }
            });
        });
    }

    // Scroll Effect
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
}

/* --- Smooth Scroll --- */
/* --- Smooth Scroll --- */
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });
}

/* --- Hero Slider (Mixed Media) --- */
function initHeroSlider() {
    const slider = document.getElementById('heroSlider');
    if (!slider) return;

    const slides = slider.querySelectorAll('.hero-slide');
    if (slides.length === 0) return;

    let currentIndex = 0;
    let timeoutId;

    function showSlide(index) {
        // Remover active de todos
        // Remover active de todos
        const currentSlide = slides[index];

        // Desactivar solo los otros slides
        slides.forEach(slide => {
            if (slide !== currentSlide && slide.classList.contains('active')) {
                slide.classList.remove('active');

                // Si el slide anterior era video, esperar la transición para pausar
                const video = slide.querySelector('video');
                if (video) {
                    setTimeout(() => {
                        video.pause();
                        video.currentTime = 0;
                    }, 1500); // 1.5s (match CSS transition)
                }
            }
        });

        // Activar el nuevo
        currentSlide.classList.add('active');

        // Lógica de duración
        const type = currentSlide.dataset.type;
        const duration = parseInt(currentSlide.dataset.duration) || 5000;

        if (type === 'video') {
            const video = currentSlide.querySelector('video');
            if (video) {
                const playPromise = video.play();
                let isBlocked = false;

                if (playPromise !== undefined) {
                    playPromise.catch(e => {
                        console.log("Autoplay blocked:", e);
                        isBlocked = true;
                        // Skip to next slide after a short fallback duration completely if blocked
                        timeoutId = setTimeout(nextSlide, 3000);
                    });
                }

                // If not blocked immediately, setup timeupdate listeners
                if (duration === 0) {
                    video.ontimeupdate = null;

                    const checkTime = () => {
                        if (isBlocked) return;
                        if (video.duration && isFinite(video.duration) && video.duration > 0) {
                            if (video.duration - video.currentTime <= 1.5) {
                                video.ontimeupdate = null;
                                nextSlide();
                            }
                        }
                    };

                    video.ontimeupdate = checkTime;

                    video.onended = () => {
                        if (isBlocked) return;
                        video.ontimeupdate = null;
                        nextSlide();
                    };
                    
                    // Fallback to ensure it doesn't get stuck if the event fails
                    setTimeout(() => {
                        if (!isBlocked && video.paused) {
                            video.ontimeupdate = null;
                            nextSlide();
                        }
                    }, 4000);
                } else {
                    timeoutId = setTimeout(nextSlide, duration);
                }
            } else {
                timeoutId = setTimeout(nextSlide, 3000);
            }
        } else {
            timeoutId = setTimeout(nextSlide, duration);
        }
    }

    function nextSlide() {
        currentIndex = (currentIndex + 1) % slides.length;
        showSlide(currentIndex);
    }

    // Iniciar
    showSlide(0);
}

/* --- Premium Effects (Spotlight & Scroll Reveal) --- */
document.addEventListener('mousemove', (e) => {
    const x = e.clientX;
    const y = e.clientY;
    document.documentElement.style.setProperty('--x', x + 'px');
    document.documentElement.style.setProperty('--y', y + 'px');
});

// Scroll Reveal Observer
const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px"
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('active');
            observer.unobserve(entry.target); // Animación solo una vez
        }
    });
}, observerOptions);

document.addEventListener('DOMContentLoaded', () => {
    initContactForm(); // Initialize Contact Form

    // --- SCROLL ANIMATIONS (GENERAL) ---
    // (Timeline specific observer removed)
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

    // --- NETFLIX MODAL LOGIC ---
    const modal = document.getElementById('expert-modal');
    if (!modal) return; // Guard

    const closeBtn = modal.querySelector('.modal-close');
    const cards = document.querySelectorAll('.netflix-card');

    // Open Modal
    cards.forEach(card => {
        card.addEventListener('click', (e) => {
            // Prevent if clicking the "Book" button (Bubble stop)
            if (e.target.closest('.card-btn-book')) return;
            const name = card.dataset.name;
            const role = card.dataset.role;
            const image = card.dataset.image;
            const story = card.dataset.story;
            const match = card.dataset.match;

            const roleKey = card.dataset.roleKey;
            const storyKey = card.dataset.storyKey;
            let finalRole = role;
            let finalStory = story;

            if (typeof getText === 'function') {
                const lang = localStorage.getItem('language') || 'es';
                if (roleKey) finalRole = getText(lang, roleKey) || role;
                if (storyKey) finalStory = getText(lang, storyKey) || story;
            }

            // Fill Data
            document.getElementById('modal-name').textContent = name;
            document.getElementById('modal-role').textContent = finalRole;
            document.getElementById('modal-story').textContent = finalStory;
            document.getElementById('modal-match').textContent = match;
            document.getElementById('modal-img').src = image;

            // Show
            modal.classList.add('active');
            document.body.style.overflow = 'hidden'; // Prevent scrolling
        });
    });

    // Close Modal Function
    const closeModal = () => {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    };

    closeBtn.addEventListener('click', closeModal);

    // Close on click outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    // Close on Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeModal();
        }
    });

    /* =========================================
       THEME TOGGLE (Dark/Light)
       ========================================= */
    const themeBtn = document.getElementById('theme-toggle');
    const themeIcon = themeBtn.querySelector('i');

    // Check saved theme or default to dark
    const savedTheme = localStorage.getItem('theme');
    const systemAccentsLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;

    // Default is dark. If saved is light, apply it.
    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
        themeIcon.classList.remove('fa-sun');
        themeIcon.classList.add('fa-moon');
    }

    themeBtn.addEventListener('click', () => {
        document.body.classList.toggle('light-mode');
        const isLight = document.body.classList.contains('light-mode');

        // Update Icon
        if (isLight) {
            themeIcon.classList.remove('fa-sun');
            themeIcon.classList.add('fa-moon');
            localStorage.setItem('theme', 'light');
        } else {
            themeIcon.classList.remove('fa-moon');
            themeIcon.classList.add('fa-sun');
            localStorage.setItem('theme', 'dark');
        }
    });

    /* =========================================
       MULTILANGUAGE LOGIC
       ========================================= */
    const translations = {
        es: {
            nav_home: "Inicio",
            nav_services: "Servicios",
            nav_experts: "Expertos",
            nav_contact: "Contacto",
            hero_title: "Cortes con <br> <span>Distinción</span>",
            hero_subtitle: "EXPERIMENTA EL ARTE DE LA BARBERÍA CLÁSICA CON UN TOQUE MODERNO.",
            btn_services: "VER SERVICIOS",
            btn_book: "RESERVAR CITA",
            team_title: "Nuestros <br> <span>Expertos</span>",
            team_subtitle: "Maestros de la tijera y la navaja"
        },
        en: {
            nav_home: "Home",
            nav_services: "Services",
            nav_experts: "Experts",
            nav_contact: "Contact",
            hero_title: "Cuts with <br> <span>Distinction</span>",
            hero_subtitle: "EXPERIENCE THE ART OF CLASSIC BARBERING WITH A MODERN TOUCH.",
            btn_services: "VIEW SERVICES",
            btn_book: "BOOK APPOINTMENT",
            team_title: "Our <br> <span>Experts</span>",
            team_subtitle: "Masters of scissors and razor"
        }
    };

    const langBtn = document.getElementById('lang-toggle');
    const langText = langBtn.querySelector('.lang-text');
    let currentLang = localStorage.getItem('language') || 'es';

    function updateLanguage(lang) {
        const texts = translations[lang];
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.dataset.i18n;
            if (texts[key]) {
                el.innerHTML = texts[key]; // innerHTML to preserve spans/br
            }
        });
        langText.textContent = lang.toUpperCase();
        localStorage.setItem('language', lang);
    }

    // Init Language
    updateLanguage(currentLang);

    langBtn.addEventListener('click', () => {
        currentLang = currentLang === 'es' ? 'en' : 'es';
        updateLanguage(currentLang);
    });

});

/* --- CONTACT FORM EMAILJS --- */
function initContactForm() {
    const form = document.getElementById('contact-form');
    if (!form) return;

    form.addEventListener('submit', function (e) {
        e.preventDefault();

        const btn = document.getElementById('submit-btn');
        const status = document.getElementById('form-status');
        const honeypot = form.querySelector('[name="company_website"]');

        // 1. Honeypot Anti-Spam
        if (honeypot && honeypot.value) {
            console.warn("Bot detected via honeypot.");
            return;
        }

        // 2. Loading State
        const originalText = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> ENVIANDO...';
        status.className = 'form-status';
        status.textContent = '';

        // 3. Send via EmailJS
        emailjs.sendForm('service_jjmxeqg', 'template_i5lr0ow', this)
            .then(() => {
                status.textContent = '¡Mensaje enviado con éxito! Nos pondremos en contacto pronto.';
                status.classList.add('success');
                form.reset();
                setTimeout(() => {
                    status.textContent = '';
                    status.classList.remove('success');
                }, 5000);
            })
            .catch((err) => {
                console.error('EmailJS Error:', err);
                status.textContent = 'Ocurrió un error. Por favor verifica tu conexión o llámanos.';
                status.classList.add('error');
            })
            .finally(() => {
                btn.disabled = false;
                btn.innerHTML = originalText;
            });
    });

    // Simple Real-time Validation Visuals
    const inputs = form.querySelectorAll('input, textarea');
    inputs.forEach(input => {
        input.addEventListener('input', () => {
            if (input.checkValidity()) {
                input.classList.remove('invalid');
                input.classList.add('valid');
            } else {
                input.classList.remove('valid');
                if (input.value.length > 0) input.classList.add('invalid');
            }
        });
    });
}
/**
 * Close Service Modal (Global)
 */
function closeServiceModal() {
    const modal = document.getElementById('svc-modal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';

        // Stop any playing video in modal if applicable
        const visual = modal.querySelector('.svc-modal-visual');
        if (visual) {
            visual.innerHTML = '<img id="modal-img" src="" alt="Service Image">';
        }
    }
}
