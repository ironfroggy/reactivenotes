import {NoteStore} from '../app/store.jsx'

describe('NoteStore', function () {
  beforeEach(function(){
    this.store = new NoteStore()
  })
  it('exists', function () {
    expect(typeof NoteStore).toBe('function');
  });
  it('notes begin empty', function() {
    expect(this.store.notes).toEqual([])
  });
  it('tag begin null', function() {
    expect(this.store.tag).toBe(null)
  });
  it('page begins 1', function() {
    expect(this.store.page).toEqual(1)
  });
});
