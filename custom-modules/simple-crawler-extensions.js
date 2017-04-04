var cheerio = require('cheerio');
var Crawler = require('simplecrawler');
var loopObj = require('./utils').loopObj;
var Page = require('./Page');

var SiteStatus = require('./SiteStatus');
var capDecimals = require('./utils.js').capDecimals;

class BrokenLinkCrawler extends Crawler {
    constructor(config) {
        var host = 'www.'+config.host.replace('www.', '');
        super(host);

        this.pages = [];

        this._limitCrawlingToHostDomain();
        this.crawlerListeners();

        this.status = new SiteStatus();
    }

    _limitCrawlingToHostDomain() {
        var myCrawler = this;

        myCrawler.addFetchCondition(function(queueItem, referrerQueueItem) {
            return referrerQueueItem.host === myCrawler.host ? true : false; 
        });
    };

    /*
        add listeners to curr crawl to sync with status object.
    */
    crawlerListeners() {
        this.on('crawlstart', () => {
            this.crawlStartTime = Date.now();
        });

        this.on('fetchheaders', (queueItem, responseObject) => {
            this.status.updateProcessResources();
        });

        this.on('discoverycomplete', (queueItem, resources) => {
            this.makePage({ url: queueItem.url, path: queueItem.path, resources: resources });
            this.status.updateTotalResources(this.queue.length);
        });

        this.on('complete', () => {
            this.crawlEndTime = Date.now();
            this.crawlDurationInSeconds = capDecimals((this.crawlEndTime - this.crawlStartTime) / 1000, 2);
        });
    }

    makePage(config) {
        var page = new Page(config.url, config.path, config.resources);
        this.pages.push(page);
    };

    /*
        uses
        @return obj of objs
    */
    _getBadUrlsReference() {
        var resources = [], badUrls = {};

        this.queue.getWithStatus("failed", function(err, items) {
            resources = resources.concat(items);
        });

        this.queue.getWithStatus("notfound", function(err, items) {
            resources = resources.concat(items);
        });

        resources.forEach((resource) => {
            var o = { url: resource.url, contentType: resource.stateData.contentType, status: resource.status };
            badUrls[resource.url] = o;
        });

        return badUrls;
    };

    _getBadUrls() {
        var badUrls = [];
        var badUrlsRef = this._getBadUrlsReference();

        this.pages.forEach((page) => {
            page.resources.forEach((url) => {
                if(!badUrlsRef.hasOwnProperty(url.absPath)) return;

                var badUrl = badUrlsRef[url.absPath];
                badUrl.referrer = url.referrer;
                badUrl.timeStamp = page.timeStamp;

                badUrls.push(badUrl);
            });
        });

        return badUrls;
    }

    getCrawlReport() {

        return {
            badUrls: this._getBadUrls(),
            crawlDurationInSeconds: this.crawlDurationInSeconds,
            totalPages: this.pages.length
        }
    }

    discoverResources(buffer, queueItem) {

        var crawler = this;

        var string = buffer.toString("utf8");

        console.log('discoverResources string: ', string);
        console.log('***');

        var $ = cheerio.load(string);

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

