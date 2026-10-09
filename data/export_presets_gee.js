// Terrain Flux: export preset DEMs from Google Earth Engine
// Paste into the Earth Engine Code Editor, click Run, then Run each task in the Tasks tab.
// Output: one GeoTIFF per place in a Drive folder called terrain_flux.
//
// SRTM marks the ocean as 0 m, which Terrain Flux treats as sea.
// EPSG:3310 (California Albers) keeps the boxes square in meters.

var places = {
  morro_bay:       [-120.85, 35.37,  9000],  // [lon, lat, half-width in meters]
  yosemite_valley: [-119.59, 37.73,  7000],
  big_sur:         [-121.80, 36.25,  9000],
  san_francisco:   [-122.45, 37.78, 12000]
};

var dem = ee.Image('USGS/SRTMGL1_003');

Object.keys(places).forEach(function (name) {
  var p = places[name];
  var region = ee.Geometry.Point([p[0], p[1]]).buffer(p[2]).bounds();
  Export.image.toDrive({
    image: dem.clip(region),
    description: 'tf_' + name,
    folder: 'terrain_flux',
    region: region,
    scale: 30,
    crs: 'EPSG:3310',
    maxPixels: 1e9
  });
});
