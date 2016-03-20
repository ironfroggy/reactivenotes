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
    let tags = []
    for (let tag of this.props.tags) {
      tags.push(<span key={this.props.key+"_tag_"+tag} className="tag">{tag}</span>)
    }
    if (this.props.editMode) {
      return (
        <div className="note note-edit"><NoteEntry text={this.props.text} onEnter={this.onEnter} />{tags}</div>
      )
    } else {
      let text = this.props.text.split(/(#\w+)/).map((s)=>{
        if (s.match(/#\w+/)) {
          return <span className="tag">{s}</span>
        } else {
          return <span>{s}</span>
        }
      })
      return (
        <div className="note" onClick={this.onClick}><span className="note-text">{text}</span>{tags}</div>
      )
    }
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
    var className = "note-entry"
    if (typeof this.props.onEnter === "undefined") {
      className += " new-note-entry"
    }
    return (
      <div className={className}>
        <textarea ref={(el)=>this.input=el} type="text" onKeyUp={this.onKeyUp} onKeyDown={this.onKeyDown} onChange={this.onChange} value={text}></textarea></div>
    )
  }
  onChange(ev) {
    this.setState({text: ev.target.value})
  }
  onKeyDown(ev) {
    switch (ev.keyCode) {
      case 13:
        break
    }
  }
  onKeyUp(ev) {
    let shift = ev.shiftKey
    switch (ev.keyCode) {
      case 13:
        this.onEnter(ev.target.value)
        break
      case 38:
        if (shift) {
          Actions.movePage(1)
        } else {
          Actions.moveUp()
        }
        break
      case 40:
        if (shift) {
          Actions.movePage(-1)
        } else {
          Actions.moveDown()
        }
        break
    }
  }
  onEnter(text) {
    text = text.trim()
    if (typeof this.props.onEnter === "undefined") {
      if (text.match(/^#\w+$/) !== null || text === "") {
        Actions.setFilter(text)
      } else {
        Actions.newEntry(text)
      }
      this.setState({text: ""})
    } else {
      this.props.onEnter(text)
    }
  }
}
