// process.env.enviornment = "dev";

require('./config.js');
var db = require('./db/connect');

var UserModel = require('./models/Users');
var PagesService = require('./services/pages');
var ResourcesService = require('./services/resources');
var SitesService = require('./services/sites');

var Mocha = require('mocha'),
    fs = require('fs'),
    path = require('path');

flushDb(function() {
	makeTestUser();
	runMochaTests();
});

function flushDb(callback) {
	console.log('flushDb: ');
	db.connection.on('open', function (ref) {
		db.connection.db.listCollections().toArray(function(err, names) {
		    if (err) {
		        console.log(err);
		    }
		    else {
		        names.forEach(function(e,i,a) {
		            // db.connection.db.dropCollection(e.name);
		            console.log("--->>", e.name);

		            if(names.indexOf('users')) UserModel.drop();
					if(names.indexOf('sites')) SitesService.drop();
					if(names.indexOf('pages')) PagesService.drop();
					if(names.indexOf('resources')) ResourcesService.drop();

					if(callback) callback();
		        });
		    }
		});
	});
}

function makeTestUser() {
	//* Create a test user *//
	var newUser = new UserModel({
	  name: process.env.testUser,
	  password: process.env.testPass
	});

	// save the user
	newUser.save(function(err) {
	  if (err) {
	  	db.disconnect();
	  	return console.log('Username already exists.', err);
	  }

	  console.log('Successful created new user.');
	  db.disconnect();
	  runMochaTests();
	});
}

function runMochaTests() {
	// Instantiate a Mocha instance.
	var mocha = new Mocha();

	var testDir = __dirname+'/test';

	// Add each .js file to the mocha instance
	fs.readdirSync(testDir).filter(function(file){
		console.log('readdirSync: ', file);
	    // Only keep the .js files
	    return file.substr(-3) === '.js';

	}).forEach(function(file){
	    mocha.addFile(
	        path.join(testDir, file)
	    );
	});

	// Run the tests.
	mocha.run(function(failures){

		process.exit();

	  process.on('exit', function () {
	  	console.log('exit');
	    process.exit(failures);  // exit with non-zero status if there were failures
	  });
	});
};

