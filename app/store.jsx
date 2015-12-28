import EventEmitter from 'events';
import Moment from 'moment';

import PouchDB from 'pouchdb';

import Dispatcher from './dispatcher.jsx';


class PouchNoteStore extends EventEmitter {
  constructor() {
    super()
    Dispatcher.register(this.onAction.bind(this));
    this.db = new PouchDB("notes")
    this.notes = []
    this._fetchNotes()
  }
  onAction(payload) {
    switch (payload.action) {
      case "new_entry":
        this.addNote(payload.text)
        break
      case "change_note_text":
        this.editNote(payload.note, payload.text)
        break
      case "delete_note":
        this.deleteNote(payload.note)
        break
    }
  }
  addNote(text) {
    let ts = Moment().format()
    this.db.put({
      _id: ts,
      text: text,
    }).then((result)=>{
      console.log('Added note:', text)
      this._fetchNotes()
    })
  }
  editNote(i, text) {
    let id = this.notes[i]._id;
    let rev = this.notes[i]._rev;
    this.db.put({
      _id: id,
      _rev: rev,
      text: text,
    }).then((result)=>{
      this._fetchNotes()
    }).catch((error)=>{
      console.error(error)
    })
  }
  deleteNote(i) {
    this.db.remove(this.notes[i])
      .then(()=>{
        this._fetchNotes()
      })
      .catch((error)=>{
        console.error(`delete error (${this.notes[i]._id}):`, error);
      })
  }
  _fetchNotes() {
    return new Promise((resolve, reject)=>{
      this.db.allDocs({
        include_docs: true,
      }).then((results)=>{
        this.notes = results.rows.map((row)=>row.doc)
        this.emit('change')
        resolve(this.notes)
      }).catch((error)=>console.error)
    })
  }
}


export default new PouchNoteStore()
