var mongoose = require('mongoose');

var SiteSchema = new mongoose.Schema({
    url: { type: String, required: true },
    links: { type: Array, required: true },
    date: { type: Date, required: true },
    brokenLinks: { type: Array, required: true }
});

var Sites = mongoose.model('Sites', SiteSchema);

module.exports.Sites = Sites;
module.exports.mongoose = mongoose;