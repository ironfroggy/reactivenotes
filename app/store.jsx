import EventEmitter from 'events';

import Dispatcher from './dispatcher.jsx';


class NoteStore extends EventEmitter {
    constructor() {
        super()
        this._notes = [];

        Dispatcher.register(this.onAction.bind(this));
    }

    onAction(payload) {
        switch (payload.action) {
            case "new_entry":
                this._notes.push({text: payload.text})
                this.emit('change')
                break
            case "change_note_text":
                this._notes[payload.note].text = payload.text
                this.emit('change')
                break
        }
    }
}

export default new NoteStore()
