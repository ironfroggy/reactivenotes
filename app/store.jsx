import EventEmitter from 'events';
import Moment from 'moment';
import uuid from 'uuid';

import PlasmidDB from 'PlasmidDB';

import Dispatcher from './dispatcher.jsx';


class Property {
  constructor(note, index, property) {
    this.note = note
    this.index = index
    this.name = property.key
    this.value = property.value
  }

  toString() {
    return `${this.name}=${this.value} (of ${this.note._id})`
  }

  update(changes) {
    Object.assign(this.note.properties[this.index], changes)
  }
}


class Note {
  constructor(notedata) {
    Object.keys(notedata).forEach((key)=>{
      this[key] = notedata[key]
    })
  }

  getProperties() {
    return this.properties.map((p, i)=>new Property(this, i, p))
  }

  updateProperty(index, changes) {
    let prev = this.properties[index]
    delete this.properties[prev.key]
    this.properties[changes.key || prev.key] = changes.value || prev.value
    Object.assign(this.properties[index], changes)
    let keys = new Set()
    this.properties.forEach((p)=>{
      keys.add(p.key)
    })
    this.property_keys = Array.from(keys)
  }

  serialize() {
    let note = Object.assign({}, this);
    let text = note.text
    let hashtag_re = /#\w+/gi
    let property_re = /(^|\n)(\w+): ?(.*)$/gi
    let result = null
    let tag, index, input, prop, propkey, propval, _
    if (typeof note.tags === "undefined") {
      note.tags = []
    }
    while (result = hashtag_re.exec(text)) {
      [tag, index, input] = result
      if (!note.tags.includes(tag)) {
        note.tags.push(tag)
      }
    }
    if (typeof note.properties === "undefined") {
      note.properties = []
    }
    if (typeof note.property_keys === "undefined") {
      note.property_keys = []
    }
    while (result = (/(^|\n)(\w+): ?(.*)$/gi).exec(text)) {
      [prop, _, propkey, propval] = result
      text = text.slice(0, text.length - prop.length)
      note.properties.push({
        key: propkey,
        value: propval,
      })
      note.properties[propkey] = propval
      if (!note.property_keys.includes(propkey)) {
        note.property_keys.push(propkey)
      }
    }
    note.text = text
    return note
  }
}


class NoteStore extends EventEmitter {
  constructor() {
    super()
    Dispatcher.register(this.onAction.bind(this));
    this.notes = []
    this.filter = {}
    this.page = 1
    this._setupDB()

    window.note_store = this
  }
  _setupDB() {
    this.db = new PlasmidDB.Database({
      name: 'notes',
      schema: {
        version: 3,
        stores: {
          notes: {
            sync: false,
            indexes: {
              tags: {key: "tags", multi: true},
              properties: {key: "property_keys", multi: true},
            }
          },
        },
      }
    });
    this.db.on('opensuccess', ()=>{
      this._fetchNotes()
      this.emit('ready')
      this.isReady = true
    })
  }
  whenReady(cb) {
    if (this.isReady) {
      cb.call(this)
    } else {
      this.on('ready', cb)
    }
  }
  onAction(payload) {
    switch (payload.action) {
      case "set_filter":
        this.filter = payload.filter
        this._fetchNotes()
        break
      case "new_entry":
        this.addNote(payload.text)
        break
      case "change_note_text":
        this.editNote(payload.note, payload.text)
        break
      case "change_property":
        let note = this.notes[payload.note]
        note.updateProperty(payload.propindex, payload.property)
        this.db.stores.notes.put(note.serialize()).then((result)=>{
          this._fetchNotes()
        }, (error)=>{
          console.error(error)
        })
        break
      case "delete_note":
        this.deleteNote(payload.note)
        break
      case "move_page":
        this.movePage(payload.n)
    }
  }
  movePage(n=1) {
    this.page += n
    this._fetchNotes()
  }
  addNote(text) {
    let ts = Moment().format() + ':' + uuid.v4()
    let note = new Note({text: text, _id: ts})
    if (this.filter.tag) {
      note.tags = [this.filter.tag]
    }
    return new Promise((resolve) => {
      this.db.stores.notes.add(note.serialize()).then((result)=>{
        this._fetchNotes().then(resolve)
      })
    });
  }
  editNote(i, text) {
    let note = Object.assign(this.notes[i], {text: text})
    this.db.stores.notes.put(note.serialize()).then((result)=>{
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
        reverse: true,
      }
      if (this.filter.tag) {
        opt.eq = this.filter.tag
        var index = this.db.stores.notes.by('tags');
        q = index.fetch(opt)
      } else if (this.filter.property) {
        opt.eq = this.filter.property
        var index = this.db.stores.notes.by('properties');
        q = index.fetch(opt)
      } else {
        q = this.db.stores.notes.fetch(opt)
      }
      q.then((results)=>{
        this.notes = results.map((note)=>new Note(note))
        this.emit('change')
        resolve(this.notes)
      }, (error)=>console.error)
    })
  }
}

export {NoteStore}
export default new NoteStore()
