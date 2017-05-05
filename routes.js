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
  getUserCoords.then((result) => {
    res.status(200).render('list', {result});
  });
});
    // userCoords.latitude = coords.lat;
    // userCoords.longitude = coords.lng;
    // console.log(coords);
    // res.render('list', {places: coords});
  // }, (reject) => {
  //   console.log(reject);
  // });
//     trailapi.getPlaces({lat: coords.lat, lon: coords.lng, activity: activity, radius: radius}).then((placeList) => {
//       for (let p = 0; i < placeList.places.length; p++) {
//         placeList.places[p].distance = geospacial.getDistance({latitude: userCoords.latitude, longitude: userCoords.longitude},{latitude: placeList.places[p].lat, longitude: placeList.places[p].lat})
//       }
//       places = placelist.places.sort((a,b) => {
//         return a.distance - b.distance;
//       });
//     }).then(res.render('list', {places}));
//   });
// });

module.exports = router;