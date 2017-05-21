const express = require('express');
const router = express.Router();
const geospacial = require('./geospacial.js');
const trailapi = require('./trailapi.js');
const weatherapi = require('./weather.js');
require('./env.js');  // comment out for production

router.get('/', (req, res, next) => {
  res.render('index', {title: 'Outdoor Activity Locator'});
});

router.post('/', (req, res, next) => {
  let address;

  if (req.body.address && req.body.city && req.body.state) {
    address = req.body.address + "+" + req.body.city + "+" + req.body.state;
  } else {
    address = req.body.zip;
  }

  let activity = req.body.activity;
  let radius = req.body.radius;
  
  let getUserCoords = geospacial.getCoords(address);

  getUserCoords.then((coords) => {
    let startLat = coords.lat;
    let startLon = coords.lng;

    trailapi.getPlaces({lat: startLat, lon: startLon, activity: activity, radius: radius}).then((places) => {
      let origin = {latitude: startLat, longitude: startLon};
      
      for (let p = 0; p < places.places.length; p++) {
        let destination = {latitude: places.places[p].lat, longitude: places.places[p].lon};
        places.places[p].distance = geospacial.getDistance(origin,destination)
      }

      places = places.places.sort((a,b) => {
        return a.distance - b.distance;
      });

      res.status(200).render('places', {places: places, title: "Search Results"});
      // res.status(200).json(places);
    });
  });
});

router.get('/place', (req, res, next) => {
  trailapi.getPlaces({lat: req.query.lat, lon: req.query.lon, radius: .01}).then((place) => {
    for (let a = 0; a < place.places[0].activities.length; a++) {
      place.places[0].activities[a].description = trailapi.cleanDescription(place.places[0].activities[a].description)
    }
    weatherapi.getWeather(req.query.lat,req.query.lon).then((weather) => {
      weather.main.temp = weather.main.temp.toFixed();
      weather.wind.speed = weather.wind.speed.toFixed();
      weather.wind.deg = weatherapi.convertToDirection(weather.wind.deg);
      res.status(200).render('place', {place: place.places[0], weather: weather, title: place.places[0].name, key: process.env.googleMapsAPIKey});
    });
  });
});

module.exports = router;