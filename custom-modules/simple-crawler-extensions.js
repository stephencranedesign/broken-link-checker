var cheerio = require('cheerio');
var Crawler = require('simplecrawler');

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
        // var host = 'www.'+config.host.replace('www.', '');
        super(config.host);

        this.limitOutBoundLinks();
        this.pages = {};
    }

    discoverResources(buffer, queueItem) {
        // console.log('discoverResources: ', this.pagesCrawled[queueItem.url]);
        console.log('discoverResources queueItem: ', queueItem);
        
        // if(this.pagesCrawled[queueItem.url]) return [];

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

        $("link[rel='next']").map(function() {
            var url = $(this).attr("href");
            if(crawler.shouldAddResource(url)) resources.push(url);
            console.log(resources.length);
        }).get();

        // this.pagesCrawled[queueItem.url] = true;

        this.pages[queueItem.url] = resources;

        console.log('discoveredResources: ', resources);

        return resources;
    }

    limitOutBoundLinks(queueItem, referrerQueueItem) {

        var myCrawler = this;

        myCrawler.addFetchCondition(function(queueItem, referrerQueueItem) {
            console.log('addFetchCondition 2', myCrawler.host);
            console.log('queueItem: ', queueItem);
            console.log('referrerQueueItem: ', referrerQueueItem);

            // requesting resource from same domain as page resource was found on.
            if(queueItem.host === referrerQueueItem.host) {
                console.log('resource host is same as referrer host');

                // the referrer page host is not the crawler host.
                if(queueItem.host != myCrawler.host && referrerQueueItem.host != myCrawler.host) {
                    console.log('referrer page host is not crawler host.')
                    return false;
                }
                // else return true;
                else { // the referrer page host is the crawler host.

                    console.log('referrer page host is crawler host.')
                    // get the link if it is not already added to the goodResources object.
                    // if(!myCrawler.goodResources.hasOwnProperty(queueItem.path)) return true;

                    // if it is on the object, call shouldFetch to see if it is a redirect or a downloaded.
                    // return myCrawler.goodResources[queueItem.path].shouldFetch();

                    return true;
                }
            }

            // requesting resource from different domain the page resource was found on.
            else if(referrerQueueItem.host != myCrawler.host) return false;

            // download.
            else return true;
        });
    }


    shouldAddResource(url, elmTag) {
        console.log('shouldAddResource: ', url, ' | ', '<',elmTag,'>');
        /* has a hash -> shouldn't have to worry about a hash url and it causes an error */
        if(elmTag === 'a' && /#/.test(url)) return false;
        // if(this.goodResources[url]) return false;

        return true;
    }
};

module.exports.BrokenLinkCrawler = BrokenLinkCrawler;