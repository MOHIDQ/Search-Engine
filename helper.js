const {Matrix} = require("ml-matrix");
const Graph = require('graph-data-structure')
const Handlebars = require('handlebars')

module.exports = {
    compareScores: compareScores,
    pageRankCalc: pageRankCalc,
    renderTemplate: renderTemplate
}

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

    //console.dir(combinePageRankLinks(x0, newGraph.topologicalSort()), {maxArrayLength: null})
    let linkWithPageRank = combinePageRankLinks(x0, graphType.topologicalSort())
    linkWithPageRank.sort(comparePageRank)

    //console.log(linkWithPageRank)
    return linkWithPageRank
    
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

