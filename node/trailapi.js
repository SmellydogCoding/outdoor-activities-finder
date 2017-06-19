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
  text = text.replace(/<br \/>{1,2}|br\s\/|&lt;|&gt;/g, ''); // \xa0 === &nbsp;
  text = text.replace(/\.\b|\.\s{1,2}\b/g, '.\xa0\xa0');
  return text;
};

module.exports = {
  getPlaces:getPlaces,
  cleanDescription: cleanDescription
};