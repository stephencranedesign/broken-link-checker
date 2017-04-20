var Req200 = function(message) {
    this.message = message;
    this.name = "req200";
    Error.captureStackTrace(this, Req200);
}
Req200.prototype = Object.create(Error.prototype);
Req200.prototype.constructor = Req200;

var Req404 = function(message) {
    this.message = message;
    this.name = "req404";
    Error.captureStackTrace(this, Req404);
}
Req404.prototype = Object.create(Error.prototype);
Req404.prototype.constructor = Req404;


module.exports.Req200 = Req200;
module.exports.Req404 = Req404;

