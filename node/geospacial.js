const https = require('https');
require('./env.js');  // comment out for production

// Source: https://gist.github.com/clauswitt/1604972
const getDistance = (start, end) => {
  const earthRadius = 6371.008;
  let lat1 = parseFloat(start.latitude);
  let lat2 = parseFloat(end.latitude);
  let lon1 = parseFloat(start.longitude);
  let lon2 = parseFloat(end.longitude);

  let dLat = (lat2 - lat1) * Math.PI / 180;
  let dLon = (lon2 - lon1) * Math.PI / 180;
  lat1 = lat1 * Math.PI / 180;
  lat2 = lat2 * Math.PI / 180;

  let a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  let d = earthRadius * c;
  let kilometers = Math.round(d * Math.pow(10, 2)) / Math.pow(10, 2);
  let miles = Math.round(kilometers * .621371);
  return miles;
};

// getDistance({latitude: 39.72122192, longitude: -80.51956177},{latitude: 40.02198029, longitude: -79.90330505}); // for testing

const getGPSData = (GPSInput) => {
  return new Promise((resolve,reject) => {
    let body = '';
    let req = https.get('https://maps.googleapis.com/maps/api/geocode/json?' + GPSInput + '&key=' + process.env.googleAPIKey, function(res) {
      res.on('data', function(data) {
        body += data;
      });
      res.on('end', () => {
        let result = JSON.parse(body);
        let coords = result.results[0].geometry.location;
        let zipcodeIndex = result.results[0].address_components.findIndex(i => i.types[0] === "postal_code");
        let zipcode = result.results[0].address_components[zipcodeIndex].short_name;
        resolve({"coords": coords, "zipcode": zipcode});
      });
      req.on('error', (error) => {
        reject(error);
        console.error('getCoords: ' + error);
      });
    });
  });
};
// getCoords('15351');  // for testing

module.exports = { 
  getGPSData: getGPSData,
  getDistance: getDistance
};