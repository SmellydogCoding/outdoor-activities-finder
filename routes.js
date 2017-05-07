const express = require('express');
const router = express.Router();
const geospacial = require('./geospacial.js');
const trailapi = require('./trailapi.js');

router.get('/', (req, res, next) => {
  res.render('index');
});

router.post('/', (req, res, next) => {
  let activity = req.body.activity;
  let radius = req.body.radius;

  let getUserCoords = geospacial.getCoords(req.body.zip);
  getUserCoords.then((coords) => {
    let startLat = coords.lat;
    let startLon = coords.lng;
    trailapi.getPlaces({lat: startLat, lon: startLon, activity: activity, radius: radius}).then((places) => {
      // for (let p = 0; i < placeList.places.length; p++) {
      //   placeList.places[p].distance = geospacial.getDistance({latitude: userCoords.latitude, longitude: userCoords.longitude},{latitude: placeList.places[p].lat, longitude: placeList.places[p].lat})
      // }
      res.status(200).render('list', {places: places.places, title: "Places"});
      // res.status(200).json(places);
    });
  });
});
    
    
//       places = placelist.places.sort((a,b) => {
//         return a.distance - b.distance;
//       });
//     }).then(res.render('list', {places}));
//   });
// });

module.exports = router;