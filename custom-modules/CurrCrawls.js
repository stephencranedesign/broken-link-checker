var loopObj = require('./utils.js').loopObj;

/*
    CurrCrawls
        - holds a reference to all sites being crawled.
*/
var CurrCrawls = function() {
    this.crawls = {};
    this.activeCrawls = 0;
};
CurrCrawls.prototype.getCrawl = function(user, host) {
    return this.crawls.hasOwnProperty(user+"::"+host) ? this.crawls[user+"::"+host] : null;
};
CurrCrawls.prototype.add = function(user, host, currCrawl) { 
    this.crawls[user+"::"+host] = currCrawl; 
    this.activeCrawls += 1;
};
CurrCrawls.prototype.delete = function(user, host) { 
    
    var crawl = this.getCrawl(user, host);
    if(crawl) crawl.stop();

    delete this.crawls[user+"::"+host];
    this.activeCrawls -= 1;
};
CurrCrawls.prototype.isIdle = function() { return this.activeCrawls ? false : true; };
CurrCrawls.prototype.reportStatus = function() {
    var status = {};
    loopObj(this.crawls, function(key, val) {
        status[key] = val.status;
    });
    return status;
};

var currCrawls = new CurrCrawls();


module.exports.currCrawls = currCrawls;