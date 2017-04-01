var capDecimals = require('./utils.js').capDecimals;
var loopObj = require('./utils.js').loopObj;
var Page = require('./Page');
var Resource = require('./Resource');

var OffendersList = require('./Offenders').List;
var Offender = require('./Offenders').Offender;

var SiteStatus = require('./SiteStatus');
var TimerWrapper = require('./TimerWrapper');


/*
    Description of the site. this is what we eventually send to Db to save info.
*/
var Site = function(user, url, crawlFrequency, crawlOptions) {
    this.url = url;

    this.queue = [];
    this.brokenResources = [];
    this.whitelistedUrls = crawlOptions.hasOwnProperty('whitelistedUrls') ?  crawlOptions.whitelistedUrls : [];
    this.user = user;
    this.pages = [];

    this.crawlFrequency = crawlFrequency;
    this.crawlOptions = crawlOptions;
    this.crawlType = crawlOptions.hasOwnProperty('crawlType') ?  crawlOptions.crawlType : 'full-site';

    this.status = new SiteStatus(this.crawlType);
    this.timer = new TimerWrapper(crawlFrequency);

    console.log('site created: ', this.whitelistedUrls);
};
Site.prototype.fetchStart = function(queueItem) { 
    console.log('fetchStart: ', queueItem);
    this.queue.push(queueItem);
};
Site.prototype.crawlStarted = function() {
    this._logStage('crawlStarted');

    this.brokenResources = [];
    this.queue = [];
    this.pages = [];
    
    if(this.crawlType === 'page-update') return;
    this.crawlStartTime = Date.now();
};
Site.prototype._logStage = function(stageName) {
    console.log('*****************************************');
    console.log('************** '+stageName+' ************');
    console.log('*****************************************');
};
Site.prototype.crawlFinished = function(type) {
    this._logStage('crawlFinished');
    if(type != undefined) this.crawlType = type;
    this.brokenResources = this.getBrokenResources();

    this.worstOffenders = this._findWorstOffenders();
    this.queue = null; // free some space.

    if(this.crawlType === 'page-update') return;
    this.crawlEndTime = Date.now();
    this.crawlDurationInSeconds = capDecimals((this.crawlEndTime - this.crawlStartTime) / 1000, 2);
};

/*
    compares url with whitelisted urls.
    @return bool
*/
Site.prototype._isWhiteListed = function(url) {
    var isWhiteListed = false;
    if( this.whitelistedUrls.indexOf(url) > -1 ) isWhiteListed = true;

    console.log("_isWhiteListed: ", isWhiteListed, url, this.whitelistedUrls.indexOf(url));
    return isWhiteListed;
};

/*
    pass either an array of urls or a single url to add to whiteList array.
    @return void
*/
Site.prototype.whiteListAddUrl = function(url) {
    if(typeof url.forEach === "function") { // check to see if it's an array.
        var array = [];

        // ensure whitelist stays unique.
        url.forEach(function(val) {
            if(array.indexOf(val) > -1) return;
            if(this.whitelistedUrls.indexOf(val) > -1) return;
            array.push(val);
        }.bind(this));

        this.whitelistedUrls = this.whitelistedUrls.concat(array);
        this.crawlOptions.whitelistedUrls = this.whitelistedUrls;
    }
    else {

        // ensure whitelist stays unique.
        if(this.whitelistedUrls.indexOf(url) > -1) return;
        this.whitelistedUrls.push(url);
        this.crawlOptions.whitelistedUrls = this.whitelistedUrls;
    }
};

/*
    look at queueItem.status to determine if the resource is broken.
    @return bool
*/ 
Site.prototype._isBrokenResource = function(status) {
    console.log('_isBrokenResource: ', status);
    return (status === 'notfound' || status === 'failed') ? true : false;
};

Site.prototype._getContentType = function(contentType) {
    var type;

    if(/text/.test(contentType)) type = 'text';
    else if(/image/.test(contentType)) type = 'image';
    else if(/audio/.test(contentType)) type = 'audio';
    else if(/video/.test(contentType)) type = 'video';
    else if(/application/.test(contentType)) type = 'application';
    else type = 'text';

    return type;
};

Site.prototype.makePage = function(config) {
    var page = new Page(config.url, config.path, config.resources);
    this.pages.push(page);
};
/*
    - looks through this.brokenResources array and finds the most frequent offenders
*/
Site.prototype._findWorstOffenders = function() {
    console.log('_findWorstOffenders: ', this.brokenResources);
    var worstOffenders = new OffendersList(this.brokenResources);
    worstOffenders.sortByProp('length', true);
    return worstOffenders.array.slice(0,5);
}; 

/*
    loops through queue and finds status that are considered broken
    @return obj of objs
*/
Site.prototype._determineBadUrls = function() {
    var badUrls = {};

    // adds two items to the badUrls object for each url. 
    // one for the full url and one for the path
    // this is for convience later in the getBrokenResources()
    loopObj(this.queue, function(key, val) {
        if(this._isBrokenResource(val.status)) {
            console.log('broken queueItem: ', val);
            var o = { url: val.url, contentType: this._getContentType(val.stateData.contentType), status: val.status };
            badUrls[val.url] = o;
            if( val.host === this.url ) badUrls[val.path] = o; // only add if from same domain.
        }
    }.bind(this));

    return badUrls;
};

/*
    
*/
Site.prototype.getBrokenResources = function() {
    var badUrlsReference = this._determineBadUrls();
    var brokenResources = [];

    console.log('badUrlsReference: ', badUrlsReference);

    this.pages.forEach(function(page) {
        page.resources.forEach(function(url) {
            console.log('getBrokenResources: ', url);
            if(!badUrlsReference.hasOwnProperty(url)) return;
            console.log('url is about to get added to brokenResources');
            var badUrl = badUrlsReference[url];
            badUrl.referrer = page.url;
            if(this._isWhiteListed(badUrl.url)) badUrl.whiteListed = true;
            var resource = new Resource(this.user, this.url, page.timeStamp, badUrl);
            brokenResources.push(resource);
        }.bind(this));
    }.bind(this));

    return brokenResources;
}

/*
    - grabs fills the site object with all the info the sitesService.save needs in order to save it to the db.
*/
Site.prototype.makeStub = function() {
    this.brokenResources = [];
    this.date = new Date().toLocaleString();
    this.crawlDurationInSeconds = null;
    this.pages = [];

    return this;
};


module.exports.Site = Site;
