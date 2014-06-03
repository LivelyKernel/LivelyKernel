module('lively.data.DirectoryUpload').requires('lively.data.FileUpload').toRun(function() {

lively.data.FileUpload.Handler.subclass('lively.data.DirectoryUpload.Handler', {

    handles: function(file, evt) {
        var entry = this.asWebKitEntry(file, evt);
        return entry && entry.isDirectory;
    },

    asItem: function(file, evt) {
        var files = Array.from(evt.dataTransfer.files);
        var idx = files.indexOf(file);
        return evt.dataTransfer.items[idx];
    },

    asWebKitEntry: function(file, evt) {
        var item = this.asItem(file, evt);
        if (!item) return false;
        return item && item.webkitGetAsEntry ? item.webkitGetAsEntry() : null;
    },

    getUploadSpec: function(evt, file) {
        return {}; // manual read
    },

    openPrinted: function(entry) {
        var printed = Strings.printTree(entry,
            function(n) { return Strings.print(n.name); },
            function(n) { return n.children || {}; })

        $world.addCodeEditor({
            title: 'Directory contents of ' + entry.fullPath,
            content: printed,
            textMode: 'text'
        });
    },

    startReading: function() {
        readEntry(this.asWebKitEntry(this.file, this.evt), function(err, entryTree) {
            this.openPrinted(entryTree);
        }.bind(this));

        function readEntry(entry, thenDo) {
            var reader = entry.createReader();
            reader.readEntries(function(entries) {
                entry.children = [];
                entries.doAndContinue(function(next, subentry) {
                    entry.children.push(subentry);
                    if (subentry.isDirectory) readEntry(subentry, next);
                    else next();
                }, function() { thenDo(null, entry); });
            })
        }

    }
});

}) // end of module
