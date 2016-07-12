/home
    - shows all sites registered

/post-a-site
    - ability to registers a site
    - ability to unregister a site

/query-a-site
    - ability to get all info on site.

/api/crawler/status
    - shows json response of what sites are being crawled and links found / links processed / total percent of site crawled based on those two numbers.

/api/crawler/explode
    - creates a fakeSite and fills it with a bunch of fakeLinks that deepEqual the objects that are created to represtent the links we gather for the site.

    - I created this to see if I reduced the info I was storing if that'd help. It was interesting tho becuase node didn't have any trouble handling 50,000 links on this object. It got all the way up to 299,500 fakeLinks before it return an error about not being able to json.parse it.  