import React from 'react'
import ReactDOM from 'react-dom'
import AutoComponent from './utils.jsx'

var plugins = {}

export default function plugin(property, component) {
    if (typeof component === 'function') {
        if (typeof plugins[property] === 'undefined') {
            plugins[property] = [];
        }
        plugins[property].push(component)
    } else {
        let opt = component
        if (typeof plugins[property] !== 'undefined') {
            var plugin_ui = []
            plugins[property].forEach((Component)=>{
                let ui = <Component note={opt.note} property={opt.key} value={opt.value} />
                plugin_ui.push(ui)
            })
            return plugin_ui;
        }
    }
}

plugin('todo', class Todo extends AutoComponent {
  render() {
    return (
      <div className="todo">
        <input type="checkbox" />
        {this.props.value}
      </div>
    )
  }
});
