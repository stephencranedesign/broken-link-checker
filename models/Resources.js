var mongoose = require('mongoose');

var ResourceSchema = new mongoose.Schema({
    _siteUrl: { type: String, required: false },
    user: { type: String, required: true },
    whiteListed: { type: Boolean, required: true },
    contentType: { type: String, required: true },
    url: { type: String, required: true },
    timeStamp: { type: Date, required: true },
    status: { type: String, required: true },
    referrer: { type: String, required: true }
});

var Resources = mongoose.model('Resources', ResourceSchema);
module.exports = Resources;