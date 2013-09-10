module('lively.morphic.Clipboard').requires("lively.data.FileUpload").toRun(function() {

// Copy'n Paste and Drag'n Drop support. HTML5 offers some options for content
// import. Note that the event handler functions for morphs are defined in
// lively.morphic.Events. This module implements the deeper HTML/Event handling
// that is independent of Morphic

Object.extend(lively.morphic.Clipboard, {
    handleKeyCopy: function(copyString, evt, data, thenDo) {
        try {
            var header = 'LIVELYKERNELCLIPBOARDDATA|' + copyString.length + '|';
            data.setData("Text", header + copyString);
            thenDo(null);
        } catch(e) { thenDo(e); }
    },

    handleKeyPaste: function(evt, data, withExtractedMorphsDo) {
        try {
            if (data.types.any(function(type) { return type.toLowerCase() === 'files'})) {
                evt.getPosition = function() { return $world.firstHand().getPosition(); };
                var items = Array.from(data.items);
                lively.data.FileUpload.handleDroppedFiles(items.invoke('getAsFile'), evt);
                return;
            }
            var text = data.getData('Text');
            if (!text) return;
            var match = text.match(/LIVELYKERNELCLIPBOARDDATA\|([0-9]+)\|(.+)/i);
            if (!match || !match[2]) return;
            var obj = lively.persistence.Serializer.deserialize(match[2]);
            if (!obj || !obj.isMorph) return;
            withExtractedMorphsDo(null, [obj]);
        } catch(e) { withExtractedMorphsDo(e, null); }
    },

    handleItemOrFileImport: function(evt) {
        // see https://developer.mozilla.org/en/Using_files_from_web_applications
        var files = evt.dataTransfer.files;
        if (files && files.length > 0) {
            lively.data.FileUpload.handleDroppedFiles(files, evt);
        }
        var items = evt.dataTransfer.items;
        if (items && items.length) {
            var content = evt.dataTransfer.getData('text/html');
            if (content) {
                lively.morphic.HtmlWrapperMorph.renderHTML(content);
                return;
            }
            content = evt.dataTransfer.getData('text/plain');
            if (content) {
                this.addCodeEditor({content: content, gutter: false, textMode: 'text'});
                return;
            }
        }
    }
});

}) // end of module