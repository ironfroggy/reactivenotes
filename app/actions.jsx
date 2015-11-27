import Dispatcher from './dispatcher.jsx';


class Actions {
    newEntry(text) {
        Dispatcher.dispatch({
            action: "new_entry",
            text: text,
        })
    }
    enableEditMode(note) {
        Dispatcher.dispatch({
            action: "edit_mode",
            note: note.props.i,
        })
    }
    disableEditMode() {
        Dispatcher.dispatch({
            action: "edit_mode",
            note: -1,
        })
    }
    changeNoteText(note, text) {
        Dispatcher.dispatch({
            action: "change_note_text",
            note: note.props.i,
            text: text,
        })
        Dispatcher.dispatch({
            action: "edit_mode",
            note: -1,
        })
    }
}

export default new Actions()
