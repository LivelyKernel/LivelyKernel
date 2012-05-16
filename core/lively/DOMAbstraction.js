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
};

Global.Converter = {
    documentation: "singleton used to parse DOM attribute values into JS values",

    toBoolean: function toBoolean(string) {
        return string && string == 'true';
    },

    fromBoolean: function fromBoolean(object) {
        if (object == null) return "false";
        var b = object.valueOf();
        // this is messy and should be revisited
        return (b === true || b === "true") ? "true" : "false";
    },

    parseInset: function(string) {
        // syntax: <left>(,<top>(,<right>,<bottom>)?)?
        
        if (!string || string == "none") return null;
        try {
            var box = string.split(",");
        } catch (er) {alert("string is " + string + " string? " + (string instanceof String)) }
        var t, b, l, r;
        switch (box.length) {
        case 1:
            b = l = r = t = lively.data.Length.parse(box[0].strip());
            break;
        case 2:
            t = b = lively.data.Length.data.parse(box[0].strip());
            l = r = lively.data.Length.data.parse(box[1].strip());
            break;
        case 4:
            t = lively.data.Length.parse(box[0].strip());
            l = lively.data.Length.parse(box[1].strip());
            b = lively.data.Length.parse(box[2].strip());
            r = lively.data.Length.parse(box[3].strip());
            break;
        default:
            console.log("unable to parse padding " + padding);
            return null;
        } 
        return Rectangle.inset(t, l, b, r);
    },

    wrapperAndNodeEncodeFilter: function(baseObj, key) {
        var value = baseObj[key];
        if (value instanceof lively.data.Wrapper) return value.uri();
        if (value instanceof Document || value instanceof Element || value instanceof DocumentType)
            return JSON.serialize({XML: Exporter.stringify(value)});
        return value;
    },

    wrapperAndNodeDecodeFilter:  function(baseObj, key) {
        var value = baseObj[key];
        // console.log("wrapperAndNodeDecodeFilter: " + baseObj + " key: " + key + " value: " + baseObj[key]);
        if (Object.isString(value)) {
            var uri = lively.data.FragmentURI.parse(value)
            if (uri) {
                // resolve uri to an object
                // Search the world, because we don't have an general URI resolver
                var obj = lively.morphic.World.current().resolveUriToObject(uri)
                if (obj)
                    return obj;
                else
                    return value;
            }
        }
        return Converter.nodeDecodeFilter(baseObj, key)
    },

    nodeEncodeFilter: function(baseObj, key) {
        var value = baseObj[key];
        if (!value) return value;
        if (!value.nodeType) return value;
        if (value.nodeType !== document.DOCUMENT_NODE && value.nodeType !== document.DOCUMENT_TYPE_NODE)
            return JSON.serialize({XML: Exporter.stringify(value)});
        throw new Error('Cannot store Document/DocumentType'); // to be removed
    },
    
    toJSONAttribute: function(obj) {
        return obj ? escape(JSON.serialize(obj, Converter.wrapperAndNodeEncodeFilter)) : "";
    },

    nodeDecodeFilter: function(baseObj, key) {
        var value = baseObj[key];
        if (!value || !Object.isString(value) || !value.include('XML')) return value;
        var unserialized = JSON.unserialize(value);
        if (!unserialized.XML) return value;
        // var xmlString = value.substring("XML:".length);
        // FIXME if former XML was an Element, it has now a new parentNode, seperate in Elements/Documents?
        //dbgOn(true);
        var node = new DOMParser().parseFromString(unserialized.XML, "text/xml");
        return document.importNode(node.documentElement, true);
    },

    fromJSONAttribute: function(str) {
        return str ?  JSON.unserialize(unescape(str), Converter.nodeDecodeFilter) : null;
    },
    
    needsJSONEncoding: function(value) {
        // some objects can be saved in as DOM attributes using their
        // .toString() form, others need JSON
        if (value instanceof Color) return false;
        var type = typeof value.valueOf();
        return type != "string" && type != "number"; 
    },

    quoteCDATAEndSequence: function(string) {
        var closeCDATASequence = ']' + ']' + '>';
        if (string.include(closeCDATASequence)) {
            console.log("Warning: quoted CDATA Sequence ] ] >")
            string = string.replace(closeCDATASequence, "\\]\\]\\>");
        };
        return string
    },

    // TODO parallels to preparePropertyForSerialization in scene.js
    // Why to we encodeProperties for Records at runtime and not at serialization time?
    encodeProperty: function(prop, propValue, isItem) {
        if (isItem) {
            var desc = LivelyNS.create("item");
        } else {
            var desc = LivelyNS.create("field", {name: prop});
        }
        if (propValue instanceof Function) {
            // console.log("convert function")
            desc.setAttributeNS(null, "family", "Function");
            desc.appendChild(NodeFactory.createCDATA(JSON.serialize(propValue.toLiteral())));
            return desc;
        }
        if (Converter.isJSONConformant(propValue) || propValue instanceof Array) { // hope for the best wrt/arrays
            // FIXME: deal with arrays of primitives etc?
            var encoding;
            if (propValue === null)
                encoding = NodeFactory.createText("null");
            else switch (typeof propValue) {
                case "number":
                case "boolean":
                    encoding = NodeFactory.createText(String(propValue));
                    break;
                default:
                    var jsonSource = JSON.serialize(propValue, Converter.wrapperAndNodeEncodeFilter);
                    encoding = NodeFactory.createCDATA(this.quoteCDATAEndSequence(jsonSource));
            }
            desc.appendChild(encoding);
            return desc;
        } 
    
        if (propValue && propValue.toLiteral) {
            desc.setAttributeNS(null, "family", propValue.constructor.type);
            desc.appendChild(NodeFactory.createCDATA(JSON.serialize(propValue.toLiteral())));
            return desc;
        }
                
        if (propValue.nodeType) {
            switch (propValue.nodeType) {
                case document.DOCUMENT_NODE:
                case document.DOCUMENT_TYPE_NODE:
                    throw new Error('Cannot store Document/DocumentType'); // to be removed
                default:
                    desc.setAttributeNS(null, "isNode", true); // Replace with DocumentFragment
                    desc.appendChild(document.importNode(propValue, true));
            }
            return desc;
        } 
        return null;
    },
    
    isJSONConformant: function(value) { // for now, arrays not handled but could be
        if (value instanceof Element && value.ownerDocument === document) return false;
        // why disallow all objects?
    // KP: because we don't know how to handle them up front, special cases handled bye encodeProperty
    // this makes simple objects like {a: 1} hard to serialize
    // fix for now: objects can determine by themselves if isJSONConformant should be true
        return value == null || value.isJSONConformant || (typeof value.valueOf()  !== 'object');
    },

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
        isFragmentNode: function(node) { return node && node.nodeType === this.FragmentType() },
};

Global.XLinkNS = {
    create: function(href, doc) {
        var doc = doc || Global.document;
        var node = NodeFactory.createNS(null, 'script', {type: "text/ecmascript"});
        node.setAttribute('xlink:href', href);
        // XLinkNS.setHref(node, href); // does not seem to work
        return node;
    },
    setHref: function(node, href) {
    return node.setAttributeNS(Namespace.XLINK, "href", href);
    },
    
    getHref: function(node) {
    return node.getAttributeNS(Namespace.XLINK, "href");
    }
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
    },
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
    },
});

Object.subclass('Copier', {
    isCopier: true,
});

Copier.subclass('Importer', {
    isImporter: true,

    // this gets overwritten in lively.oldCore.Misc
    canvas: function(doc) { return doc.getElementsByTagName('body')[0] },

    getBaseDocument: function() {
        if (Config.standAlone) {
            var doc = new DOMParser().parseFromString(Exporter.stringify(document), "text/xml");
                svgNode = doc.getElementsByTagName('svg')[0];
            if (svgNode)
                $A(svgNode.childNodes).forEach(function(node) { svgNode.removeChild(node) });
            return doc
        }

        // FIXME memoize
        var webRes = new WebResource(URL.source).get(), status = webRes.status;
        if (!status.isSuccess()) {
            console.log("failure retrieving  " + URL.source + ", status " + status);
            return null;
        }
        var doc = webRes.contentDocument;
        if (!doc) return null;
        // FIX for IE9+
        if (doc.documentElement == null) {
             doc = new ActiveXObject('MSXML2.DOMDocument.6.0');
            doc.validateOnParse = false;
            doc.setProperty('ProhibitDTD', false);
            doc.setProperty('SelectionLanguage', 'XPath');
            doc.setProperty('SelectionNamespaces', XPathEmulator.prototype.createNSResolver());
            doc.loadXML(webRes.content);
        }
        this.clearCanvas(doc);
        return doc;
    },

    clearCanvas: function(doc) { // is overwritten later in lively.oldCore.Misc
        var canvas = this.canvas(doc),
            node = canvas.firstChild;
        while (node) {
            var toRemove = node;
            node = node.nextSibling;
            canvas.removeChild(toRemove);
        }
    },

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
    },

});

Object.extend(Global, {
    stringToXML: function(string) {
            return new DOMParser().parseFromString(string, "text/xml").documentElement;
    },
})

}); // end of module
