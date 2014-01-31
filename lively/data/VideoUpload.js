module('lively.data.VideoUpload').requires('lively.data.FileUpload').toRun(function() {

lively.data.FileUpload.Handler.subclass('lively.Clipboard.VideoUploader', {
    handles: function(file) {
        return file.type.match(/video.*/);
    },
    getUploadSpec: function(evt, file) {
        return {readMethod: "asBinary"};
    },
    onLoad: function(evt) {
        this.uploadAndOpenVideoTo(
            URL.source.withFilename(this.file.name),
            this.file.type, evt.target.result, this.pos);
    },

    openVideo: function(url, mime, pos) {
        // new lively.data.FileUpload.Handler().openVideo('http://lively-kernel.org/repository/webwerkstatt/documentation/videoTutorials/110419_ManipulateMorphs.mov', 'video/mp4')
        module('lively.morphic.video.Video').load();
        mime = mime || '';
        var videoNode;
        if (/*mime.include('webm')*/true) {
            videoNode = XHTMLNS.create('video');
            videoNode.width = 400;
            videoNode.height = 300;
            videoNode.controls = true;
            videoNode.preload = true;
            var sourceNode = XHTMLNS.create('source');
            sourceNode.src = url;
            videoNode.appendChild(sourceNode);

            // if (mime.include('quicktime')) mime = mime.replace('quicktime', 'mp4');

            // if (mime.include('mp4')) {
            //     sourceNode.type = mime + '; codecs="avc1.42E01E, mp4a.40.2"'
            // } else if (mime.include('webm')) {
            //     sourceNode.type = mime //+ '; codecs="vp8, vorbis"'
            // } else {
            //     sourceNode.type = mime;
            //     alert('video with type ' + mime + ' currently not supported');
            // }
        } else {
            var embedNode = XHTMLNS.create('object');
            embedNode.type = mime;
            embedNode.data = url;
            embedNode.play="false"
            // embedNode.scale="tofit"
            embedNode.width="400"
            embedNode.height="400"
            videoNode = embedNode
            // XHTMLNS.create('object');
            // videoNode.appendChild(embedNode)
        }

        // FIXME implement video morph?
        var morph = new lively.morphic.Morph(new lively.morphic.Shapes.External(videoNode));
        morph.applyStyle({borderWidth: 1, borderColor: Color.black})
        morph.openInWorld(pos);
    },
    uploadAndOpenVideoTo: function(url, mime, binaryData, pos) {
        var onloadDo = function(status) {
            if (!status.isDone()) return;
            if (status.isSuccess()) this.openVideo(url, mime, pos)
            else alert('Failure uploading ' + url + ': ' + status);
        }.bind(this)
        var webR = this.uploadBinary(url, mime, binaryData, onloadDo);
    },
});

}) // end of module