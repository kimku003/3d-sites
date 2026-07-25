(function (root, factory) {
    const api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    if (root) root.RobotSceneUtils = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    function getNormalizedTransform(min, max, targetSize = 2.8) {
        const size = {
            x: max.x - min.x,
            y: max.y - min.y,
            z: max.z - min.z
        };
        const maxDimension = Math.max(size.x, size.y, size.z);

        if (!Number.isFinite(maxDimension) || maxDimension <= 0) {
            throw new Error('Le modèle 3D ne possède pas de dimensions valides.');
        }

        const scale = targetSize / maxDimension;
        const center = {
            x: (min.x + max.x) / 2,
            z: (min.z + max.z) / 2
        };

        return {
            scale,
            position: {
                x: -center.x * scale,
                y: -min.y * scale,
                z: -center.z * scale
            }
        };
    }

    return { getNormalizedTransform };
}));
