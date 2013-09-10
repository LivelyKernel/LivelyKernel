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
        var onloadDo = function(status) {
            if (!status.isDone()) return;
            if (status.isSuccess()) this.openPDF(url, mime, pos)
            else alert('Failure uploading ' + url + ': ' + status);
        }.bind(this)
        var webR = this.uploadBinary(url, mime, binaryData, onloadDo);
    },

    openPDF: function(url, mime, pos) {
        if (false) {
            var embedNode = XHTMLNS.create('embed');
            embedNode.type = mime;
            embedNode.src = url;
            embedNode.width="400"
            embedNode.height="400"
            var pdfNode = embedNode
        } else {
            var objectNode = XHTMLNS.create('object');
            objectNode.type = mime;
            objectNode.data = url;
            objectNode.width="400"
            objectNode.height="400"
            var linkNode = XHTMLNS.create('a');
            linkNode.setAttribute('href', url);
            linkNode.textContent = url
            objectNode.appendChild(linkNode);
            var pdfNode = objectNode;
        }
        // FIXME implement video morph?
        var morph = new lively.morphic.Morph(new lively.morphic.Shapes.External(pdfNode));
        morph.addScript(function getURL() { return this.renderContext().shapeNode.childNodes[0].href })
        morph.addScript(function setURL(url) {
            this.renderContext().shapeNode.data = String(url);
            this.renderContext().shapeNode.childNodes[0].href = String(url)
            var owner = this.owner;
            if (!owner) return;
            this.remove();
            owner.addMorph(this)
        })

        morph.applyStyle({borderWidth: 1, borderColor: Color.black})
        morph.openInWorld(pos);
    }

});

}) // end of module