module('lively.data.ImageUpload').requires('lively.data.FileUpload').toRun(function() {

lively.data.FileUpload.Handler.subclass('lively.Clipboard.ImageUploader', {

    uploadThreshold: 1024*1024*1.5, // 1.5MB

    handles: function(file) {
        return file.type.match(/image\/.*/);
    },

    htmlWrapsImage: function(evt) {
        // when dropping images from one browser page to another we receive a
        // drop event with an item. The item has the mime type html, even if an
        // image and not a whole DOM selection was dragged&dropped. However, in
        // those cases only the image element is the only meaningful element.
        // This method recognizes that.
        var elems = this.getHTMLElementsFromDataTransfer(evt);
        return elems.length === 1 && elems[0].tagName === 'IMG';
    },

    getHTMLElementsFromDataTransfer: function(evt) {
        var content = evt.dataTransfer.getData('text/html');
        if (!content) return null;
        return lively.$.parseHTML(content).filter(function(el) {
            return el.tagName !== 'META'; });
    },

    handlesItems: function(items, evt) {
        var content = evt.dataTransfer && evt.dataTransfer.getData('text/html');
        return content && this.htmlWrapsImage(evt);
    },

    handleItems: function(items, evt) {
        var el = this.getHTMLElementsFromDataTransfer(evt)[0];
        var src = el.getAttribute('src');
        this.openImage(src, null, evt.getPosition());
    },

    getUploadSpec: function(evt, file) {
        var altDown = evt.isAltDown();
        return {readMethod: altDown ? "asBinary" : 'asDataURL'};
    },

    onLoad: function(evt) {
        if (this.readMethod === "asBinary") {
            this.uploadAndOpenImageTo(
                URL.source.withFilename(this.file.name),
                this.file.type, evt.target.result, this.pos);
        } else {
            if ((typeof evt.total == 'number') && (evt.total > this.uploadThreshold)) {
                var size = Numbers.humanReadableByteSize(evt.total);
                $world.confirm('WARNING: Uploaded file is rather big (' + size + ').\n' +
                'Do you want to continue uploading?', function(result) {
                    if (result === 0)
                        this.openImage(evt.target.result, this.file.type, this.pos, this.file.name);
                }.bind(this), ['Yes', 'No']);
            } else
            this.openImage(evt.target.result, this.file.type, this.pos, this.file.name);
        }
    },

    uploadAndOpenImageTo: function(url, mime, binaryData, pos) {
        var openImage = this.openImage.bind(this, url, mime, pos);
        var webR = this.uploadBinary(url, mime, binaryData, function(status) {
            if (!status.isDone()) return;
            if (status.isSuccess()) openImage();
            else alert('Failure uploading ' + url + ': ' + status);
        });
    },

    openImage: function(url, mime, pos, optName) {
        var name = optName;
        if (!name) try { name = new URL(url).filename() } catch (e) { name = "image"; }
        var img = new lively.morphic.Image(pos.extent(pt(200,200)), url, true).openInWorld();
        img.name = name;
    }
});

}) // end of module
