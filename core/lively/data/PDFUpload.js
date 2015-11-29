module('lively.data.PDFUpload').requires('lively.data.FileUpload').toRun(function() {

lively.data.FileUpload.Handler.subclass('lively.data.PDFUpload.Handler', {
    handles: function(file) {
        return file.type.match(/application\/pdf/);
    },

    getUploadSpec: function(evt, file) {
        return {readMethod: "asBinary"}
    },

    onLoad: function(evt) {
        this.uploadAndOpenPDFTo(
            URL.source.withFilename(this.file.name),
            this.file.type, evt.target.result, this.pos);
    },

    uploadAndOpenPDFTo: function(url, mime, binaryData, pos) {
        var self = this;
        this.uploadBinary(url, mime, binaryData, function(status) {
            if (!status.isDone()) return;
            if (status.isSuccess()) self.openPDF(url, mime, pos)
            else alert('Failure uploading ' + url + ': ' + status);
        });
    },

    openPDF: function(url, mime, pos) {
        var extent = pt(400,400),
            pdfNode = document.createElement('object'),
            linkNode = document.createElement('a');
        pdfNode.type = mime;
        pdfNode.data = url;
        linkNode.setAttribute('href', url);
        linkNode.textContent = url
        pdfNode.appendChild(linkNode);

        var morph = new lively.morphic.Morph(new lively.morphic.Shapes.External(pdfNode));
        morph.disableGrabbing();

        morph.addScript(function getURL() { return this.renderContext().shapeNode.childNodes[0].href })
        morph.addScript(function setURL(url) {
            this.renderContext().shapeNode.data = String(url);
            this.renderContext().shapeNode.childNodes[0].href = String(url)
            var owner = this.owner;
            if (!owner) return;
            this.remove();
            owner.addMorph(this)
        })

        morph.applyStyle({extent: extent, borderWidth: 1, borderColor: Color.black})
        morph.openInWorld(pos);
    }

});

}) // end of module
