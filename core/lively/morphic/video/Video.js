module('lively.morphic.video.Video').requires().toRun(function() {

(function loadHTML5MediaLib() {
    JSLoader.loadJs("http://api.html5media.info/1.1.5/html5media.min.js", function() {
        lively.morphic.video.Video.ready = true;
    }, null, true);
})();

// JSLoader.removeAllScriptsThatLinkTo("http://api.html5media.info/1.1.5/html5media.min.js")
// $('script').last().attr('src')


// new lively.FileUploader().openVideo('http://lively-kernel.org/repository/webwerkstatt/documentation/videoTutorials/110419_ManipulateMorphs.mov')

}) // end of module