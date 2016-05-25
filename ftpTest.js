/*
    example showing how to ftp to root of domain and upload a local file.
    I'll use this to put sitemaps up on the root of a domain.
*/

var Client = require('ftp');

var c = new Client();

c.on('greeting', function(msg) { console.log('greeting', msg); });
c.on('close', function() { console.log('close'); });
c.on('end', function() { console.log('end'); });
c.on('error', function(err) { console.log('error', err); }); 

c.on('ready', function() {
    console.log('ready');

        c.put('test.txt', 'test.remote-copy.txt', function(err) {
            if (err) throw err;
            c.end();
        });

});

// connect to localhost:21 as anonymous 
c.connect({
    host: '..',
    user: '..',
    password: '..',
});