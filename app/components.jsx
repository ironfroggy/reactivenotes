import React from 'react'
import ReactDOM from 'react-dom'
import AutoComponent from './utils.jsx'
import Actions from './actions.jsx'
import Dispatcher from './dispatcher.jsx'


export class Note extends AutoComponent {
  constructor(props={editMode: false}) {
    super(props)
  }
  render() {
    if (this.props.editMode) {
      return (
        <div className="note note-edit"><NoteEntry text={this.props.text} onEnter={this.onEnter} /></div>
      )
    } else {
      return (
        <div className="note" onClick={this.onClick}>{this.props.text}</div>
      )
    }
    return (
      <div className="note" onClick={this.onClick}>{this.props.text}{edit}</div>
    )
  }
  onClick(ev) {
    Actions.enableEditMode(this)
  }
  onEnter(text) {
    Actions.changeNoteText(this, text)
  }
}

export class NoteEntry extends AutoComponent {
  constructor(props) {
    super(props)
    Dispatcher.register((payload) => {
      if (payload.action == "edit_mode" && payload.note == -1) {
        this.focus()
      }
    })
  }
  componentWillMount() {
    this.setState({text: this.props.text || ""})
  }
  componentDidMount() {
    this.focus()
  }
  componentDidUpdate() {
    if (this.props.isFocused) {
      this.focus()
    }
  }
  focus() {
    var el = ReactDOM.findDOMNode(this.input)
    if (el !== null && el !== document.activeElement) {
      el.focus()
      el.setSelectionRange(0, el.value.length)
    }
  }
  render() {
    var text = this.state.text || ""
    return (
      <input ref={(el)=>this.input=el} type="text" onKeyUp={this.onKeyUp} onChange={this.onChange} value={text} />
    )
  }
  onChange(ev) {
    this.setState({text: ev.target.value})
  }
  onKeyUp(ev) {
    if (ev.keyCode === 13) {
      this.setState({text: ""})
      this.onEnter(ev.target.value)
    }
  }
  onEnter(text) {
    if (typeof this.props.onEnter === "undefined") {
      Actions.newEntry(text)
    } else {
      this.props.onEnter(text)
    }
  }
}
