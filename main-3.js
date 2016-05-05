var Crawler = require("simplecrawler");

var myCrawler = new Crawler("www.cernecalcium.com");

/*
    Goal:
        - function to return obj with:
            fileType:
            refererUrl:
            fileName:
            status: 
*/
var makeReqObj = function(req) {
    return {
        fileType: null,
        refererUrl: req.headers.Referer,
        statusCode: 'pending'
    }
};
var makeResObj = function(req, res) {
    return {
        fileType: res.headers['content-type'],
        refererUrl: req.refererUrl,
        statusCode: res.statusCode
    }
};

myCrawler.initialPath = "/";
// myCrawler.initialPort = 8080;
myCrawler.initialProtocol = "http";

myCrawler.maxConcurrency = 1;
// myCrawler.maxDepth = 3;

var cache = {};

myCrawler.on('crawlstart', function() {
    cache = {};
});

myCrawler.on("fetchstart", function(queueItem, requestOptions) {
    // console.log('requestOptions: ', requestOptions);
    cache[queueItem.url] = makeReqObj(requestOptions);
});

myCrawler.on("fetchcomplete", function(queueItem, responseBuffer, response) {
    cache[queueItem.url] = makeResObj(cache[queueItem.url], response);
    // console.log('response: ', response);
    // console.log('fetchcomplete: ', cache);
});

myCrawler.on("fetcherror", function(queueItem, response) {
    cache[queueItem.url] = makeResObj(cache[queueItem.url], response);
});

myCrawler.on('complete', function() {
   console.log('***do something', cache); 
});

/* exclude images */
// myCrawler.addFetchCondition(function(parsedURL, queueItem) {
//     return !parsedURL.path.match(/\.png$|\.jpg$|\.jpeg$|\.svg$|\.gif$|\.ico$/i);
// });

// /* exclude static resources */
// myCrawler.addFetchCondition(function(parsedURL, queueItem) {
//     return !parsedURL.path.match(/\.css$|\.js$/i);
// });

myCrawler.start();