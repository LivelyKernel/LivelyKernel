module('lively.morphic.StyleSheetsHTML').requires('lively.morphic.HTML').toRun(function() {

    Object.extend(lively.morphic.Morph.prototype.htmlDispatchTable, {
        
    });
    lively.morphic.Morph.addMethods(
        'stylesheets', {
            setStyleSheet: function(value) {
                this.shape.setStyleSheet(value);
            },
        }
    )
}) // end of module