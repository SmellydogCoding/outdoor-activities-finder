const https = require('https');
require('./env.js');  // comment out for production

const getPlaces = (placeData) => {
  return new Promise((resolve,reject) => {
    let body = '';

    const options = {
      hostname: 'trailapi-trailapi.p.mashape.com',
      path: '/?lat=' + placeData.lat + '&lon=' + placeData.lon + '&q[activities_activity_type_name_eq]=' + placeData.activity + '&q[country_cont]=United+States&radius=' + placeData.radius,
      headers: {'X-Mashape-Key': process.env.trailAPIKey}
    };

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
      console.error(error);
    });
  });
};
// getPlaces({lat: '39.80001161', lon: '-80.22746854', activity: 'hiking', radius: '19'});  // for testing

module.exports.getPlaces = getPlaces;