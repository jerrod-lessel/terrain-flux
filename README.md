# ⛰️ Terrain Flux

**Someone has to grade this mess.**

A SimCity 2000 style terrain and city sandbox with real California elevation baked in. Sculpt hills, flood the coast, zone a town, and watch it grow. Or watch it refuse to grow, if you built it somewhere ridiculous.

Part of [Lessel Geospatial Labs](https://lesselgeospatial.com).

![Morro Bay in Terrain Flux](docs/morro-bay.png)

## Play it

**[Launch Terrain Flux](https://lesselgeospatial.com)** <!-- swap in the live URL -->

It is one self-contained HTML file. No build step, no server, no install. Download `index.html` and open it, or host it anywhere static (GitHub Pages, Vercel, Cloudflare Pages).

## What you can do

- 🏔️ **Sculpt terrain** with raise, lower, level, and smooth tools. Hillsides follow the cursor the way they did in 1993.
- 📍 **Start from a real place:** Morro Bay, Big Sur, Yosemite Valley, or San Francisco, built from 30 m SRTM elevation.
- 🌊 **Model sea level rise** on coastal real places, in meters, with NOAA 2022 scenario shortcuts and a tally of land, buildings, and people affected.
- 🗺️ **Load your own DEM:** drop in any single-band GeoTIFF.
- 🌍 **Generate a map** with sliders for hills, water, and trees, plus optional coastline and river.
- 🌊 **Raise or lower the sea**, place lakes, and make waterfalls on slopes.
- 🏙️ **Zone and grow a city.** 9 building types with 4 styles each, 36 designs, all drawn in code.
- 🏥 **Build civic buildings:** parks, hospitals, fire stations, police stations, and stadiums, 21 designs in all. Each one changes how the city around it grows.
- 🌬️ **Feel the wind:** gusts roll across the map and set the forests they pass swaying.
- 🚗 **Watch traffic** fill the roads near homes and jobs, while the road to nowhere stays empty.
- 〰️ **Contour lines** from the real elevation, with a sensible interval picked for each place and bold index contours.
- 🔄 **Rotate**, zoom, toggle a grid, switch between classic green and an elevation color ramp, or turn on chunky retro pixels.
- 💾 **Save** to your browser or **export** a map as JSON.

![A grown city](docs/city.png)

## Controls

| Action | Input |
|---|---|
| Use the selected tool (starts on Pan) | Left click or drag |
| Pan | Right drag, middle drag, Alt + drag, arrows, or WASD |
| Zoom | Mouse wheel, `+` / `-` |
| Rotate view | `Q` / `E` |
| Undo | `Ctrl` + `Z` |
| Grid / contours / tint / retro pixels | `G` / `C` / `T` / `P` |
| Pause growth | `Space` |
| Cancel a road | `Esc` |

## How it works

**Terrain.** Heights live on the 129 by 129 corners of a 128 by 128 tile grid, and neighboring corners (diagonals included) can differ by one step at most. Every edit locks the corners you touched and clamps the rest of the map between the highest and lowest surfaces the rule allows, computed with two-pass chamfer envelopes. That keeps every slope legal without ever moving what you just edited.

**Real places.** Elevation is exported from Google Earth Engine in California Albers (EPSG:3310), cropped to the center square, box-averaged to 129 by 129, and stored in the HTML as 16-bit meters. Anything at or below 0 m becomes sea. Peaks steeper than the one-step rule allows are softened into slopes, which is why Yosemite's granite walls come out as stairs.

**Sea level rise.** Flooding uses the real SRTM meters stored with each place, not the game's blocky steps, and only spreads to land connected to the ocean (a breadth-first search from the sea), so low ground behind a ridge stays dry. It is a preview and destroys nothing. SRTM's vertical accuracy is a few meters, so small rises often fall below what the data can resolve.

**Contours.** Each tile runs marching squares on its four corners and draws the segments onto the tilted tile surface. Real places contour the true SRTM meters at an interval of about one twentieth of the relief (20 m for San Francisco, 50 m for Morro Bay, 100 m for Yosemite), with every fifth line bold.

**Growth.** Any zone next to a road can become a small building. Bigger buildings need a real neighborhood around them and demand nearby: homes need jobs, while shops and factories need residents. Lone zones stay rural forever. Buildings shrink if their demand disappears. Hover a zone to see what it is waiting for.

**Civic buildings.** Each one reaches a radius of tiles. Parks speed up nearby homes and count as a nicer neighborhood. Hospitals count as jobs for homes. Fire stations speed up factories. Police stations speed up everything, and towers need police coverage. Stadiums take a 2 by 2 lot, boost shops, and pull crowds onto the roads.

**Wind.** A slowly shifting wind spawns gusts just upwind of wherever you are looking, and they drift through. Only the screen area under each gust gets redrawn, so a calm forest costs nothing.

**Traffic.** Each road tile scores the development within 3 tiles, then spreads that score along the road network with a 28% falloff per tile. Cars hide behind buildings using a small depth buffer of building silhouettes.

## Add your own place

1. Edit the place list in [`data/export_presets_gee.js`](data/export_presets_gee.js) (longitude, latitude, half-width in meters), run it in the [Earth Engine Code Editor](https://code.earthengine.google.com), and run the export tasks.
2. Open [`data/build_presets.ipynb`](data/build_presets.ipynb) in Google Colab, upload the GeoTIFFs, and run the cells.
3. Paste the printed `PRESETS` list over the one in `index.html`.

The notebook reproduces the shipped presets byte for byte, so you can rebuild them from scratch.

## Roadmap

- [x] Real place presets
- [x] About panel
- [x] Smoother traffic
- [x] Civic buildings: parks, hospitals, fire and police stations, stadiums, each with real effects
- [x] Wind gusts and swaying trees
- [x] Sea level rise scenarios in meters on real terrain
- [x] Contour line overlay
- [ ] Wildfire, then post-fire debris flows
- [ ] Bridges
- [ ] Day and night cycle
- [ ] Shareable map links
- [ ] Hills that hide cars
- [ ] Pinch to zoom on phones

## Credits

- Elevation: [SRTM 30 m](https://developers.google.com/earth-engine/datasets/catalog/USGS_SRTMGL1_003), NASA and USGS, via Google Earth Engine
- GeoTIFF reading: [geotiff.js](https://github.com/geotiffjs/geotiff.js) (MIT)
- Fonts: [Press Start 2P](https://fonts.google.com/specimen/Press+Start+2P) and [VT323](https://fonts.google.com/specimen/VT323) (SIL Open Font License)
- Inspired by SimCity 2000 (Maxis, 1993). Every pixel here is drawn in code; no original game assets are used.

## License

[MIT](LICENSE) © 2026 Jerrod Lessel
