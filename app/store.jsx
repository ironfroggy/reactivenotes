import EventEmitter from 'events';
import Moment from 'moment';

import PlasmidDB from 'PlasmidDB';

import Dispatcher from './dispatcher.jsx';


class PouchNoteStore extends EventEmitter {
  constructor() {
    super()
    Dispatcher.register(this.onAction.bind(this));
    this.notes = []
    this.tag = null
    this.page = 1
    this._setupDB()

    window.note_store = this
  }
  _setupDB() {
    this.db = new PlasmidDB.Database({
      name: 'notes',
      schema: {
        version: 2,
        stores: {
          notes: {
            sync: false,
            indexes: {
              tagged: {key: "tags", unique: false, multi: true},
            }
          },
        },
      }
    });
    this.db.on('opensuccess', ()=>this._fetchNotes())
  }
  onAction(payload) {
    switch (payload.action) {
      case "set_filter":
        this.tag = payload.tag
        this._fetchNotes()
        break
      case "new_entry":
        this.addNote(payload.text)
        break
      case "change_note_text":
        this.editNote(payload.note, payload.text)
        break
      case "delete_note":
        this.deleteNote(payload.note)
        break
      case "move_page":
        this.movePage(payload.n)
    }
  }
  _prepareNote(note) {
    let text = note.text
    let hashtag_re = /#\w+/gi
    let result = null
    let tag, index, input
    if (typeof note.tags === "undefined") {
      note.tags = []
    }
    while (result = hashtag_re.exec(text)) {
      [tag, index, input] = result
      if (!note.tags.includes(tag)) {
        note.tags.push(tag)
      }
    }
  }
  movePage(n=1) {
    this.page += n
    this._fetchNotes()
  }
  addNote(text) {
    let ts = Moment().format()
    let note = {text: text, _id: ts}
    if (this.tag) {
      note.tags = [this.tag]
    }
    this._prepareNote(note)
    console.log(this.db.stores);
    this.db.stores.notes.add(note).then((result)=>{
      this._fetchNotes()
    })
  }
  editNote(i, text) {
    let note = Object.assign(this.notes[i], {text: text})
    this._prepareNote(note)
    this.db.stores.notes.put(note).then((result)=>{
      this._fetchNotes()
    }, (error)=>{
      console.error(error)
    })
  }
  deleteNote(i) {
    this.db.stores.notes.remove(this.notes[i])
      .then(()=>{
        this._fetchNotes()
      }, (error)=>{
        console.error(`delete error (${this.notes[i]._id}):`, error);
      })
  }
  _fetchNotes() {
    return new Promise((resolve, reject)=>{
      let q
      let limit = 5
      let opt = {
        start: (this.page - 1) * limit,
        stop: (this.page - 1) * limit + limit,
      }
      console.log('fetch...', this.tag)
      if (this.tag === null) {
        q = this.db.stores.notes.fetch(opt)
      } else {
        opt.eq = this.tag
        q = this.db.stores.notes.by('tagged').fetch(opt)
      }
      q.then((results)=>{
        this.notes = results.reverse()
        this.notes.forEach((note)=>console.log(note))
        this.emit('change')
        resolve(this.notes)
      }, (error)=>console.error)
    })
  }
}

export {PouchNoteStore as NoteStore}
export default new PouchNoteStore()
