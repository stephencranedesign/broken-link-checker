var Crawler = require("simplecrawler");

Crawler.crawl("http://trilixgroup.com/")
    .on("fetchcomplete", function(queueItem) {
        console.log("Completed fetching resource:", queueItem.url);
    });