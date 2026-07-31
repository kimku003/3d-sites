# Projets — Suite de Hoshi-no-Tani

Trois projets de la même famille : un fichier HTML unique, Three.js via CDN, tout procédural, zéro asset externe. Chaque projet a un défi technique central qui n'existe dans aucun des deux autres.

---

## 1. 「海辺の灯台」— Le Phare au Bord de Mer

Un promontoire rocheux battu par les vagues, avec un phare en pierre dont la lumière tourne. La mer est entièrement procédurale : grille déformée par des vagues de Gerstner superposées, mousse blanche sur les creux, éclaboussures sur les rochers. L'air salé se voit — brume marine qui s'épaissit au ras de l'eau. Le phare éclaire un cercle rotatif dans la brume, avec des God rays volumétriques faits par raymarching léger dans le fragment shader. Quelques mouettes (billboards) tournent en spirale autour du feu.

**Défi technique :** l'eau. Une surface océanique crédible en temps réel sans texture demande un Vertex Shader qui déforme une grille avec ~6 superpositions de vagues, plus un fragment shader qui calcule la réflexion et la réfraction.

**Palette :** bleu-gris profond, blanc cassé, pierre dorée, lumière chaude du phare, ciel d'orage.

### Prompt

Build a single self-contained `index.html` file — a real-time 3D coastal lighthouse scene in the style of Studio Ghibli. Load Three.js via CDN importmap only. Everything is procedural: no textures, no 3D models, no audio recordings, no external assets.

**World:** A rocky promontory with a stone lighthouse. Jagged cliff geometry via domain-warped ridged noise. A few sea stacks in the distance.

**Ocean:** A deformed grid mesh using ~6 overlapping Gerstner wave layers in the vertex shader. Fragment shader computes reflection (simplified sky dome) and refraction (depth-tinted underwater colour). White foam on wave crests via a steepness mask. Splash particles where waves hit rocks. Animated foam trails on the water surface.

**Lighthouse:** A cylindrical tower with a rotating lamp. The light casts a cone through volumetric fog — implemented as a radial gradient in screen space, not raymarching. God rays emerge from the fog cone via a screen-space ray march (6–8 steps, low cost). The beam sweeps 360° and paints a moving streak across the water surface.

**Atmosphere:** Heavy marine haze — depth fog that thickens near sea level. Overcast sky with breaks near the horizon letting warm light through. The fog colour shifts from grey to amber where the lighthouse beam cuts through it.

**Life:** 3–5 seagulls circling the lighthouse — billboard sprites with wing-flap animation driven by a sine wave and their orbit parameter. They follow circular paths at different altitudes.

**Post-processing:** Bloom on the lighthouse beam, FXAA, exposure tonemap. Underwater tint on pixels below the waterline.

**UI:** Same structure as Hoshi-no-Tani — loading card with Japanese title (海辺の灯台), progress bar, "Enter the scene" button. Settings panel with quality presets, wave complexity, fog density, bloom intensity.

**Controls:** WASD walk, Shift run, mouse look, F fly mode, Space/Ctrl up/down, C cinematic camera.

**Palette:** Deep blue-grey, warm stone, amber lighthouse glow, grey-green sea, overcast white, foam white. ~60 colours in one sRGB hex object, converted to linear at load.

The entire file should be a single `<script type="module">` with clearly labeled sections. No build step, no bundler, no npm.

---

## 2. 「雪見の宿」— L'Auberge sous la Neige

Une auberge japonaise isolée dans un col de montagne enneigé, vue de l'extérieur à la tombée de la nuit. Toit de chaume chargé de neige, fumée qui monte de la cheminée (particules), lanternes de papier qui émettent une lumière chaude. Les sapins sont des cônes procéduraux avec des branches courbées sous le poids de la neige. La neige tombe en flocons de tailles variées (depth-of-field sur les plus proches). Le sol est une heightmap couverte d'une couche de neige qui s'épaissit dans les creux et s'amincit sur les pentes raides (slope mask). Un petit ruisseau coule au premier plan, pas encore gelé.

**Défi technique :** la neige qui s'accumule. Le masque de neige doit être un shader qui lisse la heightmap, épaissit dans les concavités, et thins sur les arêtes — un problème classique de SDF inversé. Et la fumée de cheminée doit suivre un champ de vent turbulent sans ressembler à des billes qui montent en ligne droite.

**Palette :** blanc neige, bleu nuit, chaume chaud, rouge des lanternes, vert sombre des sapins, fumée gris-bleu.

### Prompt

Build a single self-contained `index.html` file — a real-time 3D mountain lodge scene in the style of Studio Ghibli (Snow Princess Mononoke / winter Totoro aesthetic). Load Three.js via CDN importmap only. Everything is procedural: no textures, no 3D models, no audio recordings, no external assets.

**World:** A mountain pass at dusk. Heightmap terrain with a valley floor, steep forested slopes, and distant peaks. A small stream flows through the foreground — not yet frozen, animated water surface.

**Snow accumulation:** The terrain shader computes a snow mask per fragment: accumulate in concavities (sample neighbours, count how many are lower), thin on steep slopes (slope > 45° = no snow), feather at the transition zone. The mask drives a blend between rock/earth colour and snow. Snow surface is slightly raised above the terrain (parallax offset, not geometry displacement). Snow sparkles via a specular highlight that shifts with viewing angle.

**Lodge:** A rectangular building with a thatched roof (thick, overhanging eaves). The roof geometry carries a heavy snow layer — the same accumulation mask applied to roof UV space. Paper lanterns on the porch emit warm point lights (2–3 lanterns, each a different warm tone). A doorway glows from inside.

**Chimney smoke:** Particle system emitting from the chimney — ~200 particles, each following a turbulent path (3 octaves of curl noise displacement over time). Particles fade from warm grey to transparent. Wind pushes the plume sideways. The smoke must not rise in a straight line — the curl noise is what makes it look like real smoke.

**Trees:** ~50 procedural pine trees on the slopes. Each tree is a vertical stack of 3–5 cone sections, decreasing in radius. Branches are implied by the cone silhouette, with snow caps on the upper surfaces. Trees closer to the camera are slightly larger and more detailed. Trees far away billboard.

**Snowfall:** ~3000 falling snowflakes as point sprites. Size varies (near flakes larger). Gentle wind drift. Slight depth-of-field: near flakes slightly blurred, far flakes sharp (do this with size modulation, not actual DoF). Snowflakes accumulate on the ground over time (optional — complexity budget permitting).

**Atmosphere:** Dusk sky — deep blue overhead fading to warm orange at the horizon. Volumetric fog in the valley. The warm light from lanterns bleeds into the surrounding snow, creating soft orange pools.

**Post-processing:** Bloom on lanterns and doorway glow, FXAA, exposure tonemap. Cool-toned shadows (blue shadows, not black).

**UI:** Same structure as Hoshi-no-Tani — loading card with Japanese title (雪見の宿), progress bar, "Enter the scene" button. Settings panel with quality presets, snowfall density, fog distance, exposure.

**Controls:** WASD walk, Shift run, mouse look, F fly mode, Space/Ctrl up/down, C cinematic camera.

**Palette:** Snow white, night blue, warm chaume, lantern red-orange, pine green-dark, smoke grey-blue. ~55 colours in one sRGB hex object, converted to linear at load.

The entire file should be a single `<script type="module">` with clearly labeled sections. No build step, no bundler, no npm.

---

## 3. 「蜃気楼の市場」— Le Marché des Mirages

Un marché flottant dans le désert — des structures de bois et de tissu tendu sur des dunes de sable doré, avec des tapis volants qui servent de toits. L'air est si chaud que le sol scintille (mirage parallaxe au sol, un simple décalage de coordonnées UV en fonction de l'angle de vue). Le sable est un terrain procédural avec des crêtes de vent (ondulation sinusoïdale orientée par un champ de direction). Des marchands invisibles laissent des traces de pas qui se remplissent de sable progressivement (écrire dans un shadow map ou un buffer de traces). Le soleil est bas, tout est or et ombre longue.

**Défi technique :** la mirage. C'est un fragment shader — pour chaque pixel du sol, on projette plus loin que la surface réelle selon l'angle rasant, et on mélange la couleur du ciel. Et le sable qui bouge — les crêtes de vent qui se reforment en temps réel demandent un champ de déplacement animé dans le vertex shader du terrain.

**Palette :** or brûlé, ombre violette, tissu rouge/orange/indigo, ciel cyan pâle, sable blanc-crème.

### Prompt

Build a single self-contained `index.html` file — a real-time 3D desert market scene in the style of Studio Ghibli (Nausicaä valley, desert Princess Mononoke aesthetic). Load Three.js via CDN importmap only. Everything is procedural: no textures, no 3D models, no audio recordings, no external assets.

**World:** A desert with undulating dunes. The terrain is a heightmap with animated wind-ripple displacement in the vertex shader — sinusoidal ridges oriented by a global wind direction field, animating slowly over time. Dune crests shift and reform.

**Mirage:** A screen-space parallax mirage on the desert floor. For each ground fragment, compute the viewing angle relative to the horizon. At grazing angles (below ~5°), blend the ground colour with a distorted sample of the sky dome, offset by a parallax distance that increases as the angle flattens. The effect creates the classic "wet road" illusion on hot sand. The mirage shimmers subtly via time-based noise on the parallax offset.

**Market structures:** 8–12 wooden stalls with fabric canopies (cloth draped over posts, simulated as quads with vertex noise for wrinkles). Some stalls have hanging carpets — coloured quads with geometric patterns (simple woven-look stripes). Goods on tables are implied by coloured blocks/shapes (no detailed models — impressionistic, like Ghibli background art).

**Floating carpets:** 2–3 large carpets hovering above the stalls as roofs, gently undulating (vertex displacement with slow sine wave). They cast dappled shadows on the ground below.

**Footprints:** Invisible merchants leave footprint trails in the sand. Implement as a secondary render target: 3–4 NPC paths defined as spline curves, their positions advance over time. At each NPC position, stamp a small dark circle into the footprint RT. The RT is sampled in the sand shader to darken/indent the sand where prints exist. Prints gradually fill with sand (fade out over ~30 seconds).

**Lighting:** Low sun (late afternoon), long shadows. The light is warm gold, shadows are cool violet. Strong directional light with a single shadow map. Ambient is split: warm from the sand bounce, cool from the sky.

**Atmosphere:** Hot air distortion — a subtle screen-space wobble applied to all fragments based on their height above the terrain (parallax scrolling of UVs). Heat haze intensifies near the ground. Distant dunes fade into a warm haze (aerial perspective with orange-brown fog colour, not blue).

**Life:** Desert birds (vultures?) circling high above — tiny billboard silhouettes. A few butterflies near the market stalls. Dust motes in the sunbeams (particle system, very small points).

**Post-processing:** Strong bloom on sunlit sand (the specular glint), FXAA, exposure tonemap. The overall tone should be warm and golden — push the white balance toward amber.

**UI:** Same structure as Hoshi-no-Tani — loading card with Japanese title (蜃気楼の市場), progress bar, "Enter the scene" button. Settings panel with quality presets, mirage intensity, heat haze strength, wind speed, exposure.

**Controls:** WASD walk, Shift run, mouse look, F fly mode, Space/Ctrl up/down, C cinematic camera.

**Palette:** Burnt gold, violet shadow, indigo/red/orange fabrics, pale cyan sky, cream sand. ~55 colours in one sRGB hex object, converted to linear at load.

The entire file should be a single `<script type="module">` with clearly labeled sections. No build step, no bundler, no npm.

---

## Comparaison des défis techniques

| Projet | Défi central | Pourquoi c'est dur |
|--------|-------------|-------------------|
| Phare | Océan Gerstner + God rays | Vertex shader déformant une grille + raymarching screen-space |
| Auberge | Neige qui s'accumule + fumée | SDF inversé (concavité/convexité) + champ de vent curl noise |
| Marché | Mirage parallaxe + sable animé | Fragment shader contre-intuitif (projeter AU-DELÀ de la surface) + displacement animé |

Les trois ensemble couvrent presque tout le spectre du procédural en WebGL : déformation de surface, éclairage volumétrique, effets screen-space, systèmes de particules, champs de vent, et accumulation de matière.
