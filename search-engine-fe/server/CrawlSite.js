const Graph = require('graph-data-structure')
const Crawler = require("crawler")
const domain = "https://people.scs.carleton.ca/~davidmckenney/fruitgraph"
const mongoClient = require('mongodb').MongoClient
const startLink = "https://people.scs.carleton.ca/~davidmckenney/fruitgraph/N-0.html"
const helper = require("./helper")

//init for fruit 
let graph = Graph()
let linksCrawled = new Set(); //variable to keep track of links visisted
linksCrawled.add(startLink)
//variable to keep track of linkks to be visited
let linkQueue = [startLink]
let index = 0 //index used to access links in queue 

graph.addNode(startLink)

//variable for the content of each link, includes on <p> tags
let siteContents = {}


//function that starts the queue
function startCrawl(db) {
    //globalize the db
    mainDB = db
    //starting queue    
    c.queue(startLink) 
}   

//function that adds networks of websites into DB for when the crawl is complete
function crawlComplete(mainDB) {
    mainDB.collection("Network").insertOne(graph.serialize(), (err, result) => {
        if (err) throw err

        console.log("ADDED")
        addLinks()
    })
}

//function that adds each link and the link info into the DB
function addLinks() {
    //getting page rank values for each link
    let pageRankValues = helper.pageRankCalc(graph, 1000)
    console.log(pageRankValues)

    //getting incoming links for each link
    let incomingLinkObj = getIncomingLinks(graph)

    let objArr = []
    let nodes = graph.topologicalSort()
    //loop through each node (which are the link url) in the graph (should be 1000 for this ex)
    for (let i = 0; i < nodes.length; i++) {
        let newStr = nodes[i].substr(nodes[i].indexOf("N"))
        let linkID = newStr.substr(0, newStr.indexOf("."))
        let containedLinks = graph.adjacent(nodes[i])
        let linkContents = siteContents[nodes[i]]
        let numberOfIncomingLinks = graph.indegree(nodes[i])
        let pr = pageRankValues.find(x => x.link === nodes[i])

        let obj = { linkID: linkID, link: nodes[i], pageRank: pr ,numIncomingLinks: numberOfIncomingLinks, 
                    linkContent: linkContents, containedLinks: containedLinks, incomingLinks: incomingLinkObj[nodes[i]]}
        objArr.push(obj)
    }
    
    mainDB.collection("LinkInfo").insertMany(objArr, (err, result) => {
        if (err) throw err

        console.log(`Inserted ${result.insertedCount} Documents`)
    })
}

let c = new Crawler({
    maxConnections : 999,
    // This will be called for each crawled page
    callback : function (error, res, done) {
        if(error){
            console.log(error);
        }
        else{
            console.log(`\n\nCRAWING ${res.options.uri}\n\n`)
            let $ = res.$;
            //for getting all the links to the website
            let links = $("a")
            $(links).each(function(i, link){
                //Log out links
                //In real crawler, do processing, decide if they need to be added to queue
        

                //if the link found in the current site has not been crawled add to 
                //link visiting queue
                graph.addEdge(res.options.uri, domain + $(link).attr('href').substr(1))

                if (!linksCrawled.has(domain + $(link).attr('href').substr(1))) {
                    linkQueue.push(domain + $(link).attr('href').substr(1))   
                }
                else {
                    console.log(`VISITED ${domain + $(link).attr('href').substr(1)} ALREADY`)
                }
                
            });
            //for getting content and title of the website
            let siteInfo = $("p")
            $(siteInfo).each(function (i, text) {
                //setting content attr to <p> data and title attr to link title
                siteContents[res.options.uri] = {content: $(text).text().replace(/(\r\n|\n|\r)/gm, " "), title: $("title").text()}
            })
            index++ //increment so we look at the next link in the queue
        }

        //remove all duplicate links (we must remove duplicates because there may be links we
        //have visited yet but the links were available to be scraped on sites be crawled
        //from before)
        linkQueue = linkQueue.filter((v, i, a) => a.indexOf(v) === i);

        //add the link that will be visited next to the set of visited links
        linksCrawled.add(linkQueue[index])
        c.queue(linkQueue[index])

        
        console.log(`${linksCrawled.size} Crawled`)
        console.log(`${linkQueue.length} Links in Queue`)
        //finished crawling all links
        if (index === 999) {
            console.dir(Array.from(linksCrawled).sort(), {maxArrayLength: null})
            done();

            crawlComplete()
            //getIncomingLinks()
            
        }

    }
}); //end of crawl

module.exports = {
    startCrawl: startCrawl
}