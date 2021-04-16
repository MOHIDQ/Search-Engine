import React, {Component} from 'react';

class Result extends Component {
    constructor() {
        super()
    }

    componentDidMount() {
        console.log("Mounted")
        console.log(this.props)
    }

    render() {
        return(
            <div>
                <p>This is the Results page</p>
            </div>
        )
    }
}

export default Result