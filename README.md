# Search Engine


NodeJS Search Engine using ElasticLunr and PageRank algorithms to search through and index data based on website content with their incoming/outgoing links. I used Crawler.js to scrap data off of the Calreton University Scraping Test Website and stored data on MongoDB. Mainly a backend project but created a simple frontend to be able to test the REST endpoints and organize the search results + correpsonding website data.


REST End Point

    GET /fruits?q=apple&limit=45&boost=false
    /fruits contains 3 query paramaters
        q:      Is the query/the string that is being searched for
        limit:  Is the number of search results that is being returned, by default 10 results will return. 
                Maximum amount of results that can be returned is 50.
        boost:  Is a boolean value indicating if the you want the search results to be boosted by the page rank aglorithm.
                By default ElasticLunr search is done without page ranking.
