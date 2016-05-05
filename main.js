var Crawler = require("simplecrawler");

var crawler = new Crawler("www.trilixgroup.com");

var startedFetches = 0, completedFetches = 0;

function checkComplete() {
    if( completedFetches !== 0 && startedFetches === completedFetches ) crawlComplete();
}

function crawlComplete() {
    console.log('do something');
}
 
crawler.interval = 500;
crawler.maxDepth = 1;
crawler.initialProtocol = "http";
 
crawler.on('fetchstart', function(queueItem) {
    console.log('fetchstart: ', queueItem.url);
    startedFetches++;
    checkComplete();
});

crawler.on('fetcherror', function(queueItem) {
    console.log('fetcherror: ', queueItem.url);
    completedFetches++;
    checkComplete();
});
 
crawler.on("fetchcomplete", function(queueItem, responseBuffer, response) {
    // console.log("Completed fetching resource:", queueItem.url);
    console.log("I just received %s (%d bytes)", queueItem.url, responseBuffer.length);
    console.log("It was a resource of type %s", response.headers['content-type']);
    completedFetches++;
    checkComplete();
});

crawler.on("complete", function() {
    console.log("Complete");
});

crawler.addFetchCondition(function(parsedURL, queueItem) {
    return !parsedURL.path.match(/\.pdf$/i);
});

crawler.addFetchCondition(function(parsedURL, queueItem) {
    return !parsedURL.path.match(/\.png$/i);
});

crawler.addFetchCondition(function(parsedURL, queueItem) {
    return !parsedURL.path.match(/\.jpg$/i);
});

crawler.addFetchCondition(function(parsedURL, queueItem) {
    return !parsedURL.path.match(/\.ico$/i);
});

crawler.addFetchCondition(function(parsedURL, queueItem) {
    return !parsedURL.path.match(/\.gif$/i);
});

crawler.addFetchCondition(function(parsedURL, queueItem) {
    return !parsedURL.path.match(/\.svg$/i);
});

crawler.addFetchCondition(function(parsedURL, queueItem) {
    return !parsedURL.path.match(/\.js$/i);
});

crawler.addFetchCondition(function(parsedURL, queueItem) {
    return !parsedURL.path.match(/\.css$/i);
});

crawler.start();