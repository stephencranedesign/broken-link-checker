require('./db/connect');
var express = require('express');
var bodyParser = require('body-parser');
var siteRoutes = require('./routes/sites');
var crawlerRoutes = require('./routes/crawler');
var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

app.use('/', siteRoutes);
app.use('/', crawlerRoutes);

app.use('*', function(req, res) {
    res.status(404).json({ message: 'Not Found' });
});

app.listen(8080, function() {
    console.log('Listening on port 8080');
});

exports.app = app;