import React, {Component} from 'react';
import Result from "./Result"
import {
  BrowserRouter as Router,
  Switch,
  Route
} from 'react-router-dom';

class App extends Component {
  constructor() {
    super();

  }

  testFetch = () => {
    console.log("Clicked")
    fetch("http://localhost:3000/fruits?q=apple&limit=10&boost=false")
        .then((response) => response.json())
        .then((json) => {
          //checks if property is there, meaning the youtube video was found
            console.log(json)
        })
        .catch((error) => {
          console.error(error);
        });
  }

  render() {
    return(
      <div>
        <Router>
        <Switch>
          <Route path="/result">
            <Result url="test"/>
          </Route>
          <Route path="/">
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
                  
                </h1>
                </div>
                
              </div>
              <div className="card bg-light text-dark">
                <div className="card-body">
                  <div className="search"> 
                    <input className="form-control searchInp"></input>
                    <button onClick={() => {window.location.href="/result"}} type="button" className="btn btn-outline-dark">Search</button>
                  </div>
                  <div className="settings">
                    <input type="Number" className="form-control numResults" placeholder="# of Results"></input>
                    <select class="form-control boost">
                      <option>No Boost</option>
                      <option>Boost</option>
                  </select>

                  </div>
                    
                </div>
              </div>
              
            </div>
          </Route>
        </Switch>
        </Router>
      </div>
    );
  }

}

export default App;
