(function () {
    'use strict';

    const container = document.getElementById('canvas-container');
    const loadingLabel = document.getElementById('robot-loading');
    const dependenciesReady = window.THREE && THREE.GLTFLoader && THREE.DRACOLoader && window.gsap && window.ScrollTrigger && window.RobotSceneUtils;

    if (!container || !dependenciesReady) {
        if (container) container.hidden = true;
        console.warn('La scène 3D ne peut pas démarrer : une dépendance est indisponible.');
        return;
    }

    gsap.registerPlugin(ScrollTrigger);

    const models = [
        { name: 'robot_souriant', rotation: 0 },
        { name: 'robot_like', rotation: 0.18 },
        { name: 'robot_mainlevee', rotation: -0.18 },
        { name: 'robot_accroupi', rotation: 0.12 },
        { name: 'robot_assis', rotation: -0.12 },
        { name: 'robot_grimace', rotation: 0.08 },
        { name: 'robot_gauche', rotation: 0 },
        { name: 'robot_droite', rotation: 0 },
        { name: 'robot_bas', rotation: 0 }
    ];

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

    function preloadFollowingModel(name) {
        const index = models.findIndex((m) => m.name === name);
        const next = models[index + 1];
        if (next) fetchModel(next.name).catch(() => {});
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

    function positionRobot(robot = activeRobot) {
        if (!robot) return;
        const mobile = window.innerWidth < 768;
        robot.position.x = mobile ? 0 : Math.min(1.65, window.innerWidth / 850);
        robot.position.y = mobile ? 0.65 : -0.8;
    }

    function initScroll() {
        let lastIdx = -1;
        const totalHeight = document.documentElement.scrollHeight - window.innerHeight;

        ScrollTrigger.create({
            trigger: document.body,
            start: 'top top',
            end: 'bottom bottom',
            onUpdate: (self) => {
                const progress = self.progress;
                const idx = Math.min(Math.floor(progress * models.length), models.length - 1);

                container.classList.toggle('is-active', progress > 0.02 && progress < 0.98);

                if (idx !== lastIdx) {
                    lastIdx = idx;
                    showModel(models[idx].name, models[idx].rotation);
                }
            }
        });
    }

    function animate() {
        requestAnimationFrame(animate);
        const delta = Math.min(clock.getDelta(), 0.05);
        const elapsed = clock.elapsedTime;
        if (activeMixer) activeMixer.update(delta);
        if (activeRobot) {
            activeRobot.rotation.y += Math.sin(elapsed * 0.45) * 0.002;
            const mobile = window.innerWidth < 768;
            const targetY = mobile ? 0.65 : -0.8;
            activeRobot.position.y += (Math.sin(elapsed * 1.5) * 0.045 + targetY - activeRobot.position.y) * 0.1;
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

    initScroll();
    animate();
}());
