# Terrain Flux: Methods

Terrain Flux looks like a game, and it is one. Underneath, several systems borrow from real geospatial and hazard science. This page says what each one is based on, how it is simplified, and where it stops being true. Honest limits are part of the point.

Everything runs in the browser in one HTML file. The map is a 128 by 128 grid of tiles with heights on the 129 by 129 corners, and neighboring corners can differ by at most one height step, the same rule SimCity 2000 used.

---

## Real places: elevation

**Source.** NASA Shuttle Radar Topography Mission (SRTM) 1 arc-second elevation (about 30 m), accessed in Google Earth Engine as `USGS/SRTMGL1_003` (Farr et al., 2007).

**Processing.** Each preset (Morro Bay, Big Sur, Yosemite Valley, San Francisco) is reprojected to California Albers (EPSG:3310), center-cropped to a square, resampled bilinearly to 129 by 129, and stored as 16-bit integers inside the page. The export script and the Colab notebook that rebuilds the presets are in `data/`.

**Game conversion.** Real meters are kept for sea level rise and contours. For the tile terrain, heights are binned into steps and passed through a Lipschitz envelope (an upward and a downward pass that clamp neighbors to one step apart), which softens cliffs without moving the cells that already satisfy the rule.

**Limits.** A preset covers 13 to 23 km with only 128 tiles, so each tile is roughly 100 to 180 m across. Cliffs and narrow canyons get smoothed. SRTM measures the top of whatever the radar saw (canopy, buildings), not bare ground, and its published absolute vertical accuracy target is 16 m (90%), though it is usually much better than that in open terrain.

**Your own data.** Any single-band GeoTIFF can be loaded. It goes through the same crop, resample, and softening steps.

---

## Post-fire debris flows

**Model.** The USGS M1 logistic regression for the likelihood of a post-fire debris flow in a drainage basin (Staley et al., 2017):

```
x = -3.63 + (0.41 X1 + 0.67 X2 + 0.70 X3) R
P = 1 / (1 + e^-x)
```

| Term | In the USGS model | In Terrain Flux |
|---|---|---|
| X1 | Fraction of the basin burned at moderate or high severity on slopes of 23 degrees or more | Fraction of basin tiles with burn severity 2 or 3 on slopes of 23 degrees or more (on made-up maps, any tile that changes height is treated as steep) |
| X2 | Average dNBR / 1000 | Average of a severity proxy: 0.2, 0.45, 0.75 for low, moderate, high |
| X3 | Average soil KF factor | Fixed at 0.25 |
| R | Peak 15-minute rainfall accumulation (mm) | Storm intensity (mm/hr) / 4 |

Likelihood classes follow the Scar Threshold project: Low below 0.2, Moderate from 0.2, High from 0.6.

**Routing.** Water flows tile to tile by steepest descent (D8 style). Basins of about 40 tiles are scored, and only basins with at least 10% recently burned ground are assessed, mirroring how real post-fire assessments focus on burned watersheds. Flows start from the highest steep burned slope and run downhill, leaving mud that fades over two years. Wetlands (bayou, mangrove, reef) stop flows.

**Limits.** No real soils, no real dNBR, basins defined on a coarse grid, and a single fixed rainfall duration. It shows the shape of the hazard, not a forecast. For the real version of this pipeline, see [Scar Threshold](https://scar-threshold.pages.dev), which reproduces the USGS M1 results with Sentinel-2 dNBR, 3DEP terrain, and STATSGO soils.

---

## Sea level rise

**Scenarios.** Quick-pick buttons at +0.3, +1, and +2 m are rounded values in the range of the NOAA 2022 interagency scenarios for the end of the century (Sweet et al., 2022). The slider goes to 10 m for exploring.

**Method.** A connected bathtub model on real SRTM meters: flooding spreads outward from the ocean (breadth-first) into any tile whose elevation is below the new sea level. Low ground with no path to the sea stays dry. Mangroves hold back 2 m and bayous and coral reefs hold back 1 m for land within 3 tiles.

**Limits.** No tides, storm surge, waves, levees, or land subsidence. SRTM is a surface model with meters of vertical error, so rises smaller than a few meters are below what the data can resolve, and the app says so when you pick one. The wetland protection values are illustrative: mangroves and reefs really do reduce coastal flooding (Menéndez et al., 2020; Beck et al., 2018), but not as a fixed number of meters.

---

## Earthquakes

**Shaking.** A Modified Mercalli style intensity that grows with magnitude and falls off with distance:

```
MMI = 1.68 + 1.2 M - 2.6 log10(R + 5)     (R in km)
```

This is a toy curve with the same general shape as published intensity prediction equations (for example Atkinson and Wald, 2007), not a fitted one.

**Site effects.** Low, flat ground next to water is treated as liquefiable and shakes one intensity step harder, a heuristic in the spirit of liquefaction susceptibility mapping. San Francisco's bay margins light up, as they did in 1989.

**Damage.** Each building rolls against a collapse threshold by type (towers and heavy industry lowest, houses highest). Roads crack, bridges can drop a whole span, steep slopes away from the shore can slide, and collapsed buildings can start fires that join the wildfire model.

**Limits.** No fault geometry, no ground motion simulation, no building codes or construction eras. It is not a ShakeMap.

---

## Wildfire

A cellular model. Each burning tile tries to ignite its neighbors every tick, with odds shaped by:
- **Fuel:** grass, forest, and buildings each have their own base spread rate, adjusted by biome (chaparral fastest and hottest, deserts and wetlands barely burn).
- **Wind:** spread grows exponentially downwind, and gusts boost it locally.
- **Slope:** fire runs uphill faster.
- **Firebreaks:** roads, water, beaches, bare rock, and fresh burn scars stop it. Fire stations slow it inside their reach.

Burned tiles keep a severity (1 to 3) that feeds the debris flow model and heals over about five game years.

**Limits.** Qualitatively shaped like real fire behavior (wind, slope, fuel), but not a physics model like Rothermel spread or FARSITE.

---

## Air pollution and dust

Heavy industry, factories, busy roads, and burning tiles are sources. Each puts out a plume that follows the current wind: it widens as it travels downwind, fades with distance, and barely reaches upwind, loosely like a Gaussian plume. Industry plumes reach about 10 tiles; traffic is a short-range source. Transit lowers traffic emissions locally, and park trees soak up a little. On the Moon and Mars the same system tracks dust contamination from mining and rover traffic (and on the windless Moon it simply settles nearby).

Homes in moderate air grow slower and cannot become towers; homes in unhealthy air stay small. In a test town, factories upwind of the homes held population to about 1,800, while the same factories downwind allowed about 12,100.

**Limits.** No chemistry, stability classes, terrain effects, or deposition. It is not dispersion modeling like AERMOD.

---

## The hazard report card

For each hazard, the share of residents exposed, graded A (under 5%) through F (50% or more):

| Row | Exposed means |
|---|---|
| Wildfire | Homes with at least 4 forest tiles within 3 tiles (the wildland-urban interface), with each fire station that reaches a home cutting its risk to 40% |
| Debris flow | Homes in Moderate or High drainages at 24 mm/hr |
| Earthquake | Homes on liquefiable ground |
| Sea level rise | Homes underwater at +2 m (coastal real places) |
| Air quality | Homes in moderate or worse air |
| Services | Average coverage by fire, police, and hospitals (graded the other way) |

The idea of mapping hazard burden against where people live is a small nod to tools like CalEnviroScreen.

---

## Biomes

Painted by hand, or filled by climate. The fill sorts each tile by temperature and moisture the way the Whittaker biome diagram does (Whittaker, 1975): elevation cools tiles down, land near water is wetter, and smooth noise varies both across the map. Climates (temperate, arid, tropical, cold, mixed) shift the averages.

Biomes change ground color and plants, fire behavior, local wind strength, town growth (deserts grow slowly without water nearby, cold biomes grow slowly), coastal protection, and whether debris flows can pass.

**Limits.** The temperature and moisture fields are synthetic, not climate data.

---

## Volcanoes

A cone with a crater is raised in steps, then lava paths run from the rim by steepest descent with a little randomness, spreading a short way across flat ground. Lava buries what it reaches, ignites neighbors, cools to rock over several game months, and builds new land where it reaches shallow sea.

**Limits.** No viscosity, temperature, effusion rate, or eruption style. It is geometry plus routing.

---

## The Moon and Mars

Procedural terrain: smooth noise plus craters, each a bowl with a raised rim, with small craters more common than large ones. Water becomes ice, fire and rain are off, the Moon has no wind, and Mars has dust devils. Plants are imagined: pale fungus on the Moon, and on Mars the kinds of life studied as plausible survivors there (lichens) plus greenhouse pods.

**Limits.** Crater shapes are not fitted to real depth-to-diameter ratios, and nothing here uses real lunar or Martian elevation yet. Real presets (Tycho crater from LRO LOLA, Olympus Mons from MGS MOLA) are on the roadmap.

---

## What is a game rule, not a model

Zoning, growth, demand (the R C I bars), traffic, bridges, the day and night cycle, and rocket launches are game mechanics. They are designed to be readable and fun, and they are not meant to represent real urban dynamics.

---

## References

- Atkinson, G. M., and Wald, D. J. (2007). "Did You Feel It?" intensity data: A surprisingly good measure of earthquake ground motion. *Seismological Research Letters*, 78(3), 362-368.
- Beck, M. W., Losada, I. J., Menéndez, P., Reguero, B. G., Díaz-Simal, P., and Fernández, F. (2018). The global flood protection savings provided by coral reefs. *Nature Communications*, 9, 2186.
- Farr, T. G., et al. (2007). The Shuttle Radar Topography Mission. *Reviews of Geophysics*, 45, RG2004.
- Menéndez, P., Losada, I. J., Torres-Ortega, S., Narayan, S., and Beck, M. W. (2020). The global flood protection benefits of mangroves. *Scientific Reports*, 10, 4404.
- Staley, D. M., Negri, J. A., Kean, J. W., Laber, J. L., Tillery, A. C., and Youberg, A. M. (2017). Prediction of spatially explicit rainfall intensity-duration thresholds for post-fire debris-flow generation in the western United States. *Geomorphology*, 278, 149-162.
- Sweet, W. V., et al. (2022). *Global and Regional Sea Level Rise Scenarios for the United States.* NOAA Technical Report NOS 01.
- Whittaker, R. H. (1975). *Communities and Ecosystems* (2nd ed.). Macmillan.
