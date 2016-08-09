var cheerio = require('cheerio');
var Crawler = require('simplecrawler');
var FetchQueue = require('simplecrawler').queue;

/*
    extend FetchQueue so that ia allows us to allow un-unique urls into queue.
*/
class BrokenLinkQueue extends FetchQueue {
    constructor(uniqueUrlsOnly) {
        super();
        this.uniqueUrlsOnly = uniqueUrlsOnly;
    }

    exists(protocol, domain, port, path, callback) {
        callback = callback && callback instanceof Function ? callback : function() {};

        port = port !== 80 ? ":" + port : "";

        var url = (protocol + "://" + domain + port + path).toLowerCase();

        if (this.uniqueUrlsOnly && this.scanIndex[url]) {
            callback(null, 1);
            return 1;
        }

        if(this.uniqueUrlsOnly) this.scanIndex[url] = true;

        callback(null, 0);
        return 0;

    };
}

/*
    extend Crawler reasoning:
        If we only extend the queue to allow non-unique urls then we end up hitting a bunch of pages over and over that we dont need to.
        We only care about making sure we have all broken links checked throughout the site. 
        In other words, once we know that a link returns a good status code,
        We dont have to crawl that link ever again. 
        This class allows for that.
*/
class BrokenLinkCrawler extends Crawler {
    constructor(config) {
        console.log('BrokenLinkCrawler');
        super(config.host);
        this.pagesCrawled = {};
        this.goodResources = {};
        this.setUniqueUrlsForQueue(config.uniqueUrlsOnly);
    }

    discoverResources(buffer, queueItem) {
        console.log('discoverResources: ', this.pagesCrawled[queueItem.url]);
        if(this.pagesCrawled[queueItem.url]) return [];

        var crawler = this;

        var $ = cheerio.load(buffer.toString("utf8"));

        var resources = [];
     
        /* page links */
        $("a[href]").map(function () {
            var url = $(this).attr('href');

            /* has a hash -> shouldn't have to worry about a hash url and it causes an error */
            // if(/#/.test(href)) return false;

            if(crawler.shouldAddResource(url, 'a')) resources.push(url);
            console.log(resources.length);
            // resources.push(href);

        }).get();

        /* imgs */
        $("img[src]").map(function () {
            var url = $(this).attr("src");
            if(crawler.shouldAddResource(url)) resources.push(url);
            console.log(resources.length);
        }).get();

        /* scripts */
        $("scripts[href]").map(function () {
            var url = $(this).attr("href");
            if(crawler.shouldAddResource(url)) resources.push(url);
            console.log(resources.length);
        }).get();

        /* styles */
        $("link[rel='stylesheet']").map(function () {
            var url = $(this).attr("href");
            if(crawler.shouldAddResource(url)) resources.push(url);
            console.log(resources.length);
        }).get();

        this.pagesCrawled[queueItem.url] = true;

        console.log('discoveredResources: ', resources);

        return resources;
    }

    /*
        dig through header received and if it has a status code of 200 or 300 then set a property on goodResources.
        This is referenced by the discoverResources function prior to adding a reference to the queue.
        If a reference is downloadable we dont care where it came from in the site. If it is not downloadable, than we want to know every place that it is listed on the site.
    */
    processHeader(responseObject) {

        // was an error.
        if(responseObject.statusCode > 399) return false;

        // is a redirect
        else if(responseObject.statusCode > 299 && responseObject.statusCode < 400) {
            console.log('redirect found: ', responseObject.req.path);
            // redirecting to error page..
            if(/\/404\.aspx\?aspxerrorpath=\//.test(responseObject.headers.location)) return false;
            console.log('goodResourceFound: ', responseObject.req.path)
            // this.goodResourceFound(responseObject.req.path, "redirect");
        }

        // successfully downloaded
        else if(responseObject.statusCode > 199 && responseObject.statusCode < 300) {
            console.log('goodResourceFound: ', responseObject.req.path);
            this.goodResourceFound(responseObject.req.path, "downloaded");
        }
    }

    goodResourceFound(url, type) {
        if(this.goodResources.hasOwnProperty(url)) return;
        this.goodResources[url] = new GoodResource(url, type);
    }

    shouldAddResource(url, elmTag) {
        console.log('shouldAddResource: ', url, ' | ', this.goodResources[url], ' | ', elmTag);
        /* has a hash -> shouldn't have to worry about a hash url and it causes an error */
        if(elmTag === 'a' && /#/.test(url)) return false;
        if(this.goodResources[url]) return false;

        return true;
    }

    /* OverRide the Queue that simple crawler sets up in its constructor call. */
    setUniqueUrlsForQueue(uniqueUrlsOnly) {
        console.log('setUniqueUrlsForQueue');
        if(uniqueUrlsOnly === undefined) uniqueUrlsOnly = true;
        this.queue = new BrokenLinkQueue(uniqueUrlsOnly);
    }
};

/*
    Allows us to distinquish between downloaded / redirected good links.
    This is important b/c if a page is downloaded once, we dont want to fetch it again;
    however, with a redirect, we need to allow it to be downloaded twice to actually get the links.
*/
class GoodResource {
    constructor(url, type) {
        this.url = url;
        this.type = type;
    };

    shouldFetch() {
        return this.type === "redirect" ? true : false;
    }
}

module.exports.BrokenLinkCrawler = BrokenLinkCrawler;