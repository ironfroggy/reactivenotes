import {NoteStore} from '../app/store.jsx'

function delete_database(name) {
  return new Promise(function(resolve, reject) {
    var close = indexedDB.deleteDatabase(name);
    close.onsuccess = function() {
      resolve();
    };
    close.onerror = function() {
      resolve(); // ignore missing database for first run
    };
  });
}

describe('NoteStore', function () {
  beforeAll(function(done){
    this.store = new NoteStore()
    this.store.whenReady(done)
  })
  it('exists', function () {
    expect(typeof NoteStore).toBe('function');
  });
  it('notes begin empty', function() {
    expect(this.store.notes).toEqual([])
  });
  it('filter begins empty', function() {
    expect(this.store.filter).toEqual({})
  });
  it('page begins 1', function() {
    expect(this.store.page).toEqual(1)
  });
  it('includes notes on add', function(done) {
    this.store.addNote("note text").then(()=>{
      expect(this.store.notes.length).toEqual(1);
      expect(this.store.notes[0].text).toEqual("note text");
      done();
    });
  });
  it('fetches correctly tagged notes', function(done) {
    this.store.addNote("note text #foo").then(()=>{
      this.store.filter = {tag: '#foo'}
      this.store._fetchNotes().then(()=>{
        expect(this.store.notes.length).toEqual(1);
        expect(this.store.notes[0].text).toEqual("note text #foo");
        done();
      });
    });
  });
  it('excludes incorrectly tagged notes', function(done) {
    this.store.addNote("note text #foo").then(()=>{
      this.store.filter = {tag: '#bar'}
      this.store._fetchNotes().then(()=>{
        expect(this.store.notes.length).toEqual(0);
        done();
      });
    });
  });
});
