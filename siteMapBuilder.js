var fs = require('fs');
var SiteService = require('./services/sites.js');

var url = 'localhost';

require('./db/connect');

var buildSiteMap = function(list) {
	console.log('list: ', list);
	var siteMap = ['<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">'];
	list.forEach(function(obj) {
		siteMap.push('<url><loc>'+obj.fileName+'</loc></url>');
	});
	siteMap.push('</urlset>');
	return siteMap.join('');
	
};


SiteService.findSite(url, function(res) {

	var o = res.toObject();
	console.log('o: ', o.list, o);
    // var sitemap = buildSiteMap(o.list);
    // fs.appendFile('siteMap.txt', sitemap, 'utf8', callback);
}, function(err) {
    console.log('error: ', err);
});