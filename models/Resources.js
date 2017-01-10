var mongoose = require('mongoose');

var ResourceSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    _siteUrl: { type: String, required: false },
    user: { type: String, required: true },
    info: { type: Object, required: true },
    isBroken: { type: String, required: true }
});

var Resources = mongoose.model('Resources', ResourceSchema);
module.exports = Resources;