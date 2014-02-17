/*
 * Copyright (c) 2006-2009 Sun Microsystems, Inc.
 * Copyright (c) 2008-2011 Hasso Plattner Institute
 *
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.

 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

// ===========================================================================
// Our JS library extensions (JS 1.5, no particular browser or graphics engine)
// ===========================================================================

/**
  * LK class system.
  */
Object.extend(Function.prototype, {

    defaultCategoryName: 'default category',

    subclass: function(/*... */) {
        // Main method of the LK class system.

        // {className} is the name of the new class constructor which this method synthesizes
        // and binds to {className} in the Global namespace.
        // Remaining arguments are (inline) properties and methods to be copied into the prototype
        // of the newly created constructor.

        // modified from prototype.js

        var args = Array.from(arguments),
            className = args.shift(),
            targetScope = Global,
            shortName = null;

        if (className) {
            targetScope = lively.Class.namespaceFor(className);
            shortName = lively.Class.unqualifiedNameFor(className);
        }  else {
            shortName = "anonymous_" + (lively.Class.anonymousCounter++);
            className = shortName;
        }

        var klass;
        if (className && targetScope[shortName] && (targetScope[shortName].superclass === this)) {
            // preserve the class to allow using the subclass construct in interactive development
            klass = targetScope[shortName];
        } else {
            klass = lively.Class.newInitializer(shortName);
            klass.superclass = this;
            var protoclass = function() { }; // that's the constructor of the new prototype object
            protoclass.prototype = this.prototype;
            klass.prototype = new protoclass();
            klass.prototype.constructor = klass;
            klass.type = className; // KP: .name would be better but js ignores .name on anonymous functions
            klass.displayName = className; // for debugging, because name can not be assigned
            if (className) targetScope[shortName] = klass; // otherwise it's anonymous

            // remember the module that contains the class def
            if (Global.lively && lively.Module && lively.Module.current)
                klass.sourceModule = lively.Module.current();
                
            // add a more appropriate toString implementation
            klass.toString = function(){
                var name = this.type;
                if(name.startsWith("anonymous_"))
                    name = "null";
                else
                    name = "'" + name + "'";
                var categories = this.categories;
                if(categories)
                    var category = Object.keys(categories).detect(function(category){
                        return categories[category].include("initialize");
                    });
                if(!category) category = "default category";
                return (this.superclass.type || this.superclass.name) + ".subclass(" + name + 
                        ", '" + category + "', {initialize: " + this.prototype.initialize + "})";
            }
        };

        // the remaining args should be category strings or source objects
        this.addMethods.apply(klass, args);

        if (!klass.prototype.initialize)
            klass.prototype.initialize = Functions.Empty;

        return klass;
    },

    addMethods: function(/*...*/) {
        var args = arguments,
            category = this.defaultCategoryName,
            traits = [];
        for (var i = 0; i < args.length; i++) {
            if (Object.isString(args[i])) {
                category = args[i];
            } else if (Global.RealTrait && args[i] instanceof RealTrait) {
                // FIXME Traits are optional and defined in lively.Traits
                // This should go somewhere into lively.Traits...
                // we apply traits afterwards because they can override behavior
                traits.push(args[i]);
            } else {
                this.addCategorizedMethods(category, args[i] instanceof Function ? (args[i])() : args[i]);
            }
        }
        for (i = 0; i < traits.length; i++) {
            traits[i].applyTo(this);
        }
    },

    addCategorizedMethods: function(categoryName, source) {
        // first parameter is a category name
        // copy all the methods and properties from {source} into the
        // prototype property of the receiver, which is intended to be
        // a class constructor.     Method arguments named '$super' are treated
        // specially, see Prototype.js documentation for "lively.Class.create()" for details.
        // derived from lively.Class.Methods.addMethods() in prototype.js

        // prepare the categories
        if (!this.categories) this.categories = {};
        if (!this.categories[categoryName]) this.categories[categoryName] = [];
        var currentCategoryNames = this.categories[categoryName];

        if (!source)
            throw dbgOn(new Error('no source in addCategorizedMethods!'));

        var ancestor = this.superclass && this.superclass.prototype;

        var className = this.type || "Anonymous";

        for (var property in source) {

            if (property == 'constructor') continue;

            var getter = source.__lookupGetter__(property);
            if (getter) this.prototype.__defineGetter__(property, getter);
            var setter = source.__lookupSetter__(property);
            if (setter) this.prototype.__defineSetter__(property, setter);
            if (getter || setter) continue;

            currentCategoryNames.push(property);

            var value = source[property];
            // weirdly, RegExps are functions in Safari, so testing for
            // Object.isFunction on regexp field values will return true.
            // But they're not full-blown functions and don't
            // inherit argumentNames from Function.prototype

            var hasSuperCall = ancestor && Object.isFunction(value) &&
                value.argumentNames && value.argumentNames().first() == "$super";
            if (hasSuperCall) {
                // wrapped in a function to save the value of 'method' for advice
                (function() {
                    var method = value,
                        advice = (function(m) {
                          var cs = function callSuper() {
                            var method = ancestor[m];
                            if (!method) {
                                throw new Error(Strings.format('Trying to call super of' +
                                    '%s>>%s but super method non existing in %s',
                                    className, m, ancestor.constructor.type));
                            }
                            return method.apply(this, arguments);
                        };
                        cs.varMapping = {ancestor: ancestor, m: m};
                        cs.isSuperCall = true;
                        return cs;
                    })(property);

                    advice.methodName = "$super:" + (this.superclass ? this.superclass.type + ">>" : "") + property;

                    value = Object.extend(advice.wrap(method), {
                        valueOf:  function() { return method },
                        toString: function() { return method.toString() },
                        originalFunction: method,
                        methodName: advice.methodName,
                        isSuperWrapper: true
                    });
                    // for lively.Closures
                    method.varMapping = {$super: advice};
                })();
            }

            this.prototype[property] = value;

            if (property === "formals") { // rk FIXME remove this cruft
                // special property (used to be pins, but now called formals to disambiguate old and new style
                lively.Class.addPins(this, value);
            } else if (Object.isFunction(value)) {
                // remember name for profiling in WebKit
                value.displayName = className + "$" + property;

                // remember where it was defined
                if (Global.lively && lively.Module && lively.Module.current)
                    value.sourceModule = lively.Module.current();

                for (; value; value = value.originalFunction) {
                    if (value.methodName) {
                        //console.log("class " + this.prototype.constructor.type
                        // + " borrowed " + value.qualifiedMethodName());
                    }
                    value.declaredClass = this.prototype.constructor.type;
                    value.methodName = property;
                }
            }
        } // end of for (var property in source)

        return this;
    },


    addProperties: function(spec, recordType) {
        lively.Class.addMixin(this, recordType.prototype.create(spec).prototype);
    },

    isSubclassOf: function(aClass) {
        return this.superclasses().include(aClass);
    },

    allSubclasses: function() {
        var klass = this;
        return Global.classes(true).select(function(ea) { return ea.isSubclassOf(klass) });
    },
    withAllSubclasses: function() { return [this].concat(this.allSubclasses()) },


    directSubclasses: function() {
        var klass = this;
        return Global.classes(true).select(function(ea) { return ea.superclass === klass });
    },

    withAllSortedSubclassesDo: function(func) {
        // this method iterates func on all subclasses of klass (including klass)
        // it is ensured that the klasses are sorted by a) subclass relationship and b) name (not type!)
        // func gets as parameters: 1) the class 2) index in list 3) level of inheritance
        // compared to klass (1 for direct subclasses and so on)

        function createSortedSubclassList(klass, level) {
            var list = klass.directSubclasses()
                .sortBy(function(ea) { return ea.name.charCodeAt(0) })
                .collect(function(subclass) { return createSortedSubclassList(subclass, level + 1) })
                .flatten();
            return [{klass: klass, level: level}].concat(list)
        }

        return createSortedSubclassList(this, 0).collect(function(spec, idx) { return func(spec.klass, idx, spec.level) })
    },

    superclasses: function() {
        if (!this.superclass) return [];
        if (this.superclass === Object) return [Object];
        return this.superclass.superclasses().concat([this.superclass]);
    },

    categoryNameFor: function(propName) {
        for (var categoryName in this.categories) {
            if (this.categories[categoryName].include(propName)) {
                return categoryName;
            }
        }
        return null;
    },

    remove: function() {
        var ownerNamespace = lively.Class.namespaceFor(this.type),
            ownName = lively.Class.unqualifiedNameFor(this.type);
        delete ownerNamespace[ownName];
    }

});

lively.Class = {

    anonymousCounter: 0,

    initializerTemplate: (function CLASS(){ lively.Class.initializer.apply(this, arguments) }).toString(),

    newInitializer: function(name) {
        // this hack ensures that class instances have a name
        return eval(lively.Class.initializerTemplate.replace(/CLASS/g, name) + ";" + name);
    },

    initializer: function initializer() {
        var firstArg = arguments[0];
        if (firstArg && firstArg.isInstanceRestorer) {
            // for deserializing instances just do nothing
        } else {
            // automatically call the initialize method
            this.initialize.apply(this, arguments);
        }
    },

    isValidIdentifier: (function() {
        // As defined in the Ecmascript standard (http://www.ecma-international.org/ecma-262/5.1/#sec-7.6)
        // JS identifiers can consist out of several unicode character classes.
        // The code below was generated using the MIT licensed CSET library, see http://inimino.org/~inimino/blog/javascript_cset
        // The code to produce the regexps:
        //
        // var specialStart = fromString('$_'),
        //     Lu = fromUnicodeGeneralCategory('Lu'),
        //     Ll = fromUnicodeGeneralCategory('Ll'),
        //     Lt = fromUnicodeGeneralCategory('Lt'),
        //     Lm = fromUnicodeGeneralCategory('Lm'),
        //     Lo = fromUnicodeGeneralCategory('Lo'),
        //     Nl = fromUnicodeGeneralCategory('Nl');
        //     joiner1 = fromString("\u200C"),
        //     joiner2 = fromString("\u200D"),
        //     Mn = fromUnicodeGeneralCategory("Mn"),
        //     Mc = fromUnicodeGeneralCategory("Mc"),
        //     Nd = fromUnicodeGeneralCategory("Nd"),
        //     Pc = fromUnicodeGeneralCategory("Pc"),
        //     startCharTester = toRegex([specialStart,Lu,Ll,Lt,Lm,Lo,Nl].reduce(union)),
        //     precedingCharTester = toRegex([specialStart, Lu,Ll,Lt,Lm,Lo,Nl, joiner1, joiner2,Mn, Mc, Nd, Pc].reduce(union));
        // console.log('var startChars = /%s/;', startCharTester);
        // console.log('var precedingCharTester = /^(?:%s)*$/;', precedingCharTester);
        var startCharTester = /[$A-Z_a-zªµºÀ-ÖØ-öø-ˁˆ-ˑˠ-ˤˬˮͰ-ʹͶ-ͷͺ-ͽΆΈ-ΊΌΎ-ΡΣ-ϵϷ-ҁҊ-ԣԱ-Ֆՙա-ևא-תװ-ײء-يٮ-ٯٱ-ۓەۥ-ۦۮ-ۯۺ-ۼۿܐܒ-ܯݍ-ޥޱߊ-ߪߴ-ߵߺऄ-हऽॐक़-ॡॱ-ॲॻ-ॿঅ-ঌএ-ঐও-নপ-রলশ-হঽৎড়-ঢ়য়-ৡৰ-ৱਅ-ਊਏ-ਐਓ-ਨਪ-ਰਲ-ਲ਼ਵ-ਸ਼ਸ-ਹਖ਼-ੜਫ਼ੲ-ੴઅ-ઍએ-ઑઓ-નપ-રલ-ળવ-હઽૐૠ-ૡଅ-ଌଏ-ଐଓ-ନପ-ରଲ-ଳଵ-ହଽଡ଼-ଢ଼ୟ-ୡୱஃஅ-ஊஎ-ஐஒ-கங-சஜஞ-டண-தந-பம-ஹௐఅ-ఌఎ-ఐఒ-నప-ళవ-హఽౘ-ౙౠ-ౡಅ-ಌಎ-ಐಒ-ನಪ-ಳವ-ಹಽೞೠ-ೡഅ-ഌഎ-ഐഒ-നപ-ഹഽൠ-ൡൺ-ൿඅ-ඖක-නඳ-රලව-ෆก-ะา-ำเ-ๆກ-ຂຄງ-ຈຊຍດ-ທນ-ຟມ-ຣລວສ-ຫອ-ະາ-ຳຽເ-ໄໆໜ-ໝༀཀ-ཇཉ-ཬྈ-ྋက-ဪဿၐ-ၕၚ-ၝၡၥ-ၦၮ-ၰၵ-ႁႎႠ-Ⴥა-ჺჼᄀ-ᅙᅟ-ᆢᆨ-ᇹሀ-ቈቊ-ቍቐ-ቖቘቚ-ቝበ-ኈኊ-ኍነ-ኰኲ-ኵኸ-ኾዀዂ-ዅወ-ዖዘ-ጐጒ-ጕጘ-ፚᎀ-ᎏᎠ-Ᏼᐁ-ᙬᙯ-ᙶᚁ-ᚚᚠ-ᛪ\u16ee-\u16f0ᜀ-ᜌᜎ-ᜑᜠ-ᜱᝀ-ᝑᝠ-ᝬᝮ-ᝰក-ឳៗៜᠠ-ᡷᢀ-ᢨᢪᤀ-ᤜᥐ-ᥭᥰ-ᥴᦀ-ᦩᧁ-ᧇᨀ-ᨖᬅ-ᬳᭅ-ᭋᮃ-ᮠᮮ-ᮯᰀ-ᰣᱍ-ᱏᱚ-ᱽᴀ-ᶿḀ-ἕἘ-Ἕἠ-ὅὈ-Ὅὐ-ὗὙὛὝὟ-ώᾀ-ᾴᾶ-ᾼιῂ-ῄῆ-ῌῐ-ΐῖ-Ίῠ-Ῥῲ-ῴῶ-ῼⁱⁿₐ-ₔℂℇℊ-ℓℕℙ-ℝℤΩℨK-ℭℯ-ℹℼ-ℿⅅ-ⅉⅎ\u2160-\u2188Ⰰ-Ⱞⰰ-ⱞⱠ-Ɐⱱ-ⱽⲀ-ⳤⴀ-ⴥⴰ-ⵥⵯⶀ-ⶖⶠ-ⶦⶨ-ⶮⶰ-ⶶⶸ-ⶾⷀ-ⷆⷈ-ⷎⷐ-ⷖⷘ-ⷞⸯ々-\u3007\u3021-\u3029〱-〵\u3038-〼ぁ-ゖゝ-ゟァ-ヺー-ヿㄅ-ㄭㄱ-ㆎㆠ-ㆷㇰ-ㇿ㐀-䶵一-鿃ꀀ-ꒌꔀ-ꘌꘐ-ꘟꘪ-ꘫꙀ-ꙟꙢ-ꙮꙿ-ꚗꜗ-ꜟꜢ-ꞈꞋ-ꞌꟻ-ꠁꠃ-ꠅꠇ-ꠊꠌ-ꠢꡀ-ꡳꢂ-ꢳꤊ-ꤥꤰ-ꥆꨀ-ꨨꩀ-ꩂꩄ-ꩋ가-힣豈-鶴侮-頻並-龎ﬀ-ﬆﬓ-ﬗיִײַ-ﬨשׁ-זּטּ-לּמּנּ-סּףּ-פּצּ-ﮱﯓ-ﴽﵐ-ﶏﶒ-ﷇﷰ-ﷻﹰ-ﹴﹶ-ﻼＡ-Ｚａ-ｚｦ-ﾾￂ-ￇￊ-ￏￒ-ￗￚ-ￜ]|[\ud840-\ud868][\udc00-\udfff]|\ud800[\udc00-\udc0b\udc0d-\udc26\udc28-\udc3a\udc3c-\udc3d\udc3f-\udc4d\udc50-\udc5d\udc80-\udcfa\udd40-\udd74\ude80-\ude9c\udea0-\uded0\udf00-\udf1e\udf30-\udf4a\udf80-\udf9d\udfa0-\udfc3\udfc8-\udfcf\udfd1-\udfd5]|\ud801[\udc00-\udc9d]|\ud802[\udc00-\udc05\udc08\udc0a-\udc35\udc37-\udc38\udc3c\udc3f\udd00-\udd15\udd20-\udd39\ude00\ude10-\ude13\ude15-\ude17\ude19-\ude33]|\ud808[\udc00-\udf6e]|\ud809[\udc00-\udc62]|\ud835[\udc00-\udc54\udc56-\udc9c\udc9e-\udc9f\udca2\udca5-\udca6\udca9-\udcac\udcae-\udcb9\udcbb\udcbd-\udcc3\udcc5-\udd05\udd07-\udd0a\udd0d-\udd14\udd16-\udd1c\udd1e-\udd39\udd3b-\udd3e\udd40-\udd44\udd46\udd4a-\udd50\udd52-\udea5\udea8-\udec0\udec2-\udeda\udedc-\udefa\udefc-\udf14\udf16-\udf34\udf36-\udf4e\udf50-\udf6e\udf70-\udf88\udf8a-\udfa8\udfaa-\udfc2\udfc4-\udfcb]|\ud869[\udc00-\uded6]|\ud87e[\udc00-\ude1d]/;
        var precedingCharTester = /^(?:[$0-9A-Z_a-zªµºÀ-ÖØ-öø-ˁˆ-ˑˠ-ˤˬˮ\u0300-ʹͶ-ͷͺ-ͽΆΈ-ΊΌΎ-ΡΣ-ϵϷ-ҁ\u0483-\u0487Ҋ-ԣԱ-Ֆՙա-և\u0591-\u05bd\u05bf\u05c1-\u05c2\u05c4-\u05c5\u05c7א-תװ-ײ\u0610-\u061aء-\u065e٠-٩ٮ-ۓە-\u06dc\u06df-\u06e8\u06ea-ۼۿܐ-\u074aݍ-ޱ߀-ߵߺ\u0901-ह\u093c-\u094dॐ-\u0954क़-\u0963०-९ॱ-ॲॻ-ॿ\u0981-\u0983অ-ঌএ-ঐও-নপ-রলশ-হ\u09bc-\u09c4\u09c7-\u09c8\u09cb-ৎ\u09d7ড়-ঢ়য়-\u09e3০-ৱ\u0a01-\u0a03ਅ-ਊਏ-ਐਓ-ਨਪ-ਰਲ-ਲ਼ਵ-ਸ਼ਸ-ਹ\u0a3c\u0a3e-\u0a42\u0a47-\u0a48\u0a4b-\u0a4d\u0a51ਖ਼-ੜਫ਼੦-\u0a75\u0a81-\u0a83અ-ઍએ-ઑઓ-નપ-રલ-ળવ-હ\u0abc-\u0ac5\u0ac7-\u0ac9\u0acb-\u0acdૐૠ-\u0ae3૦-૯\u0b01-\u0b03ଅ-ଌଏ-ଐଓ-ନପ-ରଲ-ଳଵ-ହ\u0b3c-\u0b44\u0b47-\u0b48\u0b4b-\u0b4d\u0b56-\u0b57ଡ଼-ଢ଼ୟ-\u0b63୦-୯ୱ\u0b82-ஃஅ-ஊஎ-ஐஒ-கங-சஜஞ-டண-தந-பம-ஹ\u0bbe-\u0bc2\u0bc6-\u0bc8\u0bca-\u0bcdௐ\u0bd7௦-௯\u0c01-\u0c03అ-ఌఎ-ఐఒ-నప-ళవ-హఽ-\u0c44\u0c46-\u0c48\u0c4a-\u0c4d\u0c55-\u0c56ౘ-ౙౠ-\u0c63౦-౯\u0c82-\u0c83ಅ-ಌಎ-ಐಒ-ನಪ-ಳವ-ಹ\u0cbc-\u0cc4\u0cc6-\u0cc8\u0cca-\u0ccd\u0cd5-\u0cd6ೞೠ-\u0ce3೦-೯\u0d02-\u0d03അ-ഌഎ-ഐഒ-നപ-ഹഽ-\u0d44\u0d46-\u0d48\u0d4a-\u0d4d\u0d57ൠ-\u0d63൦-൯ൺ-ൿ\u0d82-\u0d83අ-ඖක-නඳ-රලව-ෆ\u0dca\u0dcf-\u0dd4\u0dd6\u0dd8-\u0ddf\u0df2-\u0df3ก-\u0e3aเ-\u0e4e๐-๙ກ-ຂຄງ-ຈຊຍດ-ທນ-ຟມ-ຣລວສ-ຫອ-\u0eb9\u0ebb-ຽເ-ໄໆ\u0ec8-\u0ecd໐-໙ໜ-ໝༀ\u0f18-\u0f19༠-༩\u0f35\u0f37\u0f39\u0f3e-ཇཉ-ཬ\u0f71-\u0f84\u0f86-ྋ\u0f90-\u0f97\u0f99-\u0fbc\u0fc6က-၉ၐ-႙Ⴀ-Ⴥა-ჺჼᄀ-ᅙᅟ-ᆢᆨ-ᇹሀ-ቈቊ-ቍቐ-ቖቘቚ-ቝበ-ኈኊ-ኍነ-ኰኲ-ኵኸ-ኾዀዂ-ዅወ-ዖዘ-ጐጒ-ጕጘ-ፚ\u135fᎀ-ᎏᎠ-Ᏼᐁ-ᙬᙯ-ᙶᚁ-ᚚᚠ-ᛪ\u16ee-\u16f0ᜀ-ᜌᜎ-\u1714ᜠ-\u1734ᝀ-\u1753ᝠ-ᝬᝮ-ᝰ\u1772-\u1773ក-ឳ\u17b6-\u17d3ៗៜ-\u17dd០-៩\u180b-\u180d᠐-᠙ᠠ-ᡷᢀ-ᢪᤀ-ᤜ\u1920-\u192b\u1930-\u193b᥆-ᥭᥰ-ᥴᦀ-ᦩ\u19b0-\u19c9᧐-᧙ᨀ-\u1a1b\u1b00-ᭋ᭐-᭙\u1b6b-\u1b73\u1b80-\u1baaᮮ-᮹ᰀ-\u1c37᱀-᱉ᱍ-ᱽᴀ-\u1de6\u1dfe-ἕἘ-Ἕἠ-ὅὈ-Ὅὐ-ὗὙὛὝὟ-ώᾀ-ᾴᾶ-ᾼιῂ-ῄῆ-ῌῐ-ΐῖ-Ίῠ-Ῥῲ-ῴῶ-ῼ\u200c-\u200d‿-⁀⁔ⁱⁿₐ-ₔ\u20d0-\u20dc\u20e1\u20e5-\u20f0ℂℇℊ-ℓℕℙ-ℝℤΩℨK-ℭℯ-ℹℼ-ℿⅅ-ⅉⅎ\u2160-\u2188Ⰰ-Ⱞⰰ-ⱞⱠ-Ɐⱱ-ⱽⲀ-ⳤⴀ-ⴥⴰ-ⵥⵯⶀ-ⶖⶠ-ⶦⶨ-ⶮⶰ-ⶶⶸ-ⶾⷀ-ⷆⷈ-ⷎⷐ-ⷖⷘ-ⷞ\u2de0-\u2dffⸯ々-\u3007\u3021-\u302f〱-〵\u3038-〼ぁ-ゖ\u3099-\u309aゝ-ゟァ-ヺー-ヿㄅ-ㄭㄱ-ㆎㆠ-ㆷㇰ-ㇿ㐀-䶵一-鿃ꀀ-ꒌꔀ-ꘌꘐ-ꘫꙀ-ꙟꙢ-\ua66f\ua67c-\ua67dꙿ-ꚗꜗ-ꜟꜢ-ꞈꞋ-ꞌꟻ-\ua827ꡀ-ꡳ\ua880-\ua8c4꣐-꣙꤀-\ua92dꤰ-\ua953ꨀ-\uaa36ꩀ-\uaa4d꩐-꩙가-힣豈-鶴侮-頻並-龎ﬀ-ﬆﬓ-ﬗיִ-ﬨשׁ-זּטּ-לּמּנּ-סּףּ-פּצּ-ﮱﯓ-ﴽﵐ-ﶏﶒ-ﷇﷰ-ﷻ\ufe00-\ufe0f\ufe20-\ufe26︳-︴﹍-﹏ﹰ-ﹴﹶ-ﻼ０-９Ａ-Ｚ＿ａ-ｚｦ-ﾾￂ-ￇￊ-ￏￒ-ￗￚ-ￜ]|[\ud840-\ud868][\udc00-\udfff]|\ud800[\udc00-\udc0b\udc0d-\udc26\udc28-\udc3a\udc3c-\udc3d\udc3f-\udc4d\udc50-\udc5d\udc80-\udcfa\udd40-\udd74\uddfd\ude80-\ude9c\udea0-\uded0\udf00-\udf1e\udf30-\udf4a\udf80-\udf9d\udfa0-\udfc3\udfc8-\udfcf\udfd1-\udfd5]|\ud801[\udc00-\udc9d\udca0-\udca9]|\ud802[\udc00-\udc05\udc08\udc0a-\udc35\udc37-\udc38\udc3c\udc3f\udd00-\udd15\udd20-\udd39\ude00-\ude03\ude05-\ude06\ude0c-\ude13\ude15-\ude17\ude19-\ude33\ude38-\ude3a\ude3f]|\ud808[\udc00-\udf6e]|\ud809[\udc00-\udc62]|\ud834[\udd65-\udd69\udd6d-\udd72\udd7b-\udd82\udd85-\udd8b\uddaa-\uddad\ude42-\ude44]|\ud835[\udc00-\udc54\udc56-\udc9c\udc9e-\udc9f\udca2\udca5-\udca6\udca9-\udcac\udcae-\udcb9\udcbb\udcbd-\udcc3\udcc5-\udd05\udd07-\udd0a\udd0d-\udd14\udd16-\udd1c\udd1e-\udd39\udd3b-\udd3e\udd40-\udd44\udd46\udd4a-\udd50\udd52-\udea5\udea8-\udec0\udec2-\udeda\udedc-\udefa\udefc-\udf14\udf16-\udf34\udf36-\udf4e\udf50-\udf6e\udf70-\udf88\udf8a-\udfa8\udfaa-\udfc2\udfc4-\udfcb\udfce-\udfff]|\ud869[\udc00-\uded6]|\ud87e[\udc00-\ude1d]|\udb40[\udd00-\uddef])*$/;
        return function(string) {
            return startCharTester.test(string[0])
                && precedingCharTester.test(string.slice(1));
        }
    })(),

    isClass: function Class$isClass(object) {
        if (object === Object
          || object === Array
          || object === Function
          || object === String
          || object === Boolean
          || object === Date
          || object === RegExp
          || object === Number) {
            return true;
        }
        return (object instanceof Function) && (object.superclass !== undefined);
    },

    className: function Class$className(cl) {
        if (cl === Object) return "Object"
        if (cl === Array) return "Array"
        if (cl === Function) return "Function"
        if (cl === String) return "String"
        if (cl === Boolean) return "Boolean"
        if (cl === Date) return "Date"
        if (cl === RegExp) return "RegExp"
        if (cl === Number) return "Number"
        return cl.type;
    },

    forName: function forName(name) {
        // lookup the class object given the qualified name
        var ns = lively.Class.namespaceFor(name),
            shortName = lively.Class.unqualifiedNameFor(name);
        return ns[shortName];
    },

    deleteObjectNamed: function Class$deleteObjectNamed(name) {
        var ns = lively.Class.namespaceFor(name),
            shortName = lively.Class.unqualifiedNameFor(name);
        delete ns[shortName];
    },

    unqualifiedNameFor: function Class$unqualifiedNameFor(name) {
        var lastDot = name.lastIndexOf('.'), // lastDot may be -1
            unqualifiedName = name.substring(lastDot + 1);
        if (!lively.Class.isValidIdentifier(unqualifiedName)) throw new Error('not a name ' + unqualifiedName);
        return unqualifiedName;
    },

    namespaceFor: function Class$namespaceFor(className) {
        // get the namespace object given the qualified name
        var lastDot = className ? className.lastIndexOf('.') : -1;
        if (lastDot < 0) return Global;
        else return lively.module(className.substring(0, lastDot));
    },

    withAllClassNames: function Class$withAllClassNames(scope, callback) {
        for (var name in scope) {
            try {
                if (lively.Class.isClass(scope[name]))
                    callback(name);
            } catch (er) { // FF exceptions
            }
        }
        callback("Object");
        callback("Global");
    },

    makeEnum: function Class$makeEnum(strings) {
        // simple mechanism for making objecs with property values set to
        // property names, to be used as enums.

        var e = {};
        for (var i = 0; i < strings.length; i++) {
            e[strings[i]] = strings[i];
        }
        return e;
    },

    getConstructor: function Class$getConstructor(object) {
        var c = object.constructor;
        return (c && c.getOriginal) ? c.getOriginal() : c;
    },

    getPrototype: function Class$getPrototype(object) {
        return this.getConstructor(object).prototype;
    },

    applyPrototypeMethod: function Class$applyPrototypeMethod(methodName, target, args) {
        var method = this.getPrototype(target);
        if (!method) throw new Error("method " + methodName + " not found");
        return method.apply(this, args);
    },

    getSuperConstructor: function Class$getSuperConstructor(object) {
        return this.getConstructor(object).superclass;
    },

    getSuperPrototype: function Class$getSuperPrototype(object) {
        var sup = this.getSuperConstructor(object);
        return sup && sup.prototype;
    },

    addPins: function Class$addPins(cls, spec) {
        if (Global.Relay) {
            lively.Class.addMixin(cls, Relay.newDelegationMixin(spec).prototype);
            return;
        }
        // this is for refactoring away from Relay and friends
        if (!Object.isArray(spec)) throw new Error('Cannot deal with non-Array spec in addPins');
        function unstripName(name) { return name.replace(/[\+|\-]?(.*)/, '$1') };
        function needsSetter(name) { return !name.startsWith('-') };
        function needsGetter(name) { return !name.startsWith('+') };
        var mixinSpec = {};
        spec.forEach(function(specString) {
            var name = unstripName(specString);
            if (needsSetter(specString))
                mixinSpec['set' + name] = function(value) { return this['_' + name] = value }
            if (needsGetter(specString))
                mixinSpec['get' + name] = function() { return this['_' + name] }
        })
        lively.Class.addMixin(cls, mixinSpec);
    },

    addMixin: function Class$addMixin(cls, source) {
        var spec = {};
        for (var prop in source) {
            var value = source[prop];
            switch (prop) {
                case "constructor": case "initialize": case "deserialize": case "copyFrom":
                case "toString": case "definition": case "description":
                    break;
                default:
                    if (cls.prototype[prop] === undefined) // do not override existing values!
                        spec[prop] = value;
            }
        }
        cls.addMethods(spec);
    }

};

Object.extend(Global, {
    dbgOn: function dbgOn(cond, optMessage) {
        if (cond && optMessage) console.warn(optMessage);
        if (cond) debugger;
        // also call as: throw dbgOn(new Error(....))
        return cond;
    },
    assert: function assert(value, message) {
        if (value) { return; }
        // capture the stack
        var stack;
        try { throw new Error() } catch(e) { stack = e.stack || '' };
        alert('Assertion failed' + (message ? ': ' + message : '!') + '\n' + stack);
    }
});
