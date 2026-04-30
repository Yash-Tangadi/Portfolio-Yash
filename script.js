document.addEventListener('DOMContentLoaded', () => {
    // ----------------------------------------------------------------------
    // 1. Fluid Scroll Animations (Using requestAnimationFrame)
    // ----------------------------------------------------------------------

    // Pre-calculate elements to animate
    const animatableElements = [];
    
    // Add Reveal Elements (Cards, Text blocks)
    document.querySelectorAll('.reveal').forEach((el) => {
        let offsetMultiplier = 1;
        if (el.classList.contains('stagger-2')) offsetMultiplier = 1.2;
        if (el.classList.contains('stagger-3')) offsetMultiplier = 1.4;
        if (el.classList.contains('stagger-4')) offsetMultiplier = 1.6;

        animatableElements.push({
            node: el,
            type: 'reveal',
            offset: 40 * offsetMultiplier, 
            opacity: 0,
            y: 40 
        });
    });

    // Add Parallax Titles
    document.querySelectorAll('.parallax-title').forEach((el) => {
        animatableElements.push({
            node: el,
            type: 'title',
            opacity: 0,
            y: 0,
            scale: 0.95
        });
    });

    // Hero Section
    const heroContent = document.querySelector('.hero-content');
    let heroState = {
        node: heroContent,
        opacity: 1,
        y: 0,
        scale: 1
    };

    // Navigation Hide/Show Logic
    const nav = document.querySelector('nav');
    let lastScrollY = window.scrollY;
    let isNavHidden = false;

    // Viewport dimensions
    let viewportHeight = window.innerHeight;
    
    window.addEventListener('resize', () => {
        viewportHeight = window.innerHeight;
    });

    let ticking = false;

    function updateDOM() {
        const scrollY = window.scrollY;

        // --- Nav Hide/Show ---
        if (scrollY > 50) {
            if (scrollY > lastScrollY && !isNavHidden) {
                nav.classList.add('nav-hidden');
                isNavHidden = true;
            } else if (scrollY < lastScrollY && isNavHidden) {
                nav.classList.remove('nav-hidden');
                isNavHidden = false;
            }
        } else {
             nav.classList.remove('nav-hidden');
             isNavHidden = false;
        }
        lastScrollY = scrollY;

        // --- Hero Parallax ---
        if (heroContent && scrollY < viewportHeight) {
            const scrollProgress = scrollY / viewportHeight;
            heroState.opacity = 1 - (scrollProgress * 1.5); 
            heroState.y = scrollY * 0.3; 
            heroState.scale = 1 - (scrollProgress * 0.05); 

            heroState.opacity = Math.max(0, Math.min(1, heroState.opacity));
            
            heroContent.style.opacity = heroState.opacity;
            heroContent.style.transform = `translate3d(0, ${heroState.y}px, 0) scale(${heroState.scale})`;
        }

        // --- General Elements Animation ---
        animatableElements.forEach(item => {
            const rect = item.node.getBoundingClientRect();
            
            if (rect.top < viewportHeight * 1.5 && rect.bottom > -viewportHeight * 0.5) {
                
                const elementCenter = rect.top + (rect.height / 2);
                const screenProgress = 1 - (elementCenter / viewportHeight);

                if (item.type === 'reveal') {
                    if (screenProgress > 0.1 && screenProgress < 1.2) {
                        let progress = (screenProgress - 0.1) / 0.4;
                        progress = Math.max(0, Math.min(1, progress)); 
                        
                        const easedProgress = 1 - Math.pow(1 - progress, 3);

                        item.opacity = easedProgress;
                        item.y = item.offset * (1 - easedProgress);
                    } else if (screenProgress <= 0.1) {
                        item.opacity = 0;
                        item.y = item.offset;
                    }

                    item.node.style.opacity = item.opacity;
                    item.node.style.transform = `translate3d(0, ${item.y}px, 0)`;
                } 
                else if (item.type === 'title') {
                    let opacity = 1;
                    let y = 0;
                    let scale = 1;

                    if (screenProgress < 0.3) {
                        const enterProgress = Math.max(0, screenProgress / 0.3);
                        opacity = enterProgress;
                        y = 30 * (1 - enterProgress); 
                        scale = 0.98 + (0.02 * enterProgress);
                    } 
                    else if (screenProgress > 0.8) {
                        const leaveProgress = Math.min(1, (screenProgress - 0.8) / 0.2);
                        opacity = 1 - leaveProgress;
                        y = -20 * leaveProgress;
                        scale = 1 - (0.02 * leaveProgress);
                    }

                    item.node.style.opacity = opacity;
                    item.node.style.transform = `translate3d(0, ${y}px, 0) scale(${scale})`;
                }
            }
        });

        ticking = false;
    }

    // Attach scroll event listener with passive flag for better mobile performance
    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(updateDOM);
            ticking = true;
        }
    }, { passive: true }); 

    // Initial render call
    updateDOM();
});