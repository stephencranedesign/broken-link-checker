var mongoose = require('mongoose');

var SiteSchema = new mongoose.Schema({
    url: { type: String, required: true },
    date: { type: Date, required: true },

    downloadedResources: { type: Number, required: false },
    brokenResources: { type: Number, required: false },
    redirectedResources: { type: Number, required: false },
    fetchTimeouts: { type: Number, required: false },
    worstOffenders: { type: Array, required: false },

    crawlOptions: { type: Object, required: false },
    crawlDurationInSeconds: { type: Number, required: false },
    crawlFrequency: { type: Number, required: true }, // should be number of seconds.

    user: { type: String, required: true },

    totalPages: { type: Number, required: false }
});

var Sites = mongoose.model('Sites', SiteSchema);
module.exports = Sites;