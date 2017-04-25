/*
    SITE
        - what we store in node to tell if a site is registered.
        - intentionally really small to keep too much memory from being used up..
        - technically we could get away from that and just make a call to the db to see if something is stored..
*/
class Site {
    constructor(user, host) {
        console.log('**Site');
        this.host = host;
        this.user = user;
        this.crawling = false;

        return this;
    }
}



/* 
    SITE UPDATE
        - returns object that should be used to update site on the db.
*/
class SiteUpdate {
    constructor(obj) {
        this.host = obj.host || null; 
        this.user = obj.user || null;
        this.date = obj.date || new Date().toLocaleString(); 
        this.brokenResources = obj.brokenResources || 0;
        this.worstOffenders = obj.worstOffenders || [];
        this.crawlOptions = obj.crawlOptions || {};
        this.crawlDurationInSeconds = obj.crawlDurationInSeconds || 0;
        this.totalPages = obj.totalPages || 0;

        return this;
    }
}


module.exports.Site = Site;
module.exports.SiteUpdate = SiteUpdate;
