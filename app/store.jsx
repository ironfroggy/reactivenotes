import EventEmitter from 'events';

import Dispatcher from './dispatcher.jsx';


class NoteStore extends EventEmitter {
  constructor() {
    super()
    this._notes = [];

    Dispatcher.register(this.onAction.bind(this));
  }

  addNote(text) {
    this._notes.push({text: text})
  }
  editNote(i, text) {
    this._notes[i].text = text
  }
  deleteNote(i) {
    this._notes.splice(i, 1)
  }
  getNotes() {
    return this._notes
  }
  getNoteCount() {
    return this._notes.length
  }

  onAction(payload) {
    switch (payload.action) {
      case "new_entry":
        this.addNote(payload.text)
        this.emit('change')
        break
      case "change_note_text":
        this.editNote(payload.note, payload.text)
        this.emit('change')
        break
      case "delete_note":
        this.deleteNote(payload.note)
        this.emit('change')
        break
    }
  }
}

class LocalNoteStore extends NoteStore {
  constructor() {
    super()
    var notes = localStorage["notes"]
    if (!notes) {
      localStorage["notes"] = JSON.stringify([])
    }
  }
  addNote(text) {
    var notes = JSON.parse(localStorage["notes"])
    notes.push({text: text})
    localStorage["notes"] = JSON.stringify(notes)
  }
  editNote(i, text) {
    var notes = JSON.parse(localStorage["notes"])
    notes[i].text = text
    localStorage["notes"] = JSON.stringify(notes)
  }
  deleteNote(i) {
    var notes = JSON.parse(localStorage["notes"])
    notes.splice(i, 1)
    localStorage["notes"] = JSON.stringify(notes)
  }
  getNotes() {
    return JSON.parse(localStorage["notes"])
  }
  getNoteCount() {
    return this.getNotes().length
  }
}

export default new LocalNoteStore()
