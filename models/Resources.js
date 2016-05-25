var mongoose = require('mongoose');

var ResourceSchema = new mongoose.Schema({
	statusCode: { type: int, required: true },
	refererUrl: { type: String, required: true },
	fileName: { type: String, required: true },
	fileType: { type: String, required: true }
});

var Resources = mongoose.model('Resources', ResourceSchema);

module.exports.Resources = Resources;
module.exports.mongoose = mongoose;