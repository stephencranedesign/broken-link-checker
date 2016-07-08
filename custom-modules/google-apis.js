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

require('../config.js');

var google = require('googleapis');
var OAuth2Client = google.auth.OAuth2;
var webmasters = google.webmasters('v3');

var CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
var CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
var REDIRECT_URL = 'http://localhost:8080/api/google/oauth2callback';

var oauth2Client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URL);

var authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline', // will return a refresh token
  scope: 'https://www.googleapis.com/auth/webmasters' // an array of scopes
});

module.exports.config = function(app) {
  app.get('/api/google/auth', function(req, res) {
    res.redirect(authUrl);
  });

  // set credentials once.
  app.get('/api/google/oauth2callback', function(req, res) {
    oauth2Client.getToken(req.query.code, function (err, tokens) {
        if (err) {
          return callback(err);
        }

        console.log('tokens: ', tokens);
        // set tokens to the client
        // TODO: tokens should be set by OAuth2 client.
        oauth2Client.setCredentials(tokens);

        res.redirect('/');
      });
  });
};

// function getAccessToken (oauth2Client, callback) {

//   console.log('client: ', oauth2Client);

//   // generate consent page url
//   var url = oauth2Client.generateAuthUrl({
//     access_type: 'offline', // will return a refresh token
//     scope: 'https://www.googleapis.com/auth/webmasters' // an array of scopes
//   });

//   console.log('Visit the url: ', url);
//   // rl.question('Enter the code here:', function (code) {
//   //   // request access token
//   //   oauth2Client.getToken(code, function (err, tokens) {
//   //     if (err) {
//   //       return callback(err);
//   //     }

//   //     console.log('tokens: ', tokens);
//   //     // set tokens to the client
//   //     // TODO: tokens should be set by OAuth2 client.
//   //     oauth2Client.setCredentials(tokens);
//   //     callback();
//   //   });
//   // });
// }

function addSite(siteUrl, callback) {
    webmasters.sites.add({auth: oauth2Client, siteUrl: siteUrl}, function(err, o) {
      if(err) {
        console.log('err adding site: ', o);
        return callback(err);
      }

      console.log('site added: ', siteUrl);
      callback(o);
    });
};

function list() {
    webmasters.sites.list({auth: oauth2Client}, function(err, o) {
      if(err) {
        console.log('err adding site: ', o);
        return callback(err);
      }

      console.log('site list: ', o);
    });
};

function submitSiteMap(siteUrl, feedpath, callback, errback) {
  feedpath = 'http://'+feedpath;
  console.log('siteUrl: ', siteUrl, 'feedpath: ', feedpath);

  webmasters.sites.get({auth: oauth2Client, siteUrl: siteUrl}, function(err, o) {
    if(err) {
      console.log('err getting site: ', err);
    }

    console.log('site info: ', o);
  });

  webmasters.sitemaps.submit({auth: oauth2Client, siteUrl: 'http://'+siteUrl, feedpath: feedpath}, function(err, o) {
      if(err) {
        console.log('err submiting sitemap', err, o);
        return errback(err);
      }

      console.log('submitSiteMap resp: ', o, err);

      if(o === 'Not Found') {
        addSite(siteUrl, function(o) {
          list();
          callback(o);
        });
      }
      else {
        console.log('site found');
        list();
        callback(o);
      }
  });
};

module.exports.submitSiteMap = submitSiteMap;
module.exports.addSite = addSite;

