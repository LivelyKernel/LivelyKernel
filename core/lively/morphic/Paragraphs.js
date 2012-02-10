module('lively.morphic.Paragraphs').requires('lively.morphic', 'lively.LayerableMorphs').toRun(function() {

// I wanted to call this module NewJournal to do it in a clear way again, but this is a bad name
lively.morphic.Box.subclass('lively.morphic.Journal', {
    defaultExtent: pt(600,400),

    style: {borderWidth: 1, borderRadius: 10, borderColor: Color.gray},


    initialize: function($super, bounds) {
        $super(bounds || pt(0,0).extent(this.defaultExtent));
        this.setLayouter(new lively.morphic.Layout.JournalLayout())
    }
})

}) // end of module