module('lively.morphic.StyleSheets').requires().toRun(function() {

Object.subclass("Selector",
'documentation', {
    documentation: "Sizzle port for morphic."
},
'settings', {
    isColor: true
},
'initializing', {
    initialize: function(r, g, b, a) {
        this.r = r || 0;
        this.g = g || 0;
        this.b = b || 0;
        this.a = a || (a === 0 ? 0 : 1);
    }
}
)

}) // end of module