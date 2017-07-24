'use strict';

// load env file if in development environment
try { require('./env.js'); } catch(error) {} // no env file in production environment

// load modules
const express = require('express');
const router = express.Router();
const MongoClient = require('mongodb').MongoClient
const ObjectID = require('mongodb').ObjectID;
const geospacial = require('./geospacial.js');
const trailapi = require('./trailapi.js');
const weatherapi = require('./weather.js');
const bcrypt = require('bcrypt');
const mid = require('./middleware.js');

// connect to the database
let dbConnectionString;
if (process.env.state === 'development') {
  dbConnectionString = 'mongodb://localhost:27017/outdoor-activity-finder';
} else {
  dbConnectionString = 'mongodb://smellydogcoding:' + process.env.databasePassword + '@cluster0-shard-00-00-l7zef.mongodb.net:27017,cluster0-shard-00-01-l7zef.mongodb.net:27017,cluster0-shard-00-02-l7zef.mongodb.net:27017/outdoor-activity-finder?ssl=true&replicaSet=Cluster0-shard-0&authSource=admin';
}
MongoClient.connect(dbConnectionString, (error,db) => {
  let users;
  let places;
  
  if (error) {
    console.log('Database Connection Error: ' + error);
  } else {
    if (process.env.state === 'development') {
      console.log('Local Database Connection Successful')
    } else {
      console.log('MongoDB Atlas Database Connection Successful');
    }
    // on successful connection, set collections to a variable
    users = db.collection('users');
    places = db.collection('places');
  }

  router.get('/', (req, res) => {
    res.render('index', {title: 'Outdoor Activity Locator', currentUser: req.session.username});
  });

  router.post('/', (req, res, next) => {
    let zipcodeRegex = /^\d{5}$/;
    let activity = req.body.activity;
    let radius = req.body.radius;
    let zipcode = req.body.zip;
    let sortedPlaces;
    let errorFields = [];
    let errorMessages = [];

    // use zip code from the search form to get GPS coords from Google
    // if front end validation is bypassed, error messages will be generated for incorrect form field submissions
    const GPSData = () => {
      return new Promise((resolve,reject) => {
        if (zipcode || zipcode === "") {
          switch(true) {

            case (zipcode === ""):
              errorFields.push("zipcode")
              errorMessages.push("Zip Code is required.");
              resolve();
              break;
            // use regex to test if the zip code is in the proper format
            case (zipcodeRegex.test(zipcode)):
              let GPSInput = 'address=' + zipcode;
              let getUserCoords = geospacial.getGPSData(GPSInput);
              getUserCoords.then((coords) => {
                resolve(coords.coords);
              }).catch((error) => { return next(error); });
              break;

            default:
              errorFields.push("zipcode")
              errorMessages.push("Zip Code must be a 5 digit number.");
              resolve();
              break;
          }
        } else {
          // if user uses the location api of their browser, bypass the Google Geolocation api call
          let coords = { lat: req.body.userLattitude, lng: req.body.userLongitude }
          resolve(coords);
        }
      });
    }

    GPSData().then((coords) => {
      // if front end validation is bypassed, error messages will be generated for incorrect form field submissions 
      if (radius === "") { 
        errorFields.push("radius");
        errorMessages.push("You must choose a Distance.");
      }

      if (activity === "") { 
        errorFields.push("activity");
        errorMessages.push("You must choose an Activity.");
      }
      // if no validation errors, use gps data to get places data from the trail api
      if (errorFields[0] === undefined) {
        trailapi.getPlaces({lat: coords.lat, lng: coords.lng, activity: activity, radius: radius}).then((places) => {
          let origin = {latitude: coords.lat, longitude: coords.lng};
          // if search returns at least one result
          if (places.places.length > 0) {
          // filter out any places that don't have any activites (how did they get in the database in the first place?)
          let filterdPlaces = places.places.filter((item) => {
            return item.activities.length > 0;
          });
          // use the users origin gps coords to calculate the distace between the user and each place
          // add a distace key to each place with this data
          let distanceToPlaces = filterdPlaces.map((item) => {
            let destination = {latitude: item.lat, longitude: item.lon};
            item.distance = geospacial.getDistance(origin,destination);
            return item;
          });
          // sort places in ascending order based on distance from the user
          sortedPlaces = distanceToPlaces.sort((a,b) => {
            return a.distance - b.distance;
          });
          // if there are no results from the search
          } else {
            sortedPlaces = "no results";
          }
          // render the places page
          res.status(200).render('places', {places: sortedPlaces, title: "Search Results", currentUser: req.session.username, home: {lat: coords.lat, lon: coords.lng}, key: process.env.googleMapsAPIKey, zipcode, radius, activity});
        }).catch((error) => { return next(error); });
      } else {
        // render the places page with errors on the search form
        res.status(400).render('places', {places: [], title: "Search Results", currentUser: req.session.username, errorFields, errorMessages, zipcode, radius, activity});
        }
    }).catch((error) => { return next(error); });  // send any errors to the error handler
  });

  router.get('/place', (req, res, next) => {
    let total;
    let average;
    // get a single place from the trail api by using gps coords and a radius of .1 miles
    // (why didn't they design this api to allow you to query by unique id ?!?)
    trailapi.getPlaces({lat: req.query.lat, lng: req.query.lng, radius: .1}).then((place) => {
      // remove unwanted characters from the description
      for (let a = 0; a < place.places[0].activities.length; a++) {
        place.places[0].activities[a].description = trailapi.cleanDescription(place.places[0].activities[a].description)
      }
      let GPSInput = 'latlng=' + req.query.lat + ',' + req.query.lng;
      let getUserCoords = geospacial.getGPSData(GPSInput);
      // use Googe geospacial api to get the zip code for this location
      getUserCoords.then((coords) => {
        // get the current weather conditions for this location from openweather api
        weatherapi.getWeather(req.query.lat,req.query.lng).then((weather) => {
          weather.main.temp = weather.main.temp.toFixed();
          weather.wind.speed = weather.wind.speed.toFixed();
          // convert wind direction degrees to cardinal directions
          weather.wind.deg = weatherapi.convertToDirection(weather.wind.deg);
          // query database to see if this place has any reviews
          places.find({_id: place.places[0].unique_id}).toArray((error,dbplace) => {
            if (error) {
              let mongoError = new Error('MongoDB Error: ' + error);
              return next(mongoError)
            }
            if (dbplace[0] === undefined) {
              // message (for frontend UI) if there are no reviews for this place
              dbplace = [{reviews: [{message: 'No reviews for this place yet.  Be the first to write a review!'}]}];
            } else {
              // calculate average rating for reviews
              total = 0;
              for (let r = 0; r < dbplace[0].reviews.length; r++) {
                total += dbplace[0].reviews[r].rating;
              }
              average = total / dbplace[0].reviews.length
            }
            // link is a field in the places collection
            let link = `/place?lat=${req.query.lat}&lng=${req.query.lng}`;
            // query database to see if the current user has 'favorited' this location (for frontend UI)
            users.find({username: req.session.username, "favorites.id": parseInt(place.places[0].unique_id)}).toArray((error,user) => {
              if (error) {
                let mongoError = new Error('MongoDB Error: ' + error);
                return next(mongoError)
              }
              let favorited = false;
              if (user[0] !== undefined) { favorited = true; }
              // render place page
              res.status(200).render('place', {place: place.places[0], weather: weather, title: place.places[0].name, key: process.env.googleMapsAPIKey, reviews: dbplace[0], currentUser: req.session.username, average, zipcode: coords.zipcode, link, favorited});
            });
          });
        }).catch((error) => { return next(error); });
      }).catch((error) => { return next(error); });
    }).catch((error) => { return next(error); });
  });

  router.post('/reviews', mid.loginRequired, (req,res,next) => {
    let uniqueID = parseInt(req.body.uniqueID); // convert form data (string) to integer
    let rating = parseInt(req.body.rating);
    let comment = req.body.description;
    let referringUrl = '/place?lat=' + req.body.lat + '&lng=' + req.body.lon;

    // if front end validation is bypassed, error messages will be generated for incorrect form field submissions
    if (comment === "") {
      let error = new Error('Reviews can not be blank.');
      return next(error);
    }

    if (req.body.rating === undefined) {
      let error = new Error('You must choose a rating.');
      return next(error);
    }

    // query database to see if this user has already posted a review for this place
    places.find({_id:uniqueID, reviews: {$elemMatch: {username: req.session.username} } }).toArray((error,place) => {
      if (error) {
        let mongoError = new Error('MongoDB Error: ' + error);
        return next(mongoError)
      }
      if (place[0] !== undefined) {
        let error = new Error('You can only write 1 review per place.');
        return next(error);
      } else {
        if (req.body.noReviews) {
          // if this place has no reviews, add this place (with it's review) to the places collection
          places.insert({_id:uniqueID,name:req.body.placeName,link: referringUrl,reviews:[{id: new ObjectID(), username: req.session.username,rating: rating,comment: comment, posted_on: new Date()}]},(error,result) => {
            if (error) {
              let mongoError = new Error('MongoDB Error: ' + error);
              return next(mongoError)
            } else {
              console.log(result);
              // add this place to the list of places this user has reviewed
              users.update({username: req.session.username},{$push: {reviews: uniqueID}},(error,result) => {
                if (error) {
                  let mongoError = new Error('MongoDB Error: ' + error);
                  return next(mongoError)
                } else {
                  console.log(result);
                  // reroute the user back to the place page after successful review submission
                  res.redirect(referringUrl);
                }
              });
            }
          });
        } else {
          // if this place already has reviews, add this review to the list of reviews
          places.update({_id:uniqueID},{$push: {reviews: {id: new ObjectID(), username: req.session.username,rating: rating,comment: comment, posted_on: new Date()}}},(error,result) => {
            if (error) {
              let mongoError = new Error('MongoDB Error: ' + error);
              return next(mongoError)
            } else {
              // add this place to the list of places this user has reviewed
              users.update({username: req.session.username},{$push: {reviews: uniqueID}},(error,result) => {
                if (error) {
                  let mongoError = new Error('MongoDB Error: ' + error);
                  return next(mongoError)
                } else {
                  console.log(result);
                  // reroute the user back to the place page after successful review submission
                  res.redirect(referringUrl);
                }
              });
            }
          });
        }
      }
    });

  });

  router.post('/removereview', mid.loginRequired, (req,res,next) => {
    // make sure that the person trying to delete the review is the one the posted it
    if (req.session.username !== req.body.reviewPoster && req.session.usertype !== "admin") {
      let error = new Error('You can only delete a review if you are the one that created it.');
      return next(error);
    }
    // remove the review
    places.update({_id: parseInt(req.body.placeID)}, {$pull: {reviews: {id: ObjectID(req.body.reviewID), username: req.body.reviewPoster}}},(error,result) => {
      if (error) {
        let mongoError = new Error('MongoDB Error: ' + error);
        return next(mongoError)
      }
      console.log(result);
      // if the place has no other reviews, remove the place from the places collection
      places.find({_id: parseInt(req.body.placeID)}).toArray((error,place) => {
        if (place[0].reviews.length === 0) {
          places.deleteOne({_id: parseInt(req.body.placeID)},(error,result) => {
            if (error) {
              let mongoError = new Error('MongoDB Error: ' + error);
              return next(mongoError)
            }
            console.log(result);
            // reroute the user back to the place page after successful deletion
            res.redirect(req.body.link);
          });
        } else {
          // reroute the user back to the place page after successful deletion
          res.redirect(req.body.link);
        }
      });
    });
  });

  router.get('/user', mid.loginRequired, (req,res,next) => {
    users.find({username: req.session.username}).toArray((error,user) => {
      if (error) {
        let mongoError = new Error('MongoDB Error: ' + error);
        return next(mongoError)
      } else {
        // create list of place id's from user reviews
        let userReviews = [];
        for (let review in user[0].reviews) {
          userReviews.push({_id: user[0].reviews[review]});
        }
        // use place id's to query all places a user has reviewed
        places.find({$or: userReviews}).toArray((error,places) => {
          if (error) {
            let mongoError = new Error('MongoDB Error: ' + error);
            return next(mongoError)
          }
          res.render('user', {title: 'User Profile', user: user[0], places, currentUser: req.session.username, currentType: req.session.usertype});
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
    // redirect user to home page after login or signup
    if (referer.includes('/login') || referer.includes('/signup')) { referer = '/'; }
    // look for user in the users collection
    users.find({username: req.body.username}).toArray((error,user) => {
      if (error) {
        let mongoError = new Error('MongoDB Error: ' + error);
        return next(mongoError)
      } else if (user[0] === undefined) {
        invalidUser = true;
        // show error on login page if user not found
        res.render('login', {title: 'login', referer, invalidUser});
      } else {
        // check password
        bcrypt.compare(req.body.password, user[0].password , function(error, result) {
          if (error) {
            let bcryptError = new Error('Bcrypt Error: ' + error);
            return next(bcryptError)
          }
          if (result === false) {
            invalidPass = true;
            // show error on login page if password is incorrect
            res.render('login', {title: 'login', referer, invalidPass, user: user[0].username});
          } else {
            // set user into session if correct credentials
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
      // remove user from session on logout
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
    let emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    let passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[$@$!%*?&])[A-Za-z\d$@$!%*?&]{8,}/;
    let username = req.body.username;
    let email = req.body.email;
    let password = req.body.password;
    let confirmPassword = req.body.confirmPassword;
    
    let errorFields = [];
    let errorMessages = [];

    // if front end validation is bypassed, error messages will be generated for incorrect form field submissions
    if (username === "") { 
      errorFields.push("username");
      errorMessages.push("You must enter a User Name.");
    }

    if (email === "") { 
      errorFields.push("email");
      errorMessages.push("You must enter an Email Address.");
    } else if (email !== "" && !emailRegex.test(email)) { 
      errorFields.push("email");
      errorMessages.push("That is not a valid Email Address.");
    }

    if (password === "") { 
      errorFields.push("password");
      errorMessages.push("You must enter a password.");
    } else if (password !== "" && !passwordRegex.test(password)) { 
      errorFields.push("password");
      errorMessages.push("Your password must be at least 8 characters with at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character.");
    }

    if (confirmPassword === "") { 
      errorFields.push("confirmPassword");
      errorMessages.push("You must re-enter your password.");
    } else if (confirmPassword !== password) { 
      errorFields.push("confirmPassword");
      errorMessages.push("Passwords must match.");
    }

    // if validation errors
    if (errorFields[0] !== undefined) {
      res.status(400).render('signup', {title: "Sign Up", username, email, errorFields, errorMessages});
    } else { // if no validation errors
      // see if submitted username is already in the database
      users.find({username: req.body.username}).toArray((error,user) => {
        if (error) {
          let mongoError = new Error('MongoDB Error: ' + error);
          return next(mongoError)
        }
        if (user[0] !== undefined) {
          errorFields.push("username");
          errorMessages.push("That username is already in use");
          res.status(400).render('signup', {title: "Sign Up", username, email, errorFields, errorMessages});
        } else {
          // see if submitted email is already in the database
          users.find({email: req.body.email}).toArray((error,user) => {
            if (error) {
              let mongoError = new Error('MongoDB Error: ' + error);
              return next(mongoError)
            }
            if (user[0] !== undefined) {
              errorFields.push("email");
              errorMessages.push("That email address is already in use");
              res.status(400).render('signup', {title: "Sign Up", username, email, errorFields, errorMessages});
            } else {
              // hash the users password
              bcrypt.hash(req.body.password, 10, (error, hash) => {
                if (error) {
                  let bcryptError = new Error('Bcrypt Error: ' + error);
                  return next(bcryptError)
                } else {
                  req.body.password = hash;
                  // insert the new user into the database
                  users.insert({username: req.body.username, password: req.body.password, type: 'user', email: req.body.email, joined_on: new Date()}, (error,result) => {
                    if (error) {
                      let mongoError = new Error('MongoDB Error: ' + error);
                      return next(mongoError)
                    } else {
                      console.log(result);
                      // place the new user into session
                      req.session.username = req.body.username;
                      req.session.usertype = 'user';
                      res.redirect('/')
                    }
                  });
                }
              });
            }
          });
        }
      });
    }
  });

  router.get('/changepassword', mid.loginRequired, (req,res) => {
    res.render('changepassword', {title: 'Change Your Password', currentUser: req.session.username});
  });

  router.post('/changepassword', mid.loginRequired, (req,res,next) => {
    let passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[$@$!%*?&])[A-Za-z\d$@$!%*?&]{8,}/;
    let currentPassword = req.body.currentPassword;
    let password = req.body.password;
    let confirmPassword = req.body.confirmPassword;

    let errorFields = [];
    let errorMessages = [];
    
    // if front end validation is bypassed, error messages will be generated for incorrect form field submissions
    if (currentPassword === "") { 
      errorFields.push("currentPassword");
      errorMessages.push("You must enter your current password.");
    }

    if (password === "") { 
      errorFields.push("password");
      errorMessages.push("You must enter a new password.");
    } else if (password !== "" && !passwordRegex.test(password)) { 
      errorFields.push("password");
      errorMessages.push("Your password must be at least 8 characters with at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character.");
    }

    if (confirmPassword === "") { 
      errorFields.push("confirmPassword");
      errorMessages.push("You must re-enter your new password.");
    } else if (confirmPassword !== password) { 
      errorFields.push("confirmPassword");
      errorMessages.push("Passwords must match.");
    }

    // if validation errors
    if (errorFields[0] !== undefined) {
      res.status(400).render('changepassword', {title: "Change Your Password", errorFields, errorMessages});
    } else { // if no validation errors
      users.find({username: req.session.username}).toArray((error,user) => {
        if (error) {
          let mongoError = new Error('MongoDB Error: ' + error);
          return next(mongoError)
        }
        // check to see if the user put in the correct current password
        bcrypt.compare(req.body.currentPassword, user[0].password , function(error, result) {
          if (error) {
            let bcryptError = new Error('Bcrypt Error: ' + error);
            return next(bcryptError)
          } else if (result === false) {
            errorFields.push("currentPassword");
            errorMessages.push("The password that you entered for your Current Password is not correct.");
            return res.status(400).render('changepassword', {title: "Change Your Password", errorFields, errorMessages});
          } else {
            // hash new password
            bcrypt.hash(req.body.password, 10, (error, hash) => {
              if (error) {
                let bcryptError = new Error('Bcrypt Error: ' + error);
                return next(bcryptError)
              } else {
                req.body.password = hash;
                // update the database with the new password
                users.update({username: req.session.username},{$set: {password: req.body.password}},(error,result) => {
                  if (error) {
                    let mongoError = new Error('MongoDB Error: ' + error);
                    return next(mongoError)
                  } else if (result) {
                    console.log(result);
                    // send success message
                    res.status(200).render('changepassword', {title: "Change Your Password", successMessage: "Password successfully changed"});
                  }
                });
              }
            });
          }
        });
      });
    }
  });

  router.post('/addfavorite', mid.loginRequired, (req,res,next) => {
    // check to see if the user has favorited this place already
    users.find({username: req.session.username, "favorites.id": parseInt(req.body.uniqueID)}).toArray((error,user) => {
      if (error) {
        let mongoError = new Error('MongoDB Error: ' + error);
        return next(mongoError)
      }
      // this shouldn't be needed unless something goes wrong with the favorite button in the frontend UI
      if (user[0] !== undefined) {
        let error = new Error('You have already added this place to your favorites.  Go to your <a href="/user">user profile page</a> to remove it from your favorites.')
        return next(error);
      }
      // add place to user's favorites list
      users.update({username: req.session.username}, {$push: {favorites: {id: parseInt(req.body.uniqueID), name: req.body.name, city: req.body.city, state: req.body.state, link: req.body.link}}},(error,result) => {
        if (error) {
          let mongoError = new Error('MongoDB Error: ' + error);
          return next(mongoError)
        }
        console.log(result);
        res.redirect(req.body.link);
      });
    });
  });

  router.post('/removefavorite', mid.loginRequired, (req,res,next) => {
    // remove favorite from user's favorites list
    users.update({username: req.session.username}, {$pull: {favorites: {id: parseInt(req.body.uniqueID)}}},(error,result) => {
      if (error) {
        let mongoError = new Error('MongoDB Error: ' + error);
        return next(mongoError)
      }
      console.log(result);
      res.redirect('/user');
    });
  });

  router.get('/about', (req,res) => {
    res.render('about',{title: "About This Project"});
  });

  router.get('/admin', mid.loginRequired, (req,res,next) => {
    // the free tier of MongoDB Atlas doesn't include the file explorer so I guess I better make an admin page *lol*
    // this is still a work in progress, but it is meant only for me
    if (req.session.usertype === "admin") {
      users.find({}).toArray((error,users) => {
        if (error) {
          let mongoError = new Error('MongoDB Error: ' + error);
          return next(mongoError)
        }
        places.find({}).toArray((error,places) => {
          if (error) {
            let mongoError = new Error('MongoDB Error: ' + error);
            return next(mongoError)
          }
          res.render('admin', {title: "Admin Console", users, places, currentUser: req.session.username});
        });
      });
    } else {
      let error = new Error('You must be an admin to use this page.');
      error.status = 401;
      return next(error);
    }
  }); 
    
});

module.exports = router;