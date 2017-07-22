'use strict';

try { require('./env.js'); } catch(error) {} // no env file in production environment

const http = require('http');

// get current weather for a place from the openweather api
const getWeather = (lat,lon) => {
  let openWeatherErrorMessage = 'Open Weather API Error: ';
  return new Promise((resolve,reject) => {
    let body = '';
    let req = http.get('http://api.openweathermap.org/data/2.5/weather?lat=' + lat + '&lon=' + lon + '&units=imperial&APPID=' + process.env.openWeatherAPIKey, function(res) {
      res.on('data', function(data) {
        body += data;
      });
      res.on('end', () => {
        // take openweather html error message and use it to make a json error message
        if (body.indexOf("<title>") !== -1) {
          let errorStart = body.indexOf("<title>") + 7;
          let errorEnd = body.indexOf("</title>");
          openWeatherErrorMessage += body.slice(errorStart,errorEnd);
          let error = new Error(openWeatherErrorMessage);
          return reject(error);
        }
        let weather = JSON.parse(body);
        // the json object will have a message key if there is an error
        if (weather.message) {
          openWeatherErrorMessage += weather.message;
          let error = new Error(openWeatherErrorMessage);
          reject(error);
        } else {
          resolve(weather);
        }
      });
    });

    req.on('error', (err) => {
      openWeatherErrorMessage += err;
      let error = new Error(openWeatherErrorMessage)
      reject(error);
      console.error('Open Weather API Error: ' + error);
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