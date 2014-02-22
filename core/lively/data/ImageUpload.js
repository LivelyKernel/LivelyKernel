module('lively.data.ImageUpload').requires('lively.data.FileUpload').toRun(function() {

lively.data.FileUpload.Handler.subclass('lively.Clipboard.ImageUploader', {

    handles: function(file) {
        return file.type.match(/image\/.*/);
    },

    htmlWrapsImage: function(evt) {
        // when dropping images from one browser page to another we receive a
        // drop event with an item. The item has the mime type html, even if an
        // image and not a whole DOM selection was dragged&dropped. Howver, in
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
            var img = new lively.morphic.Image(this.pos.extent(pt(200,200)), evt.target.result, true).openInWorld();
            img.name = this.file.name;
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

    openImage: function(url, mime, pos) {
        var name = new URL(url).filename(),
            img = new lively.morphic.Image(pos.extent(pt(200,200)), url, true).openInWorld();
        img.name = name;
    }
});

}) // end of module
