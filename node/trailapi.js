const https = require('https');
require('./env.js');  // comment out for production

const getPlaces = (placeData) => {
  return new Promise((resolve,reject) => {
    let body = '';

    let options = {
      hostname: 'trailapi-trailapi.p.mashape.com',
      path: "",
      headers: {'X-Mashape-Key': process.env.trailAPIKey}
    };

    if (placeData.radius === .01) {
      options.path = '/?lat=' + placeData.lat + '&lon=' + placeData.lon + '&radius=' + placeData.radius;
    } else if (placeData.activity === "all") {
      options.path = '/?lat=' + placeData.lat + '&lon=' + placeData.lon + '&q[country_cont]=United+States&radius=' + placeData.radius;
    } else {
      options.path = '/?lat=' + placeData.lat + '&lon=' + placeData.lon + '&q[activities_activity_type_name_eq]=' + placeData.activity + '&q[country_cont]=United+States&radius=' + placeData.radius;
    }

    let req = https.get(options, function(res) {
      res.on('data', function(data) {
        body += data;
      });

      res.on('end', function() {
        let result = JSON.parse(body);
        resolve(result);
      });
    });

    req.on('error', function(error) {
      reject(error);
      console.error('trailAPI: ' + error);
    });
  });
};
// getPlaces({lat: '39.80001161', lon: '-80.22746854', activity: 'hiking', radius: '19'});  // for testing

const cleanDescription = (text) => {
  return text = text.replace(/&lt;br \/&gt;<br \/>/, '\xa0\xa0');
};

module.exports = {
  getPlaces:getPlaces,
  cleanDescription: cleanDescription
};