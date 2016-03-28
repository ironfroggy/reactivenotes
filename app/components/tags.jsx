import React from 'react'
import ReactDOM from 'react-dom'

import AutoComponent from '../utils.jsx'


export default class Tag extends AutoComponent {
    constructor(props) {
        super(props)
    }
    render() {
        return <span className="tag" onClick={this.onClick}>{this.props.tag}</span>
    }
    onClick(ev) {
        console.log(this.props.tag)
    }
}
