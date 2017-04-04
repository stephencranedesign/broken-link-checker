var OffendersList = require('./Offenders').List;
var Offender = require('./Offenders').Offender;

var Resource = require('./Resource');

var TimerWrapper = require('./TimerWrapper');


/*
    Description of the site. 
    this is what we eventually send to Db to save info.
    This should house a site and keep info on it. 
    I'd like to attach a crawl as a property to this object.
    then simplify the CurrCrawls object to only house the Site objects.
*/
var Site = function(user, url, crawlFrequency, crawlOptions) {
    this.url = url;

    this.whitelistedUrls = crawlOptions.hasOwnProperty('whitelistedUrls') ?  crawlOptions.whitelistedUrls : [];
    this.user = user;

    this.crawlFrequency = crawlFrequency;
    this.crawlOptions = crawlOptions;

    this.timer = new TimerWrapper(crawlFrequency);

    this.brokenResources = [];
    this.worstOffenders = [];
    this.totalPages = 0;
    this.crawlDurationInSeconds = 0;

    console.log('site created: ', this.whitelistedUrls);
};

Site.prototype.crawlStarted = function() {
    this._logStage('crawlStarted');

    this.brokenResources = [];
    this.worstOffenders = [];
    this.crawlDurationInSeconds = 0;
    this.totalPages = 0;
    
};
Site.prototype._logStage = function(stageName) {
    console.log('*****************************************');
    console.log('************** '+stageName+' ************');
    console.log('*****************************************');
};
Site.prototype.crawlFinished = function(crawlReport) {
    this._logStage('crawlFinished');
    this.brokenResources = this.getBrokenResources(crawlReport.badUrls);
    this.worstOffenders = this._findWorstOffenders();
    this.crawlDurationInSeconds = crawlReport.crawlDurationInSeconds;
    this.totalPages = crawlReport.totalPages;
};

Site.prototype.getBrokenResources = function(badUrls) {
    var brokenResources = [];

    badUrls.forEach((badUrl) => {
        if(this._isWhiteListed(badUrl.url)) url.whiteListed = true;
        var resource = new Resource(this.user, this.url, badUrl);
        brokenResources.push(resource);
    });

    return brokenResources;
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

Site.prototype._findWorstOffenders = function() {
    console.log('_findWorstOffenders: ', this.brokenResources);
    var worstOffenders = new OffendersList(this.brokenResources);
    worstOffenders.sortByProp('length', true);
    return worstOffenders.array.slice(0,5);
}; 

/*
    compares url with whitelisted urls.
    @return bool
*/
Site.prototype._isWhiteListed = function(url) {
    var isWhiteListed = false;
    if( this.whitelistedUrls.indexOf(url) > -1 ) isWhiteListed = true;

    return isWhiteListed;
};

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
