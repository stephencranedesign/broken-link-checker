var mongoose = require('mongoose');

var PageSchema = new mongoose.Schema({
	_id: { type: String, required: true },
	_siteUrl: { type: String, required: true },
	path: { type: String, required: true },
	resources: { type: Array, required: true }
});

var Pages = mongoose.model('Pages', PageSchema);
module.exports = Pages;