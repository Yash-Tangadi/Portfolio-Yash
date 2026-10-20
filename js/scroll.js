const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function setCounterValues() {
    document.querySelectorAll("[data-counter]").forEach((counter) => {
        counter.textContent = counter.dataset.counter;
    });
}

function animateCounter(counter) {
    const target = Number(counter.dataset.counter || 0);
    const duration = 1000;
    const started = performance.now();

    const tick = (now) => {
        const progress = Math.min((now - started) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        counter.textContent = Math.round(target * eased);
        if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
}

function initCounters() {
    const group = document.querySelector("[data-counter-group]");
    if (!group || reduceMotion || !("IntersectionObserver" in window)) {
        setCounterValues();
        return;
    }

    group.querySelectorAll("[data-counter]").forEach((counter) => { counter.textContent = "0"; });
    const observer = new IntersectionObserver((entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        group.querySelectorAll("[data-counter]").forEach(animateCounter);
        observer.disconnect();
    }, { threshold: 0.4 });
    observer.observe(group);
}

function initArchitecture() {
    const section = document.querySelector("[data-architecture]");
    const svg = section?.querySelector("svg");
    if (!section || !svg) return;

    const pause = () => {
        if (typeof svg.pauseAnimations === "function") svg.pauseAnimations();
    };
    const play = () => {
        if (!reduceMotion && !document.hidden && typeof svg.unpauseAnimations === "function") svg.unpauseAnimations();
    };

    if (reduceMotion || !("IntersectionObserver" in window)) {
        section.classList.add("is-active");
        if (reduceMotion) pause();
        return;
    }

    const observer = new IntersectionObserver(([entry]) => {
        section.classList.toggle("is-active", entry.isIntersecting);
        if (entry.isIntersecting) play(); else pause();
    }, { rootMargin: "15% 0px", threshold: 0.05 });
    observer.observe(section);
    document.addEventListener("visibilitychange", () => document.hidden ? pause() : play());
}

function initWithoutGsap() {
    document.querySelectorAll("[data-reveal]").forEach((element) => element.classList.add("is-visible"));
    const progress = document.querySelector("[data-scroll-progress]");
    if (!progress) return;

    let ticking = false;
    const update = () => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const ratio = max > 0 ? window.scrollY / max : 0;
        progress.style.transform = `scaleX(${Math.min(Math.max(ratio, 0), 1)})`;
        ticking = false;
    };
    window.addEventListener("scroll", () => {
        if (!ticking) {
            ticking = true;
            requestAnimationFrame(update);
        }
    }, { passive: true });
    update();
}

function initGsap() {
    const { gsap, ScrollTrigger } = window;
    gsap.registerPlugin(ScrollTrigger);

    document.querySelectorAll("[data-reveal]").forEach((element) => {
        gsap.fromTo(element,
            { autoAlpha: 0, y: 30 },
            {
                autoAlpha: 1,
                y: 0,
                duration: 0.7,
                ease: "power3.out",
                onStart: () => element.classList.add("is-visible"),
                scrollTrigger: { trigger: element, start: "top 88%", once: true }
            }
        );
    });

    const pageProgress = document.querySelector("[data-scroll-progress]");
    if (pageProgress) {
        gsap.to(pageProgress, { scaleX: 1, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: 0.2 } });
    }

    const journey = document.querySelector("[data-experience] .journey");
    const rail = document.querySelector("[data-journey-progress]");
    const marker = document.querySelector("[data-journey-marker]");
    if (journey && rail && marker) {
        const settings = { trigger: journey, start: "top 66%", end: "bottom 58%", scrub: true };
        gsap.to(rail, { scaleY: 1, ease: "none", scrollTrigger: settings });
        gsap.to(marker, { top: "100%", ease: "none", scrollTrigger: { ...settings } });
    }

    ScrollTrigger.refresh();
}

export function initScrollStory() {
    initCounters();
    initArchitecture();

    if (reduceMotion || !window.gsap || !window.ScrollTrigger) {
        initWithoutGsap();
        return;
    }
    initGsap();
}
