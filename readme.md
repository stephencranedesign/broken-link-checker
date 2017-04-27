### Broken Link Checker - 

Register a site to be crawled on an interval and find broken links. It has endpoints to get at how many broken links are on the site and info for where they're at on the site.

This is an node/express app with a mongo/mongoose db.

### Install

1) download node / mongo
  - node [https://nodejs.org/en/download/]
  - mongo 
  	- mac [http://treehouse.github.io/installation-guides/mac/mongo-mac.html]
  	- windows [http://treehouse.github.io/installation-guides/windows/mongo-windows.html]

  * optional Robomongo [https://robomongo.org/] - gui for mongodb.
  * optional Postman [https://www.getpostman.com/] - gui for endpoint testing.

2) download the repo
  - git clone https://github.com/stephencranedesign/broken-link-checker
  - npm install
  - node server

### EndPoints

/api/user/create
	[post] 
		- name
		- password
/api/user/delete
	[post] 
		- name

[get] /api/:user/crawler/:host/status - crawls for a specific user / host
[get] /api/crawler/status - crawls for all users

[post] /api/:user/crawler/:host/register - requires access token 
	- headers
		authorization: JWT access token
	- body
		- crawler options from [https://www.npmjs.com/package/simplecrawler]
[post] /api/:user/crawler/:host/unRegister 
	- headers
		authorization: JWT access token
	 

[get] /api/:user/resources/:host/list
[get] /api/:user/resources/:host/brokenLinks
[get] /api/:user/resources/:host/brokenLinks/:from/:to
[get] /api/:user/resources/:host/getWhitelist

[post] /api/:user/resources/whitelist 
	- body
		- urls: a string or an array of strings for absolute resources to not be counted as broken.
[post] /api/:user/resources/remove
 

[get] /api/:user/sites/list
[get] /api/:user/sites/find/:host

[post] /api/:user/sites/:host/updateConfig
	- body
		- crawler options from [https://www.npmjs.com/package/simplecrawler]
