'use strict';

// load modules
const express = require('express');
const app = express();
const morgan = require('morgan');
const bodyParser = require('body-parser');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const favicon = require('express-favicon');

try { require('./env.js'); } catch(error) { console.log('no env file in production') }

app.use(session({
  secret: 'zero fox given',
  resave: true,
  saveUninitialized: false,
  store: new MongoStore({ url: 'mongodb://smellydogcoding:' + process.env.databasePassword + '@cluster0-shard-00-00-l7zef.mongodb.net:27017,cluster0-shard-00-01-l7zef.mongodb.net:27017,cluster0-shard-00-02-l7zef.mongodb.net:27017/outdoor-activity-finder?ssl=true&replicaSet=Cluster0-shard-0&authSource=admin' })
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

app.use(favicon(__dirname + '/public/img/favicon.png'));

// pug template engine
app.set('view engine','pug');
app.set('views', __dirname + '/views');

// catch 404 and forward to error handler
app.use((req, res) => {
  res.status(404).render('fourohfour', {title: "404: Page Not Found"});
});

// error handler
// define as the last app.use callback
app.use((error, req, res) => {
    res.status(error.status || 500).render('errors', {title: error.status, status: error.status, message: error.message, stack: error.stack});
});

// start listening on our port
var server = app.listen(app.get('port'), function() {
  console.log('Express server is listening on port ' + server.address().port);  
});