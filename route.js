const mongoClient = require('mongodb').MongoClient
const mongoUrl = "REDACTED"
const elasticlunr = require("elasticlunr");
const helper = require('./helper')
const domain = "https://people.scs.carleton.ca/~davidmckenney/fruitgraph"


//setting up search index for link title, link content and the link id
let searchIndex = elasticlunr(function () {
    this.addField('title');
    this.addField('body');
    this.setRef('id');
});

function fruitResults(req, res) {
    let searchValue = req.query.q 
    let resultLimit = req.query.limit
    let isBoosted = JSON.parse(req.query.boost)

    console.log(searchValue)
    console.log(resultLimit)
    console.log(isBoosted)
    mongoClient.connect(mongoUrl, (err, db) => {
        let mainDB = db.db('Crawler')

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
                searchResult.sort(helper.compareScores)
                if(searchResult.length > resultLimit) {
                    searchResult.length = resultLimit
                }

                res.locals.results = searchResult
                res.status(200).send(helper.renderTemplate(res))

            }
            //no boosting with page rank scores required
            else {
                if(searchResult.length > resultLimit) {
                    searchResult.length = resultLimit
                }
                res.locals.results = searchResult
                //res.status(200).send(helper.renderTemplate(res))
                res.status(200).send(searchResult)
            }
        })

    })

}



module.exports = {
    fruitResults: fruitResults
}