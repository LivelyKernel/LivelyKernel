module('lively.data.DirectoryUpload').requires('lively.data.FileUpload').toRun(function() {

lively.data.FileUpload.Handler.subclass('lively.data.DirectoryUpload.Handler', {

    handles: function(file, evt) {
        var entry = this.asWebKitEntry(file, evt);
        return entry && entry.isDirectory;
    },

    asItem: function(file, evt) {
        var data = evt.dataTransfer;
        var files = data && data.files && Array.from(data.files);
        if (!files) return null;
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
        }).getWindow().comeForward();
    },

    printFileNameListAsTree: function(files, title) {
        var fileSplitter = "/";
        var fileMap = files
            .map(function(ea) { return ea.startsWith(fileSplitter) ? ea.slice(1) : ea; })
            .reduce(function(fileMap, file) {
                lively.PropertyPath(file, fileSplitter).set(fileMap, file, true);
                return fileMap;
            }, {})

        var hier = createHierarchy(fileMap, ".");
        if (hier.children.length === 1) hier = hier.children[0];
        var printed = Strings.printTree(hier, function(ea) { return ea.name.split(fileSplitter).last(); }, function(ea) { return ea.children; })
        $world.addCodeEditor({
            title: (title || "file listing"),
            content: printed,
            textMode: 'texttree'
        }).getWindow().comeForward();

        function createHierarchy(fileMap, currentPath) {
            if (Object.isString(fileMap)) return {name: currentPath};
            return {
                name: currentPath,
                children: Object
                    .keys(fileMap)
                    .map(function(key) { return createHierarchy(fileMap[key], currentPath + fileSplitter + key); })
            }
        }
    },

    startReading: function() {
        var self = this;
        readEntry(this.asWebKitEntry(this.file, this.evt), [],
            function(err, entries) {
                self.printFileNameListAsTree(entries.pluck('fullPath'),
                    entries[0] && 'Directory contents of ' + entries[0].fullPath);
            });

        function readEntry(entry, entryList, thenDo) {
            entryList.push(entry);
            if (entry.isDirectory) {
                entry.createReader().readEntries(function(entries) {
                    entries.doAndContinue(function(next, subentry) {
                        readEntry(subentry, entryList, next);
                    }, function() { thenDo(null, entryList); });
                });
            } else thenDo(null, entryList);

        }

    }
});

}) // end of module
