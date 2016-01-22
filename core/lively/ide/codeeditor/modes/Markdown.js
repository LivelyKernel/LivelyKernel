module('lively.ide.codeeditor.modes.Markdown').requires('lively.ide.codeeditor.ace').requiresLib({url: "https://cdnjs.cloudflare.com/ajax/libs/marked/0.3.2/marked.js", loadTest: function() { return  typeof marked !== "undefined"; }}).toRun(function() {

Object.extend(lively.ide.codeeditor.modes.Markdown, {

  compileToHTML: function(src) {
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

    return marked(src);
  },

  compileToHTMLAndOpen: function(src) {
    var html = this.compileToHTML(src), win;
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
    return win;
  },

  changeHeadingDepthAt: function(editor, pos, delta) {
    var cursor = editor.getCursorPositionAce(),
        src = editor.textString,
        headings = this.parseHeadings(src),
        h = this.headingOfLine(headings, pos.row),
        sub = this.rangeOfHeading(src, headings, h),
        changes = this.headingsDepthChanges(src, headings, h, h.depth + delta);
    editor.applyChanges(changes, cursor, true);
  },

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

  parseHeadings: function(markdownSrcOrLines) {
    var lexer = new marked.Lexer(),
        lines = Array.isArray(markdownSrcOrLines) ?
          markdownSrcOrLines : lively.lang.string.lines(markdownSrcOrLines),
        headings = lines
          .map(l => l.match(lexer.rules.heading))
          .map((m, i) => m ? {
            line: i,
            depth: m[1].trim().length,
            string: m[2].trim()
          } : null)
          .compact();
    return headings;
  },

  ownerHeadings: function(headings, heading) {
    if (heading.depth <= 1) return [];
    var before = headings.slice(0, headings.indexOf(heading));
    if (!before.length) return [];
    var owner = before.reverse().detect(ea => ea.depth < heading.depth);
    return this.ownerHeadings(headings, owner).concat([owner]);
  },

  withSiblings: function(markdownSrcOrLines, headings, heading) {
    if (heading.depth === 1) return headings.filter(ea => ea.depth === 1);
    var owners = this.ownerHeadings(headings, heading),
        sub = this.rangeOfHeading(markdownSrcOrLines, headings, owners.last());
    return sub.subheadings.filter(ea => ea.depth === heading.depth);
  },

  siblingsBefore: function(markdownSrcOrLines, headings, heading) {
    var sibs = this.withSiblings(markdownSrcOrLines, headings, heading);
    return sibs.slice(0, sibs.indexOf(heading));
  },

  siblingsAfter: function(markdownSrcOrLines, headings, heading) {
    var sibs = this.withSiblings(markdownSrcOrLines, headings, heading);
    return sibs.slice(sibs.indexOf(heading) + 1);
  },

  headingOfLine: function(headings, line) {
    // find last heading at or above line
    var found;
    for (var i = 0; i < headings.length; i++) {
      if (headings[i].line > line) break;
      found = headings[i];
    }
    return found;
  },

  rangeOfHeading: function(markdownSrcOrLines, headings, heading) {
    // return the entire text range of the content at and below heading
    var md = this,
        lines = Array.isArray(markdownSrcOrLines) ?
          markdownSrcOrLines : lively.lang.string.lines(markdownSrcOrLines),
        start = headings.detect(ea => ea.line === heading.line),
        startIndex = headings.indexOf(start),
        end = headings.slice(startIndex+1).detect(ea => ea.depth <= heading.depth),
        subheadings = headings.slice(headings.indexOf(start), headings.indexOf(end));
    return {
      range: {
        start: {row: start.line, column: 0},
        end: {row: end.line-1, column: lines[end.line-1].length}
      },
      subheadings: subheadings
    }
  },

  headingsDepthChanges: function(markdownSrcOrLines, headings, heading, newDepth) {
    var lines = Array.isArray(markdownSrcOrLines) ?
          markdownSrcOrLines : lively.lang.string.lines(markdownSrcOrLines),
        subheadings = this.rangeOfHeading(lines, headings, heading),
        depth = heading.depth,
        delta = newDepth - depth,
        newHeadings = subheadings.subheadings.map(h => lively.lang.obj.merge(h, {
          depth: h.depth + delta,
          lineString: lively.lang.string.times("#", h.depth + delta) + " " + h.string
        })),
        changes = lively.lang.arr.flatmap(newHeadings, h => [
          ["remove", {row: h.line, column: 0}, {row: h.line, column: lines[h.line].length}],
          ["insert", {row: h.line, column: 0}, h.lineString],
        ]);
    return changes;
  }
});

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

var Navigator = {

  moveToHeading: function(ed, heading) {
    if (!heading) return;
    ed.moveCursorToPosition({row: heading.line, column: 0})
    ed.renderer.scrollCursorIntoView();
  },

  backwardSexp: function(ed) {
    var md = lively.ide.codeeditor.modes.Markdown,
        src = ed.getValue(),
        headings = md.parseHeadings(src),
        pos = ed.getCursorPosition(),
        h = md.headingOfLine(headings, pos.row);
    if (h && h.line === pos.row && pos.column === 0) {
      var siblings = md.siblingsBefore(src, headings, h);
      h = siblings.last();
    }
    this.moveToHeading(ed, h);
  },

  forwardSexp: function(ed) {
    var md = lively.ide.codeeditor.modes.Markdown,
        src = ed.getValue(),
        headings = md.parseHeadings(src),
        h = md.headingOfLine(headings, ed.getCursorPosition().row),
        siblings = md.siblingsAfter(src, headings, h);
    this.moveToHeading(ed, siblings[0]);
  },

  backwardUpSexp: function(ed) {
    var md = lively.ide.codeeditor.modes.Markdown,
        headings = md.parseHeadings(ed.getValue()),
        heading = md.headingOfLine(headings, ed.getCursorPosition().row),
        owners = md.ownerHeadings(headings, heading);
    this.moveToHeading(ed, owners.last());
  },

  forwardDownSexp: function(ed) {
    var md = lively.ide.codeeditor.modes.Markdown,
        headings = md.parseHeadings(ed.getValue()),
        heading = md.headingOfLine(headings, ed.getCursorPosition().row),
        sub = md.rangeOfHeading(ed.getValue(), headings, heading);
    this.moveToHeading(ed, sub.subheadings[1]);
  },

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  // expansion

  expandRegion: function(ed, src, ast, expandState) {
    var md = lively.ide.codeeditor.modes.Markdown,
        pos = ed.getCursorPosition(),
        headings = md.parseHeadings(ed.getValue()),
        heading = md.headingOfLine(headings, pos.row);
    if (!heading) return expandState;

    if (heading
     && heading.line === pos.row 
     && pos.column === 0 
     && expandState.range[0] !== expandState.range[1]) {
      var owners = md.ownerHeadings(headings, heading);
      heading = owners.last();
      if (!heading) return expandState;
    }

    var newRange = md.rangeOfHeading(src, headings, heading);
    if (!newRange) return expandState;

    return {
      range: [
        ed.posToIdx(newRange.range.end),
        ed.posToIdx(newRange.range.start)
        ],
        prev: expandState
    }
  },

  contractRegion: function(ed, src, ast, expandState) {
    return expandState.prev || expandState;
  }

};

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

var MarkdownMode = lively.ide.ace.require('ace/mode/markdown').Mode;

MarkdownMode.addMethods({

    getCodeNavigator: function() {
      return Navigator;
    },

    commands: {

        "lively.ide.codeeditor.modes.Markdown.compile-as-html": {
            exec: function(ed) {
              lively.ide.codeeditor.modes.Markdown.compileToHTMLAndOpen(ed.getValue());
            }
        },

        "lively.ide.codeeditor.modes.Markdown.browse-headings": {
          exec: function(ed) {
            var editor = ed.$morph;
            lively.lang.fun.composeAsync(
              n => n(null, lively.ide.codeeditor.modes.Markdown.parseHeadings(editor.textString)),
              (headings, n) => showNarrower(editor, headings, n)
            )(err => err && editor.showError(err));

            // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

            function showNarrower(editorMorph, headings, thenDo) {
              var n = lively.ide.tools.SelectionNarrowing.getNarrower({
                  name: "lively.ide.codeeditor.modes.Markdown.headingsBrowser-" + editorMorph.id,
                  spec: {
                      prompt: 'headings: ',
                      candidates: headings.map(h => lively.lang.obj.merge(h, {
                        isListItem: true,
                        value: h,
                        string: lively.lang.string.indent(h.string, " ", h.depth-1)
                      })),
                      keepInputOnReactivate: true,
                      actions: [{
                          name: 'open',
                          exec: function(candidate) {
                            if (!candidate) return;
                            editorMorph.selectAndCenterLine(Number(candidate.line));
                          }
                      }]
                  }
              });
              thenDo(null, n);
            }
          }
        },

        "lively.ide.codeeditor.modes.Markdown.change-heading-depth": {
          exec: function(ed, opts) {
            opts = opts || {};
            opts.delta = opts.delta || 1;
            var editor = ed.$morph;
            lively.ide.codeeditor.modes.Markdown.changeHeadingDepthAt(
              editor, editor.getCursorPositionAce(), opts.delta);
          }
        },

        "lively.ide.codeeditor.modes.Markdown.inc-heading": {
          exec: function(ed, opts) {
            var cmd = ed.session.getMode().commands["lively.ide.codeeditor.modes.Markdown.change-heading-depth"];
            cmd.exec(ed, {delta: 1});
          }
        },

        "lively.ide.codeeditor.modes.Markdown.dec-heading": {
          exec: function(ed, opts) {
            var cmd = ed.session.getMode().commands["lively.ide.codeeditor.modes.Markdown.change-heading-depth"];
            cmd.exec(ed, {delta: -1});
          }
        }
    },

    keybindings: {
        "lively.ide.codeeditor.modes.Markdown.browse-headings": "Alt-Shift-t",
        "lively.ide.codeeditor.modes.Markdown.inc-heading": "Ctrl-Shift-Right",
        "lively.ide.codeeditor.modes.Markdown.dec-heading": "Ctrl-Shift-Left"
    },

    keyhandler: null,

    initKeyHandler: function() {
        Properties.forEachOwn(this.keybindings, function(commandName, key) {
            if (this.commands[commandName]) this.commands[commandName].bindKey = key;
        }, this);
        return this.keyhandler = lively.ide.ace.createKeyHandler({
            keyBindings: this.keybindings,
            commands: this.commands
        });
    },

    attach: function(ed) {
        this.initKeyHandler();
        ed.keyBinding.addKeyboardHandler(this.keyhandler);
        // FIXME: only needed to make expandRegion work, can go when ace.ext
        // calls expandRegion even if no ed.session.$ast exists
        ed.session.$ast = {};
    },

    detach: function(ed) {
        this.keyhandler = null;
        ed.keyBinding.removeKeyboardHandler(this.keyhandler);
    },

    morphMenuItems: function(items, editor) {
        var mode = this;
        items.push(['Compile as HTML',function() {
          mode.commands["lively.ide.codeeditor.modes.Markdown.compile-as-html"].exec(editor.aceEditor);
        }]);
        items.push(['goto...',function() {
          mode.commands["lively.ide.codeeditor.modes.Markdown.browse-headings"].exec(editor.aceEditor);
        }]);
        return items;
    }
});

}) // end of module
