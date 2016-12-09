require('./config.js');
require('./db/connect');

var SitesService = require('./services/sites.js');
var ResourcesService = require('./services/resources.js');
var PagesService = require('./services/pages.js');

// function flush () {
	SitesService.drop(function() {
		console.log('sites dropped');
	}, function(err) {
		console.log('err dropping sites: ', err);
	});
	ResourcesService.drop(function() {
		console.log('resources dropped');
	}, function(err) {
		console.log('err dropping resources: ', err);
	});
	PagesService.drop(function() {
		console.log('pages dropped');
	}, function(err) {
		console.log('err dropping pages: ', err);
	});
// }

// module.exports.flush = flush;