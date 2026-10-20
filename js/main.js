document.documentElement.classList.add('js');

const root = document.documentElement;
const header = document.querySelector('[data-header]');
const menuToggle = document.querySelector('[data-menu-toggle]');
const navigation = document.querySelector('[data-navigation]');
const themeToggle = document.querySelector('[data-theme-toggle]');
const year = document.querySelector('[data-current-year]');

const readTheme = () => {
    try {
        const savedTheme = localStorage.getItem('portfolio-theme');
        return savedTheme === 'light' || savedTheme === 'dark' ? savedTheme : null;
    } catch {
        return null;
    }
};

const systemTheme = () => window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

const updateThemeButton = () => {
    if (!themeToggle) return;
    const activeTheme = root.dataset.theme || systemTheme();
    const nextTheme = activeTheme === 'dark' ? 'light' : 'dark';
    themeToggle.setAttribute('aria-label', `Switch to ${nextTheme} theme`);
};

const savedTheme = readTheme();
if (savedTheme) root.dataset.theme = savedTheme;
updateThemeButton();

themeToggle?.addEventListener('click', () => {
    const nextTheme = (root.dataset.theme || systemTheme()) === 'dark' ? 'light' : 'dark';
    root.dataset.theme = nextTheme;
    try {
        localStorage.setItem('portfolio-theme', nextTheme);
    } catch {
        // The selected theme still applies for this visit when storage is unavailable.
    }
    updateThemeButton();
});

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (!root.dataset.theme) updateThemeButton();
});

const closeMenu = ({ restoreFocus = false } = {}) => {
    if (!menuToggle || !navigation) return;
    navigation.classList.remove('is-open');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Open navigation');
    if (restoreFocus) menuToggle.focus();
};

menuToggle?.addEventListener('click', () => {
    const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
    navigation?.classList.toggle('is-open', !isOpen);
    menuToggle.setAttribute('aria-expanded', String(!isOpen));
    menuToggle.setAttribute('aria-label', isOpen ? 'Open navigation' : 'Close navigation');
});

navigation?.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => closeMenu());
});

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menuToggle?.getAttribute('aria-expanded') === 'true') {
        closeMenu({ restoreFocus: true });
    }
});

document.addEventListener('click', (event) => {
    if (menuToggle?.getAttribute('aria-expanded') !== 'true') return;
    if (!header?.contains(event.target)) closeMenu();
});

let headerIsScrolled = window.scrollY > 8;
let headerFrame = 0;

header?.classList.toggle('is-scrolled', headerIsScrolled);

const scheduleHeaderUpdate = () => {
    if (headerFrame) return;

    headerFrame = window.requestAnimationFrame(() => {
        const nextState = window.scrollY > 8;
        if (nextState !== headerIsScrolled) {
            headerIsScrolled = nextState;
            header?.classList.toggle('is-scrolled', headerIsScrolled);
        }
        headerFrame = 0;
    });
};

window.addEventListener('scroll', scheduleHeaderUpdate, { passive: true });

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const revealItems = document.querySelectorAll('.reveal');

if (reduceMotion || !('IntersectionObserver' in window)) {
    revealItems.forEach((item) => item.classList.add('is-visible'));
} else {
    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
        });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    revealItems.forEach((item) => revealObserver.observe(item));
}

if (year) year.textContent = String(new Date().getFullYear());
