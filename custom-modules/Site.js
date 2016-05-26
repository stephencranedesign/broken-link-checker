var ReqObj = require('./ReqObj.js');
var ResObj = require('./ResObj.js');

var Site = function(url) {
    this.url = url;
    this.uId = 0;
    this.linksIndexMap = {};
    this.links = [];
};
Site.prototype.setlinksIndex = function(url) {
    this.linksIndexMap[url] = this.uId;
    this.uId++;
};
Site.prototype.getlinksIndex = function(url) {
    return this.linksIndexMap[url];
};
Site.prototype.addRequest = function(obj) {
    this.links.push(new ReqObj(obj));
};
Site.prototype.addResponse = function(url, res) {
    var index = this.getlinksIndex(url);
    this.links[index] = new ResObj(this.links[index], res);
};
Site.prototype.findBrokenLinks = function() {
    var brokenLinks = []
    this.links.forEach(function(elm) {
        var code = parseInt(elm.statusCode);
        if(code >= 400 || code === -1) {
            brokenLinks.push(elm);
        }
    });
    this.brokenLinks = brokenLinks;
};

module.exports = Site;