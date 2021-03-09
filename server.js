const express = require('express')
const app = express()
const Handlebars = require('handlebars')
app.use(express.static('public'));
app.set('view engine', 'pug') //setting pug 
const Graph = require('graph-data-structure')
const Crawler = require("crawler")
const domain = "https://people.scs.carleton.ca/~davidmckenney/fruitgraph"
const domainWIKI = "https://en.wikipedia.org"
const mongoClient = require('mongodb').MongoClient
const mongoUrl = "REDACTED"
const elasticlunr = require("elasticlunr");
const {Matrix} = require("ml-matrix");

//init for fruit 
let graph = Graph()
let linksCrawled = new Set(); //variable to keep track of links visisted
linksCrawled.add("https://people.scs.carleton.ca/~davidmckenney/fruitgraph/N-0.html")
//variable to keep track of linkks to be visited
let linkQueue = ["https://people.scs.carleton.ca/~davidmckenney/fruitgraph/N-0.html"]
let index = 0 //index used to access links in queue 

graph.addNode("https://people.scs.carleton.ca/~davidmckenney/fruitgraph/N-0.html")

//variable for the content of each link, includes on <p> tags
let siteContents = {}

//init for personal 
let graphPersonal = Graph()
let linksCrawledPersonal = new Set(); //variable to keep track of links visisted
linksCrawledPersonal.add("https://en.wikipedia.org/wiki/Trippie_Redd")
//variable to keep track of linkks to be visited
let linkQueuePersonal = ["https://en.wikipedia.org/wiki/Trippie_Redd"]
let indexPersonal = 0 //index used to access links in queue 
//variable for the content of each link, includes on <p> tags
let siteContentsPersonal = {}
graphPersonal.addNode("https://en.wikipedia.org/wiki/Trippie_Redd")



//setting up search index for link title, link content and the link id
let searchIndex = elasticlunr(function () {
    this.addField('title');
    this.addField('body');
    this.setRef('id');
});

mongoClient.connect(mongoUrl, (err, db) => {
    let mainDB = db.db('Crawler')

    //####### FRUIT CRAWLING ############
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

    //startCrawl() //start crawling

    //function that adds networks of websites into DB for when the crawl is complete
    function crawlComplete() {
        mainDB.collection("Network").insertOne(graph.serialize(), (err, result) => {
            if (err) throw err

            console.log("ADDED")
            addLinks()
        })
    }


    //function that adds each link and the link info into the DB
    function addLinks() {
        //getting page rank values for each link
        let pageRankValues = pageRankCalc(graph, 1000)
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

    //####### PERSONAL CRAWLING ############
    const cpersonal = new Crawler({
        maxConnections : 500,
    
        // This will be called for each crawled page
        callback : function (error, res, done) {
            if(error){
                console.log(error);
            }
            else {
                console.log(`\n\nCRAWING ${res.options.uri}\n\n`)
                let $ = res.$; //get cheerio data, see cheerio docs for info
                let paraIndex = 1
                while ($(`p:nth-of-type(${paraIndex})`).text().trim() === "") {
                    paraIndex++
                }
               // if($("p:nth-of-type(1)").text().trim() === "") {
                 //   console.log("empty")
                //}
                console.log("Paragraphs: " + $(`p:nth-of-type(${paraIndex})`).text());
                siteContentsPersonal[res.options.uri] = {content: $(`p:nth-of-type(${paraIndex})`).text().trim(), title: $("title").text()}
    
                let links = $(`p:nth-of-type(${paraIndex}) a`)
    
                $(links).each((i, link) => {
                    if ($(link).attr('href') !== undefined) {
                        console.log($(link).attr('href'))
                        //dont crawl links that start with # or http (since we add wiki domain after)
                        if ($(link).attr('href').startsWith("/wiki")) {
                            //so duplicates of the same edge arent added
                            if (!graphPersonal.adjacent(res.options.uri).includes(domainWIKI + $(link).attr('href'))) {
                                graphPersonal.addEdge(res.options.uri, domainWIKI + $(link).attr('href'))
                                //console.log($(link).attr('href'))
            
                                if (!linksCrawledPersonal.has(domainWIKI + $(link).attr('href'))) {
                                    linkQueuePersonal.push(domainWIKI + $(link).attr('href'))
                                }
                                else {
                                    console.log(`VISITED ${domainWIKI + $(link).attr('href')} ALREADY`)
                                }
                            }
                        }//end nested if
                    }
                })
    
                indexPersonal++
            }
            //remove all duplicate links (we must remove duplicates because there may be links we
            //have visited yet but the links were available to be scraped on sites be crawled
            //from before)
            linkQueuePersonal = linkQueuePersonal.filter((v, i, a) => a.indexOf(v) === i);
    
            //add the link that will be visited next to the set of visited links
            linksCrawledPersonal.add(linkQueuePersonal[indexPersonal])
            cpersonal.queue(linkQueuePersonal[indexPersonal])
    
            
            console.log(`${linksCrawledPersonal.size} Crawled`)
            console.log(`${linkQueuePersonal.length} Links in Queue`)
            if (indexPersonal === 500) {
                //console.log(graphPersonal.topologicalSort())
                crawlPersonalComplete()
            }
            //done();
        }
    });

    //function that adds networks of websites into DB for when the crawl is complete
    function crawlPersonalComplete() {
        mainDB.collection("NetworkPersonal").insertOne(graphPersonal.serialize(), (err, result) => {
            if (err) throw err

            console.log("ADDED")
            addPersonalLinks() //add link data to monngodb
        })
    }

    //function that will add info about personal links to db like, linkID (title of wiki article, which matches Wiki url),
    //the actual link, number of imcoming links (in degree) of node, link content object (title and paragraph), link contained (adjacent from node),
    //and incoming links, pagerank, 
    function addPersonalLinks() {
        //getting page rank values for each link
        let pageRankValues = pageRankCalc(graphPersonal, 500)
        console.log(pageRankValues)

        let objArr = []
        let nodes = graphPersonal.topologicalSort()

        //getting incoming links for each link
        let incomingLinkObj = getIncomingLinks(graphPersonal)

        //loop through each node (which are the link url) in the graph (should be 500 for this ex)
        for (let i = 0; i < nodes.length; i++) {
            //since not all links in the graph are crawled it may not have content
            if(siteContentsPersonal[nodes[i]] !== undefined) {
                let linkID = nodes[i].substring(30)
                let containedLinks = graphPersonal.adjacent(nodes[i])
                let linkContents = siteContentsPersonal[nodes[i]]
                let numberOfIncomingLinks = graphPersonal.indegree(nodes[i])
                let pr = pageRankValues.find(x => x.link === nodes[i])

                let obj = { linkID: linkID, link: nodes[i], numIncomingLinks: numberOfIncomingLinks, pageRank: pr,
                            linkContent: linkContents, containedLinks: containedLinks, incomingLinks: incomingLinkObj[nodes[i]]}
                objArr.push(obj)
            }
        }
        
        mainDB.collection("LinkInfoPersonal").insertMany(objArr, (err, result) => {
            if (err) throw err

            console.log(`Inserted ${result.insertedCount} Documents`)
        })
    }

    //start crawling WIKI/personal pages
    //startCrawlPersonal()


    //ROUTING SECTION
    //supports the query params, q (search value), boost ( true or false ), limit (10 default, 50 max, 1 min)
    app.get("/fruits", (req, res, next) => {
        let searchValue = req.query.q 
        let resultLimit = req.query.limit
        let isBoosted = JSON.parse(req.query.boost)
        mainDB.collection("LinkInfo").find({}, {projection: {_id: 0, linkContent: 1, linkID: 1, pageRank: 1, link: 1, containedLinks: 1, incomingLinks: 1}}).toArray( (err, result) => {
            if (err) throw err 

            //loop through all the link data and create documents for each one and add to elasticlunr index
            for (let i = 0; i < result.length; i++) {
                let document = {
                    "id": result[i].linkID,
                    "title": result[i].linkContent.title,
                    "body": result[i].linkContent.content
                }
                searchIndex.addDoc(document)
            }
            //getting all the scores for each result
            let searchResult = searchIndex.search(searchValue)

            //adding the title and url of each of the given search results
            //luckily the ids/ref are the same pattern as the title and url of each page
            //we can retrieve the url and title from the ref/id 
            for (let i = 0; i < searchResult.length; i++) {
                searchResult[i].title = searchResult[i].ref
                searchResult[i].url = domain + "/" + searchResult[i].ref + ".html"

                let outGoingLink = result.find(x => x.linkID === searchResult[i].ref)
                searchResult[i].outGoingLinks = outGoingLink.containedLinks

                let incomingLink = result.find(x => x.linkID === searchResult[i].ref)
                searchResult[i].incomingLinks = incomingLink.incomingLinks
            }

            //if boost option is true we then use pagerank values to rank search results
            if (isBoosted === true) {
                    for (let i = 0; i < searchResult.length; i++) {
                        let prVal = result.find(x => x.link === searchResult[i].url)
                        console.log(prVal)
                        //searchResult[i].score = searchResult[i].score * prVal.pageRank.pageRank
                        searchResult[i].score = searchResult[i].score + prVal.pageRank.pageRank

                    }
                //sort by scores after page rank boosting
                searchResult.sort(compareScores)
                if(searchResult.length > resultLimit) {
                    searchResult.length = resultLimit
                }

                res.locals.results = searchResult
                res.status(200).send(renderTemplate(res))

            }
            //no boosting with page rank scores required
            else {
                if(searchResult.length > resultLimit) {
                    searchResult.length = resultLimit
                }
                res.locals.results = searchResult
                res.status(200).send(renderTemplate(res))
            }

        })
        
    })

    app.get("/personal", (req, res) => {
        let searchValue = req.query.q 
        let resultLimit = req.query.limit
        let isBoosted = JSON.parse(req.query.boost)
        mainDB.collection("LinkInfoPersonal").find({}, {projection: {_id: 0, linkContent: 1, linkID: 1, pageRank: 1, link: 1, containedLinks: 1, incomingLinks: 1}}).toArray((req, result) => {
            if (err) throw err

            for (let i = 0; i < result.length; i++) {
                let document = {
                    "id": result[i].linkID,
                    "title": result[i].linkContent.title,
                    "body": result[i].linkContent.content
                }
                searchIndex.addDoc(document)
            }
            let searchResult = searchIndex.search(searchValue)

            //adding the title and url of each of the given search results
            //luckily the ids/ref are the same pattern as the title and url of each page
            //we can retrieve the url and title from the ref/id 
            for (let i = 0; i < searchResult.length; i++) {
                searchResult[i].title = searchResult[i].ref
                searchResult[i].url = domainWIKI + "/wiki/" + searchResult[i].ref

                let outGoingLink = result.find(x => x.linkID === searchResult[i].ref)
                searchResult[i].outGoingLinks = outGoingLink.containedLinks

                let incomingLink = result.find(x => x.linkID === searchResult[i].ref)
                searchResult[i].incomingLinks = incomingLink.incomingLinks
            }

            //if boost option is true we then use pagerank values to rank search results
            if (isBoosted === true) {
                for (let i = 0; i < searchResult.length; i++) {
                    let prVal = result.find(x => x.link === searchResult[i].url)
                    console.log(prVal)
                    //searchResult[i].score = searchResult[i].score * prVal.pageRank.pageRank
                    searchResult[i].score = searchResult[i].score + prVal.pageRank.pageRank

                }
                //sort by scores after page rank boosting
                searchResult.sort(compareScores)
                if(searchResult.length > resultLimit) {
                    searchResult.length = resultLimit
                }

                res.locals.results = searchResult
                console.log(searchResult)
                res.status(200).send(renderTemplate(res))
                //res.status(200).send(searchResult)

            }
            //no boosting with page rank scores required
            else {
                if(searchResult.length > resultLimit) {
                    searchResult.length = resultLimit
                }
                res.locals.results = searchResult
                //res.status(200).send(searchResult)
                res.status(200).send(renderTemplate(res))
            } 

        })
    })
    
    //route for the main page and acts as middleware for case that if query param exists 
    //go to next matching route and try for searches
    app.get("/", (req, res, next) => {
        res.sendFile('public/main.html', { root: __dirname });
        
    })


    //function that starts the queue
    function startCrawl() {
        //starting queue    
        c.queue("https://people.scs.carleton.ca/~davidmckenney/fruitgraph/N-0.html") 
    }

    function startCrawlPersonal() {
        //Queue a URL, which starts the crawl
        cpersonal.queue('https://en.wikipedia.org/wiki/Trippie_Redd');
    }


    //function that renders the handlebars template when a search occurs
    function renderTemplate(res) {
        console.log(res.locals.results.length)
        //setting up handlebars template
        let src =   "<p>{{number}})  {{title}}</p>" + 
        "<ul> <li>Score: {{score}}</li>    </ul>" +
        "<ul> <li>URL: <a target = _blank href = {{url}} >{{url}}</a></li> <br> <li>Out Going Links: {{outGoingLinks}}</li> <br> <li>In Coming Links: {{incomingLinks}}</li></ul>" +
        "<br>"
        let result = ""
        let template = Handlebars.compile(src);

        for (let i = 0; i < res.locals.results.length; i++) {
            console.log(res.locals.results[i].title)
            let obj =   {number: i+1, title: res.locals.results[i].title, score: res.locals.results[i].score, 
                url: res.locals.results[i].url, outGoingLinks: res.locals.results[i].outGoingLinks, incomingLinks: res.locals.results[i].incomingLinks}
            result = result + template(obj);
        }
        return result
    }

    //function that returns the page rank matrix, what is returned is in the same order as 
    //the links are in the topologicalSort()
    function pageRankCalc(graphType, numNodes) {
        if (err) throw err
        
        let adjMatrix = Matrix.zeros(numNodes, numNodes);
        //was 1001,1001
        //console.log(adjMatrix.get(0, 1))

        //console.log(newGraph.topologicalSort())
        for (let i = 0; i < numNodes; i++) {
            let currLink = graphType.topologicalSort()[i]
            
            //looping through all the adjacent/out going links from the current ith link
            for (let k = 0; k < graphType.adjacent(currLink).length; k++) {
                let currAdj = graphType.adjacent(currLink)[k] 
                let outgoingIndex = graphType.topologicalSort().indexOf(currAdj)

                let currLinkIndex = graphType.topologicalSort().indexOf(currLink)
                console.log(currLinkIndex)
                //let ind = newGraph.topologicalSort().indexOf(newGraph.adjacent(newGraph.topologicalSort()[i]))
                adjMatrix.set(currLinkIndex, outgoingIndex, 1)
                //has + 1 to currLinkIndex and +1 to outgoingIndex
            }
        }
        console.log(adjMatrix)
        console.dir(graphType.topologicalSort(), {maxArrayLength: null})


        //next step: replace all 0s with 1/1000 (1/n) -> if row has no 1's
        for (let i = 0; i < adjMatrix.rows; i++) {
            //checking if the current row contains all zeroes
            let rowAllZero = adjMatrix.getRow(i).every(e => {
                return e === 0
            })
            //means the entire row is all zeroes and replace all zeroes with 1/1000
            if (rowAllZero) {
                //loop through all the values in the column for that row and set to 1/1000
                for (let k = 0; k < adjMatrix.columns; k++) {
                    adjMatrix.set(i, k, 1/numNodes)
                }
            }
        }

                
        //next step: in each row, divide all the 1's with 1/total number of 1s in the row
            //so if a row has 5 1's replace each 1 with 1/5
        for (let i = 0; i < adjMatrix.rows; i++) {
            let numOfOnes = countOccurrences(adjMatrix.getRow(i), 1)
            for (let k = 0; k < adjMatrix.columns; k++) {
                if (adjMatrix.get(i,k) === 1) {
                    adjMatrix.set(i, k, 1/numOfOnes)
                }
            }
        }
        //console.log(adjMatrix)

        //third step, using a value of 0.1, so multiple by 1-0.1=0.9
        adjMatrix.mul(0.9)

        //fourth step, add 0.1/1000 
        adjMatrix.add(0.1/numNodes)

        console.log(adjMatrix)
        
        //last step
        //init page rank matrix
        let x0 =  Matrix.zeros(1, numNodes) // 1 row and 1000 columns, each column is each link
        x0.set(0, 1, 1) //setting first value to 1
        for (let i = 0; i < 100; i++) {
            x0 = x0.mmul(adjMatrix);
        }
        console.log(x0)

        //testing
        let te = graphType.topologicalSort()[0]
        console.log(te)
        let obj = {}
        obj[te] = x0.get(0, 0)
        console.log(obj)

        //res.status(200).send(x0)

        //get the top 25 and return it
        //console.dir(combinePageRankLinks(x0, newGraph.topologicalSort()), {maxArrayLength: null})
        let linkWithPageRank = combinePageRankLinks(x0, graphType.topologicalSort())
        linkWithPageRank.sort(comparePageRank)

       //console.log(linkWithPageRank)
        return linkWithPageRank
        
    }

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

})






//have function take arr and value and return index the value is in the array
//we will use the topological sort to match the adjacency matrix, so whatever index
//the value is in the topological array is the index in the adjancey matrix

//helper function to sort the search results by score with page rank boosting
function compareScores(a, b) {
    if ( a.score < b.score ){
        return 1;
      }
      if ( a.score > b.score ){
        return -1;
      }
      return 0;
}
  //helper function thats counts the number of occurnes of a single value in an array
  const countOccurrences = (arr, val) => arr.reduce((a, v) => (v === val ? a + 1 : a), 0);

  //function that combines the links and its page rank value into one object
  function combinePageRankLinks(x0, graphTopo) {
    let retObj = []
    for (let i = 0; i < graphTopo.length; i++) {
        let tmpObj = {link: graphTopo[i], pageRank: x0.get(0, i)}
        retObj[i] = tmpObj
    }
    return retObj
  }

  function comparePageRank(a, b) {
    if (a.pageRank < b.pageRank) {
        return 1;
      }
      if (a.pageRank > b.pageRank) {
        return -1;
      }
      return 0;
  }


app.listen(3000, () => {
    console.log(`server running on localhost at port 3000`)
})