module('lively.morphic.Clipboard').requires('lively.persistence.Serializer', 'lively.Network').toRun(function() {

// Copy'n Paste and Drag'n Drop support. HTML5 offers some options for content
// import. Note that the event handler functions for morphs are defined in
// lively.morphic.Events. This module implements the deeper HTML/Event handling
// that is independent of Morphic

Object.extend(lively.morphic.Clipboard, {
    handleKeyCopy: function(copyString, evt, data, thenDo) {
        try {
            var header = 'LIVELYKERNELCLIPBOARDDATA|' + copyString.length + '|';
            data.setData("Text", header + copyString);
            thenDo(null);
        } catch(e) { thenDo(e); }
    },

    handleKeyPaste: function(evt, data, withExtractedMorphsDo) {
        try {
            if (data.types.any(function(type) { return type.toLowerCase() === 'files'})) {
                evt.getPosition = function() { return $world.firstHand().getPosition(); };
                var items = Array.from(data.items);
                lively.FileUploader.handleDroppedFiles(items.invoke('getAsFile'), evt);
                return;
            }
            var text = data.getData('Text');
            if (!text) return;
            var match = text.match(/LIVELYKERNELCLIPBOARDDATA\|([0-9]+)\|(.+)/i);
            if (!match || !match[2]) return;
            var obj = lively.persistence.Serializer.deserialize(match[2]);
            if (!obj || !obj.isMorph) return;
            withExtractedMorphsDo(null, [obj]);
        } catch(e) { withExtractedMorphsDo(e, null); }
    },

    handleItemOrFileImport: function(evt) {
        // see https://developer.mozilla.org/en/Using_files_from_web_applications
        var files = evt.dataTransfer.files;
        if (files && files.length > 0) {
            lively.FileUploader.handleDroppedFiles(files, evt);
        }
        var items = evt.dataTransfer.items;
        if (items && items.length) {
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
    }
});

Object.subclass('lively.FileUploader',
"initalization", {
    initialize: function(evt, file) {
        this.evt = evt;
        this.file = file;
    }
},
'handler interface', {
    handles: function(file) { return false; },
},
'file reader', {

    startReading: function() {
        var reader = this.getFileReader();
        if (this.readMethod === 'asBinary') reader.readAsBinaryString(this.file);
        else if (this.readMethod === 'asText') reader.readAsText(this.file);
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

Object.extend(lively.FileUploader, {
    handleDroppedFiles: function(files, evt) {
        // handler for specific file types
        var pos = evt.getPosition(), i = 0,
            handlerClasses = lively.FileUploader.allSubclasses();
        Array.from(files).map(function(file) {
            var handlerClass = handlerClasses.detect(function(handlerClass) {
                return handlerClass.prototype.handles(file); });
            if (!handlerClass) return null;
            var handler = new handlerClass(evt, file);
            i++;
            var options = handler.getUploadSpec(evt, file);
            Object.extend(handler, {
                showProgressbar: options.hasOwnProperty('showProgressbar') ? options.showProgressbar : true,
                readMethod: options.readMethod || 'asDataURL',
                pos: pos.addXY(15*i,15*i)});
            handler.startReading();
        })
    }
});

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

// 1. file.type -> fileList
// 2. FileUploader>loadAndOpenDroppedFiles(evt, fileList, spec = {
//        onLoad, asBinary: BOOL, asText: BOOL})
// 3. FileReader>>readAsBinaryString || FileReader>>readAsText || FileReader>>readAsDataURL
// 4.1. onLoad (if not as binary, content is now via file object in browser and can be used, e.g. as dataURL)
// 4.2 onLoadBinary (content is asbinary data in browser but might be uploaded to file)
//    -> uploadAndOpen -> (when uploading finished) -> open


// handler are expected to implement
// onLoad(evt, uploader)
// handlers can parameterize the reader/uploader by returning a spec object
// from getUploadSpec(evt, file):
// {
//     readMethod: "asBinaryString"|"asText"|"asDataURL", // read as binary encoding
//     showProgressbar: BOOL // show a progressbar while reading? defaults to true
// }

lively.FileUploader.subclass('lively.Clipboard.ImageUploader', {

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

lively.FileUploader.subclass('lively.Clipboard.VideoUploader', {
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
        // new lively.FileUploader().openVideo('http://lively-kernel.org/repository/webwerkstatt/documentation/videoTutorials/110419_ManipulateMorphs.mov', 'video/mp4')
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

lively.FileUploader.subclass('lively.Clipboard.AudioUploader', {

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

lively.FileUploader.subclass('lively.Clipboard.TextUploader', {

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

lively.FileUploader.subclass('lively.Clipboard.PDFUploader', {
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

lively.FileUploader.subclass('lively.Clipboard.ODFUploader', {

    handles: function(file) {
        return file.type.match(/application\/.*opendocument.*/);
    },

    getUploadSpec: function(evt, file) {
        return {readMethod: "asBinary"}
    },

    onLoad: function(evt) {
        this.uploadAndOpenODFTo(
            URL.source.withFilename(this.file.name),
            this.file.type, evt.target.result, this.pos);
    },
    uploadAndOpenODFTo: function(url, mime, binaryData, pos) {
        var onloadDo = function(status) {
            if (!status.isDone()) return;
            if (status.isSuccess()) this.openODF(url, mime, pos)
            else alert('Failure uploading ' + url + ': ' + status);
        }.bind(this)
        var webR = this.uploadBinary(url, mime, binaryData, onloadDo);
    },

    openODF: function(url, mime, pos) {
        require('lively.morphic')
        .requiresLib({
            url: "http://webodf.org/demo/demobrowser/webodf.js",
            loadTest: function() { return typeof odf !== "undefined"; }})
        .toRun(function() {
            // 1) load ODF using WebODF into a wrapper morph
            var id = 'odf-' + Strings.newUUID();
            var wrapper = lively.morphic.HtmlWrapperMorph.renderHTML('<div id="' + id + '" />')
            wrapper.getWindow().openInWorld();
            var odfelement = document.getElementById(id)
            var odfcanvas = new odf.OdfCanvas(odfelement);
            odfcanvas.load(url);
            // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
(function() {
    try {
        Global.pageMorphs = odfToMorphic(wrapper)
        pageMorphs.invoke('openInWorldCenter');
    } catch(e) {
        inspect(wrapper)
        show(e.stack || e);
    }
}).delay(5);
// pageMorphs.forEach(function(ea) { $world.addMorph(ea); });
// Global.pageMorphs.invoke('remove')
// $world.beClip(false)
        });
        // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
        // odf rendering --> Morphs data pipeline:
        Global.renderStateForOdfPage = function renderStateForOdfPage(pageEl) {
            // for each odf page element we extract the position, extent, and
            // elements that are rendered on that page
            return {
                node: pageEl,//.cloneNode(false/*don'copy children*/),
                elements: Array.from(pageEl.childNodes).inject([], function(renderStates, node) {
                    if (node.prefix !== 'draw') return renderStates;
                    var $bounds = $(node).bounds(),
                        bounds = lively.rect(pt($bounds.left, $bounds.top), pt($bounds.right, $bounds.bottom)),
                        state = {
                            node: node.cloneNode(true),
                            position: bounds.topLeft(),
                            extent: bounds.extent()};
                    return renderStates.concat([state]);
                })
            }
        }
        
        Global.morphWrapperForOdfPageElement = function morphWrapperForOdfPageElement(renderState) {
            // this creates a morph for an element that appears on a rendered
            // odf page, like a text or a drawing
            var wrapper = new lively.morphic.HtmlWrapperMorph(pt(0,0));
            wrapper.applyStyle({fill: Color.white, position: renderState.position});
            wrapper.shape.odfRenderState = renderState;
            (function getExtentHTML(ctx) { return this.odfRenderState.extent; }).asScriptOf(wrapper.shape);
            $(Strings.format('<div style="position: absolute; top: -%spx; left: -%spx" />',
                renderState.position.y, renderState.position.x))
                .appendTo(wrapper.renderContext().shapeNode)
                .append(renderState.node);
            return wrapper;     
        }
        
        Global.morphForOdfRendering = function morphForOdfRendering(odfRenderState) {
            // This creates a morph container for an odf page
            var pageMorph = lively.newMorph({
                style: {fill: Color.white},
                bounds: lively.Rectangle.fromElement(odfRenderState.node)});
            odfRenderState.elements
                .map(morphWrapperForOdfPageElement)
                .forEach(function(morph) { pageMorph.addMorph(morph); })
            return pageMorph;
        }
        
        // odfToMorphic(that)
        Global.odfToMorphic = function odfToMorphic(htmlMorph) {
            // starting from a HtmlWrapperMorph that has odf content loaded
            // using the WebODF library this function axtracts the rendered pages
            // and will create a morph container (as copy) for each page
            var presEl = htmlMorph.jQuery().find('presentation').toArray()[0];
            return Array.from(presEl.childNodes).map(function(pageEl) {
                return morphForOdfRendering(renderStateForOdfPage(pageEl)); });
        }

        // that.getWindow().openInWorld()
        // presEl = that.jQuery().find('presentation').toArray()[0];
        // pageEl = Array.from(presEl.childNodes)[0]
        // m=morphForOdfRendering(renderStateForOdfPage(pageEl));
        // m.openInWorld()
        // m.showHalos()
        // show(m.bounds())
        // m.shape.getExtent()
        // m.remove()
        // that.owner.remove()
        // pageMorphs = odfToMorphic(that)
        // pageMorphs.forEach(function(ea) { $world.addMorph(ea); });
        // Global.pageMorphs.invoke('remove')
        // $world.beClip(false)
    }

});

}) // end of module