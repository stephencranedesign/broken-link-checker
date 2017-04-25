var mongoose = require('mongoose');

var SiteSchema = new mongoose.Schema({
    host: { type: String, required: true },
    date: { type: Date, required: true },

    // downloadedResources: { type: Number, required: false },
    brokenResources: { type: Number, required: false },
    // redirectedResources: { type: Number, required: false },
    // fetchTimeouts: { type: Number, required: false },
    worstOffenders: { type: Array, required: false },

    crawlOptions: { type: Object, required: false },
    crawlDurationInSeconds: { type: Number, required: false },

    user: { type: String, required: true },

    totalPages: { type: Number, required: false }
});

var Sites = mongoose.model('Sites', SiteSchema);
module.exports = Sites;