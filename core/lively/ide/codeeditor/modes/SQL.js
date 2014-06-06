module('lively.ide.codeeditor.modes.SQL').requires('lively.ide.codeeditor.ace', 'lively.store.SQLiteInterface').toRun(function() {

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// SQL-mode, for the server database
lively.ide.ace.require('ace/mode/sql').Mode.addMethods({

    commands: {
        changeDBAccessor: {
            exec: function(ed) {
                var mode = lively.ide.ace.require('ace/mode/sql').Mode;
                var m = ed.$morph, defaultAccessor = mode.prototype.defaultDBAccessorCode;
                $world.editPrompt('customize the DB access function', function(input) {
                    if (!input) { show('aborting'); return; }
                    m.sqlDBAccessorCode = String(input);
                }, m.sqlDBAccessorCode || defaultAccessor)
            }
        },
    },

    attach: function(ed) {
        ed.commands.addCommands(this.commands);
    },

    detach: function(ed) {
        ed.commands.removeCommands(this.commands);
    },

    defaultDBAccessorCode: "lively.repository.fs.storage.db",

    morphMenuItems: function(items, editor) {
        var mode = this;
        items.push(['SQL', [["change DB accessor", function() {
            editor.withAceDo(function(ed) {
                mode.commands.changeDBAccessor.exec(ed);
            });
        }]]]);
        return items;
    },

    doEval: function(codeEditor, insertResult) {
        var doQuery = !!insertResult,
            sourceString = codeEditor.getSelectionOrLineString();
        lively.store.SQLiteInterface._sendToServer(
            {
                dbAccessor: codeEditor.sqlDBAccessorCode || this.defaultDBAccessorCode,
                statements: [{action: doQuery ? 'all' : 'run', sql: sourceString}]
            },
            function(err, result) {
                if (doQuery) {
                    var objToPrint = Object.isArray(result) ? result.map(Strings.printTable) : Objects.inspect(result);
                    codeEditor.printObject(codeEditor.aceEditor, objToPrint);
                } else {
                    if (err) alert(Objects.inspect(err))
                    else alertOK(Objects.inspect(result));
                }
            });
    }
});

}) // end of module
