'use strict';

// load modules
const express = require('express');
const app = express();
const morgan = require('morgan');
const bodyParser = require('body-parser');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);

app.use(session({
  secret: 'zero fox given',
  resave: true,
  saveUninitialized: false,
  store: new MongoStore({ url: 'mongodb://localhost:27017/outdoor-activity-finder' })
}));

// make user ID available in templates
app.use(function (req, res, next) {
  res.locals.currentUser = req.session.username;
  res.locals.currentType = req.session.usertype;
  next();
});

// Body Parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

// Routes
const routes = require('./routes.js');
app.use('/', routes);

// set our port
app.set('port', process.env.PORT || 3000);

// morgan gives us http request logging
app.use(morgan('dev'));

// setup our static route to serve files from the "public" folder
app.use('/', express.static('dist/public'));

// pug template engine
app.set('view engine','pug');
app.set('views', __dirname + '/views');

// catch 404 and forward to error handler
app.use((req, res, next) => {
  res.status(404).send('not found');
});

// error handler
// define as the last app.use callback
app.use((error, req, res, next) => {
    res.status(error.status || 500).send(error.message);
});

// start listening on our port
var server = app.listen(app.get('port'), function() {
  console.log('Express server is listening on port ' + server.address().port);  
});