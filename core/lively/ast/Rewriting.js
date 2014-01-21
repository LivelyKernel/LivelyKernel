module('lively.ast.Rewriting').requires().toRun(function() {

Object.extend(lively.ast, {
    oldEval: eval
});

Object.extend(lively.ast.Rewriting, {
    table: []
});

Object.extend(Global, {
    __createClosure: function(idx, scope, f) {
        f._cachedAst = lively.ast.Rewriting.table[idx];
        f._cachedScope = scope;
        return f;
    }
});

Object.extend(JSLoader, {
    loadJs2: function (url, onLoadCb, loadSync, okToUseCache, cacheQuery) {
        var exactUrl = url;
        if ((exactUrl.indexOf('!svn') <= 0) && !okToUseCache) {
            exactUrl = this.makeUncached(exactUrl, cacheQuery);
        }
        $.ajax(exactUrl, {
            success: lively.ast.Rewriting.loadJS.bind(lively.ast.Rewriting, onLoadCb)
        });
    }
});

Object.extend(lively.ast.Rewriting, {
    loadJS: function(cb, src) {
        if (!src) { src = cb; cb = null; }
        eval(src);
        if (cb) cb();
    }
});

}) // end of module
