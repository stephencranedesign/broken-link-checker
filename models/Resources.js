var mongoose = require('mongoose');

var ResourceSchema = new mongoose.Schema({
    user: { type: String, required: true },
    host: { type: String, required: false },
    contentType: { type: String, required: false },
    url: { type: String, required: true },
    timeStamp: { type: Date, required: true },
    referrer: { type: String, required: true },
    status: { type: String, required: true },
    tagRef: { type: String, required: false },
    parentTagRef: { type: String, required: false },
    prevTagRef: { type: String, required: false },
    nextTagRef: { type: String, required: false },
    whiteListed: { type: Boolean, required: true }
});

var Resources = mongoose.model('Resources', ResourceSchema);
module.exports = Resources;