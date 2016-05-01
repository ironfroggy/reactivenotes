import React from 'react'
import ReactDOM from 'react-dom'
import AutoComponent from './utils.jsx'
import Actions from './actions.jsx'


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
          let ui = <Component note={opt.note} noteindex={opt.noteindex} property={opt.key} value={opt.value} index={opt.index} />
          plugin_ui.push(ui)
        })
        return plugin_ui;
      }
    }
}

class Todo extends AutoComponent {
  render() {
    let attrs = {}
    if (this.props.property == "done") {
      attrs["checked"] = "checked"
    }
    return (
      <div className="todo">
        <input type="checkbox" onChange={this.onCheck} {...attrs} />
        {this.props.value}
      </div>
    )
  }
  onCheck() {
    let property = {
      key: this.props.property == "todo" ? "done" : "todo",
      value: this.props.value,
    }
    Actions.updateNoteProperty(this.props.noteindex, this.props.index, property)
  }
}

plugin('todo', Todo)
plugin('done', Todo)
