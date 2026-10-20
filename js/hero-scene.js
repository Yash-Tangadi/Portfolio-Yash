const THREE_URL = "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.min.js";

function canUseWebGl() {
    try {
        const canvas = document.createElement("canvas");
        return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
    } catch {
        return false;
    }
}

function isLowEndDevice() {
    const memory = navigator.deviceMemory;
    const cores = navigator.hardwareConcurrency;
    return (typeof memory === "number" && memory <= 2) || (typeof cores === "number" && cores <= 2);
}

export async function initHeroScene() {
    const hero = document.querySelector("[data-hero]");
    const canvas = document.querySelector("[data-hero-canvas]");
    const loader = document.querySelector("[data-scene-loader]");
    if (!hero || !canvas || !loader) return;

    const useFallback = () => {
        hero.classList.remove("webgl-ready");
        hero.classList.add("scene-fallback");
        loader.hidden = true;
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || isLowEndDevice() || !canUseWebGl()) {
        useFallback();
        return;
    }

    const safetyTimer = window.setTimeout(useFallback, 4000);

    try {
        const THREE = await import(THREE_URL);
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 100);
        camera.position.set(0, 0, 7.6);

        const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: "high-performance" });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth < 700 ? 1.25 : 1.75));
        renderer.setClearColor(0x000000, 0);
        canvas.setAttribute("aria-hidden", "true");

        const graph = new THREE.Group();
        scene.add(graph);

        const positions = [
            [-2.8, 0.7, 0.2], [-1.5, -1.05, -0.25], [-0.4, 1.35, 0.1],
            [0.65, -0.2, 0.6], [1.65, 1.05, -0.35], [2.75, -0.55, 0.1], [0.15, -1.75, -0.55]
        ].map(([x, y, z]) => new THREE.Vector3(x, y, z));
        const connections = [[0, 1], [0, 2], [1, 3], [2, 3], [2, 4], [3, 4], [3, 5], [3, 6], [4, 5], [6, 5]];
        const curves = connections.map(([from, to]) => new THREE.LineCurve3(positions[from], positions[to]));

        const linePoints = [];
        connections.forEach(([from, to]) => linePoints.push(...positions[from].toArray(), ...positions[to].toArray()));
        const lineGeometry = new THREE.BufferGeometry();
        lineGeometry.setAttribute("position", new THREE.Float32BufferAttribute(linePoints, 3));
        graph.add(new THREE.LineSegments(lineGeometry, new THREE.LineBasicMaterial({ color: 0x6ee7f9, transparent: true, opacity: 0.23 })));

        const nodeGeometry = new THREE.IcosahedronGeometry(0.16, 1);
        const ringGeometry = new THREE.RingGeometry(0.23, 0.27, 30);
        const nodes = [];
        positions.forEach((position, index) => {
            const node = new THREE.Group();
            const color = index % 3 === 0 ? 0x9b7bff : 0x6ee7f9;
            node.add(new THREE.Mesh(nodeGeometry, new THREE.MeshBasicMaterial({ color })));
            const ring = new THREE.Mesh(ringGeometry, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.22, side: THREE.DoubleSide }));
            ring.scale.setScalar(1.35);
            node.add(ring);
            node.position.copy(position);
            graph.add(node);
            nodes.push(node);
        });

        const particleCount = window.innerWidth < 700 ? 72 : 140;
        const particlePositions = new Float32Array(particleCount * 3);
        const particleGeometry = new THREE.BufferGeometry();
        particleGeometry.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
        const particleMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.055, transparent: true, opacity: 0.88, depthWrite: false });
        const particles = new THREE.Points(particleGeometry, particleMaterial);
        graph.add(particles);
        const particleData = Array.from({ length: particleCount }, (_, index) => ({
            curve: curves[index % curves.length],
            offset: Math.random(),
            speed: 0.055 + Math.random() * 0.09
        }));

        let width = 0;
        let height = 0;
        const resize = () => {
            const rect = hero.getBoundingClientRect();
            width = Math.max(1, Math.round(rect.width));
            height = Math.max(1, Math.round(rect.height));
            renderer.setSize(width, height, false);
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            graph.scale.setScalar(width < 650 ? 0.68 : Math.min(1.08, width / 1250));
        };
        const resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(hero);
        resize();

        const target = { x: 0, y: 0 };
        hero.addEventListener("pointermove", (event) => {
            const rect = hero.getBoundingClientRect();
            target.y = ((event.clientX - rect.left) / rect.width - 0.5) * 0.34;
            target.x = ((event.clientY - rect.top) / rect.height - 0.5) * -0.24;
        }, { passive: true });
        hero.addEventListener("pointerleave", () => { target.x = 0; target.y = 0; });

        if (typeof window.DeviceOrientationEvent !== "undefined" && typeof window.DeviceOrientationEvent.requestPermission !== "function") {
            window.addEventListener("deviceorientation", (event) => {
                target.y = Math.max(-0.2, Math.min(0.2, (event.gamma || 0) / 150));
                target.x = Math.max(-0.16, Math.min(0.16, (event.beta || 0) / 300));
            }, { passive: true });
        }

        let visible = true;
        let frame = 0;
        let startTime = performance.now();
        const render = (now) => {
            if (!visible || document.hidden) {
                frame = 0;
                return;
            }
            const elapsed = (now - startTime) / 1000;
            graph.rotation.x += (target.x - graph.rotation.x) * 0.035;
            graph.rotation.y += (target.y - graph.rotation.y) * 0.035;
            graph.rotation.z = Math.sin(elapsed * 0.18) * 0.025;

            nodes.forEach((node, index) => {
                const pulse = 1 + Math.sin(elapsed * 1.4 + index * 0.9) * 0.08;
                node.scale.setScalar(pulse);
                node.children[1].lookAt(camera.position);
            });
            particleData.forEach((data, index) => {
                const point = data.curve.getPointAt((data.offset + elapsed * data.speed) % 1);
                particlePositions[index * 3] = point.x;
                particlePositions[index * 3 + 1] = point.y;
                particlePositions[index * 3 + 2] = point.z;
            });
            particleGeometry.attributes.position.needsUpdate = true;
            renderer.render(scene, camera);
            frame = requestAnimationFrame(render);
        };

        const observer = new IntersectionObserver(([entry]) => {
            visible = entry.isIntersecting;
            if (visible && !frame) frame = requestAnimationFrame(render);
        }, { threshold: 0.01 });
        observer.observe(hero);
        document.addEventListener("visibilitychange", () => {
            if (!document.hidden && visible && !frame) {
                startTime = performance.now();
                frame = requestAnimationFrame(render);
            }
        });

        renderer.render(scene, camera);
        clearTimeout(safetyTimer);
        hero.classList.add("webgl-ready");
        hero.classList.remove("scene-fallback");
        loader.hidden = true;
        frame = requestAnimationFrame(render);

        window.addEventListener("pagehide", () => {
            cancelAnimationFrame(frame);
            observer.disconnect();
            resizeObserver.disconnect();
            renderer.dispose();
            lineGeometry.dispose();
            nodeGeometry.dispose();
            ringGeometry.dispose();
            particleGeometry.dispose();
            particleMaterial.dispose();
        }, { once: true });
    } catch (error) {
        clearTimeout(safetyTimer);
        useFallback();
        console.warn("Interactive hero unavailable; using static system map.", error);
    }
}
