'use strict';

// load modules
const express = require('express');
const app = express();
const morgan = require('morgan');
const bodyParser = require('body-parser');

// const session = require('express-session');
// const mongoStore = require('connect-mongo')(session);

// mongodb connection
//
// db.on('open', () => {console.log('Database connection successful');});
// mongo error
// db.on('error', console.error.bind(console, 'connection error:'));

// Body Parser
// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({extended: false}));

// Routes
const router = require('./routes.js');
app.use('/', router);

// set our port
app.set('port', process.env.PORT || 5000);

// morgan gives us http request logging
app.use(morgan('dev'));

// setup our static route to serve files from the "public" folder
app.use('/', express.static('public'));

// catch 404 and forward to error handler
app.use((req, res, next) => {
  // res.status(404).render('error');
});

// error handler
// define as the last app.use callback
app.use((error, req, res, next) => {
    // res.status(error.status || 500).render(error);
  }
);

// start listening on our port
var server = app.listen(app.get('port'), function() {
  console.log('Express server is listening on port ' + server.address().port);  
});