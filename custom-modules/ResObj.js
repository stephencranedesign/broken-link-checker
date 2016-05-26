var ResObj = function(req, res) {
    this.fileType = res.headers['content-type'];
    this.fileName = req.fileName;
    this.refererUrl = req.refererUrl;
    this.statusCode = res.statusCode;
    this.lastModified = this._setLastModified(res.headers);
};
ResObj.prototype._setLastModified = function(headers) {
    var date = new Date(headers['last-modified']);
    if( date == 'Invalid Date' ) return null;
    return date.getFullYear()+'/'+date.getMonth()+'/'+date.getDay();
}

module.exports = ResObj;