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
    initialize: function(evt, fileOrItems) {
        this.evt = evt;
        if (fileOrItems instanceof File)
          this.file = fileOrItems;
        else if (fileOrItems[0] instanceof DataTransferItem)
          this.items = fileOrItems;
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

    startReading: function(readMethod, file) {
        if (readMethod === 'manual') return this.readManually(file);

        var reader = this.getFileReader();
        if (readMethod === 'asBinary') reader.readAsBinaryString(file);
        else if (readMethod === 'asText') reader.readAsText(file);
        else if (readMethod === 'asArrayBuffer') reader.readAsArrayBuffer(file);
        else reader.readAsDataURL(file);
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
    },

    readManually: function(file) {}
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

    handleImportEvent: function(evt) {
      // see https://developer.mozilla.org/en/Using_files_from_web_applications
      var files = evt.dataTransfer.files;
      if (files && files.length > 0) {
          lively.data.FileUpload.handleDroppedFiles(files, evt);
      }
      var items = evt.dataTransfer.items;
      if (items && items.length) {
          lively.data.FileUpload.handleDroppedItems(items, evt);
      }
    },

    handleDroppedFiles: function(files, evt) {
        // handler for specific file types
        var pos = evt.getPosition(), i = 0,
            handlerClasses = lively.data.classes(true).concat(lively.Clipboard.classes(true))
              .filter(function(ea) { return ea.isSubclassOf(lively.data.FileUpload.Handler); }),
            filesToUpload = [];

        if (evt.isAltDown()) {
            this.uploadFilesToServer(files, evt, false, function(err, report) {
              if (err) alert(err)
              else alertOK('uploaded files: \n' + JSON.stringify(report, null, 2));
            });
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
  
            i++;
            var handler = new handlerClass(evt, file),
                options = handler.getUploadSpec(evt, file),
                readMethod = options.readMethod || 'asDataURL';
            Object.extend(handler, {
                i: i,
                showProgressbar: options.hasOwnProperty('showProgressbar') ? options.showProgressbar : true,
                pos: pos.addXY(15*i,15*i)});
            handler.startReading(readMethod, file);
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
            var handler = new handlerClass(evt, items);
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
                $world.addCodeEditor({content: content, gutter: false, textMode: 'text'});
                return;
            }
        }
    },

    uploadFilesToServer: function(files, evt, askForLocation, thenDo) {
        // use XHR2 form data object to upload data via POST /upload
        // implemented by subserver UploadServer

        var formData = new Global.FormData(),
            files = Array.from(files);
        files.forEach(function(file) { formData.append('file', file); });

        // files will be put into a designated directory on server once
        // uploaded, let user choose this dir here
        Functions.composeAsync(
            function(n) {
              var m = module("lively.ide.CommandLineInterface");
              if (m.isLoaded()) return n();
              m.load(); m.runWhenLoaded(function() { n(); });
            },
            
            function(n) {
              var uploadDir = lively.lang.string.joinPath(lively.shell.WORKSPACE_LK, $world.getUserDir().fullPath(), "uploads");
              n(null, uploadDir);
            },

            askForLocation ?
              function askForLocation(defaultLocation, next) {
                $world.prompt('Location to upload files to', function(input) {
                    next(null, input || defaultLocation);
                }, defaultLocation);
              } : function(loc, n) { n(null, loc); },

            function upload(location, next) {
                formData.append('location', location);
                URL.root.withFilename('upload').asWebResource()
                    .enableShowingProgress().createProgressBar("Uploading")
                    .beAsync().post(formData)
                    .withJSONWhenDone(function(json, stat) { next(null, json, stat); });
            },

            function report(uploadReport, postStatus, next) { next(null, uploadReport); }

        )(function(err, uploadReport) { thenDo && thenDo(err, uploadReport); });

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
