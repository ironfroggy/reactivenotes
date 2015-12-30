import Dispatcher from './dispatcher.jsx';


class Actions {
    setFilter(tag) {
        Dispatcher.dispatch({
            action: "set_filter",
            tag: tag || null,
        })
    }
    newEntry(text) {
        if (text) {
            Dispatcher.dispatch({
                action: "new_entry",
                text: text,
            })
        }
    }
    moveUp() {
        Dispatcher.dispatch({
            action: "move",
            direction: -1,
        })
    }
    moveDown() {
        Dispatcher.dispatch({
            action: "move",
            direction: 1,
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
        var origtext = text
        var text = text.trim()
        Dispatcher.dispatch({
            action: "edit_mode",
            note: -1,
        })
        if (text) {
            Dispatcher.dispatch({
                action: "change_note_text",
                note: note.props.i,
                text: text,
            })
        } else {
            Dispatcher.dispatch({
                action: "delete_note",
                note: note.props.i,
            })
        }
    }
    movePage(n) {
        this.disableEditMode()
        Dispatcher.dispatch({
            action: "move_page",
            n: n,
        })
    }
}

export default new Actions()
