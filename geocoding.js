const https = require('https');
if (process.env.stage === 'development') { require('./env.js'); }

const getCoords = (addressData) => {
  
  let options = {
    host: 'maps.googleapis.com',
    port: 443,
    path: '/maps/api/geocode/json?address=' + addressData + '&key=' + process.env.googleAPIKey,
  };

  let req = https.get(options, function(res) {
    console.log(res.statusCode);
    res.on('data', function(result) {
      console.log(result);
    });
  });

  req.on('error', function(e) {
    console.error(e);
  });

};
getCoords('15351');