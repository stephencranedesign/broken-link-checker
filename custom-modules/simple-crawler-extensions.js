var cheerio = require('cheerio');
var Crawler = require('simplecrawler');
var loopObj = require('./utils').loopObj;

class BrokenLinkCrawler extends Crawler {
    constructor(config) {
        var host = 'www.'+config.host.replace('www.', '');
        super(host);

        this.pages = [];

        this._limitCrawlingToHostDomain();
    }

    _limitCrawlingToHostDomain() {
        var myCrawler = this;

        myCrawler.addFetchCondition(function(queueItem, referrerQueueItem) {
            return referrerQueueItem.host === myCrawler.host ? true : false; 
        });
    }


    discoverResources(buffer, queueItem) {

        var crawler = this;

        var $ = cheerio.load(buffer.toString("utf8"));

        var resources = [];
     
        /* page links */
        $("a[href]").map(function () {
            var url = $(this).attr('href');

            /* has a hash -> shouldn't have to worry about a hash url and it causes an error */
            // if(/#/.test(href)) return false;

            if(crawler.shouldAddResource(url, 'a')) resources.push(url);
            // resources.push(href);

        }).get();

        /* imgs */
        $("img[src]").map(function () {
            var url = $(this).attr("src");
            if(crawler.shouldAddResource(url)) resources.push(url);
        }).get();

        /* ifames */
        $("ifame[src]").map(function () {
            var url = $(this).attr("src");
            if(crawler.shouldAddResource(url)) resources.push(url);
        }).get();

        /* scripts */
        $("scripts[href]").map(function () {
            var url = $(this).attr("href");
            if(crawler.shouldAddResource(url)) resources.push(url);
        }).get();

        /* styles */
        $("link[rel='stylesheet']").map(function () {
            var url = $(this).attr("href");
            if(crawler.shouldAddResource(url)) resources.push(url);
        }).get();

        $("link[rel='next']").map(function() {
            var url = $(this).attr("href");
            if(crawler.shouldAddResource(url)) resources.push(url);
        }).get();

        return resources;
    }

    shouldAddResource(url, elmTag) {
        /* has a hash -> shouldn't have to worry about a hash url and it causes an error */
        if(elmTag === 'a' && /#/.test(url)) return false;

        return true;
    }
};

module.exports.BrokenLinkCrawler = BrokenLinkCrawler;