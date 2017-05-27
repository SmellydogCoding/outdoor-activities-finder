const express = require('express');
const router = express.Router();
const MongoClient = require('mongodb').MongoClient
const geospacial = require('./geospacial.js');
const trailapi = require('./trailapi.js');
const weatherapi = require('./weather.js');
const bcrypt = require('bcrypt');

require('./env.js');  // comment out for production

MongoClient.connect('mongodb://localhost:27017/outdoor-activity-finder', (error,db) => {
  if (error) {
    console.log(error)
  } else {
    console.log('Database Connection Successful');
    const users = db.collection('users');
    const reviews = db.collection('reviews');

    router.get('/', (req, res) => {
      res.render('index', {title: 'Outdoor Activity Locator', user: res.locals.currentUser});
    });

    router.post('/', (req, res) => {
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
            places.places[p].distance = geospacial.getDistance(origin,destination);
            for (let a = 0; a < places.places[p].activities.length; a++) {
              places.places[p].activities[a].description = trailapi.cleanDescription(places.places[p].activities[a].description)
            }
          }

          places = places.places.sort((a,b) => {
            return a.distance - b.distance;
          });

          res.status(200).render('places', {places: places, title: "Search Results"});
          // res.status(200).json(places);
        });
      });
    });

    router.get('/place', (req, res) => {
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

    router.get('/login', (req,res) => {
      res.render('login', {title: 'login'});
    });

    router.post('/login', (req,res,next) => {
      users.find({username: req.body.username}).toArray((error,user) => {
        if (error) {
          return next(error);
        } else if (user[0] === undefined) {
          console.log('user not found');
        } else {
          if (req.body.password === user[0].password) {
            req.session.username = user[0].username;
            req.session.usertype = user[0].type;
            res.redirect('/');
          } else {
            console.log('incorrect password');
          }
        }
      });
    });

    router.get('/logout', (req, res, next) => {
      if (req.session) {
        // delete session object
        req.session.destroy((error) => {
          if(error) {
            return next(error);
          } else {
            res.redirect('/');
          }
        });
      }
    });

  }
});

module.exports = router;