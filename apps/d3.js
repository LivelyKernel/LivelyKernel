module('apps.d3').requires().toRun(function() {

(function loadD3() {
    //FIXME load async!
    var src = JSLoader.getSync('http://d3js.org/d3.v2.js'),
    rewritten = '(function (){'+ src
        + 'this.d3 = d3;'+'}).call(apps.d3);';
    try {
        eval(rewritten);
    } catch(e) {
        alert('D3 lib failed to load because of:\n' + e);
    }

})();

}) // end of module