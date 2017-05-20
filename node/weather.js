const http = require('http');
require('./env.js');  // comment out for production

const getWeather = (lat,lon) => {
  return new Promise((resolve,reject) => {
    let body = '';
    let req = http.get('http://api.openweathermap.org/data/2.5/weather?lat=' + lat + '&lon=' + lon + '&units=imperial&APPID=' + process.env.openWeatherAPIKey, function(res) {
      res.on('data', function(data) {
        body += data;
      });
      res.on('end', () => {
        let weather = JSON.parse(body);
        resolve(weather);
      });
      req.on('error', (error) => {
        reject(error);
        console.error('getCoords: ' + error);
      });
    });
  });
};

const convertToDirection = (deg) => {
  let index = ((deg/22.5)+.5).toFixed();
  let directions = ["N","NNE","NE","ENE","E","ESE", "SE", "SSE","S","SSW","SW","WSW","W","WNW","NW","NNW"]
  return directions[(index % 16)]
};

module.exports = {
  getWeather:getWeather,
  convertToDirection: convertToDirection
};