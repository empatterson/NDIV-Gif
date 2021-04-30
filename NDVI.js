//Get the MODIS NDVI image collection
var col = ee.ImageCollection('MODIS/006/MOD13A2').select('NDVI');

//Defines a mask to clip the data collection of wordlwide boundaries
var mask = ee.FeatureCollection('USDOS/LSIB_SIMPLE/2017')
  .filter(ee.Filter.eq('country_co', 'UG')); 

//Define the bounds of the GIF animation frames
var region = ee.Geometry.Polygon(
  [[[29.171916218087063,-1.8707624991976586],
    [35.23636934308706,-1.8707624991976586],
    [35.23636934308706,4.715369926984031],
    [29.171916218087063,-1.8707624991976586]]],
  null, false
);

//Add day-of-year (DOY) property to each image
col = col.map(function(img){
  var doy = ee.Date(img.get('system:time_start')).getRelative('day','year');
  return img.set('doy', doy);
}); 

//Get a collection of seperate images by DOY
var distinctDOY = col.filterDate('2020-01-01', '2021-01-01');

//Define a filter that selects images by distinct DOY filter dates
var filter = ee.Filter.equals({leftField:'doy', rightField:'doy'}); 

//Define a join 
var join = ee.Join.saveAll('doy_matches'); 

//apply the join and convert the feature collection to 
//an ImageCollection
var joinCol = ee.ImageCollection(join.apply(distinctDOY, col, filter));

//Apply median reduction among matching DOY collections
var comp = joinCol.map(function(img) {
  var doyCol = ee.ImageCollection.fromImages(
    img.get('doy_matches')
  ); 
  return doyCol.reduce(ee.Reducer.median());
}); 

//Define RGB visualization parameters & set background to null(black)
var visParams = {
  min: 0.0, 
  max: 9000.00, 
  palette: [
    'FFFFFF', 'CE7E45', 'DF923D', 'F1B555', 'FCD163', '99B718', '74A901',
    '66A000', '529400', '3E8601', '207401', '056201', '004C00', '023B01',
    '012E01', '011D01', '011301'
  ],
}; 

//Create RGB visualization images for use as animation frames
var rgbVis = comp.map(function(img) {
  return img.visualize(visParams).clip(mask); 
}); 

//Define GIF visualization arguments
var gifParams = {
  'region': region,
  'dimensions': 600,
  'crs': 'EPSG:3857',
  'framesPerSecond': 10,
  'format': 'gif'
};

//Print the GIF URL to the console
print(rgbVis.getVideoThumbURL(gifParams));

//Render the GIF animation in the console
print(ui.Thumbnail(rgbVis, gifParams)); 
