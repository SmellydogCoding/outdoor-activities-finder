const express = require('express');
const router = express.Router();
const MongoClient = require('mongodb').MongoClient
const geospacial = require('./geospacial.js');
const trailapi = require('./trailapi.js');
const weatherapi = require('./weather.js');
const bcrypt = require('bcrypt');
const mid = require('./middleware.js');

require('./env.js');  // comment out for production

// MongoClient.connect('mongodb://localhost:27017/outdoor-activity-finder', (error,db) => {
MongoClient.connect('mongodb://smellydogcoding:' + process.env.databasePassword + '@cluster0-shard-00-00-l7zef.mongodb.net:27017,cluster0-shard-00-01-l7zef.mongodb.net:27017,cluster0-shard-00-02-l7zef.mongodb.net:27017/outdoor-activity-finder?ssl=true&replicaSet=Cluster0-shard-0&authSource=admin', (error,db) => {
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
      let zipcodeRegex = /^\d{5}$/;
      let activity = req.body.activity;
      let radius = req.body.radius;
      let zipcode = req.body.zip;
      let sortedPlaces;
      let errorFields = [];
      let errorMessages = [];

      const GPSData = () => {
        return new Promise((resolve,reject) => {
          if (zipcode || zipcode === "") {
            switch(true) {

              case (zipcode === ""):
                errorFields.push("zipcode")
                errorMessages.push("Zip Code is required.");
                resolve();
                break;

              case (zipcodeRegex.test(zipcode)):
                let GPSInput = 'address=' + zipcode;
                let getUserCoords = geospacial.getGPSData(GPSInput);
                getUserCoords.then((coords) => {
                  resolve(coords.coords);
                });
                break;

              default:
                errorFields.push("zipcode")
                errorMessages.push("Zip Code must be a 5 digit number.");
                resolve();
                break;
            }
          } else {
            let coords = { lat: req.body.userLattitude, lng: req.body.userLongitude }
            resolve(coords);
          }
          // reject();
        });
      }

      GPSData().then((coords) => {

        if (radius === "") { 
          errorFields.push("radius");
          errorMessages.push("You must choose a Distance.");
        }
        if (activity === "") { 
          errorFields.push("activity");
          errorMessages.push("You must choose an Activity.");
        }

        if (errorFields[0] === undefined) {
          trailapi.getPlaces({lat: coords.lat, lng: coords.lng, activity: activity, radius: radius}).then((places) => {
            let origin = {latitude: coords.lat, longitude: coords.lng};

            if (places.places.length > 0) {

            let filterdPlaces = places.places.filter((item) => {
              return item.activities.length > 0;
            });

            let distanceToPlaces = filterdPlaces.map((item) => {
              let destination = {latitude: item.lat, longitude: item.lon};
              item.distance = geospacial.getDistance(origin,destination);
              return item;
            });

            sortedPlaces = distanceToPlaces.sort((a,b) => {
              return a.distance - b.distance;
            });

            } else {
              sortedPlaces = "no results";
            }

            res.status(200).render('places', {places: sortedPlaces, title: "Search Results", currentUser: res.locals.currentUser, home: {lat: coords.lat, lon: coords.lng}, key: process.env.googleMapsAPIKey, zipcode, radius, activity});
          });
        } else {
          res.status(400).render('places', {places: [], title: "Search Results", currentUser: req.session.username, errorFields, errorMessages, zipcode, radius, activity});
          }
      });
    });

    router.get('/place', (req, res, next) => {
      let total;
      let average;
      trailapi.getPlaces({lat: req.query.lat, lng: req.query.lng, radius: .1}).then((place) => {
        for (let a = 0; a < place.places[0].activities.length; a++) {
          place.places[0].activities[a].description = trailapi.cleanDescription(place.places[0].activities[a].description)
        }
        let GPSInput = 'latlng=' + req.query.lat + ',' + req.query.lng;
        let getUserCoords = geospacial.getGPSData(GPSInput);
        getUserCoords.then((coords) => {
          weatherapi.getWeather(req.query.lat,req.query.lng).then((weather) => {
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
              let link = `/place?lat=${req.query.lat}&lng=${req.query.lng}`;
              users.find({username: req.session.username, "favorites.id": parseInt(place.places[0].unique_id)}).toArray((error,user) => {
                if (error) { return next(error) }
                let favorited = false;
                if (user[0] !== undefined) { favorited = true; }
                res.status(200).render('place', {place: place.places[0], weather: weather, title: place.places[0].name, key: process.env.googleMapsAPIKey, reviews: dbplace[0], currentUser: req.session.username, average, zipcode: coords.zipcode, link, favorited});
              });
            });
          });
        });
      });
    });

    router.post('/reviews', mid.loginRequired, (req,res,next) => {
      let uniqueID = parseInt(req.body.uniqueID);
      let rating = parseInt(req.body.rating);
      let referringUrl = '/place?lat=' + req.body.lat + '&lng=' + req.body.lon;
      if (req.body.noReviews) {
        places.insert({_id:uniqueID,name:req.body.placeName,link: referringUrl,reviews:[{username: res.locals.currentUser,rating: rating,comment: req.body.description, posted_on: new Date()}]},(error,result) => {
          if (error) {
            return next(error);
          } else {
            console.log(result);
            users.update({username: res.locals.currentUser},{$push: {reviews: uniqueID}},(error,result) => {
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
        places.update({_id:uniqueID},{$push: {reviews: {username: res.locals.currentUser,rating: rating,comment: req.body.description, posted_on: new Date()}}},(error,result) => {
          if (error) {
            return next(error);
          } else {
            users.update({username: res.locals.currentUser},{$push: {reviews: uniqueID}},(error,result) => {
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

    router.post('/removereview', mid.loginRequired, (req,res,next) => {
      places.update({_id: parseInt(req.body.ID)}, {$pull: {reviews: {username: req.session.username}}},(error,result) => {
        if (error) { return next(error); }
        console.log(result);
        places.find({_id: parseInt(req.body.ID)}).toArray((error,place) => {
          if (place[0].reviews.length === 0) {
            places.deleteOne({_id: parseInt(req.body.ID)},(error,result) => {
              if (error) {return next(error); }
              console.log(result);
              res.redirect(req.body.link);
            });
          } else {
            res.redirect(req.body.link);
          }
        });
      });
    });

    router.get('/user', mid.loginRequired, (req,res,next) => {
      users.find({username: req.session.username}).toArray((error,user) => {
        if (error) {
          return next(error);
        } else {
          let userReviews = [];
          for (let review in user[0].reviews) {
            userReviews.push({_id: user[0].reviews[review]});
          }
          places.find({$or: userReviews}).toArray((error,places) => {
            res.render('user', {title: 'User Profile', user: user[0], places, currentUser: req.session.username});
          });
        }
      });
    });
    
    router.get('/login', (req,res) => {
      res.render('login', {title: 'login', referer: req.headers.referer});
    });

    router.post('/login', (req,res,next) => {
      let invalidUser = false;
      let invalidPass = false;
      let referer = req.body.referer;
      if (referer.includes('/login') || referer.includes('/signup')) { referer = '/'; }
      users.find({username: req.body.username}).toArray((error,user) => {
        if (error) {
          return next(error);
        } else if (user[0] === undefined) {
          invalidUser = true;
          res.render('login', {title: 'login', referer, invalidUser});
        } else {
          bcrypt.compare(req.body.password, user[0].password , function(error, result) {
            if (result === false) {
              invalidPass = true;
              res.render('login', {title: 'login', referer, invalidPass, user: user[0].username});
            } else {
              req.session.username = user[0].username;
              req.session.usertype = user[0].type;
              res.redirect(referer);
            }
          });
        }
      });
    });

    router.get('/logout', mid.loginRequired, (req, res, next) => {
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

    router.get('/changepassword', mid.loginRequired, (req,res) => {
      res.render('changepassword', {title: 'Change Your Password', currentUser: res.locals.currentUser});
    });

    router.post('/changepassword', mid.loginRequired, (req,res,next) => {
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

    router.post('/addfavorite', mid.loginRequired, (req,res,next) => {
      users.find({username: req.session.username, "favorites.id": parseInt(req.body.uniqueID)}).toArray((error,user) => {
        if (error) { return next(error); }
        if (user[0] !== undefined) {
          let error = new Error("You have already added this place to your favorites")
          return next(error);
        }
        users.update({username: req.session.username}, {$push: {favorites: {id: parseInt(req.body.uniqueID), name: req.body.name, city: req.body.city, state: req.body.state, link: req.body.link}}},(error,result) => {
          if (error) { return next(error); }
          console.log(result);
          res.redirect(req.body.link);
        });
      });
    });

    router.post('/removefavorite', mid.loginRequired, (req,res,next) => {
      users.update({username: req.session.username}, {$pull: {favorites: {id: parseInt(req.body.uniqueID)}}},(error,result) => {
        if (error) { return next(error); }
        console.log(result);
        res.redirect('/user');
      });
    });
    
  }
});

module.exports = router;