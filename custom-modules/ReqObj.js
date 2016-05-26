var ReqObj = function(req) {
    this.fileType = null;
    this.fileName = this._buildUrl(req);
    this.refererUrl = req.headers.Referer;
    this.statusCode = -1;
};
ReqObj.prototype._buildUrl = function(reqObj) {
    var test = reqObj.agent.protocol+'//'+reqObj.host+reqObj.path;
    return test;
};

module.exports = ReqObj;