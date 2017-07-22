'use strict';

// load env file if in development environment
try { require('./env.js'); } catch(error) {}

// load modules
const express = require('express');
const app = express();
const morgan = require('morgan');
const bodyParser = require('body-parser');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const favicon = require('express-favicon');

// store session data using MongoDB
let dbConnectionString;
if (process.env.state === 'development') {
  dbConnectionString = 'mongodb://localhost:27017/outdoor-activity-finder';
} else {
  dbConnectionString = 'mongodb://smellydogcoding:' + process.env.databasePassword + '@cluster0-shard-00-00-l7zef.mongodb.net:27017,cluster0-shard-00-01-l7zef.mongodb.net:27017,cluster0-shard-00-02-l7zef.mongodb.net:27017/outdoor-activity-finder?ssl=true&replicaSet=Cluster0-shard-0&authSource=admin';
}
app.use(session({
  secret: 'zero fox given',
  resave: true,
  saveUninitialized: false,
  store: new MongoStore({ url: dbConnectionString })
}));

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

app.use(favicon(__dirname + '/public/img/favicon.png'));

// pug template engine
app.set('view engine','pug');
app.set('views', __dirname + '/views');

// catch 404 and forward to error handler
app.use((req, res, next) => {
  res.status(404).render('fourohfour', {title: "404: Page Not Found"});
});

// error handler
// define as the last app.use callback
app.use((error, req, res, next) => {
    res.status(error.status || 500).render('errors', {title: error.status, status: error.status, message: error.message, stack: error.stack, currentUser: req.session.username});
});

// start listening on our port
var server = app.listen(app.get('port'), function() {
  console.log('Express server is listening on port ' + server.address().port);  
});