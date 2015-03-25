module('lively.ide.codeeditor.modes.Markdown').requires('lively.ide.codeeditor.ace').requiresLib({url: "https://cdnjs.cloudflare.com/ajax/libs/marked/0.3.2/marked.js", loadTest: function() { return  typeof marked !== "undefined"; }}).toRun(function() {

var MarkdownMode = lively.ide.ace.require('ace/mode/markdown').Mode;

MarkdownMode.addMethods({

    morphMenuItems: function(items, editor) {
        var mode = this,
            s = editor.getSession();
        items.push(['Compile as HTML',function() {
          var renderer = new marked.Renderer();
          renderer.link = renderer.link.wrap(function(proceed, href, title, text) {
            return proceed(href, title, text).replace(/^<a /, "<a target=\"blank\" ")
          });
          marked.setOptions({
            renderer: renderer,
            // gfm: true,
            // tables: true,
            // breaks: false,
            // pedantic: false,
            // sanitize: true,
            // smartLists: true,
            // smartypants: false
          });

          var html = marked(editor.textString), win;
          if ($morph("MarkdownRendering")) {
            $morph("MarkdownRendering").setHTML(html);
            win = $morph("MarkdownRendering").getWindow();
          } else {
            var wrapper = lively.morphic.HtmlWrapperMorph.renderHTML(html, lively.rect(0,0,500,800));
            win = wrapper.getWindow();
            win.setTitle("markdown rendering");
            wrapper.setName("MarkdownRendering");
          }
          win.openInWorld().comeForward();
        }]);
        return items;
    }
});

}) // end of module
