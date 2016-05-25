1) Purpose of App
    - provide an easy way to 
        - add a site to be automatically monitored for broken links
        - build a site map and submit that site map to google
        - monitor crawl status
        - optionally start crawl with button automatically crawl site on set interval.
        - explore broken links
            - group by filetype
            - group by pages
            
    - should be able to easily split app onto seperate server for really large sites
        - would still store info in central database.
        

2) Domain Modeling
    a) DB
        - users
            - Stephen
                - username
                - password
        - sites 
            - dummySite1
                - google credentials for submitting site map..
                - generated site structure
                    [
                        {
                            "fileType": '...',
                            "refererUrl":"..."
                            "url":"...",
                            statusCode: 'pending'
                        }
                    ]
                    - siteMaps have flat structure. 
                    - cuts back on redundancies.
                        - if nested, /about.aspx is in main nav. I dont want to store its status code for every page I hit. I'd rather have it listed once.
                - brokenLinksCount
            - dummySite2
            
    b) Hub Server
        - houses database
        - house client
        - main server
            - queue of sites to crawl
            - endpoints for setting and getting data.
        
    c) Optionally create a dedicated server for sites that are really big.
        - data should still be stored in hub server.
        
    d) 
    

3) Process
    - crawl site
    - store broken links report in database
    - if no broken links
        - generate sitemap.xml
        - ftp sitemap to root of domain.
        - use google search console api to submit new site map