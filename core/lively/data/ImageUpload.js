module('lively.data.ImageUpload').requires('lively.data.FileUpload').toRun(function() {

lively.data.FileUpload.Handler.subclass('lively.Clipboard.ImageUploader', {

    handles: function(file) {
        return file.type.match(/image.*/);
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