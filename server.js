require('./config.js');
require('./db/connect');

var express = require('express');
var bodyParser = require('body-parser');

var siteRoutes = require('./routes/sites');
var crawlerRoutes = require('./routes/crawler');
var pagesRoutes = require('./routes/pages');
var resourcesRoutes = require('./routes/resources');

var app = express();
app.use(express.static('public'));

// require('./custom-modules/google-apis.js').config(app);


/* for login stuff.. */
// var auth = require('./custom-modules/authentication');
// auth.config(app);

// app.use(auth.isAuthenticated('/login.html'));

// if(typeof auth === 'undefined')
app.use(bodyParser.urlencoded({ extended: true }));	

app.use('/', siteRoutes);
app.use('/', crawlerRoutes);
app.use('/', pagesRoutes);
app.use('/', resourcesRoutes);

app.use('*', function(req, res) {
    res.status(404).json({ message: 'Not Found' });
});

app.listen(8080, function() {
    console.log('Listening on port 8080');
});

exports.app = app;