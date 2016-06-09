var mongoose = require('mongoose');

var SiteSchema = new mongoose.Schema({
    url: { type: String, required: true },
    links: { type: Array, required: true },
    date: { type: Date, required: true },
    brokenLinks: { type: Array, required: true },
    ftpHost: { type: String, required: true },
    ftpUserName: { type: String, required: true },
    ftpPassword: { type: String, required: true }
    // lastModified: { type: String, required: true }
});

var Sites = mongoose.model('Sites', SiteSchema);

module.exports = Sites;