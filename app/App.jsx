import React from 'react';
import Dispatcher from './dispatcher.jsx';
import NoteStore from './store.jsx';
import Actions from './actions.jsx';
import {Note, NoteEntry} from './components.jsx';
import AutoComponent from './utils.jsx'


class App extends AutoComponent {
  constructor() {
    super()
    NoteStore.addListener('change', this.onChange)
    Dispatcher.register(this.onAction)
    this.state = {
      editNote: -1
    }
  }

  render() {
    var editNote = this.state.editNote
    var notes = NoteStore.getNotes().map(
      (note, i) => <Note key={i} i={i} text={note.text} editMode={editNote===i} />
    )
    var focusEntry = editNote === -1
    return (
      <div className="note-list">
        {notes}
        <NoteEntry isFocused={focusEntry} />
      </div>
    )
  }

  onChange() {
    this.forceUpdate()
  }

  onAction(payload) {
    switch (payload.action) {
      case "edit_mode":
        this.setState({editNote: payload.note})
        break
      case "move":
        var i = this.state.editNote
        if (i < 0) {
          i = NoteStore.getNoteCount()
        }
        i += payload.direction
        if (i < 0) {
          i = 0
        }
        if (i >= NoteStore.getNoteCount()) {
          i = NoteStore.getNoteCount() - 1
          this.setState({editNote: -1})
        } else {
          this.setState({editNote: i})
        }
        break
    }
  }
}

export default App;
