module('lively.data.TextUpload').requires('lively.data.FileUpload').toRun(function() {

lively.data.FileUpload.Handler.subclass('lively.Clipboard.TextUploader', {

    handles: function(file) {
        return file.type.match(/text.*/);
    },

    getUploadSpec: function(evt, file) {
        return {readMethod: "asText"}
    },

    onLoad: function(evt) {
        lively.morphic.World.current().addTextWindow({
            title: this.file.name,
            content: evt.target.result});
    }
});

}) // end of module