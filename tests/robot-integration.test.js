const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

test('chaque modèle GLB est référencé dans robot-scene.js', () => {
    const sceneScript = fs.readFileSync(path.join(root, 'robot-scene.js'), 'utf8');
    const modelFiles = fs.readdirSync(path.join(root, 'models'))
        .filter((file) => file.endsWith('.glb'))
        .map((file) => file.replace(/\.glb$/, ''))
        .sort();
    const scriptModels = [...sceneScript.matchAll(/name:\s*'([^']+)'/g)]
        .map((match) => match[1])
        .sort();

    assert.deepEqual(scriptModels, modelFiles);
});

test('le cadrage normalise la taille et pose le modèle sur le sol', () => {
    const { getNormalizedTransform } = require('../robot-scene-utils.js');
    const transform = getNormalizedTransform(
        { x: -2, y: -1, z: -3 },
        { x: 4, y: 5, z: 1 },
        3
    );

    assert.equal(transform.scale, 0.5);
    assert.deepEqual(transform.position, { x: -0.5, y: 0.5, z: 0.5 });
});

test('le cadrage rejette un modèle sans dimensions', () => {
    const { getNormalizedTransform } = require('../robot-scene-utils.js');

    assert.throws(
        () => getNormalizedTransform({ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }),
        /dimensions/i
    );
});

test('les modèles compressés Draco disposent de leur décodeur', () => {
    const html = fs.readFileSync(path.join(root, 'kimportfolio.html'), 'utf8');
    const sceneScript = fs.readFileSync(path.join(root, 'robot-scene.js'), 'utf8');
    const compressedModels = fs.readdirSync(path.join(root, 'models'))
        .filter((file) => file.endsWith('.glb'))
        .filter((file) => {
            const buffer = fs.readFileSync(path.join(root, 'models', file));
            const jsonLength = buffer.readUInt32LE(12);
            const gltf = JSON.parse(buffer.toString('utf8', 20, 20 + jsonLength).replace(/\0+$/, ''));
            return gltf.extensionsUsed?.includes('KHR_draco_mesh_compression');
        });

    assert.ok(compressedModels.length > 0, 'ce test attend au moins un GLB compressé');
    assert.match(html, /DRACOLoader\.js/);
    assert.match(sceneScript, /setDRACOLoader\s*\(/);
});
