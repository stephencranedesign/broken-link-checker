var cheerio = require('cheerio');
var Crawler = require('simplecrawler');
var loopObj = require('./utils').loopObj;
var Page = require('./Page');

var SiteStatus = require('./SiteStatus');
var capDecimals = require('./utils.js').capDecimals;


/*
    extends https://www.npmjs.com/package/simplecrawler

    added events:
        BrokenLinkCrawller::comb - fires after so many pages have been processed.
        BrokenLinkCrawller::complete
*/
class BrokenLinkCrawler extends Crawler {
    constructor(config) {

        // var host = 'www.'+config.host.replace('www.', '');
        var host = config.host;
        super(host);

        this.pages = [];
        this.lastCombLength = 0;

        this.combInterval = config.combInterval || 300;

        this._limitCrawlingToHostDomain();
        this.crawlerListeners();

        this.pagesLength = 0;

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

        this.on('queueadd', (queueItem, responseObject) => {
            this.status.updateTotalResources();
            // this.urlQueue.push(queueItem.url);
        });

        this.on('fetchheaders', (queueItem, responseObject) => {
            this.status.updateProcessResources();
        });

        this.on('discoverycomplete', (queueItem, resources) => {

            if(!this.shouldCombPages()) return;

            console.log('start of comb | pages: ', this.pages.length, " | queue: ", this.queue.length);

            this.combPages();

            var report = this.getCrawlReport();

            this.deleteProcessedPages();

            console.log('end of comb | pages: ', this.pages.length, " | queue: ", this.queue.length);
            this.emit('BrokenLinkCrawller::comb', report);
        });

        this.on('complete', () => {
            this.crawlEndTime = Date.now();
            this.crawlDurationInSeconds = capDecimals((this.crawlEndTime - this.crawlStartTime) / 1000, 2);
            var report = this.getCrawlReport();

            this.emit('BrokenLinkCrawller::complete', report);
            setTimeout(function() {
                process.kill(process.pid, 'SIGUSR2');
            }, 10000);
        });
    }

    /* 
        after ever 500 process pages pull out items from queue and pages.resources that we dont need. 
    */
    shouldCombPages() {
        var diff = this.status.processedResources - this.lastCombLength;
        console.log('shouldCombPages: ', diff, ' | ', this.combInterval, ' | ', this.status.processedResources, ' | ', this.lastCombLength);
        if(diff < this.combInterval) return false;
        this.lastCombLength = this.status.processedResources;
        return true;
    }

    /* return an array of good resouces from queue to be used by combPages. */
    getCombArray() {
        var urls = [];

        this.queue.getWithStatus("redirected", function(err, items) {
            urls.push(items.url);
        });

        this.queue.getWithStatus("downloaded", function(err, items) {
            urls.push(items.url);
        });

        return urls;
    }

    /* delete resources in page array that have already been returned with redirected / downloaded status code. */
    combPages(array) {
        var array = this.getCombArray();
        this.pages.forEach((page) => {
            // console.log('combing page: ', page.url);
            page.combResources(array);
        });
    }

    makePage(config) {
        var page = new Page(config.url, config.path, config.resources);
        this.pages.push(page);
        this.pagesLength++;
    };

    _getBadUrlsFromQueue() {
        var bad = [],
            urls = [];

        this.queue.getWithStatus("failed", function(err, items) {
            bad = bad.concat(items);
        });

        this.queue.getWithStatus("notfound", function(err, items) {
            bad = bad.concat(items);
        });       

        bad.forEach((resource) => {
            urls.push({ url: resource.url, contentType: this._getContentType(resource.stateData.contentType), status: resource.status });
        });

        return urls;
    };

    _getContentType(contentType) {
        if(contentType === undefined) return null;
        return contentType;
    }

    _getBadUrls() {
        var badUrls = [];
        var badUrlsFromQueue = this._getBadUrlsFromQueue();

        this.pages.forEach((page) => {

            page.resourcesProcessed = true;
            page.resources.forEach((url) => {
                // if(!urlsFromQueue.bad.find(hasOwnProperty(url.absPath)) return; /* needed now? I think that since I combPages this check isn't needed.. */

                var badUrl = badUrlsFromQueue.find(function(element) {
                    return element.url === url.absPath;
                });   

                /* it is a bad url */
                if(badUrl) {
                    badUrl.referrer = url.referrer;
                    badUrl.tagRef = url.tagRef;
                    badUrl.parentTagRef = url.parentTagRef;
                    badUrl.nextTagRef = url.nextTagRef;
                    badUrl.prevTagRef = url.prevTagRef;
                    badUrl.timeStamp = page.timeStamp;

                    badUrls.push(badUrl);
                }

                /* if it isn't a bad url, we've already removed the good ones so that means it is pending. flag the page as still having a pending resource. */
                else page.resoucesProcessed = false;
            });
        });

        return badUrls;
    }

    deleteProcessedPages() {
        var indexesToDelete = [];

        // get indexes to delete
        this.pages.forEach(function(page, i) {
            if(page.resourcesProcessed) indexesToDelete.push(i);
        });

        var idx = 0;
        // delete pages that have had all resources processed.
        indexesToDelete.forEach((i) => {
            this.pages.splice(i-idx, 1);
            idx+=1;
        });
    }

    getCrawlReport() {
        var firstComb = this.status.processedResources > this.combInterval ? false : true;
        return new Report(this._getBadUrls(), this.crawlDurationInSeconds, this.pagesLength, firstComb);
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

class Report {
    constructor(badUrls, crawlDurationInSeconds, totalPages, firstComb) {
        this.badUrls = badUrls;
        this.crawlDurationInSeconds = crawlDurationInSeconds;
        this.totalPages = totalPages;
        this.firstComb = firstComb;
    }
}

module.exports.BrokenLinkCrawler = BrokenLinkCrawler;

