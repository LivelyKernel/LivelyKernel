module('lively.DOMAbstraction').requires().toRun(function() {

// ===========================================================================
// DOM manipulation (Browser and graphics-independent)
// ===========================================================================

Global.Namespace = {
    SVG: "http:\/\/www.w3.org/2000/svg",
    LIVELY: UserAgent.usableNamespacesInSerializer ? "http:\/\/www.experimentalstuff.com/Lively"  : null,
    XLINK: "http:\/\/www.w3.org/1999/xlink",
    XHTML: "http:\/\/www.w3.org/1999/xhtml",
    ATOM: "http:\/\/www.w3.org/2005/Atom",

    // Google specific
    OPENSEARCH: "http:\/\/a9.com/-/spec/opensearchrss/1.0/",
    GBS: "http:\/\/schemas.google.com/books/2008",
    DC: "http:\/\/purl.org/dc/terms",
    BATCH: "http:\/\/schemas.google.com/gdata/batch",
    GD: "http:\/\/schemas.google.com/g/2005",

    // SVN / DAV
    LP1: "DAV:"
};

Global.NodeFactory = {

    remove: function(element) {
        if (element.parentNode)
            element.parentNode.removeChild(element);
    },

    createNS: function(ns, name, attributes) {
        var element = Global.document.createElementNS(ns, name);
        return NodeFactory.extend(ns, element, attributes);
    },

    create: function(name, attributes) {
    //return this.createNS(Namespace.SVG, name, attributes);  // doesn't work
    var element = Global.document.createElementNS(Namespace.SVG, name);
    return NodeFactory.extend(null, element, attributes);
    },

    extend: function(ns, element, attributes) {
    if (attributes) {
        for (var name in attributes) {
        if (!attributes.hasOwnProperty(name)) continue;
        element.setAttributeNS(ns, name, attributes[name]);
        }
    }
    return element;
    },

    createText: function(string) {
    return Global.document.createTextNode(string);
    },

    createNL: function(string) {
    return Global.document.createTextNode("\n");
    },

    createCDATA: function(string) {
    return Global.document.createCDATASection(string);
    },

    CDATAType: function() {
        return Global.document.CDATA_SECTION_NODE;
    },

    TextType: function() {
        return Global.document.TEXT_NODE;
    },

    FragmentType: function() {
        return Global.document.DOCUMENT_FRAGMENT_NODE;
    },

    isTextNode: function(node) { return node && node.nodeType === this.TextType() },

    isFragmentNode: function(node) { return node && node.nodeType === this.FragmentType() }
};

Global.LivelyNS = {

    prefix: 'lively:',

    create: function(name, attributes) {
        // get takes qulaified name
        return NodeFactory.createNS(Namespace.LIVELY, this.prefix + name, attributes);
    },

    getAttribute: function(node, name) {
        if (UserAgent.isOpera) return node.getAttribute(name); // Fix for Opera 10.10
        // get takes only local name
        return node.getAttributeNS(Namespace.LIVELY, name) || node.getAttribute(name);
    },

    removeAttribute: function(node, name) {
        // remove takes local name
        return node.removeAttributeNS(Namespace.LIVELY, name);
    },

    setAttribute: function(node, name, value) {
        // set takes qualified name
        node.setAttributeNS(Namespace.LIVELY, this.prefix + name, value);
    },

    getType: function(node) {
        return node.getAttributeNS(Namespace.LIVELY, "type") || node.getAttribute("type");
    },

    setType: function(node, string) {
        node.setAttributeNS(Namespace.LIVELY, this.prefix +  "type", string);
    }
};

Global.XHTMLNS = {

    create: function(name, attributes) {
        return NodeFactory.createNS(Namespace.XHTML, name, attributes);
    },

    getAttribute: function(node, name) {
        if (UserAgent.isOpera) return node.getAttribute(name); // Fix for Opera 10.10
        return node.getAttributeNS(null, name);
    },

    removeAttribute: function(node, name) {
        return node.removeAttributeNS(null, name);
    },

    setAttribute: function(node, name, value) {
        node.setAttributeNS(null, name, value);
    },

    getType: function(node) {
        return node.getAttributeNS(Namespace.LIVELY, "type");
    },

    setType: function(node, string) {
        node.setAttributeNS(Namespace.LIVELY, "type", string);
    },

    newFragment: function(optChildNodes) {
        var fragment = document.createDocumentFragment()
        if (optChildNodes) optChildNodes.forEach(function(ea) { fragment.appendChild(ea) });
        return fragment;
    },
    newCSSDef: function(string) {
        var style = this.create('style'),
            rules = document.createTextNode(string);
        style.type = 'text/css'
        if (style.styleSheet) style.styleSheet.cssText = rules.nodeValue
        else style.appendChild(rules);
        return style;
    },
    addCSSDef: function(string) {
        var def = XHTMLNS.newCSSDef(string)
        Global.document.getElementsByTagName('head')[0].appendChild(def);
    },

};

Object.subclass('Exporter');
Object.extend(Exporter, {
    stringify: function(node) {
        return node ? new XMLSerializer().serializeToString(node) : null;
    }
});


Object.subclass('DocLinkConverter', {

    initialize: function(codeBase, toDir) {
        if (!codeBase.toString().endsWith('/')) codeBase = codeBase.toString() + '/';
        if (!toDir.toString().endsWith('/')) toDir = toDir.toString() + '/';
        this.codeBase = new URL(codeBase);
        this.toDir = new URL(toDir).withRelativePartsResolved();
    },

    convert: function(doc) {
        var scripts = $A(doc.getElementsByTagName('script'));
        if (scripts.length <= 0) {
            console.warn('could not convert scripts in doc in DocLinkConverter because no scripts found!');
            return doc;
        }
        this.convertLinks(scripts);
        this.convertAndRemoveCodeBaseDefs(scripts);
        return doc;
    },

    convertAndRemoveCodeBaseDefs: function(scripts) {
        var codeBaseDefs = scripts.select(function(el) {
            return el.firstChild && el.firstChild.data && el.firstChild.data.startsWith('Config.codeBase=');
        });

        var codeBaseDef = this.createCodeBaseDef(this.codeBaseFrom(this.codeBase, this.toDir));

        if (codeBaseDefs.length == 0) {
            var script = NodeFactory.create('script');
            script.setAttribute('name', 'codeBase');
            script.appendChild(NodeFactory.createCDATA(codeBaseDef));

            var localConfigScript = this.findScriptEndingWith('localconfig.js', scripts);
            if (localConfigScript) {
                localConfigScript.parentNode.insertBefore(script, localConfigScript);
                localConfigScript.parentNode.insertBefore(NodeFactory.createNL(), localConfigScript);
            }
            return;
        }

        if (codeBaseDefs.length >= 1) {
            var cdata = codeBaseDefs[0].firstChild;
            cdata.data = codeBaseDef;
        }

        // remove remaining
        for (var i = 1; i < codeBaseDefs.length; i++)
            codeBaseDefs[i].parentNode.removeChild(codeBaseDefs[i]);
    },

    convertLinks: function(scripts) {
        var links = scripts.select(function(el) { return this.getURLFrom(el) != null }, this);
        links.forEach(function(el) {
            var url = this.getURLFrom(el),
                newUrl = this.convertPath(url);
            this.setURLTo(el, newUrl);
        }, this);
    },

    convertPath: function(path) {
        if (path.startsWith('http')) return path;
        var fn = this.extractFilename(path),
            relative = this.relativeLivelyPathFrom(this.codeBase, this.toDir);
        return relative + fn;
    },

    codeBaseFrom: function(codeBase, toDir) {
        var urlCodeBase = new URL(codeBase),
            urlToDir = new URL(toDir),
            urlIsInCodeBase = (urlCodeBase.normalizedHostname() == urlToDir.normalizedHostname()) &&
                (urlCodeBase.port == urlToDir.port);
        return urlIsInCodeBase ? this.relativeCodeBaseFrom(codeBase, toDir) : urlCodeBase.toString();
    },

    relativeCodeBaseFrom: function(codeBase, toDir) {
        codeBase = new URL(codeBase);
        toDir = new URL(toDir);
        var relative = toDir.relativePathFrom(codeBase);
        if (relative.startsWith('/')) throw dbgOn(new Error('relative looks different than expected'));
        var levels = relative.split('/').length -1
        // FIXME result should count levels between lively root dir and codeBase
        var result = Array.range(2, levels).collect(function() { return '..' }).join('/');
        if (result.length > 0) result += '/';
        return result;
    },

    relativeLivelyPathFrom: function(codeBase, toDir) {
        return this.codeBaseFrom(codeBase, toDir) + 'core/lively/';
    },

    extractFilename: function(url) {
        return url.substring(url.lastIndexOf('/') + 1, url.length);
    },

    createCodeBaseDef: function(relPath) {
        return Strings.format('Config.codeBase=Config.getDocumentDirectory()+\'%s\'', relPath);
    },

    findScriptEndingWith: function(str, scripts) {
        return scripts.detect(function(node) {
            var url = this.getURLFrom(node);
            return url && url.endsWith(str)
        }, this);
    },

    getURLFrom: function(el) {
        return el.getAttribute('xlink:href') || el.getAttribute('src')
    },

    setURLTo: function(el, url) {
        var attrName = el.getAttribute('xlink:href') ? 'xlink:href' : 'src';
        el.setAttribute(attrName, url)
    }

});

Object.extend(Global, {
    stringToXML: function(string) {
            return new DOMParser().parseFromString(string, "text/xml").documentElement;
    }
})

}); // end of module
