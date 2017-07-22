'use strict';

try { require('./env.js'); } catch(error) {} // no env file in production environment

const https = require('https');

// get a list of places from the trail api
const getPlaces = (placeData) => {
  return new Promise((resolve,reject) => {
    let body = '';

    let options = {
      hostname: 'trailapi-trailapi.p.mashape.com',
      path: "",
      headers: {'X-Mashape-Key': process.env.trailAPIKey}
    };

    // modify query string based on activity and radius
    if (placeData.radius === .1) {
      options.path = '/?lat=' + placeData.lat + '&lon=' + placeData.lng + '&radius=' + placeData.radius;
    } else if (placeData.activity === "all") {
      options.path = '/?lat=' + placeData.lat + '&lon=' + placeData.lng + '&q[country_cont]=United+States&radius=' + placeData.radius;
    } else {
      options.path = '/?lat=' + placeData.lat + '&lon=' + placeData.lng + '&q[activities_activity_type_name_eq]=' + placeData.activity + '&q[country_cont]=United+States&radius=' + placeData.radius;
    }

    let req = https.get(options, function(res) {
      res.on('data', function(data) {
        body += data;
      });

      res.on('end', function() {
        let result = JSON.parse(body);
        // the json object will have a message key if there is an error
        if (result.message) {
          let error = new Error(result.message);
          reject(error);
        } else {
          resolve(result);
        }
      });
    });

    req.on('error', function(error) {
      reject(error);
      console.error('trailAPI Error: ' + error);
    });
  });
};

// remove unwanted characters from place descriptions
// add 2 spaces after a period at the end of a sentence
const cleanDescription = (text) => {
  text = text.replace(/<br \/>{1,2}|br\s\/|&lt;|&gt;/g, ''); // \xa0 === &nbsp;
  text = text.replace(/\.\b|\.\s{1,2}\b/g, '.\xa0\xa0');
  return text;
};

module.exports = {
  getPlaces:getPlaces,
  cleanDescription: cleanDescription
};