const express = require('express');
const router = express.Router();
const MongoClient = require('mongodb').MongoClient
const ObjectID = require('mongodb').ObjectID;
const geospacial = require('./geospacial.js');
const trailapi = require('./trailapi.js');
const weatherapi = require('./weather.js');
const bcrypt = require('bcrypt');
const mid = require('./middleware.js');

require('./env.js');  // comment out for production

MongoClient.connect('mongodb://localhost:27017/outdoor-activity-finder', (error,db) => {
  if (error) {
    console.log(error)
  } else {
    console.log('Database Connection Successful');
    const users = db.collection('users');
    const places = db.collection('places');

    router.get('/', (req, res) => {
      res.render('index', {title: 'Outdoor Activity Locator', currentUser: req.session.username});
    });

    router.post('/', (req, res) => {

      let activity = req.body.activity;
      let radius = req.body.radius;

      const GPSData = () => {
        return new Promise((resolve,reject) => {
          if (req.body.zip) {
            let getUserCoords = geospacial.getCoords(req.body.zip);
            getUserCoords.then((coords) => {
              resolve(coords);
            });
          } else {
            let coords = { lat: req.body.userLattitude, lng: req.body.userLongitude }
            resolve(coords);
          }
        });
      }

      GPSData().then((coords) => {

        trailapi.getPlaces({lat: coords.lat, lng: coords.lng, activity: activity, radius: radius}).then((places) => {
          let origin = {latitude: coords.lat, longitude: coords.lng};

          let filterdPlaces = places.places.filter((item) => {
            return item.activities.length > 0;
          });

          let distanceToPlaces = filterdPlaces.map((item) => {
            let destination = {latitude: item.lat, longitude: item.lon};
            item.distance = geospacial.getDistance(origin,destination);
            return item;
          });

          let sortedPlaces = distanceToPlaces.sort((a,b) => {
            return a.distance - b.distance;
          });

          res.status(200).render('places', {places: sortedPlaces, title: "Search Results", currentUser: res.locals.currentUser, home: {lat: coords.lat, lon: coords.lng}, key: process.env.googleMapsAPIKey});
        });
      });
    });

    router.get('/place', (req, res) => {
      let total;
      let average;
      trailapi.getPlaces({lat: req.query.lat, lon: req.query.lon, radius: .01}).then((place) => {
        for (let a = 0; a < place.places[0].activities.length; a++) {
          place.places[0].activities[a].description = trailapi.cleanDescription(place.places[0].activities[a].description)
        }
        weatherapi.getWeather(req.query.lat,req.query.lon).then((weather) => {
          weather.main.temp = weather.main.temp.toFixed();
          weather.wind.speed = weather.wind.speed.toFixed();
          weather.wind.deg = weatherapi.convertToDirection(weather.wind.deg);
          places.find({_id: place.places[0].unique_id}).toArray((error,dbplace) => {
            if (dbplace[0] === undefined) {
              dbplace = [{reviews: [{message: 'No reviews for this place yet.  Be the first to write a review!'}]}];
            } else {
              total = 0;
              for (let r = 0; r < dbplace[0].reviews.length; r++) {
                total += dbplace[0].reviews[r].rating;
              }
              average = total / dbplace[0].reviews.length
            }
            res.status(200).render('place', {place: place.places[0], weather: weather, title: place.places[0].name, key: process.env.googleMapsAPIKey, reviews: dbplace[0], currentUser: res.locals.currentUser, average: average});
          });
        });
      });
    });

    router.post('/reviews', mid.loginRequired, (req,res,next) => {
      let uniqueID = parseInt(req.body.uniqueID);
      let reviewID = new ObjectID(uniqueID);
      let rating = parseInt(req.body.rating);
      let referringUrl = '/place?lat=' + req.body.lat + '&lon=' + req.body.lon;
      if (req.body.noReviews) {
        places.insert({_id:reviewID,name:req.body.placeName,link: referringUrl,reviews:[{username: res.locals.currentUser,rating: rating,description: req.body.description, date: new Date()}]},(error,result) => {
          if (error) {
            return next(error);
          } else {
            console.log(result);
            users.update({username: res.locals.currentUser},{$push: {reviews: reviewID}},(error,result) => {
              if (error) {
                return next(error);
              } else {
                console.log(result);
                res.redirect(referringUrl);
              }
            });
          }
        });
      } else {
        places.update({_id:reviewID},{$push: {reviews: {username: res.locals.currentUser,rating: rating,description: req.body.description, date: new Date()}}},(error,result) => {
          if (error) {
            return next(error);
          } else {
            users.update({username: res.locals.currentUser},{$push: {reviews: reviewID}},(error,result) => {
              if (error) {
                return next(error);
              } else {
                console.log(result);
                res.redirect(referringUrl);
              }
            });
          }
        });
      }
    });

    router.get('/user', (req,res,next) => {
      users.find({username: res.locals.currentUser}).toArray((error,user) => {
        if (error) {
          return next(error);
        } else {
          let options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
          user[0].joined_on = user[0].joined_on.toLocaleDateString('en-US',options);
          res.render('user', {title: 'User Profile', user: user[0], currentUser: res.locals.currentUser});
        }
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
          bcrypt.compare(req.body.password, user[0].password , function(error, result) {
            if (result === false) {
              console.log('incorrect password');
            } else {
              req.session.username = user[0].username;
              req.session.usertype = user[0].type;
              res.redirect('/');
            }
          });
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

    router.get('/signup', (req,res) => {
      res.render('signup', {title: 'Sign Up'});
    });

    router.post('/signup', (req,res,next) => {
      users.find({username: req.body.username}).toArray((error,user) => {
        if (user[0] !== undefined) {
          return console.log('username already exists'); // eventually res.send
        } else {
          users.find({email: req.body.email}).toArray((error,user) => {
            if (user[0] !== undefined) {
              return console.log('that email is already associated with an existing user'); // eventually res.send
            } else {
              if (req.body.password !== req.body.confirmPassword) {
                return console.log('passwords do not match');
              } else {
                bcrypt.hash(req.body.password, 10, (error, hash) => {
                  if (error) {
                    return next(error);
                  } else {
                    req.body.password = hash;
                    users.insert({username: req.body.username, password: req.body.password, type: 'user', email: req.body.email, joined_on: new Date()}, (error,result) => {
                      if (error) {
                        return next(error);
                      } else {
                        console.log(result);
                        req.session.username = req.body.username;
                        req.session.usertype = 'user';
                        res.redirect('/')
                      }
                    });
                  }
                });
              }
            }
          });
        }
      });
    });

    router.get('/changepassword', (req,res) => {
      res.render('changepassword', {title: 'Change Your Password', currentUser: res.locals.currentUser});
    });

    router.post('/changepassword', (req,res,next) => {
      users.find({username: res.locals.currentUser}).toArray((error,user) => {
        bcrypt.compare(req.body.currentPass, user[0].password , function(error, result) {
          if (error) {
            return next(error)
          } else if (result === false) {
            error.message = "incorrect password";
            return next(error);
          } else if (req.body.password !== req.body.confirmPassword) {
              error.message = 'passwords do not match';
          } else {
            bcrypt.hash(req.body.password, 10, (error, hash) => {
              if (error) {
                return next(error);
              } else {
                req.body.password = hash;
                users.update({username: res.locals.currentUser},{$set: {password: req.body.password}},(error,result) => {
                  if (error) {
                    return next(error);
                  } else if (result) {
                    console.log(result);
                    res.redirect('/');
                  }
                });
              }
            });
          }
        });
      });
    });
    
  }
});

module.exports = router;