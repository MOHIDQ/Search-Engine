import React, {Component} from 'react';

class Result extends Component {
    constructor() {
        super()
        this.state = {results: []}
    }

    componentDidMount() {
        let url = new URL(window.location);
        let q = url.searchParams.get("q");
        let boost = url.searchParams.get("boost");
        let numResults = url.searchParams.get("limit");
        //dont run api request is missing query params
        if (q !== null && boost !== null && numResults !== null) {
            this.fetchResults(q, boost, numResults)
        }
    }

    fetchResults = (q, boost, numResults) => {
        fetch(`http://localhost:3000/fruits?q=${q}&limit=${numResults}&boost=${boost}`)
        .then((response) => response.json())
        .then((json) => {
            this.setState({results: json})
           //console.log(this.state.results)
        })
        .catch((error) => {
          console.error(error);
        });
    }
    

    render() {
        return(
            <div>
                <div className="card text-dark homeDiv">
                    <div className="card-header">
                    <h1>
                    <span style={{color: "#4285F4"}}>M</span>
                    <span style={{color: "#DB4437"}}>o</span>
                    <span style={{color: "#F4B400"}}>h</span>
                    <span style={{color: "#4285F4"}}>i</span>
                    <span style={{color: "#0F9D58"}}>d</span>
                    <span style={{color: "#DB4437"}}>'</span>
                    <span style={{color: "#4285F4"}}>s</span>

                    <span style={{color: "#DB4437"}}> S</span>
                    <span style={{color: "#F4B400"}}>e</span>
                    <span style={{color: "#4285F4"}}>a</span>
                    <span style={{color: "#0F9D58"}}>r</span>
                    <span style={{color: "#DB4437"}}>c</span>
                    <span style={{color: "#4285F4"}}>h</span>

                    <span style={{color: "#DB4437"}}> E</span>
                    <span style={{color: "#F4B400"}}>n</span>
                    <span style={{color: "#4285F4"}}>g</span>
                    <span style={{color: "#0F9D58"}}>i</span>
                    <span style={{color: "#DB4437"}}>n</span>
                    <span style={{color: "#4285F4"}}>e</span>
                    
                    </h1>
                    </div>
                </div>
                <p>Results found: {this.state.results.length}</p>
                {this.state.results.map((result, index) => (
                    <div key={index} > 
                        <div className="card"> 
                            <div className="card-header"><b>{result.title}</b></div>
                            <div className="card-body">
                                <p>Page Rank Score: {result.score}</p>
                                <p>Number of Edges in Graph: {result.incomingLinks.length}</p>
                                <a target="_blank" href={result.url}>{result.url}</a>
                            </div>
                        </div>
                        <br></br>
                    </div>
                ))}
            </div>
        )
    }
}

export default Result