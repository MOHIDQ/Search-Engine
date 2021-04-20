import React, {Component} from 'react';
import Result from "./Result"

class App extends Component {
  constructor() {
    super();
    this.state = {searchVal: "", boost: true, numResults: 10, results: [], loading: false}
  }

  handleKeyPress = (e) => {
    if(e.key === 'Enter') {
      this.searchFetch()
    }
  }

  searchFetch = () => {
    console.log("Clicked")
    this.setState({loading: true, results: []})
    fetch(`http://localhost:3000/fruits?q=${this.state.searchVal}&limit=${this.state.numResults}&boost=${this.state.boost}`)
        .then((response) => response.json())
        .then((json) => {
            //console.log(json)

            this.setState({results: json, loading: false})
        })
        .catch((error) => {
          console.error(error);
        });
  }

  render() {
    return(
      <div>
            <div className="homeDiv"> 
              
              <div className="card bg-light text-dark">
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
                    <a href="https://github.com/MOHIDQ/Search-Engine" rel="noreferrer" target="_blank" className="fa fa-github" title="Github Profile"></a>

                  </h1>
                
                </div>
                
              </div>
              <div className="card bg-light text-dark">
                <div className="card-body">
                  <div className="search"> 
                    <input className="form-control searchInp" onKeyPress={this.handleKeyPress} value={this.state.searchVal} onChange={(val) => {this.setState({searchVal: val.target.value})} }></input>
                    <button onClick={() => this.searchFetch()} type="button" className="btn btn-outline-dark">Search</button>
                  </div>
                  <div className="settings">
                    <input type="Number" className="form-control numResults" placeholder="# of Results" value={this.state.numResults} onChange={(val) => {this.setState({numResults: val.target.value})}}></input>
                    <select className="form-control boost" onChange={(val) => {this.setState({boost: val.target.value})}}>
                      <option value="false">No Boost</option>
                      <option value="true">Boost</option>
                  </select>

                  </div>
                    
                </div>  
              </div>
              {this.state.loading ? (
                <div> 
                  <br></br>
                <div className="spinner-border text-primary"></div>
                <div className="spinner-border text-success"></div>
                <div className="spinner-border text-warning"></div>
                <div className="spinner-border text-danger"></div>
                </div>
                  ) : (
                ""
              )}
              <Result searchResults={this.state.results}/>
              
            </div>
        
      </div>
    );
  }

}

export default App;
