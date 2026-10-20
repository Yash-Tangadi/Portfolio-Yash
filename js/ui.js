const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");

function safeStorage() {
    try {
        return window.localStorage;
    } catch {
        return null;
    }
}

function initHeader() {
    const header = document.querySelector("[data-header]");
    const menuButton = document.querySelector("[data-menu-toggle]");
    const navigation = document.querySelector("[data-navigation]");
    if (!header || !menuButton || !navigation) return;

    let ticking = false;
    const updateHeader = () => {
        header.classList.toggle("is-scrolled", window.scrollY > 18);
        ticking = false;
    };
    window.addEventListener("scroll", () => {
        if (!ticking) {
            ticking = true;
            requestAnimationFrame(updateHeader);
        }
    }, { passive: true });
    updateHeader();

    const setMenu = (open) => {
        menuButton.setAttribute("aria-expanded", String(open));
        menuButton.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
        navigation.classList.toggle("is-open", open);
        document.body.classList.toggle("menu-open", open);
    };

    menuButton.addEventListener("click", () => setMenu(menuButton.getAttribute("aria-expanded") !== "true"));
    navigation.addEventListener("click", (event) => {
        if (event.target.closest("a")) setMenu(false);
    });
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") setMenu(false);
    });
    window.addEventListener("resize", () => {
        if (window.innerWidth > 860) setMenu(false);
    }, { passive: true });
}

function initTheme() {
    const button = document.querySelector("[data-theme-toggle]");
    if (!button) return;

    const storage = safeStorage();
    const saved = storage?.getItem("portfolio-theme");
    const initial = saved === "light" || saved === "dark" ? saved : "dark";

    const applyTheme = (theme) => {
        document.documentElement.dataset.theme = theme;
        button.setAttribute("aria-label", `Switch to ${theme === "dark" ? "light" : "dark"} theme`);
        button.setAttribute("aria-pressed", String(theme === "light"));
    };

    applyTheme(initial);
    button.addEventListener("click", () => {
        const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
        applyTheme(next);
        try {
            storage?.setItem("portfolio-theme", next);
        } catch {
            // The theme still works when storage is unavailable.
        }
    });
}

function initRoleRotation() {
    const role = document.querySelector("[data-rotating-role]");
    if (!role || reduceMotion.matches) return;

    const phrases = ["event-driven systems.", "resilient microservices.", "enterprise integrations."];
    let index = 0;

    window.setInterval(() => {
        role.classList.add("is-changing");
        window.setTimeout(() => {
            index = (index + 1) % phrases.length;
            role.textContent = phrases[index];
            role.classList.remove("is-changing");
        }, 220);
    }, 3200);
}

function initExpandableCards() {
    const cards = [...document.querySelectorAll("[data-tech-card]")];
    cards.forEach((card) => {
        card.addEventListener("click", () => {
            const expand = card.getAttribute("aria-expanded") !== "true";
            cards.forEach((item) => item.setAttribute("aria-expanded", "false"));
            card.setAttribute("aria-expanded", String(expand));
        });
    });
}

function initTilt() {
    if (!finePointer.matches || reduceMotion.matches) return;

    document.querySelectorAll(".tilt-card").forEach((card) => {
        let frame = 0;
        card.addEventListener("pointermove", (event) => {
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(() => {
                const rect = card.getBoundingClientRect();
                const x = (event.clientX - rect.left) / rect.width - 0.5;
                const y = (event.clientY - rect.top) / rect.height - 0.5;
                card.style.setProperty("--ry", `${x * 8}deg`);
                card.style.setProperty("--rx", `${y * -8}deg`);
            });
        });
        card.addEventListener("pointerleave", () => {
            card.style.setProperty("--ry", "0deg");
            card.style.setProperty("--rx", "0deg");
        });
    });

    document.querySelectorAll(".magnetic").forEach((item) => {
        item.addEventListener("pointermove", (event) => {
            const rect = item.getBoundingClientRect();
            const x = (event.clientX - rect.left - rect.width / 2) * 0.12;
            const y = (event.clientY - rect.top - rect.height / 2) * 0.12;
            item.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        });
        item.addEventListener("pointerleave", () => {
            item.style.transform = "";
        });
    });
}

function initCursorGlow() {
    const glow = document.querySelector("[data-cursor-glow]");
    if (!glow || !finePointer.matches || reduceMotion.matches) return;

    let x = 0;
    let y = 0;
    let frame = 0;
    window.addEventListener("pointermove", (event) => {
        x = event.clientX;
        y = event.clientY;
        glow.classList.add("is-visible");
        if (!frame) {
            frame = requestAnimationFrame(() => {
                glow.style.transform = `translate3d(${x}px, ${y}px, 0)`;
                frame = 0;
            });
        }
    }, { passive: true });
    document.documentElement.addEventListener("mouseleave", () => glow.classList.remove("is-visible"));
}

function initDetailsDialog() {
    const dialog = document.querySelector("[data-detail-dialog]");
    const title = document.querySelector("[data-detail-dialog-title]");
    const copy = document.querySelector("[data-detail-dialog-copy]");
    const close = document.querySelector("[data-dialog-close]");
    if (!dialog || !title || !copy || !close) return;

    let opener = null;
    document.querySelectorAll("[data-detail-id]").forEach((button) => {
        button.addEventListener("click", () => {
            const source = document.getElementById(button.dataset.detailId);
            if (!source) return;
            opener = button;
            title.textContent = source.dataset.detailTitle || "Experience details";
            copy.replaceChildren(...[...source.children].map((child) => child.cloneNode(true)));
            if (typeof dialog.showModal === "function") dialog.showModal();
            else dialog.setAttribute("open", "");
        });
    });

    const closeDialog = () => {
        if (typeof dialog.close === "function") dialog.close();
        else dialog.removeAttribute("open");
    };
    close.addEventListener("click", closeDialog);
    dialog.addEventListener("click", (event) => {
        if (event.target === dialog) closeDialog();
    });
    dialog.addEventListener("close", () => opener?.focus());
}

function initCopyEmail() {
    const button = document.querySelector("[data-copy-email]");
    const toast = document.querySelector("[data-toast]");
    if (!button || !toast) return;

    let timer = 0;
    const showToast = (message) => {
        toast.textContent = message;
        toast.classList.add("is-visible");
        clearTimeout(timer);
        timer = window.setTimeout(() => toast.classList.remove("is-visible"), 2400);
    };

    const legacyCopy = (text) => {
        const input = document.createElement("textarea");
        input.value = text;
        input.setAttribute("readonly", "");
        input.style.position = "fixed";
        input.style.opacity = "0";
        document.body.append(input);
        input.select();
        const copied = document.execCommand("copy");
        input.remove();
        return copied;
    };

    button.addEventListener("click", async () => {
        try {
            if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(button.dataset.copyEmail);
            else if (!legacyCopy(button.dataset.copyEmail)) throw new Error("Copy unavailable");
            showToast("Email copied to clipboard");
        } catch {
            showToast("Copy failed — email is shown above");
        }
    });
}

export function initUi() {
    initHeader();
    initTheme();
    initRoleRotation();
    initExpandableCards();
    initTilt();
    initCursorGlow();
    initDetailsDialog();
    initCopyEmail();

    const year = document.querySelector("[data-current-year]");
    if (year) year.textContent = new Date().getFullYear();
}
