module('lively.data.AudioUpload').requires('lively.data.FileUpload').toRun(function() {

lively.data.FileUpload.Handler.subclass('lively.Clipboard.AudioUploader', {

    handles: function(file) {
        return file.type.match(/audio.*/);
    },

    getUploadSpec: function(evt, file) {
        var altDown = evt.isAltDown();
        return {readMethod: "asBinary"}
    },

    onLoad: function(evt) {
        if (this.readMethod === 'asBinary')
            this.uploadAndOpenAudioTo(
                URL.source.withFilename(this.file.name),
                this.file.type, evt.target.result, this.pos);
        else
            this.openAudio(this.file.name, this.file.type, evt.target.result, this.pos);
    },

    openAudio: function(url, mime, data, pos) {
        switch (mime) {
            case 'audio/midi':
                this.openMidi(url, data, pos);
                break;
            default:
                alert("unknown type " + mime);
        }
    },

    uploadAndOpenAudioTo: function(url, mime, binaryData, pos) {
        var onloadDo = function(status) {
            if (!status.isDone()) return;
            if (status.isSuccess()) this.openAudio(url, mime, binaryData, pos)
            else alert('Failure uploading ' + url + ': ' + status);
        }.bind(this)
        var webR = this.uploadBinary(url, mime, binaryData, onloadDo);
    },

    openMidi: function(url, data, pos) {
        var player = $morph('PianoKeyboard');
        if (!player) {
            player = $world.openPartItem('PianoKeyboard', 'PartsBin/Fun');
            if (pos) player.setPosition(pos);
        }
        player.loadMidi(data);
    }
});

}) // end of module