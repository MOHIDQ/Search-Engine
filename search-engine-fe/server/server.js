const express = require('express')
const app = express()
const Handlebars = require('handlebars')
app.use(express.static('public'));
const cors = require('cors')


const mongoClient = require('mongodb').MongoClient
const mongoUrl = ""
const helper = require('./helper')
const route = require('./route')
const crawl = require("./CrawlSite")


app.use(cors())

mongoClient.connect(mongoUrl, (err, db) => {
    let mainDB = db.db('Crawler')


    //ROUTING SECTION    
    //route for the main page and acts as middleware for case that if query param exists 
    //go to next matching route and try for searches
    app.get("/", (req, res, next) => {
        res.sendFile('public/main.html', { root: __dirname });
    })

    //supports the query params, q (search value), boost ( true or false ), limit (10 default, 50 max, 1 min)
    app.get('/fruits', route.fruitResults)


    //function for getting the incoming links for each link, returns object, key is url, and the value is array of links 
    //that leed to the target url
    function getIncomingLinks(graphType) {
        if (err) throw err

        let incomingLinkObj = {}
        let serGraph = graphType.serialize()
        for (let i = 0; i < serGraph.links.length; i++) {
            //key already exists
            if (serGraph.links[i].target in incomingLinkObj) {
                incomingLinkObj[serGraph.links[i].target].push(serGraph.links[i].source)
            }
            //key doesnt exist
            else {
                incomingLinkObj[serGraph.links[i].target] = [serGraph.links[i].source]
            }
        }
        console.dir(incomingLinkObj, {maxArrayLength: null})
        return incomingLinkObj
        
    }
    //target is the key, source is the value to be added into the values array of target key

    //crawl.startCrawl(mainDB) //if we needed to crawl for data, uncomment this line
})


app.listen(3000, () => {
    console.log(`server running on localhost at port 3000`)
})