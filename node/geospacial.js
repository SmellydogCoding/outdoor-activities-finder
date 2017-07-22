'use strict';

try { require('./env.js'); } catch(error) {} // no env file in production environment

const https = require('https');

// get distance in miles between 2 sets of gps coords
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

// use the Google geolocation api to get gps coords from a zipcode
const getGPSData = (GPSInput) => {
  return new Promise((resolve,reject) => {
    let body = '';
    let GoogleErrorMessage = "Google Geolocation API Error: ";
    let req = https.get('https://maps.googleapis.com/maps/api/geocode/json?' + GPSInput + '&key=' + process.env.googleAPIKey, function(res) {
      
      res.on('data', (data) => {
        body += data;
      });
      
      res.on('end', () => {
        if (body.indexOf("<title>") !== -1) {
          // take google html error message and use it to make a json error message
          let errorStart = body.indexOf("<title>") + 7;
          let errorEnd = body.indexOf("</title>");
          GoogleErrorMessage += body.slice(errorStart,errorEnd);
          let error = new Error(GoogleErrorMessage);
          return reject(error);
        }
        let result = JSON.parse(body);
        // the json object will have a error_message key if there is an error
        if (result.error_message) {
          GoogleErrorMessage += result.error_message
          let error = new Error(GoogleErrorMessage);
          reject(error);
        } else {
          let coords = result.results[0].geometry.location;
          // the zip code isn't always in the same place in the json response object
          let zipcodeIndex = result.results[0].address_components.findIndex(i => i.types[0] === "postal_code");
          let zipcode = result.results[0].address_components[zipcodeIndex].short_name;
          resolve({"coords": coords, "zipcode": zipcode});
        }
      });
    });
      
    req.on('error', (err) => {
      GoogleErrorMessage += err;
      let error = new Error(GoogleErrorMessage)
      reject(error);
      console.error('Google Geolocation API Error: ' + error);
    });
    
  });
};

module.exports = { 
  getGPSData: getGPSData,
  getDistance: getDistance
};