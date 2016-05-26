var fs = require('fs');
var SiteService = require('./services/sites.js');

// var url = 'localhost';
var url = 'cernecalcium.com';

require('./db/connect');

var buildSiteMap = function(list) {
	console.log('list: ', list);
	var siteMap = ['<!-- Generated by: Cool Name for App.. -->\n\n<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">\n'];
	list.forEach(function(obj) {
		console.log('fileType: ', obj.fileType);
		if( _isHtml(obj.fileType) || _isPdf(obj.fileType) ) {
			if( obj.lastModified !== null ) {
				siteMap.push('\n<url>\n\t<loc>'+obj.fileName+'</loc>\n\t<lastmod>'+obj.lastModified+'</lastmod>\n</url>');
			}
			else {
				siteMap.push('\n<url>\n\t<loc>'+obj.fileName+'</loc>\n</url>');
			}
		}
	});
	siteMap.push('\n\n</urlset>');
	return siteMap.join('');
};
_isHtml = function(fileType) { return /text\/html/.test(fileType) };
_isPdf = function(fileType) { return /application\/pdf/.test(fileType) };


SiteService.findLinksForSite(url, function(doc) {
    var sitemap = buildSiteMap(doc.links);
    fs.unlink('sitemap.xml', function() {
    	console.log('deleted');
    	fs.appendFile('siteMap.xml', sitemap, 'utf8', function() {
	    	console.log('done');
	    });
    });
}, function(err) {
    console.log('error: ', err);
});