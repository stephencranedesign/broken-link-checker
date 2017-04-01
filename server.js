require('./config.js');
require('./db/connect');

var express = require('express');
var bodyParser = require('body-parser');

var siteRoutes = require('./routes/sites');
var crawlerRoutes = require('./routes/crawler');
var resourcesRoutes = require('./routes/resources');
var authentication = require('./custom-modules/authentication.js');

var port = process.env.PORT || 8080;

var app = express();
app.use(express.static('public'));

app.use(bodyParser.urlencoded({ extended: true }));	

authentication.config(app);

app.use('/', authentication.routes);
app.use('/', siteRoutes);
app.use('/', crawlerRoutes);
app.use('/', resourcesRoutes);

app.use('*', function(req, res) {
    res.status(404).json({ message: 'Not Found' });
});

app.listen(port, function() {
    console.log('Listening on port '+port);
});

exports.app = app;