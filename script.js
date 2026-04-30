document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Native Scroll Reveal
    const animatedElements = document.querySelectorAll('.reveal, .parallax-title');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            } else {
                if (entry.boundingClientRect.top > 0) {
                    entry.target.classList.remove('active');
                }
            }
        });
    }, {
        threshold: 0.1, 
        rootMargin: "0px 0px -10% 0px"
    });

    animatedElements.forEach(el => observer.observe(el));

    // 2. Hero Section Parallax & Navbar
    const heroContent = document.querySelector('.hero-content');
    const nav = document.querySelector('nav');
    
    let lastScrollY = window.scrollY;
    let ticking = false;

    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                const scrollY = window.scrollY;

                // Navbar Logic
                if (scrollY > 50) {
                    if (scrollY > lastScrollY) {
                        nav.classList.add('nav-hidden');
                    } else {
                        nav.classList.remove('nav-hidden');
                    }
                } else {
                    nav.classList.remove('nav-hidden');
                }
                lastScrollY = scrollY;

                // Hero Parallax Logic
                if (heroContent && scrollY <= window.innerHeight) {
                    const opacity = 1 - (scrollY / 500);
                    const yPos = scrollY * 0.4;
                    
                    heroContent.style.opacity = Math.max(0, opacity);
                    heroContent.style.transform = `translate3d(0, ${yPos}px, 0)`;
                }

                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true }); 

});