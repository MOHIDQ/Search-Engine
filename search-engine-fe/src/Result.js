import React, {Component} from 'react';

class Result extends Component {
    constructor() {
        super()
        this.state = {results: []}
    }

    render() {
        return(
            <div className="resultDiv">
                {this.props.searchResults.map((result, index) => (
                    <div key={index} > 
                        <div className="card"> 
                            <div className="card-header"><b>{result.title}</b></div>
                            <div className="card-body">
                                <p>Page Rank Score: {result.score}</p>
                                <p>Number of Edges in Graph: {result.incomingLinks.length}</p>
                                <a target="_blank" rel="noreferrer" href={result.url}>{result.url}</a>
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