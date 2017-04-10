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
            var o = { url: resource.url, contentType: this._getContentType(resource.stateData.contentType), status: resource.status };
            badUrls[resource.url] = o;
        });

        return badUrls;
    };

    _getContentType(contentType) {
        if(contentType === undefined) return null;
        return contentType;
    }

    _getBadUrls() {
        var badUrls = [];
        var badUrlsRef = this._getBadUrlsReference();

        this.pages.forEach((page) => {
            page.resources.forEach((url) => {
                if(!badUrlsRef.hasOwnProperty(url.absPath)) return;

                var badUrl = badUrlsRef[url.absPath];
                badUrl.referrer = url.referrer;
                badUrl.tagRef = url.tagRef;
                badUrl.parentTagRef = url.parentTagRef;
                badUrl.nextTagRef = url.nextTagRef;
                badUrl.prevTagRef = url.prevTagRef;
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

        var $ = cheerio.load(string);

        var resources = []; /* array of strings to return to simplecrawler */
        var resourceInterfaces = []; /* used to process pages later. */
     
        /* page links */
        $("a[href]").map(function () {
            var $elm = $(this);
            var url = $elm.attr('href');

            if(url === undefined) url = "";

            /* has a hash -> shouldn't have to worry about a hash url and it causes an error */
            // if(/#/.test(href)) return false;

            if(crawler.shouldAddResource(url, 'a')) {
                resources.push(url);    
                resourceInterfaces.push(new ResourceInterface(url, $elm));
            }
        }).get();

        /* imgs */
        $("img[src]").map(function () {
            var $elm = $(this);
            var url = $elm.attr("src");

            if(url === undefined) url = "";

            if(crawler.shouldAddResource(url)) {
                resourceInterfaces.push(new ResourceInterface(url, $elm));
                resources.push(url);
            }
        }).get();

        /* ifames */
        $("ifame[src]").map(function () {
            var $elm = $(this);
            var url = $elm.attr("src");

            if(url === undefined) url = "";

            if(crawler.shouldAddResource(url)) {
                resourceInterfaces.push(new ResourceInterface(url, $elm));
                resources.push(url);
            }
        }).get();

        /* scripts */
        $("scripts[href]").map(function () {
            var $elm = $(this);
            var url = $elm.attr("href");

            if(url === undefined) url = "";

            if(crawler.shouldAddResource(url)) {
                resourceInterfaces.push(new ResourceInterface(url, $elm));
                resources.push(url);
            }
        }).get();

        /* styles */
        $("link[href]").map(function () {
            var $elm = $(this);
            var url = $elm.attr("href");

            if(url === undefined) url = "";

            if(crawler.shouldAddResource(url)) {
                resourceInterfaces.push(new ResourceInterface(url, $elm));
                resources.push(url);
            }
        }).get();

        this.makePage({ url: queueItem.url, path: queueItem.path, resources: resourceInterfaces });

        return resources;
    }

    shouldAddResource(url, elmTag) {
        /* has a hash -> shouldn't have to worry about a hash url and it causes an error */
        if(elmTag === 'a' && /#/.test(url)) return false;

        return true;
    }
};

class ResourceInterface {
    constructor(url, $elm) {
        if(url === undefined) url = "";
        this.url = url;
        this.tagRef = this._getTagReference($elm);
        this.parentTagRef = this._getTagReference($elm.parent());
        this.prevTagRef = this._getTagReference($elm.prev());
        this.nextTagRef = this._getTagReference($elm.next());
    }


    _getTagReference($elm) {
        
        if(!$elm.length) return null;

        var array = [];
        var tagName = $elm.prop("tagName");
        var id = $elm.prop('id');
        var classNames = $elm.prop('class');

        array.push("<");
        array.push(tagName);
        if(id != undefined) array.push('#'+id)
        if(classNames != undefined) {
            classNames = classNames.split(' ');
            array.push('.'+classNames.join('.'));
        }

        array.push(">");

        return array.join('');
    }
}

module.exports.BrokenLinkCrawler = BrokenLinkCrawler;

