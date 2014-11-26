module('lively.data.FileUpload').requires('lively.persistence.Serializer', 'lively.Network').toRun(function() {

// Handles uploading of dropped files via HTML5 event API. This is how it works:
// From the drop event we get a list of files, each have a type attribute
// (String, mime type)
// 1. lively.data.FileUpload>handleDroppedFiles(files, evt})
// 2. we then use file.type to find a upload handler that deals with this file
//    type. handlers are subclasses of lively.data.FileUpload.Handler. They should
//    implement a #handle(file) method which returns true if the handler can deal
//    with the file.type. For matching handlers we then call handler.startReading
// 3. The handler can specify the readMethod. Accoriding to it the HTML5
//    FileReader>>readAsBinaryString || FileReader>>readAsText || FileReader
//    >>readAsDataURL methods are used
// 4. When reading finishes handler.onLoad is called. The uploaded data is now
//    in the browser and can be used, e.g. via dataURL. Some handlers might to
//    choose to upload their data into a file on the server instead of dealing with
//    it directly

// handlers are expected to implement
// onLoad(evt)
// handlers can parameterize the reader/uploader by returning a spec object
// from getUploadSpec(evt, file):
// {
//     readMethod: "asBinaryString"|"asText"|"asDataURL", // read as binary encoding
//     showProgressbar: BOOL // show a progressbar while reading? defaults to true
// }

Object.subclass('lively.data.FileUpload.Handler',
"initalization", {
    initialize: function(evt, file) {
        this.evt = evt;
        this.file = file;
    }
},
'handler interface', {
    handles: function(file) { return false; },
    handlesItems: function(items) { return false; }
},
'item processing', {
    handleItems: function(items) {}
},
'file reader', {

    startReading: function() {
        var reader = this.getFileReader();
        if (this.readMethod === 'asBinary') reader.readAsBinaryString(this.file);
        else if (this.readMethod === 'asText') reader.readAsText(this.file);
        else if (this.readMethod === 'asArrayBuffer') reader.readAsArrayBuffer(this.file);
        else reader.readAsDataURL(this.file);
    },

    getFileReader: function() {
        var self = this;
        return Object.extend(new FileReader(), {
            onload: function(evt) { self.onLoad && self.onLoad(evt, self); },
            onerror: function(evt) { self.onError && self.onError(evt, self); },
            onloadstart: function(evt) { self.onLoadStart && self.onLoadStart(evt, self); },
            onloadend: function(evt) { self.onLoadEnd && self.onLoadEnd(evt, self); },
            onprogress: function(evt) { self.onProgress && self.onProgress(evt, self); }
        });
    }

},
'file reader events', { // default handler methods. specific handlers can reimplement them
    onError: function(evt) {
        alert('Error occured while loading file ' + this.file.name);
        console.error(evt);
    },
    onLoadStart: function(evt) { alertOK('Loading ' + this.file.name); },
    onLoadEnd: function(evt) { this.progressbar && this.progressbar.remove(); },
    onProgress: function(evt) {
        if (!evt.lengthComputable) return;
        if (!this.showProgressbar) return;
        if (!this.progressbar) {
            this.progressbar = $world.addProgressBar(null, this.file && this.file.name);
        }
        this.progressbar.updateBar(evt.loaded / evt.total);
    },
    onLoad: function(evt) {
        alert('Loaded file ' + this.file.name + ' but don\'t know what to do now...!');
    }
},
'uploading to server', {
    uploadBinary: function(url, mime, binaryData, onloadCallback) {
        var webR = new WebResource(url)
        webR.enableShowingProgress();
        var progressBar = $world.addProgressBar(null, webR.getURL().filename());
        lively.bindings.connect(webR, 'progress', {onProgress: function(evt) {
            if (!evt.lengthComputable) return;
            progressBar.updateBar(evt.loaded / evt.total);
        }}, 'onProgress');

        if (onloadCallback) lively.bindings.connect(webR, 'status', {onLoad: onloadCallback}, 'onLoad');
        lively.bindings.connect(webR, 'status', progressBar, 'remove', {
            updater: function($upd, status) { if (status && status.isDone()) $upd(); }});

        webR.beBinary().beAsync().put(binaryData)
        return webR;
    }
});

Object.extend(lively.data.FileUpload, {

    handleDroppedFiles: function(files, evt) {
        // handler for specific file types
        var pos = evt.getPosition(), i = 0,
            handlerClasses = lively.data.classes(true).concat(lively.Clipboard.classes(true))
              .filter(function(ea) { return ea.isSubclassOf(lively.data.FileUpload.Handler); });

        if (evt.isAltDown()) {
            this.uploadFilesToServer(files, evt);
            return;
        }

        Array.from(files).forEach(function(file) {
            var handlerClass = handlerClasses.detect(function(handlerClass) {
                try {
                    return handlerClass.prototype.handles(file, evt);
                } catch (e) {
                    return false;
                }
            });
            if (!handlerClass) return null;
            var handler = new handlerClass(evt, file);
            i++;
            var options = handler.getUploadSpec(evt, file);
            Object.extend(handler, {
                showProgressbar: options.hasOwnProperty('showProgressbar') ? options.showProgressbar : true,
                readMethod: options.readMethod || 'asDataURL',
                pos: pos.addXY(15*i,15*i)});
            handler.startReading();
        });
    },

    handleDroppedItems: function(items, evt) {
        // handler for specific file types
        var pos = evt.getPosition(), i = 0,
            handlerClasses = lively.data.classes(true).concat(lively.Clipboard.classes(true))
              .filter(function(ea) { return ea.isSubclassOf(lively.data.FileUpload.Handler); });

        var handlerClass = handlerClasses.detect(function(handlerClass) {
            return handlerClass.prototype.handlesItems(items, evt); });
        if (handlerClass) {
            var handler = new handlerClass();
            handler.handleItems(items, evt);
        } else {
            // default behavior, FIXME, should go into handler class...
            var content = evt.dataTransfer.getData('text/html');
            if (content) {
                lively.morphic.HtmlWrapperMorph.renderHTML(content);
                return;
            }
            content = evt.dataTransfer.getData('text/plain');
            if (content) {
                this.addCodeEditor({content: content, gutter: false, textMode: 'text'});
                return;
            }
        }
    },

    uploadFilesToServer: function(files) {
        // use XHR2 form data object to upload data via POST /upload
        // implemented by subserver UploadServer

        var formData = new Global.FormData(),
            files = Array.from(files);
        files.forEach(function(file) { formData.append('file', file); });

        alertOK('Uploading ...' + files.pluck("name").join(', '));

        // files will be put into a designated directory on server once
        // uploaded, let user choose this dir here
        Functions.composeAsync(

            function askForLocation(defaultLocation, next) {
                $world.prompt('Location to upload files to', function(input) {
                    next(null, input || defaultLocation);
                }, defaultLocation);
            },

            function upload(location, next) {
                formData.append('location', location);
                URL.root.withFilename('upload').asWebResource()
                    .enableShowingProgress().createProgressBar("Uploading")
                    .beAsync().post(formData)
                    .withJSONWhenDone(function(json, stat) { next(null, json, stat); });
            },

            function report(uploadReport, postStatus, next) {
                alertOK('uploaded files: \n' + JSON.stringify(uploadReport, null, 2));
                next();
            }

        )(lively.shell.getWorkingDirectory(), function(err) {});

    }
});

(function loadFileUploadHandlers() {
    var handlerModules = ["lively.data.DirectoryUpload",
                          "lively.data.ODFImport",
                          "lively.data.PDFUpload",
                          "lively.data.ImageUpload",
                          "lively.data.VideoUpload",
                          "lively.data.AudioUpload",
                          "lively.data.TextUpload"];
    handlerModules.map(module).invoke('load');
})();

}) // end of module
