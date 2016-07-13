var mongoose = require('mongoose');

var SiteSchema = new mongoose.Schema({
    url: { type: String, required: true },
    date: { type: Date, required: true },
    // links: { type: Array, required: true },
    downloadedLinks: { type: Array, required: false },
    brokenLinks: { type: Array, required: false },
    redirectedLinks: { type: Array, required: false },
    fetchTimeouts: { type: Array, required: false },

    crawlOptions: { type: Object, required: false },
    crawlDurationInSeconds: { type: Number, required: false },
    crawlFrequency: { type: Number, required: true } // should be number of seconds.
});

var Sites = mongoose.model('Sites', SiteSchema);

module.exports = Sites;