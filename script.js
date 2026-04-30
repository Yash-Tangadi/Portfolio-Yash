document.addEventListener('DOMContentLoaded', () => {
    // 1. Repeating Reveal Animation
    const reveals = document.querySelectorAll('.reveal');
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            } else {
                // Remove the class when it leaves the screen to re-trigger later
                entry.target.classList.remove('active');
            }
        });
    }, observerOptions);

    reveals.forEach(reveal => observer.observe(reveal));

    // 2. Universal Parallax Animation on Scroll
    window.addEventListener('scroll', () => {
        const scrolled = window.scrollY;
        
        // Original Hero Parallax
        const heroContent = document.querySelector('.hero-content');
        if (heroContent && scrolled < window.innerHeight) {
            const opacity = 1 - (scrolled / 600);
            const translateY = scrolled * 0.4;
            const scale = 1 - (scrolled * 0.0005);
            heroContent.style.transform = `translateY(${translateY}px) scale(${scale})`;
            heroContent.style.opacity = Math.max(0, opacity);
        }

        // Apply similar dynamic scroll effect to Section Titles and Footer
        const parallaxTitles = document.querySelectorAll('.parallax-title');
        parallaxTitles.forEach(title => {
            const rect = title.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            
            if (rect.top < viewportHeight && rect.bottom > 0) {
                const scrollProgress = 1 - (rect.top / viewportHeight);
                
                let opacity = 1;
                let scale = 1;
                let translateY = 0;

                // Fading in from bottom
                if (scrollProgress < 0.4) {
                    const enterProgress = scrollProgress / 0.4;
                    opacity = enterProgress;
                    translateY = 50 * (1 - enterProgress);
                    scale = 0.95 + (0.05 * enterProgress);
                } 
                // Fading out at top
                else if (scrollProgress > 0.7) {
                    const leaveProgress = (scrollProgress - 0.7) / 0.3;
                    opacity = 1 - leaveProgress;
                    translateY = -(50 * leaveProgress);
                    scale = 1 - (0.05 * leaveProgress);
                }

                title.style.opacity = Math.max(0, opacity);
                title.style.transform = `translateY(${translateY}px) scale(${scale})`;
            }
        });
    });
});