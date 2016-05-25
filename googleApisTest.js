/*
  Testing google search console apis for node.
  Running this script should add the propery 'stephencranedesign.com' to my google search console account and then display list of sites in that account.
  
  Currently the api doesn't support a way to verify ownership of the site so I'm not sure how to get around that.
*/

// Copyright 2012-2016, Google, Inc.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

'use strict';

var readline = require('readline');

var google = require('googleapis');
var OAuth2Client = google.auth.OAuth2;
var webmasters = google.webmasters('v3');

var CLIENT_ID = '133085738861-m9hf0inpqcfinfqhutli86a1t3taa12g.apps.googleusercontent.com';
var CLIENT_SECRET = 'XZHzAFjE2NobXNssIp4B2rrU';
var REDIRECT_URL = 'https://broken-link-checker-stephenrusselcrane.c9users.io/oauth2callback';

var oauth2Client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URL);

var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function getAccessToken (oauth2Client, callback) {
  // generate consent page url
  var url = oauth2Client.generateAuthUrl({
    access_type: 'offline', // will return a refresh token
    scope: 'https://www.googleapis.com/auth/webmasters' // an array of scopes
  });

  console.log('Visit the url: ', url);
  rl.question('Enter the code here:', function (code) {
    // request access token
    oauth2Client.getToken(code, function (err, tokens) {
      if (err) {
        return callback(err);
      }
      // set tokens to the client
      // TODO: tokens should be set by OAuth2 client.
      oauth2Client.setCredentials(tokens);
      callback();
    });
  });
}

// retrieve an access token
getAccessToken(oauth2Client, function () {
  // retrieve user profile
  webmasters.sites.add({auth: oauth2Client, siteUrl: 'www.stephencranedesign.com'}, function(err, o) {
    if(err) {
      return console.log('an error occured', err);
    }
    console.log('o: ', o);
  });
  
  webmasters.sites.list({auth: oauth2Client}, function(err, o) {
    if(err) {
      return console.log('an error occured', err);
    }
    console.log('o: ', o);
  });
});