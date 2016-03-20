import EventEmitter from 'events';
import Moment from 'moment';

import PouchDB from 'pouchdb';

import Dispatcher from './dispatcher.jsx';


class PouchNoteStore extends EventEmitter {
  constructor() {
    super()
    Dispatcher.register(this.onAction.bind(this));
    this.notes = []
    this.tag = null
    this.page = 1
    this._setupDB()
    this._fetchNotes()

    window.note_store = this
  }
  _setupDB() {
    this.db = new PouchDB("notes")
    let ddoc = {
      _id: "_design/indexes",
      views: {
        by_tag: {
          map: function(doc) {
            if (doc.tags) {
              for (let tag of doc.tags) {
                emit(tag);
              }
            }
          }.toString()
        }
      }
    }
    this.db.get(ddoc._id)
      .then((res)=>{
        ddoc._rev = res._rev
        this.db.put(ddoc)
      })
      .catch(()=>{
        this.db.put(ddoc)
      })
    ;
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
      note.tags.push(tag)
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
    this.db.put(note).then((result)=>{
      this._fetchNotes()
    })
  }
  editNote(i, text) {
    let note = Object.assign(this.notes[i], {text: text})
    this._prepareNote(note)
    this.db.put(note).then((result)=>{
      this._fetchNotes()
    }).catch((error)=>{
      console.error(error)
    })
  }
  deleteNote(i) {
    console.log("delete", this.notes[i]._id)
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
      let q
      let limit = 5
      let opt = {
        include_docs: true,
        endkey: "0000-12-28T09:15:42-05:00",
        startkey: "9999-12-28T09:15:42-05:00",
        limit: limit,
        skip: (this.page - 1) * limit,
        descending: true,
      }
      console.log('fetch', this.tag)
      console.trace()
      if (this.tag === null) {
        q = this.db.allDocs(opt)
      } else {
        opt.key = this.tag
        q = this.db.query("indexes/by_tag", opt)
      }
      q.then((results)=>{
        this.notes = results.rows.map((row)=>row.doc).reverse()
        this.emit('change')
        resolve(this.notes)
      }).catch((error)=>console.error)
    })
  }
}


export default new PouchNoteStore()
