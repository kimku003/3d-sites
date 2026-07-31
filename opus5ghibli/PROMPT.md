# Prompt — Hoshi-no-Tani (星の谷)

Build a single self-contained `index.html` file — a real-time 3D valley scene in the style of Studio Ghibli (My Neighbor Totoro, Princess Mononoke golden-hour aesthetic). Load Three.js via CDN importmap only. Everything is procedural: no textures, no 3D models, no audio recordings, no external assets.

**World:** A 2400m valley with a Catmull-Rom spline river, gentle rolling hills (FBM + ridged noise), a stone viaduct/bridge crossing, a small village on the far bank, and a spawn point on an overlook knoll.

**Grass:** ~12M blades in 4 LOD rings using instanced Bezier geometry. Continuous density law (no banding between rings). Vertex-shader thinning against true distance. Grass reacts to a wind field.

**Sky:** Painted gradient dome (not physics scattering) — 4-stop vertical wash, azimuthal warm/cool asymmetry toward/away from sun, Mie forward-scatter halo, thin cirrus streaks. Cloud layer at ~980m altitude with a 13-octave warped FBM coverage field baked to a 512² shadow map each frame.

**Lighting:** Half-Lambert with a 3-colour hue-path ramp (shade → mid → lit), hemispheric ambient that tints without bleaching, backlight Fresnel rim, subsurface transmission for grass/leaves. Shadows use a sun shadow map with painterly wobble (noise offset on the edge for a brush-stroke look, not PCF filtering). Cloud shadows via the baked coverage map.

**River:** Animated water with sparkle, foam, and a simplified sky reflection (lite dome without cirrus). Spline-based course with EDT distance field for the riverbed.

**Life:** Floating pollen particles, butterflies, and birds — all billboard sprites. A train that follows a track spline with smoke particles, summoned with T key.

**Post-processing:** Multi-pass bloom, FXAA, exposure tonemap, aerial perspective fog with mist pooling in the valley floor.

**Audio:** Procedurally generated ambient soundscape (wind, birds, water) — no recordings.

**UI:** Loading card with Japanese title (星の谷), progress bar, "Enter the valley" button. In-game HUD with keybinds. Settings panel (H key) with quality presets (Low/Med/High/Ultra), grass density, render scale, wind speed/gustiness, exposure, bloom, painterly strength, audio volume, music toggle.

**Controls:** WASD walk, Shift run, mouse look, F fly mode, Space/Ctrl up/down, C cinematic camera, P pause time-of-day.

**Palette:** All ~80 colours defined in one sRGB hex object, converted to linear at load, injected as `vec3` constants into every GLSL shader. The palette must feel hand-painted — warm golden-hour tones, teal shadows, cream highlights.

**Performance:** The scene must run at 30+ fps on a mid-range GPU. Quality presets scale grass density, shadow resolution, wind RT size, bloom passes, and render resolution. The grass density exponent must be exactly 1.5 to allow `x*x*inversesqrt(x)` instead of `pow()`.

The entire file should be a single `<script type="module">` with clearly labeled sections (§0–§15). No build step, no bundler, no npm.
