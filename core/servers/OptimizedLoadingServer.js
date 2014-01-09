var crypto = require("crypto");
var fs = require("fs");
var path = require("path");
var zlib = require('zlib');
var ffuser = require('file-fuser');

var coreFiles = ['core/lib/lively-libs-debug.js', 'core/lively/Migration.js', 'core/lively/JSON.js', 'core/lively/lang/Object.js', 'core/lively/lang/Function.js', 'core/lively/lang/String.js', 'core/lively/lang/Array.js', 'core/lively/lang/Number.js', 'core/lively/lang/Date.js', 'core/lively/lang/Worker.js', 'core/lively/lang/LocalStorage.js', 'core/lively/defaultconfig.js', 'core/lively/Base.js', 'core/lively/ModuleSystem.js', 'core/lively/Traits.js', 'core/lively/DOMAbstraction.js', 'core/lively/IPad.js', 'core/lively/LogHelper.js', 'core/lively/lang/Closure.js', 'core/lively/lang/UUID.js', 'core/lively/bindings/Core.js', 'core/lively/persistence/Serializer.js', 'core/lively/morphic/StyleSheetRepresentation.js', 'core/lively/ide/commands/default.js', 'core/lively/ide/codeeditor/DocumentChange.js', 'core/lively/ide/codeeditor/Keyboard.js', 'core/lively/net/WebSockets.js', 'core/lively/ast/generated/Nodes.js', 'core/lively/store/Interface.js', 'core/cop/Layers.js', 'core/ometa/lib.js', 'core/ometa/ometa-base.js', 'core/ometa/parser.js', 'core/ometa/ChunkParser.js', 'core/ometa/bs-ometa-compiler.js', 'core/ometa/bs-js-compiler.js', 'core/ometa/bs-ometa-js-compiler.js', 'core/ometa/bs-ometa-optimizer.js', 'core/ometa/lk-parser-extensions.js', 'core/ometa/lively.js', 'core/lively/bindings.js', 'core/lively/Main.js', 'core/lively/PartsBin.js', 'core/lively/Helper.js', 'core/lively/LKFileParser.js', 'core/lively/net/Wiki.js', 'core/lively/data/ODFFormulaParser.js', 'core/lively/ast/LivelyJSParser.js', 'core/lively/ast/generated/Translator.js', 'core/lively/OldModel.js', 'core/lively/Data.js', 'core/lively/Network.js', 'core/lively/Ometa.js', 'core/lib/ace/lively-ace.js', 'core/lively/ide/codeeditor/ace.js', 'core/lively/data/FileUpload.js', 'apps/ColorParser.js', 'apps/cssParser.js', 'core/lively/morphic/Clipboard.js', 'core/lively/morphic/Graphics.js', 'core/lively/ide/FileParsing.js', 'core/lively/ide/codeeditor/Snippets.js', 'core/lively/ide/codeeditor/Modes.js', 'core/lively/ide/codeeditor/Completions.js', 'core/lively/data/ODFImport.js', 'core/lively/data/PDFUpload.js', 'core/lively/data/ImageUpload.js', 'core/lively/data/VideoUpload.js', 'core/lively/data/AudioUpload.js', 'core/lively/data/TextUpload.js', 'core/lively/ast/Parser.js', 'core/lively/CrayonColors.js', 'core/lively/ide/CommandLineInterface.js', 'core/lively/morphic/Shapes.js', 'core/lively/ide/SourceDatabase.js', 'core/lively/ast/StaticAnalysis.js', 'core/lively/morphic/Core.js', 'core/lively/morphic/Styles.js', 'core/lively/morphic/PathShapes.js', 'core/lib/acorn/acorn.js', 'core/lib/acorn/acorn-loose.js', 'core/lib/acorn/acorn-walk.js', 'core/lively/ast/acorn.js', 'core/lively/persistence/MassMorphCreation.js', 'core/lively/morphic/TextCore.js', 'core/lively/ide/codeeditor/JS.js', 'core/lively/morphic/Events.js', 'core/lively/morphic/Grid.js', 'core/lively/morphic/Rendering.js', 'core/lively/morphic/Widgets.js', 'core/lively/morphic/Lists.js', 'core/lively/morphic/SVG.js', 'core/lively/morphic/Canvas.js', 'core/lively/ide/codeeditor/EvalMarker.js', 'core/lively/bindings/GeometryBindings.js', 'core/lively/morphic/MorphAddons.js', 'core/lively/morphic/Serialization.js', 'core/lively/morphic/Halos.js', 'core/lively/morphic/HTML.js', 'core/lively/morphic/Layout.js', 'core/lively/morphic/AdditionalMorphs.js', 'core/lively/morphic/ObjectMigration.js', 'core/lively/morphic/StyleSheetsHTML.js', 'core/lively/persistence/BuildSpec.js', 'core/lively/persistence/BuildSpecMorphExtensions.js', 'core/lively/morphic/StyleSheets.js', 'core/lively/morphic/Connectors.js', 'core/lib/jsdiff/jsdiff.js', 'core/lively/ChangeSets.js', 'core/lively/morphic/ScriptingSupport.js', 'core/lively/net/SessionTracker.js', 'core/lively/net/tools/Lively2Lively.js', 'core/lively/morphic/Complete.js', 'core/lively/morphic.js', 'core/lively/net/tools/Wiki.js', 'core/lively/LayerableMorphs.js', 'core/lively/ide/CodeEditor.js', 'core/lively/ide/VersionTools.js', 'core/lively/morphic/EventExperiments.js', 'core/lively/ide/BrowserFramework.js', 'core/lively/ide/tools/CommandLine.js', 'core/lively/ide/SystemBrowserNodes.js', 'core/lively/ide/BrowserCommands.js', 'core/lively/ide/SyntaxHighlighting.js', 'core/lively/ide/tools/SelectionNarrowing.js', 'core/lively/ide/SystemCodeBrowser.js', 'core/lively/ide/WindowNavigation.js', 'core/lively/ast/IDESupport.js', 'core/lively/ide/ErrorViewer.js', 'core/lively/ide.js'];
var dir = process.env.WORKSPACE_LK;
var combinedFile = "combined.js"
var fuser;

ffuser({
    baseDirectory: dir,
    files: coreFiles,
    combinedFile: combinedFile
}, function(err, _fuser) { global.fuser = fuser = _fuser; });

module.exports = function(route, app) {

    app.get('/generated/combinedModulesHash.txt', function(req, res) {
        if (!fuser) {
            res.status(500).end(String('file-fuser could not be started'));
            return;
        }
        fuser.withHashDo(function(err, hash) {
            res.writeHead(200, {
                'Content-Type': 'text/plain',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            });
            res.end(hash);
        });
    });

    app.get('/generated/combinedModules.js', function(req, res) {
        if (!fuser) {
            res.status(500).end(String('file-fuser could not be started'));
            return;
        }
        fuser.withCombinedFileStreamDo(function(err, stream) {
            if (err) { res.status(500).end(String(err)); return; }
            var acceptEncoding = req.headers['accept-encoding'] || '',
                header = {
                    // indefinitely?
                    "Cache-Control": "max-age=" + 60/*secs*/*60/*mins*/*24/*h*/*30/*days*/
                }
            if (acceptEncoding.match(/\bdeflate\b/)) {
                header['content-encoding'] = 'deflate';
                stream = stream.pipe(zlib.createDeflate());
            } else if (acceptEncoding.match(/\bgzip\b/)) {
                header['content-encoding'] = 'gzip';
                stream = stream.pipe(zlib.createGzip());
            }
            res.writeHead(200, header);
            stream.pipe(res);
        });
    });
}
