(function () {
    'use strict';

    const container = document.getElementById('canvas-container');
    const sections = [...document.querySelectorAll('.scroll-section[data-model]')];
    const loadingLabel = document.getElementById('robot-loading');
    const dependenciesReady = window.THREE && THREE.GLTFLoader && THREE.DRACOLoader && window.gsap && window.ScrollTrigger && window.RobotSceneUtils;

    if (!container || !sections.length || !dependenciesReady) {
        if (container) container.hidden = true;
        console.warn('La scène 3D ne peut pas démarrer : une dépendance est indisponible.');
        return;
    }

    gsap.registerPlugin(ScrollTrigger);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 1.25, 6);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.insertBefore(renderer.domElement, loadingLabel);

    scene.add(new THREE.HemisphereLight(0xe0f2fe, 0x172554, 1.45));
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    keyLight.position.set(4, 7, 6);
    keyLight.castShadow = true;
    scene.add(keyLight);
    const rimLight = new THREE.DirectionalLight(0x818cf8, 1.4);
    rimLight.position.set(-5, 3, -4);
    scene.add(rimLight);

    const dracoLoader = new THREE.DRACOLoader();
    dracoLoader.setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/libs/draco/');
    dracoLoader.setDecoderConfig({ type: 'js' });
    const loader = new THREE.GLTFLoader();
    loader.setDRACOLoader(dracoLoader);
    const modelCache = new Map();
    const clock = new THREE.Clock();
    let activeRobot = null;
    let activeMixer = null;
    let activeModelName = '';
    let requestedModel = '';
    let desiredRotation = 0;

    function setLoading(isLoading, message = 'Chargement du modèle 3D…') {
        loadingLabel.textContent = message;
        loadingLabel.classList.toggle('is-visible', isLoading);
    }

    function prepareModel(gltf) {
        const robot = new THREE.Group();
        const model = gltf.scene;
        const bounds = new THREE.Box3().setFromObject(model);
        const transform = RobotSceneUtils.getNormalizedTransform(bounds.min, bounds.max);

        model.scale.setScalar(transform.scale);
        model.position.set(transform.position.x, transform.position.y, transform.position.z);
        model.traverse((node) => {
            if (!node.isMesh) return;
            node.castShadow = true;
            node.receiveShadow = true;
        });
        robot.add(model);
        robot.userData.animations = gltf.animations || [];
        return robot;
    }

    function fetchModel(name) {
        if (!modelCache.has(name)) {
            const request = new Promise((resolve, reject) => {
                loader.load(
                    `models/${name}.glb`,
                    (gltf) => {
                        try { resolve(prepareModel(gltf)); } catch (error) { reject(error); }
                    },
                    undefined,
                    reject
                );
            });
            modelCache.set(name, request);
            request.catch(() => modelCache.delete(name));
        }
        return modelCache.get(name);
    }

    async function showModel(name, rotation = 0) {
        if (!name || (name === activeModelName && activeRobot)) return;
        requestedModel = name;
        setLoading(true);

        try {
            const cachedRobot = await fetchModel(name);
            if (requestedModel !== name) return;

            const nextRobot = cachedRobot.clone(true);
            nextRobot.scale.setScalar(0.88);
            nextRobot.rotation.y = rotation;
            positionRobot(nextRobot);
            scene.add(nextRobot);

            if (activeRobot) scene.remove(activeRobot);
            if (activeMixer) activeMixer.stopAllAction();
            activeRobot = nextRobot;
            activeModelName = name;
            desiredRotation = rotation;

            const animations = cachedRobot.userData.animations || [];
            activeMixer = animations.length ? new THREE.AnimationMixer(nextRobot.children[0]) : null;
            if (activeMixer) animations.forEach((clip) => activeMixer.clipAction(clip).play());

            gsap.to(activeRobot.scale, { x: 1, y: 1, z: 1, duration: 0.45, ease: 'back.out(1.4)' });
            preloadFollowingModel(name);
        } catch (error) {
            console.error(`Impossible de charger ${name}.glb`, error);
            setLoading(true, 'Modèle 3D indisponible');
            return;
        }
        setLoading(false);
    }

    function preloadFollowingModel(name) {
        const index = sections.findIndex((section) => section.dataset.model === name);
        const nextName = sections[index + 1] && sections[index + 1].dataset.model;
        if (nextName) fetchModel(nextName).catch(() => {});
    }

    function positionRobot(robot = activeRobot) {
        if (!robot) return;
        const mobile = window.innerWidth < 768;
        robot.position.x = mobile ? 0 : Math.min(1.65, window.innerWidth / 850);
        robot.position.y = mobile ? 0.65 : -0.8;
    }

    function initScroll() {
        sections.forEach((section) => {
            const card = section.querySelector('.text-card');
            gsap.fromTo(card, { opacity: 0, y: 50 }, {
                opacity: 1,
                y: 0,
                ease: 'power2.out',
                scrollTrigger: { trigger: section, start: 'top 82%', end: 'top 38%', scrub: 0.5 }
            });

            ScrollTrigger.create({
                trigger: section,
                start: 'top center',
                end: 'bottom center',
                onEnter: () => showModel(section.dataset.model, Number(section.dataset.rotation) || 0),
                onEnterBack: () => showModel(section.dataset.model, Number(section.dataset.rotation) || 0)
            });
        });

        ScrollTrigger.create({
            trigger: sections[0],
            endTrigger: sections[sections.length - 1],
            start: 'top bottom',
            end: 'bottom top',
            onToggle: (self) => container.classList.toggle('is-active', self.isActive)
        });
    }

    function animate() {
        requestAnimationFrame(animate);
        const delta = Math.min(clock.getDelta(), 0.05);
        const elapsed = clock.elapsedTime;
        if (activeMixer) activeMixer.update(delta);
        if (activeRobot) {
            activeRobot.rotation.y += (desiredRotation + Math.sin(elapsed * 0.45) * 0.08 - activeRobot.rotation.y) * 0.04;
            activeRobot.position.y += (Math.sin(elapsed * 1.5) * 0.045 + (window.innerWidth < 768 ? 0.65 : -0.8) - activeRobot.position.y) * 0.1;
        }
        renderer.render(scene, camera);
    }

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        positionRobot();
        ScrollTrigger.refresh();
    });

    showModel(sections[0].dataset.model, Number(sections[0].dataset.rotation) || 0);
    initScroll();
    animate();
}());
