module('lively.ide.FileParsing').requires('lively.Ometa', 'lively.LKFileParser').toRun(function() {

// ===========================================================================
// FileFragments, another SourceCodeDescriptor
// ===========================================================================
Object.subclass('lively.ide.FileFragment', 
'initializing', {
    initialize: function(name, type, startIndex, stopIndex, fileName, subElems, srcCtrl) {
        this.name = name;
        this.type = type;
        this.startIndex = startIndex;
        this.stopIndex = stopIndex;
        this.fileName = fileName;
        this._subElements = subElems || [];
        this.sourceControl = srcCtrl;
    },
},
'comparing', {
    eq: function(other) {
        if (this == other) return true;
        if (this.constructor != other.constructor) return false;
        return this.name == other.name &&
            // this.startIndex == other.startIndex &&
            // this.stopIndex == other.stopIndex &&
            this.type == other.type &&
            this.fileName == other.fileName &&
            this.getSourceCode() == other.getSourceCode();
    },
},
'accessing', {
    subElements: function(depth) {
        if (!depth || depth === 1)
            return this._subElements; 
        return this._subElements.inject(this._subElements, function(all, ea) { return all.concat(ea.subElements(depth-1)) });
    },

    fragmentsOfOwnFile: function() {
        return this.getSourceControl().rootFragmentForModule(this.fileName)
            .flattened()
            .reject(function(ea) { return ea.eq(this) }, this);
    },

    findOwnerFragment: function() {
        // if (this._owner) return this._owner;
        if (!this.fileName) throw dbgOn(new Error('no fileName for fragment ' + this));
        var self = this;

        var moduleWrapper = this.getSourceControl().findModuleWrapperForFileName(this.fileName)
        if (!moduleWrapper)
            throw new Error('SourceControl doesn\'t have my module: ' + this.fileName)
            
        return moduleWrapper.ast().flattened().detect(function(ea) {
            return ea.subElements().any(function(subElem) { return self.eq(subElem) });
        });
    },

    flattened: function() {
        return this.subElements().inject([this], function(all, ea) { return all.concat(ea.flattened()) });
    },

    getSourceCode: function() {
        return this.getFileString().substring(this.startIndex, this.stopIndex+1);
    },

    getSourceCodeWithoutSubElements: function() {
        var completeSrc = this.getSourceCode();
        return this.subElements().inject(completeSrc, function(src, ea) {
            var elemSrc = ea.getSourceCode();
            var start = src.indexOf(elemSrc);
            var end = elemSrc.length-1 + start;
            return src.substring(0,start) + src.substring(end+1);
        });
    },

    getSourceControl: function() {
        var ctrl = this.sourceControl || lively.ide.startSourceControl();
        if (!ctrl) throw dbgOn(new Error('No sourcecontrol !! '));
        if (!(ctrl instanceof AnotherSourceDatabase)) throw dbgOn(new Error('Using old source control, could lead to errors...'));
        return ctrl;
    },

    sourceCodeWithout: function(childFrag) {
        if (!this.flattened().any(function(ea) {return ea.eq(childFrag)}))
            throw dbgOn(new Error('Fragment' + childFrag + ' isn\'t in my (' + this + ') subelements!'));
        var mySource = this.getSourceCode();
        var childSource = childFrag.getSourceCode();
        var start = childFrag.startIndex - this.startIndex;
        if (start === -1) throw dbgOn(new Error('Cannot find source of ' + childFrag));
        var end = start + childSource.length;
        var newSource = mySource.slice(0, start) + mySource.slice(end);
        return newSource;
    },

    getFileString: function() {
        if (!this.fileName && this._fallbackSrc)
            return this._fallbackSrc;
        if (!this.fileName) throw dbgOn(new Error('No filename for descriptor ' + this.name));
        return  this.getSourceControl().getCachedText(this.fileName);
    },

    newChangeList: function() {
        throw dbgOn(new Error('Not yet!'));
    },

    startLine: function() {
        if (this.startLineNumber === undefined) 
            this.startLineNumber = JsParser.prototype.findLineNo(this.getFileString().split(/[\n\r]/), this.startIndex);
        return this.startLineNumber
    },

    stopLine: function() {
        if (this.stopLineNumber === undefined)
            this.stopLineNumber = JsParser.prototype.findLineNo(this.getFileString().split(/[\n\r]/), this.stopIndex);
        return this.stopLineNumber
    },

    prevElement: function() {
        var siblingsAndMe = this.withSiblings();
        if (!siblingsAndMe) return null;
        var idx = siblingsAndMe.indexOf(this);
        return siblingsAndMe[idx - 1];
    },
    withSiblings: function() {
        var owner = this.findOwnerFragment();
        if (!owner) return null;
        return owner.subElements();
    },
    getComment: function() {
        var prev = this.prevElement();
        if (!prev || prev.type != 'comment') return null;
        var src = prev.getSourceCode();
        // if there multiple comments take the last one
        src = src.split(/\n[\n]+/).last();
        return src;
    },
    getSubElementAtLine: function(line, depth) {
        var element = this.subElements().detect(function(ea) {
            return  ea.startLine() <= line && ea.stopLine() >= line});
        if (element && depth > 1) {
            return element.getSubElementAtLine(line, depth - 1) || element
        };
        return element
    },
    getSubElementAtIndex: function(index, depth) {
        var element = this.subElements().detect(function(ea) {
            return  ea.startIndex <= index && ea.stopIndex >= index});
        if (element && depth > 1) {
            return element.getSubElementAtIndex(index, depth - 1) || element
        };
        return element
    },

    getOwnerNamePath: function() {
        return this.getOwnerPath().pluck('name')
    },
    getOwnerPath: function() {
        var owner = this.findOwnerFragment();
        return (owner ? owner.getOwnerPath() : []).concat([this])
    },

},
'writeing', {
    putSourceCode: function(newString) {
        if (!this.fileName) throw dbgOn(new Error('No filename for descriptor ' + this.name));

        var newMe = this.reparseAndCheck(newString);
        if (!newMe) return null;

        var newFileString = this.buildNewFileString(newString);
        this.getSourceControl().putSourceCodeFor(this, newFileString);

        this.updateIndices(newString, newMe);
        return newMe;
    },

    buildNewFileString: function(newString) {
        var fileString = this.getFileString();
        var beforeString = fileString.substring(0, this.startIndex);
        var afterString = fileString.substring(this.stopIndex+1);
        var newFileString = beforeString.concat(newString, afterString);
        return newFileString;
    },
},
'parsing', {
    reparse: function(newSource) {
        var newFileString = this.buildNewFileString(newSource);
        newFileString = newFileString.slice(0,this.startIndex + newSource.length)

        if (this.type === 'moduleDef' || this.type === 'completeFileDef' || this.type === 'ometaGrammar')
            return this.sourceControl.parseCompleteFile(this.fileName, newFileString);

        // FIXME time to cleanup!!!
        var parser = (this.type === 'ometaDef' || this.type === 'ometaRuleDef') ?
        new OMetaParser() :
        new JsParser();

        parser.debugMode = this.debugMode;
        parser.ptr = this.startIndex;
        parser.src = newFileString;
        parser.lines = newFileString.split(/[\n\r]/);
        parser.fileName = this.fileName;

        var newFragment = parser.parseWithOMeta(this.type);
        if (newFragment)
            newFragment.flattened().forEach(function(ea) { ea.sourceControl = this.sourceControl }, this);
        return newFragment;
    },

    reparseAndCheck: function(newString) {
        var newMe = this.reparse(newString);

        if (!newMe) dbgOn(true);

        if (newMe && this.startIndex !== newMe.startIndex)
            throw dbgOn(new Error("Inconsistency when reparsing fragment " + this.name + ' ' + this.type));
        if (newMe && (this.type == 'completeFileDef' || this.type == 'moduleDef')
            && (newMe.type == 'completeFileDef' || newMe.type == 'moduleDef')) {
                this.type = newMe.type; // Exception to the not-change-type-rule -- better impl via subclassing
        }
        if (!newMe || newMe.type !== this.type) {
            newMe.flattened().forEach(function(ea) { ea.sourceControl = this.sourceControl }, this);
            var msg = Strings.format('Error occured during parsing.\n%s (%s) was parsed as %s. End line: %s.\nChanges are NOT saved.\nRemove the error and try again.',
            this.name, this.type, newMe.type, newMe.stopLine());
            console.warn(msg);
            lively.morphic.World.current().alert(msg);
            return null;
        }

        if (this.type === 'klassDef') { // oh boy, that gets ugly... subclassing, really!
            this.categories = newMe.categories;
        }

        return newMe;
    },


    updateIndices: function(newSource, newMe) {
        this.checkConsistency();

        var prevStop = this.stopIndex;
        var newStop = newMe.stopIndex;
        var delta = newStop - prevStop;

        this.stopIndex = newStop;    // self
        this.startLineNumber = undefined;
        this.stopLineNumber = undefined;

        // update fragments which follow after this or where this is a part of
        this.fragmentsOfOwnFile().each(function(ea) {
            if (ea.stopIndex < prevStop) return;
            ea.stopIndex += delta;
            if (ea.startIndex <= prevStop) return;
            ea.startIndex += delta;
            ea.startLineNumber = undefined;
            ea.stopLineNumber = undefined;
        });

        this.name = newMe.name; // for renaming
        this._subElements = newMe.subElements();
    },
},
'consistency', {
    checkConsistency: function() {
        this.fragmentsOfOwnFile().forEach(function(ea) { // Just a quick check if fragments are ok...
            if (this.flattened().any(function(ea) {return ea.eq(this)}, this)) return;
            if ((this.startIndex < ea.startIndex && ea.startIndex < this.stopIndex)
                || (this.startIndex < ea.stopIndex && ea.stopIndex < this.stopIndex))
            throw new Error('Malformed fragment: ' + ea.name + ' ' + ea.type);
        }, this);
    },
},
'removing', {
    remove: function() {
        var owner = this.findOwnerFragment();
        if (!owner) throw dbgOn(new Error('Cannot find owner of fragment ' + this));
        var newSource = owner.sourceCodeWithout(this);
        owner._subElements = owner.subElements().reject(function(ea) {return ea.eq(this)}, this)
        owner.putSourceCode(newSource);
    },
},
'moving', {
    moveTo: function(index) {
        console.log('Moving from ' + this.startIndex + ' to ' + index)
        var mySrc = this.getSourceCode();
        var myOwner = this.findOwnerFragment();
        step1 = myOwner.sourceCodeWithout(this);
        myOwner = myOwner.putSourceCode(step1);
        //-------
        if (index > this.startIndex)
            index -= mySrc.length;
        this.startIndex = index; this.stopIndex = index + mySrc.length - 1;
        //-------
        var target = myOwner.fragmentsOfOwnFile().detect(function(ea) {
            return ea.startIndex <= index && ea.stopIndex >= index });
        var targetSrc = target.getSourceCode();
        var local = index - target.startIndex;
        step2 = targetSrc.slice(0,local) + mySrc + targetSrc.slice(local, targetSrc.length);
        target.putSourceCode(step2);
        return this;
    },
},
'testing', {
    
    isStatic: function() { // makes only sense for propertyDefs
        return this._isStatic; // FIXME
    },
},
'debugging', {
    toString: function() {
        if (this.fileName)
            return Strings.format('%s: %s (%s-%s in %s, starting at line %s, %s subElements)',
                this.type, this.name, this.startIndex, this.stopIndex, this.fileName, this.startLine(), this.subElements().length);
        return Strings.format('%s: %s (%s-%s in NO FILENAME FOUND, %s subElements)',
                this.type, this.name, this.startIndex, this.stopIndex, this.subElements().length);
    },

    inspect: function() {
        try { return this.toString() } catch (err) { return "#<inspect error: " + err + ">" }
    },

},
'browser support', {

    browseIt: function() {
        var browser = new lively.ide.SystemBrowser();
        browser.openIn(lively.morphic.World.current());

        // set the correct path
        var m = this.fileName.match(/(.*\/)(.+)/)
        var pathName = m[1];    
        browser.setTargetURL(URL.codeBase.withFilename(pathName))

        this.basicBrowseIt(browser);
        return browser;
    },
    basicBrowseIt: function(browser) {
        // FIXME ... subclassing

        var logicalPath = [];
        var ff = this;
        while (ff) {
            logicalPath.unshift(ff);
            if (ff.category)
                logicalPath.unshift(ff.findOwnerFragment() /*for all method category node*/);
            ff = ff.findOwnerFragment()
        }

        logicalPath.forEach(function(ea) {
            browser.selectNodeMatching(function(node) { return node && node.target == ea })
        });

    },


    addSibling: function(newSrc) {
        if (!this.getSourceCode().endsWith('\n'))
            newSrc = '\n' + newSrc;
        if (!newSrc.endsWith('\n'))
            newSrc += '\n';
        var owner = this.findOwnerFragment();
        var ownerSrc = owner.getSourceCode();
        var stopIndexInOwner = this.stopIndex - owner.startIndex;
        var newOwnerSrc = ownerSrc.slice(0, stopIndexInOwner+1) + newSrc + ownerSrc.slice(stopIndexInOwner+1);
        var newOwner = owner.putSourceCode(newOwnerSrc);
        var sibling = newOwner.subElements().detect(function(ea) { return ea.startIndex > this.stopIndex }, this);
        return sibling;
    },
},

'line position', {

    charsUpToLineInString: function(string, line) {
        var lines = string.split('\n')
        var result = 0;
        for(var i=0; (i < line) && (i < lines.length); i++) {
            result = result + lines[i].length + 1
        };
        return result
    },
    charsUpToLine: function(line) {
        var string = this.getSourceCode(); 
        return  this.charsUpToLineInString(string, line - this.startLine())
    },


},'change compatibility', {

    getName: function() {
        return this.name;
    },

    asChange: function() {
        // FIXMEEEEE!!! subclassing! Unified hierarchy
        var change;
        console.log(Strings.format('Converting %s (%s) to change', this.type, this.getSourceCode()));
        if (this.type === 'klassDef') {
            change = ClassChange.create(this.getName(), this.superclassName);
            this.subElements().forEach(function(ea) { change.addSubElement(ea.asChange()) });
        } else if (this.type === 'propertyDef' && !this.isStatic()) {
            var src = this.getSourceCode().match(/[a-zA-Z0-9]+:\s+((\s|.)*)/)[1];
            if (src.endsWith(','))
                src = src.substr(0,src.length-1);
            change = ProtoChange.create(this.getName(), src, this.className, this.category && this.category.name);
        }
        if (change) return change;
        throw dbgOn(new Error(this.type + ' is not yet supported to be converted to a Change'));
    },

    saveAsChange: function(newSrc) { // similar to putSourceCode but creates change instead of modifying src
        var newMe = this.reparseAndCheck(newSrc);
        if (!newMe) return null;
        return newMe.asChange();
    },

});

lively.ide.FileFragment.subclass('lively.ide.ParseErrorFileFragment', {

    isError: true,

    initialize: function($super, fileString, name, type, startI, stopI, fileName, subElems, srcCtrl) {
        $super(name, type, startI, stopI, fileName, subElems, srcCtrl);
        this.fileString = fileString;
    },

    getFileString: function() { return this.fileString },
});

// ===========================================================================
// Another File Parser - uses mostly OMeta for parsing LK sources
// ===========================================================================
Object.subclass('CodeParser', {

    documentation: 'Extended FileParser. Scans source code and extracts SourceCodeDescriptors for ' +
                   'classes, objects, functions, methods. Uses OMeta.',

    ometaRules: [],

    grammarFile: 'LKFileParser.txt',

    initialize: function(forceNewCompile) {
        var prototype = forceNewCompile || !Global['LKFileParser'] ?
            OMetaSupport.fromFile(this.grammarFile) :
            LKFileParser;
        this.ometaParser = Object.delegated(prototype, {_owner: this});
    },

    giveHint: Functions.Null,

    /* parsing */
    prepareParsing: function(src, config) {
        this.src = src;
        this.lines = src.split(/[\n\r]/);
        this.changeList = [];
        
        this.ptr = (config && config.ptr) || 0;
        this.fileName = (config && config.fileName) || null;
    },

    callOMeta: function(rule, src) {
        if (!this.ometaParser) throw dbgOn(new Error('No OMeta parser for parsing file sources!'));
        var errorDescr;
        var errorHandler = function(src, rule, grammarInstance, errorIndex) {
        var restLength = src.length - this.ptr
        errorDescr = new lively.ide.ParseErrorFileFragment(src, null, 'errorDef', 0, restLength-1);
        if (this.debugMode) {
            var msg = OMetaSupport.handleErrorDebug(src, rule, grammarInstance, errorIndex);
            errorDescr.parseError = msg;
            this.parserErrors.push(errorDescr);
        }
    }.bind(this);
        var result = OMetaSupport.matchAllWithGrammar(this.ometaParser, rule, src || this.src, errorHandler);
    return result ? result : errorDescr;
    },

    parseWithOMeta: function(hint) {
        var partToParse = this.src.substring(this.ptr, this.src.length);
        var descr;
        if (hint) descr = this.callOMeta(hint, partToParse);

        if (!descr || descr.isError)
            this.ometaRules
                .without(hint)
                .detect(function(rule) {
                    descr = this.callOMeta(rule, partToParse);
                    return descr && !descr.isError
                }, this);
        
        if (descr === undefined)
            throw dbgOn(new Error('Could not parse src at ' + this.ptr));
        if (descr.stopIndex === undefined)
            throw dbgOn(new Error('Parse result has an error ' + JSON.serialize(descr) + 'ptr:' + this.ptr));
            
        var tmpPtr = this.ptr;
        this.ptr += descr.stopIndex + 1;
        this.fixIndicesAndMore(descr, tmpPtr);
        return descr;
    },

    parseSource: function(src, optConfig /* FIXME */) {
        if (!src) return [];
        // this is the main parse loop
        var msParseStart;
        var msStart = new Date().getTime();
        this.overheadTime = 0;
        
        this.prepareParsing(src, optConfig);
        var descr;
    this.parserErrors = [];
        
        while (this.ptr < this.src.length) {
            if (this.debugMode) msParseStart = new Date().getTime();
            
            this.currentLine = this.lines[this.currentLineNo()-1];
            var tmpPtr = this.ptr;
 
            descr = this.parseNextPart();
            dbgOn(!descr);

            if (this.ptr <= tmpPtr) this.couldNotGoForward(descr);

            if (this.debugMode) {
                var msNow = new Date().getTime();
                var duration = msNow-msParseStart;
                console.log(Strings.format('Parsed line %s to %s (%s:%s) after %ss (%sms)%s',
                    this.findLineNo(this.lines, descr.startIndex),
                    this.findLineNo(this.lines, descr.stopIndex),
                    descr.type, descr.name,
                    (msNow-msStart)/1000, duration, (duration > 100 ? '!!!!!!!!!!' : '')));
            }
            descr = null;
        }
        if (this.debugMode) debugger
        if (this.debugMode && this.parserErrors.length > 0) {
            var msg = 'The following parser errors occured. Please note that not all of them are real errors. If you know that the source code should be a class definition look at the output of klassDef and look for "<--Error-->" to get a hint what to fix in order to parse the code.\n\n';
            msg += this.parserErrors.pluck('parseError').join('\n\n----------------------\n');

            lively.morphic.World.current().addTextWindow({title: 'Parsing errors', content: msg})            
        }

        if (this.specialDescr && this.specialDescr.length > 0 &&  (!this.specialDescr.last().subElements().last().isError || !this.changeList.last().isError))
            console.warn('Couldn\'t find end of ' + this.specialDescr.last().type);
            //throw dbgOn(new Error('Couldn\'t find end of ' + specialDescr.last().type));
        
        console.log('Finished parsing in ' + (new Date().getTime()-msStart)/1000 + ' s');
        // console.log('Overhead:................................' + this.overheadTime/1000 + 's');
 
        return this.changeList;
    },
parseNonFile: function(source) {
    var result = this.parseSource(source).first();
    this.doForAllDescriptors(result, function(d) { d._fallbackSrc = source });
    return result;
},


    couldNotGoForward: function(descr, specialDescr) {
        //dbgOn(true);
        console.warn('Could not go forward before line ' + this.findLineNo(this.lines, this.ptr));
        var    errorDescr = new lively.ide.ParseErrorFileFragment(this.src, null, 'errorDef', this.ptr, this.src.length-1, this.fileName),
            lastAdded = this.changeList.last(),
            responsible = lastAdded.flattened().detect(function(ea) { return ea.subElements(1) && ea.subElements(1).include(descr) });
        if (responsible) {
          responsible._subElements.pop();
          responsible._subElements.push(errorDescr);
        } else if (lastAdded === descr) {
          responsible = this.changeList;
          responsible.pop();
          responsible.push(errorDescr);
        } else {
          console.warn('Couldn\'t find last added descriptor');
        }
        this.ptr = errorDescr.stopIndex + 1;
    },

    /* line finders */
    currentLineNo: function() {
        return this.findLineNo(this.lines, this.ptr);
    },
    
    findLineNo: function(lines, ptr) {
         // var ms = new Date().getTime();
        // what a mess, i want ordinary non local returns!
        ptr += 1;
        try {
        lines.inject(0, function(charsUntilNow, line, i) {
            charsUntilNow += line.length + 1;
            if (ptr <= charsUntilNow) throw {_theLineNo: i+1};
            return charsUntilNow;
        });
        } catch(e) {
            // this.overheadTime += new Date().getTime() - ms;
            
            if (e._theLineNo !== undefined) return e._theLineNo;
            throw e
        }
        
        // this.overheadTime += new Date().getTime() - ms;
        
        return null
    },
    
    ptrOfLine: function(lines, lineNo) {
        lineNo = lineNo - 1; // zero index
        var ptr = 0;
        try {
            lines.inject(0, function(charsUntilNow, line, i) {
            if (lineNo === i) throw {_ptr: charsUntilNow};
            charsUntilNow += line.length + 1;            
            return charsUntilNow;
        });
        } catch(e) {
            if (e._ptr !== undefined) return e._ptr;
            throw e
        }
        return null
    },

    /* descriptor modification */
    doForAllDescriptors: function(descr, action) {
        action.call(this, descr);
        if (!descr.subElements()) return;
        descr.subElements().forEach(function(ea) { this.doForAllDescriptors(ea, action) }, this);
    },
    
    fixIndicesAndMore: function(descr, startPos) {
        // var ms = new Date().getTime();
        // ----------
        this.doForAllDescriptors(descr, function(d) {
            d.startIndex += startPos;
            d.stopIndex += startPos;
            d.fileName = this.fileName;
            d.subElements().forEach(function(sub) { sub._owner = d });
            if (d.categories) // FIXME!!!
                d.categories.forEach(function(categoryDescr) {
                    categoryDescr.startIndex += startPos;
                    categoryDescr.stopIndex += startPos;
                    categoryDescr.fileName = d.fileName
                })
        });
        // ----------------
        // this.overheadTime += new Date().getTime() - ms;
    },

     /* loading */
    sourceFromUrl: function(url) {
        var scrCtrl = lively.ide.startSourceControl();
        return scrCtrl.getCachedText(url.filename());        
    },
    
    //FIXME cleanup
    parseFileFromUrl: function(url) {
        var src = this.sourceFromUrl(url);
        var result = this.parseSource(src);
        
        var flattened = [];
        result.forEach(function(ea) {
            this.doForAllDescriptors(ea, function(d) { flattened.push(d) });
        }, this);
        
        flattened.forEach(function(ea) {
            ea.fileName = url.filename();
        });
        
        return flattened;
    },

});

CodeParser.subclass('JsParser', {
    
    debugMode: false,

    ometaRules: [/*'blankLine',*/ 'comment',
               'klassDef', 'objectDef', 'klassExtensionDef', 'traitDef', 'copDef', 'propertyDef',
               'functionDef', 'categoryDef', 'unknown'],
    
    parseClass: function() {
        return this.callOMeta("klassDef");
    },
    
    parseModuleBegin: function() {
        var match = this.currentLine.match(/^\s*module\([\'\"](.*)[\'\"]\)\.requires\(.*toRun\(.*$/);
        if (!match) return null;
    if (this.debugMode)
        console.log('Found module start in line ' +  this.currentLineNo());
        var descr = new lively.ide.FileFragment(match[1], 'moduleDef', this.ptr, null, this.fileName);
        this.ptr += match[0].length + 1;
        return descr;
    },
    
    parseUsingBegin: function() {
        var match = this.currentLine.match(/^\s*using\((.*)\)\.run\(.*$/);
        if (!match) return null;
    if (this.debugMode)
        console.log('Found using start in line ' +  this.currentLineNo());
        var descr = new lively.ide.FileFragment(match[1], 'usingDef', this.ptr, null, this.fileName);
        this.ptr += match[0].length + 1;
        return descr;
    },
    
    parseModuleOrUsingEnd: function(specialDescr) {
        if (!specialDescr) return null;
        var match = this.currentLine.match(/^\s*\}.*?\)[\;]?.*$/);
        if (!match) return null;
    if (this.debugMode) {
        if (specialDescr.type === 'moduleDef')
            console.log('Found module end in line ' +  this.currentLineNo());
        if (specialDescr.type === 'usingDef')
            console.log('Found using end in line ' +  this.currentLineNo());
    }
        specialDescr.stopIndex = this.ptr + match[0].length - 1;
        this.ptr = specialDescr.stopIndex + 1;
        // FIXME hack
        if (this.src[this.ptr] == '\n') {
            specialDescr.stopIndex += 1;
            this.ptr += 1;
        }
        return specialDescr;
    },

    giveHint: function() {
        if (/^[\s]*([\w\.]+)\.subclass\([\'\"]([\w\.]+)[\'\"]/.test(this.currentLine))
            return 'klassDef';
        // if (/^[\s]*([\w]+)\:[\s]+function/.test(this.currentLine))
        //     return 'protoDef';
        // if (/^[\s]*([\w]+)\:/.test(this.currentLine))
        //     return 'protoDef';
        // if (/^[\s]*function[\s]+([\w]+)[\s]*\(.*\)[\s]*\{.*/.test(this.currentLine)
        //         || /^[\s]*var[\s]+([\w]+)[\s]*\=[\s]*function\(.*\)[\s]*\{.*/.test(this.currentLine))
        //             return 'functionDef';
        if (/^[\s]*Object\.extend.*$/.test(this.currentLine) || /^.*\.addMethods\(.*$/.test(this.currentLine))
                return 'klassExtensionDef';
        // if (/^[\s]*\(function.*/.test(this.currentLine))
        //         return 'funcitonDef';
        return null;
    },

    parseNextPart: function() {
        var descr;
        if (!this.specialDescriptors) this.specialDescriptors = [];
        
        if (descr = this.parseUsingBegin() || this.parseModuleBegin()) { // FIXME nested module/using
            if (this.specialDescriptors.length > 0) this.specialDescriptors.last().subElements().push(descr);
            else this.changeList.push(descr);
            this.specialDescriptors.push(descr)
            return descr;
        };

        if (descr = this.parseModuleOrUsingEnd(this.specialDescriptors.last())) {
            this.specialDescriptors.pop();
            return descr;
        };

        if (descr = this.parseWithOMeta(this.giveHint())) {
            if (this.specialDescriptors.length > 0) this.specialDescriptors.last().subElements().push(descr);
            else this.changeList.push(descr);
            return descr;
        }
        
        throw new Error('Could not parse ' + this.currentLine + ' ...');
    }
    
});
 
Object.extend(JsParser, {

    parseAndShowFileFromURL: function(url) {
        var chgList = new JsParser().parseFileFromUrl(new URL(url));
        new ChangeList(fileName, null, chgList).openIn(lively.morphic.World.current()); 
    }
    
});

CodeParser.subclass('OMetaParser', {

    debugMode: true,

    ometaRules: ['ometaDef', 'unknown'],

    parseNextPart: function() {
        var descr = this.parseWithOMeta(this.giveHint());
        if (descr)
            return this.changeList.push(descr);
        throw new Error('Could not parse ' + this.currentLine + ' ...');
    }
    
    
});

}) // end of module
