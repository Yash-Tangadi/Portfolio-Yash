import { initUi } from "./ui.js";
import { initHeroScene } from "./hero-scene.js";
import { initScrollStory } from "./scroll.js";

document.documentElement.classList.add("js");

function start() {
    initUi();
    initScrollStory();

    const launchScene = () => initHeroScene();
    if ("requestIdleCallback" in window) {
        window.requestIdleCallback(launchScene, { timeout: 800 });
    } else {
        window.setTimeout(launchScene, 80);
    }
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
} else {
    start();
}
