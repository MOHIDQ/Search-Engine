import React, {Component} from 'react';
import Result from "./Result"
import Home from "./Home"
import {
  BrowserRouter as Router,
  Switch,
  Route,
  NavLink
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
            <Result />
          </Route>
          <Route path="/">
            <Home />
          </Route>
        </Switch>
        </Router>
      </div>
    );
  }

}

export default App;
