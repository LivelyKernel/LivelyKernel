module('lively.LKFileParser').requires('ometa.lively').toRun(function () {
    {
        LKFileParser = objectThatDelegatesTo(Parser, {
            "isLKParser": function () {
                var $elf = this;
                return true
            },
            "halt": function () {
                var $elf = this;
                return dbgOn(true)
            },
            "log": function () {
                var $elf = this,
                    msg;
                return (function () {
                    msg = this._apply("anything");
                    return (function () {
                        console.log(msg);
                        return true
                    }).call(this)
                }).call(this)
            },
            "logPos": function () {
                var $elf = this;
                return (function () {
                    console.log(this.pos());
                    return true
                }).call(this)
            },
            "emptyLine": function () {
                var $elf = this,
                    x;
                return (function () {
                    this._many((function () {
                        return (function () {
                            x = this._apply("space");
                            return this._pred(((x != "\n") && (x != "\r")))
                        }).call(this)
                    }));
                    this._apply("nl");
                    return "\n"
                }).call(this)
            },
            "emptyLines": function () {
                var $elf = this;
                return this._many((function () {
                    return this._apply("emptyLine")
                }))
            },
            "whereAreYou": function () {
                var $elf = this;
                return (function () {
                    var charsBefore = (120);
                    var charsAfter = (120);
                    var src = this["_originalInput"]["arr"];
                    var startIndex = Math.max((0), (this.pos() - charsBefore));
                    var stopIndex = Math.min(src["length"], (this.pos() + charsAfter));
                    console.log(((src.substring(startIndex, this.pos()) + "<--I am here-->") + src.substring(this.pos(), stopIndex)));
                    console.log(("Rules: " + this["_ruleStack"]));
                    console.log(("Stack: " + this["stack"]));
                    return true
                }).call(this)
            },
            "fromTo": function () {
                var $elf = this,
                    x, y, cs;
                return (function () {
                    x = this._apply("anything");
                    y = this._apply("anything");
                    this._applyWithArgs("seq", x);
                    cs = this._many((function () {
                        return (function () {
                            this._not((function () {
                                return this._applyWithArgs("seq", y)
                            }));
                            return this._apply("char")
                        }).call(this)
                    }));
                    this._applyWithArgs("seq", y);
                    return cs
                }).call(this)
            },
            "stackSize": function () {
                var $elf = this;
                return this["stack"]["length"]
            },
            "num": function () {
                var $elf = this,
                    x;
                return (function () {
                    x = this._apply("anything");
                    return this["stack"].select((function (ea) {
                        return (ea === x)
                    }))["length"]
                }).call(this)
            },
            "getStack": function () {
                var $elf = this;
                return this["stack"].clone()
            },
            "assignStack": function () {
                var $elf = this,
                    s;
                return (function () {
                    s = this._apply("anything");
                    return (this["stack"] = s)
                }).call(this)
            },
            "startTime": function () {
                var $elf = this;
                return ({})
            },
            "stopTime": function () {
                var $elf = this,
                    t;
                return (function () {
                    t = this._apply("anything");
                    return true
                }).call(this)
            },
            "open": function () {
                var $elf = this,
                    x;
                return (function () {
                    x = this._apply("anything");
                    this._applyWithArgs("add", x);
                    return x
                }).call(this)
            },
            "close": function () {
                var $elf = this,
                    x, y;
                return (function () {
                    x = this._apply("anything");
                    y = this._apply("anything");
                    this._applyWithArgs("add", y);
                    this._applyWithArgs("remove", y);
                    this._applyWithArgs("remove", x);
                    return y
                }).call(this)
            },
            "add": function () {
                var $elf = this,
                    x;
                return (function () {
                    x = this._apply("anything");
                    this._applyWithArgs("exactly", x);
                    return this["stack"].push(x)
                }).call(this)
            },
            "remove": function () {
                var $elf = this,
                    x;
                return (function () {
                    x = this._apply("anything");
                    return (function () {
                        if ((this["stack"]["length"] == (0))) {
                            this.whereAreYou();
                            throw new Error(("Stack is empty, cannot remove " + x))
                        } else {
                            undefined
                        };
                        undefined;
                        var rem = this["stack"].pop();
                        if ((rem !== x)) {
                            this.whereAreYou();
                            throw new Error(((((((("Unmatched " + x) + "at: ") + this.pos()) + " instead found ") + rem) + "; stack: ") + this["stack"]))
                        } else {
                            undefined
                        };
                        undefined;
                        return true
                    }).call(this)
                }).call(this)
            },
            "everythingBut": function () {
                var $elf = this,
                    x, y, a;
                return (function () {
                    x = this._apply("anything");
                    y = this._apply("anything");
                    this._not((function () {
                        return this._applyWithArgs("exactly", x)
                    }));
                    this._not((function () {
                        return this._applyWithArgs("exactly", y)
                    }));
                    a = this._apply("anything");
                    return a
                }).call(this)
            },
            "nonRecursive": function () {
                var $elf = this,
                    x, y, s, a;
                return (function () {
                    x = this._apply("anything");
                    y = this._apply("anything");
                    return this._or((function () {
                        return (function () {
                            s = this._apply("getStack");
                            this._applyWithArgs("open", x);
                            a = this._many((function () {
                                return this._applyWithArgs("everythingBut", x, y)
                            }));
                            this._applyWithArgs("close", x, y);
                            return ((x + a.join("")) + y)
                        }).call(this)
                    }), (function () {
                        return (function () {
                            this._applyWithArgs("assignStack", s);
                            return this._manualFail()
                        }).call(this)
                    }))
                }).call(this)
            },
            "recursive": function () {
                var $elf = this,
                    x, y, s, a;
                return (function () {
                    x = this._apply("anything");
                    y = this._apply("anything");
                    return this._or((function () {
                        return (function () {
                            s = this._apply("getStack");
                            this._applyWithArgs("open", x);
                            a = this._many((function () {
                                return this._or((function () {
                                    return this._applyWithArgs("everythingBut", x, y)
                                }), (function () {
                                    return this._applyWithArgs("recursive", x, y)
                                }))
                            }));
                            this._applyWithArgs("close", x, y);
                            return ((x + a.join("")) + y)
                        }).call(this)
                    }), (function () {
                        return (function () {
                            this._applyWithArgs("assignStack", s);
                            return this._manualFail()
                        }).call(this)
                    }))
                }).call(this)
            },
            "chunk": function () {
                var $elf = this,
                    x, y, a;
                return (function () {
                    x = this._apply("anything");
                    y = this._apply("anything");
                    a = this._applyWithArgs("basicChunk", x, y);
                    return a
                }).call(this)
            },
            "somethingRelated": function () {
                var $elf = this;
                return (function () {
                    this._not((function () {
                        return this._apply("end")
                    }));
                    return this._many((function () {
                        return (function () {
                            this._not((function () {
                                return this._applyWithArgs("exactly", "\n")
                            }));
                            this._not((function () {
                                return this._applyWithArgs("exactly", "\r")
                            }));
                            this._not((function () {
                                return this._applyWithArgs("exactly", ";")
                            }));
                            return this._apply("anything")
                        }).call(this)
                    }))
                }).call(this)
            },
            "somethingBigRelated": function () {
                var $elf = this;
                return (function () {
                    this._not((function () {
                        return this._apply("end")
                    }));
                    return this._many((function () {
                        return this._or((function () {
                            return this._applyWithArgs("chunk", "(", ")")
                        }), (function () {
                            return this._applyWithArgs("chunk", "{", "}")
                        }), (function () {
                            return this._applyWithArgs("chunk", "[", "]")
                        }), (function () {
                            return this._applyWithArgs("chunk", "\'", "\'")
                        }), (function () {
                            return this._applyWithArgs("chunk", "\"", "\"")
                        }), (function () {
                            return (function () {
                                this._apply("spaces");
                                this._applyWithArgs("exactly", "+");
                                return this._apply("spaces")
                            }).call(this)
                        }), (function () {
                            return (function () {
                                this._not((function () {
                                    return this._applyWithArgs("exactly", ",")
                                }));
                                this._not((function () {
                                    return this._applyWithArgs("exactly", ";")
                                }));
                                this._not((function () {
                                    return this._applyWithArgs("exactly", "(")
                                }));
                                this._not((function () {
                                    return this._applyWithArgs("exactly", "{")
                                }));
                                this._not((function () {
                                    return this._applyWithArgs("exactly", "[")
                                }));
                                this._not((function () {
                                    return this._applyWithArgs("exactly", "\'")
                                }));
                                this._not((function () {
                                    return this._applyWithArgs("exactly", "\"")
                                }));
                                this._not((function () {
                                    return this._apply("nl")
                                }));
                                return this._apply("anything")
                            }).call(this)
                        }))
                    }))
                }).call(this)
            },
            "defEnd": function () {
                var $elf = this;
                return this._or((function () {
                    return (function () {
                        switch (this._apply('anything')) {
                        case ";":
                            return this._or((function () {
                                return (function () {
                                    switch (this._apply('anything')) {
                                    case "\n":
                                        return "\n";
                                    default:
                                        throw fail
                                    }
                                }).call(this)
                            }), (function () {
                                return this._apply("spaces")
                            }));
                        default:
                            throw fail
                        }
                    }).call(this)
                }), (function () {
                    return this._applyWithArgs("token", "")
                }))
            },
            "classElemDefEnd": function () {
                var $elf = this;
                return this._or((function () {
                    return this._applyWithArgs("token", ",")
                }), (function () {
                    return this._applyWithArgs("token", "")
                }))
            },
            "space": function () {
                var $elf = this;
                return this._or((function () {
                    return Parser._superApplyWithArgs(this, "space")
                }), (function () {
                    return this._applyWithArgs("fromTo", "//", "\n")
                }), (function () {
                    return this._applyWithArgs("fromTo", "/*", "*/")
                }))
            },
            "nl": function () {
                var $elf = this;
                return (function () {
                    switch (this._apply('anything')) {
                    case "\n":
                        return "\n";
                    case "\r":
                        return "\n";
                    default:
                        throw fail
                    }
                }).call(this)
            },
            "spacesNoNl": function () {
                var $elf = this,
                    spcs;
                return (function () {
                    spcs = this._many((function () {
                        return (function () {
                            this._not((function () {
                                return this._apply("nl")
                            }));
                            return this._apply("space")
                        }).call(this)
                    }));
                    return spcs
                }).call(this)
            },
            "nameFirst": function () {
                var $elf = this;
                return this._or((function () {
                    return this._apply("letter")
                }), (function () {
                    return (function () {
                        switch (this._apply('anything')) {
                        case "$":
                            return "$";
                        case "_":
                            return "_";
                        default:
                            throw fail
                        }
                    }).call(this)
                }))
            },
            "nameRest": function () {
                var $elf = this;
                return this._or((function () {
                    return this._apply("nameFirst")
                }), (function () {
                    return this._apply("digit")
                }))
            },
            "iName": function () {
                var $elf = this,
                    r;
                return (function () {
                    r = this._applyWithArgs("firstAndRest", "nameFirst", "nameRest");
                    return r.join("")
                }).call(this)
            },
            "isKeyword": function () {
                var $elf = this,
                    x;
                return (function () {
                    x = this._apply("anything");
                    return this._pred(BSJSParser._isKeyword(x))
                }).call(this)
            },
            "name": function () {
                var $elf = this,
                    n;
                return (function () {
                    n = this._apply("iName");
                    return n
                }).call(this)
            },
            "keyword": function () {
                var $elf = this,
                    k;
                return (function () {
                    k = this._apply("iName");
                    this._applyWithArgs("isKeyword", k);
                    return k
                }).call(this)
            },
            "namespaceIdSplitted": function () {
                var $elf = this,
                    n, r, n;
                return this._or((function () {
                    return (function () {
                        n = this._apply("name");
                        this._applyWithArgs("exactly", ".");
                        r = this._apply("namespaceIdSplitted");
                        return [n].concat(r)
                    }).call(this)
                }), (function () {
                    return (function () {
                        n = this._apply("name");
                        return [n]
                    }).call(this)
                }))
            },
            "namespaceId": function () {
                var $elf = this,
                    nArr;
                return (function () {
                    nArr = this._apply("namespaceIdSplitted");
                    return nArr.join(".")
                }).call(this)
            },
            "nsFollowedBy": function () {
                var $elf = this,
                    x, nArr;
                return (function () {
                    x = this._apply("anything");
                    nArr = this._apply("namespaceIdSplitted");
                    this._pred((nArr.last() === x));
                    return nArr.slice((0), (nArr["length"] - (1))).join(".")
                }).call(this)
            },
            "nsWith": function () {
                var $elf = this,
                    x, nArr;
                return (function () {
                    x = this._apply("anything");
                    nArr = this._apply("namespaceIdSplitted");
                    this._pred(nArr.include(x));
                    return (function () {
                        var i = nArr.indexOf(x);
                        return ({
                            "before": nArr.slice((0), i).join("."),
                            "after": nArr.slice((i + (1)), nArr["length"]).join(".")
                        })
                    }).call(this)
                }).call(this)
            },
            "basicFunction": function () {
                var $elf = this,
                    n;
                return (function () {
                    this._applyWithArgs("token", "function");
                    this._apply("spaces");
                    this._or((function () {
                        return n = this._apply("name")
                    }), (function () {
                        return this._apply("empty")
                    }));
                    this._applyWithArgs("chunk", "(", ")");
                    this._apply("spaces");
                    this._applyWithArgs("chunk", "{", "}");
                    return n
                }).call(this)
            },
            "func": function () {
                var $elf = this,
                    fn, fn;
                return this._or((function () {
                    return fn = this._apply("basicFunction")
                }), (function () {
                    return (function () {
                        this._applyWithArgs("token", "var");
                        this._many1((function () {
                            return this._apply("space")
                        }));
                        fn = this._apply("name");
                        this._apply("spaces");
                        this._applyWithArgs("exactly", "=");
                        this._apply("spaces");
                        this._apply("basicFunction");
                        return fn
                    }).call(this)
                }))
            },
            "functionDef": function () {
                var $elf = this,
                    p, fn, fn;
                return (function () {
                    p = this._apply("pos");
                    this._or((function () {
                        return fn = this._apply("func")
                    }), (function () {
                        return (function () {
                            switch (this._apply('anything')) {
                            case "(":
                                return (function () {
                                    fn = this._apply("func");
                                    return this._applyWithArgs("exactly", ")")
                                }).call(this);
                            default:
                                throw fail
                            }
                        }).call(this)
                    }));
                    this._apply("somethingRelated");
                    this._apply("defEnd");
                    return this._fragment(fn, "functionDef", p, (this.pos() - (1)))
                }).call(this)
            },
            "staticProperty": function () {
                var $elf = this,
                    p, nsArr;
                return (function () {
                    p = this._apply("pos");
                    this._apply("spacesNoNl");
                    nsArr = this._apply("namespaceIdSplitted");
                    this._pred((nsArr["length"] > (1)));
                    this._apply("spaces");
                    this._applyWithArgs("exactly", "=");
                    this._apply("somethingBigRelated");
                    this._apply("defEnd");
                    return this._fragment(nsArr.last(), "staticProperty", p, (this.pos() - (1)), null, ({
                        "className": nsArr.slice((0), (nsArr["length"] - (1))).join("."),
                        "_isStatic": true
                    }))
                }).call(this)
            },
            "methodModificationDef": function () {
                var $elf = this,
                    p, spec;
                return (function () {
                    p = this._apply("pos");
                    this._apply("spacesNoNl");
                    spec = this._applyWithArgs("nsWith", "prototype");
                    this._apply("spaces");
                    this._applyWithArgs("exactly", "=");
                    this._apply("spaces");
                    this._apply("somethingBigRelated");
                    this._apply("defEnd");
                    return this._fragment(spec["after"], "methodModificationDef", p, (this.pos() - (1)), null, ({
                        "className": spec["before"],
                        "_isStatic": false
                    }))
                }).call(this)
            },
            "protoDef": function () {
                var $elf = this,
                    p, pName, pEnd;
                return (function () {
                    p = this._apply("pos");
                    this._apply("spacesNoNl");
                    pName = this._or((function () {
                        return this._apply("name")
                    }), (function () {
                        return this._apply("nameString")
                    }));
                    this._apply("spaces");
                    this._applyWithArgs("exactly", ":");
                    this._apply("spaces");
                    this._or((function () {
                        return (function () {
                            this._apply("basicFunction");
                            return this._or((function () {
                                return this._apply("somethingBigRelated")
                            }), (function () {
                                return this._apply("empty")
                            }))
                        }).call(this)
                    }), (function () {
                        return this._apply("somethingBigRelated")
                    }));
                    pEnd = this._apply("pos") - 1;
                    this._apply("classElemDefEnd");
                    return this._fragment(pName, "protoDef", p, pEnd, null, ({
                        "_isStatic": false
                    }))
                }).call(this)
            },
            "getterOrSetter": function () {
                var $elf = this,
                    p, pName, pEnd;
                return (function () {
                    p = this._apply("pos");
                    this._apply("spacesNoNl");
                    this._or((function () {
                        return this._applyWithArgs("token", "get")
                    }), (function () {
                        return this._applyWithArgs("token", "set")
                    }));
                    this._apply("spaces");
                    pName = this._apply("name");
                    this._applyWithArgs("chunk", "(", ")");
                    this._apply("spaces");
                    this._applyWithArgs("chunk", "{", "}");
                    pEnd = this._apply("pos") - 1;
                    this._apply("classElemDefEnd");
                    return this._fragment(pName, "protoDef", p, pEnd, null, ({
                        "_isStatic": false
                    }))
                }).call(this)
            },
            "propertyDef": function () {
                var $elf = this,
                    spec;
                return (function () {
                    spec = this._or((function () {
                        return this._apply("protoDef")
                    }), (function () {
                        return this._apply("methodModificationDef")
                    }), (function () {
                        return this._apply("staticProperty")
                    }), (function () {
                        return this._apply("getterOrSetter")
                    }));
                    return (function () {
                        (spec["type"] = "propertyDef");
                        return spec
                    }).call(this)
                }).call(this)
            },
            "classElems": function () {
                var $elf = this,
                    defs, allDefs;
                return (function () {
                    allDefs = this._many1((function () {
                        return (function () {
                            defs = this._apply("categoryDef");
                            this._apply("classElemDefEnd");
                            return defs
                        }).call(this)
                    }));
                    return allDefs.invoke("subElements").flatten()
                }).call(this)
            },
            "categoryDef": function () {
                var $elf = this,
                    p, catName, defs, allDefs;
                return (function () {
                    this._apply("spaces");
                    p = this._apply("pos");
                    catName = this._apply("category");
                    allDefs = this._many1((function () {
                        return (function () {
                            defs = this._apply("classElemsInCategory");
                            this._apply("classElemDefEnd");
                            return defs
                        }).call(this)
                    }));
                    return (function () {
                        var classElemDefs = allDefs.flatten();
                        var catDef = this._fragment(catName, "categoryDef", p, (this.pos() - (1)), classElemDefs);
                        classElemDefs.collect((function (def) {
                            (def["category"] = catDef);
                            return def
                        }));
                        return catDef
                    }).call(this)
                }).call(this)
            },
            "category": function () {
                var $elf = this,
                    name;
                return this._or((function () {
                    return (function () {
                        name = this._apply("categoryName");
                        this._apply("spaces");
                        this._applyWithArgs("exactly", ",");
                        return name
                    }).call(this)
                }), (function () {
                    return (function () {
                        this._apply("empty");
                        return 'default category'
                    }).call(this)
                }))
            },
            "categoryName": function () {
                var $elf = this,
                    name;
                return (function () {
                    name = this._or((function () {
                        return this._applyWithArgs("fromTo", "\'", "\'")
                    }), (function () {
                        return this._applyWithArgs("fromTo", "\"", "\"")
                    }));
                    return name.join("")
                }).call(this)
            },
            "classElemsInCategory": function () {
                var $elf = this,
                    pD, defs;
                return (function () {
                    this._apply("spaces");
                    this._applyWithArgs("exactly", "{");
                    defs = this._many((function () {
                        return (function () {
                            this._apply("emptyLines");
                            pD = this._apply("propertyDef");
                            this._apply("emptyLines");
                            return pD
                        }).call(this)
                    }));
                    this._apply("spaces");
                    this._applyWithArgs("exactly", "}");
                    return defs
                }).call(this)
            },
            "restKlassDef": function () {
                var $elf = this,
                    descriptors, traits, descriptors, traits;
                return this._or((function () {
                    return (function () {
                        switch (this._apply('anything')) {
                        case ",":
                            return (function () {
                                this._apply("spaces");
                                descriptors = this._apply("classElems");
                                return ({
                                    "classElems": descriptors
                                })
                            }).call(this);
                        default:
                            throw fail
                        }
                    }).call(this)
                }), (function () {
                    return (function () {
                        traits = this._many1((function () {
                            return (function () {
                                this._applyWithArgs("exactly", ",");
                                this._apply("spaces");
                                return this._or((function () {
                                    return this._apply("realTraitReference")
                                }), (function () {
                                    return this._apply("klass")
                                }))
                            }).call(this)
                        }));
                        this._applyWithArgs("exactly", ",");
                        this._apply("spaces");
                        descriptors = this._apply("classElems");
                        return ({
                            "traits": traits,
                            "classElems": descriptors
                        })
                    }).call(this)
                }), (function () {
                    return (function () {
                        traits = this._many1((function () {
                            return (function () {
                                this._applyWithArgs("exactly", ",");
                                this._apply("spaces");
                                return this._or((function () {
                                    return this._apply("realTraitReference")
                                }), (function () {
                                    return this._apply("klass")
                                }))
                            }).call(this)
                        }));
                        return ({
                            "traits": traits,
                            "classElems": []
                        })
                    }).call(this)
                }), (function () {
                    return (function () {
                        switch (this._apply('anything')) {
                        case ",":
                            return (function () {
                                this._applyWithArgs("token", "{");
                                this._apply("spaces");
                                this._applyWithArgs("token", "}");
                                return ({
                                    "classElems": []
                                })
                            }).call(this);
                        default:
                            throw fail
                        }
                    }).call(this)
                }), (function () {
                    return (function () {
                        this._apply("spaces");
                        return ({
                            "classElems": []
                        })
                    }).call(this)
                }))
            },
            "klass": function () {
                var $elf = this;
                return this._apply("namespaceId")
            },
            "nameString": function () {
                var $elf = this,
                    n;
                return (function () {
                    this._apply("spaces");
                    (function () {
                        switch (this._apply('anything')) {
                        case "\'":
                            return "\'";
                        case "\"":
                            return "\"";
                        default:
                            throw fail
                        }
                    }).call(this);
                    n = this._apply("klass");
                    (function () {
                        switch (this._apply('anything')) {
                        case "\'":
                            return "\'";
                        case "\"":
                            return "\"";
                        default:
                            throw fail
                        }
                    }).call(this);
                    this._apply("spaces");
                    return n
                }).call(this)
            },
            "klassDef": function () {
                var $elf = this,
                    p, sName, kName, spec;
                return (function () {
                    p = this._apply("pos");
                    sName = this._applyWithArgs("nsFollowedBy", "subclass");
                    this._applyWithArgs("exactly", "(");
                    kName = this._apply("nameString");
                    spec = this._apply("restKlassDef");
                    this._applyWithArgs("exactly", ")");
                    this._apply("defEnd");
                    return (function () {
                        var categories = [];
                        spec["classElems"].forEach((function (ea) {
                            (ea["className"] = kName);
                            if (ea["category"]) {
                                categories.push(ea["category"])
                            } else {
                                undefined
                            }
                        }));
                        (categories = categories.uniq());
                        return this._fragment(kName, "klassDef", p, (this.pos() - (1)), spec["classElems"], ({
                            "traits": spec["traits"],
                            "superclassName": sName,
                            "categories": categories
                        }))
                    }).call(this)
                }).call(this)
            },
            "basicKlassExt": function () {
                var $elf = this,
                    n, spec, n, n, clElems, layerName, n, spec, layerName, n, spec;
                return this._or((function () {
                    return (function () {
                        this._applyWithArgs("token", "Object.extend");
                        this._applyWithArgs("exactly", "(");
                        n = this._apply("klass");
                        spec = this._apply("restKlassDef");
                        this._applyWithArgs("token", ")");
                        return (function () {
                            spec["classElems"].forEach((function (ea) {
                                (ea["className"] = n);
                                (ea["_isStatic"] = true)
                            }));
                            return ({
                                "name": n,
                                "traits": spec["traits"],
                                "subElements": spec["classElems"]
                            })
                        }).call(this)
                    }).call(this)
                }), (function () {
                    return (function () {
                        this._or((function () {
                            return n = this._applyWithArgs("nsFollowedBy", "addMethods")
                        }), (function () {
                            return n = this._applyWithArgs("nsFollowedBy", "addProperties")
                        }));
                        this._applyWithArgs("exactly", "(");
                        clElems = this._apply("classElems");
                        this._apply("spaces");
                        this._applyWithArgs("exactly", ")");
                        return (function () {
                            clElems.forEach((function (ea) {
                                (ea["className"] = n);
                                (ea["_isStatic"] = false)
                            }));
                            return ({
                                "name": n,
                                "subElements": clElems
                            })
                        }).call(this)
                    }).call(this)
                }), (function () {
                    return (function () {
                        this._applyWithArgs("token", "layerClass");
                        this._applyWithArgs("exactly", "(");
                        layerName = this._apply("namespaceId");
                        this._apply("spaces");
                        this._applyWithArgs("exactly", ",");
                        this._apply("spaces");
                        n = this._apply("klass");
                        spec = this._apply("restKlassDef");
                        this._applyWithArgs("token", ")");
                        return (function () {
                            spec["classElems"].forEach((function (ea) {
                                (ea["layerName"] = layerName);
                                (ea["className"] = n);
                                (ea["_isStatic"] = false)
                            }));
                            return ({
                                "name": n,
                                "layerName": layerName,
                                "subElements": spec["classElems"]
                            })
                        }).call(this)
                    }).call(this)
                }), (function () {
                    return (function () {
                        this._applyWithArgs("token", "layerObject");
                        this._applyWithArgs("exactly", "(");
                        layerName = this._apply("namespaceId");
                        this._apply("spaces");
                        this._applyWithArgs("exactly", ",");
                        this._apply("spaces");
                        n = this._apply("klass");
                        spec = this._apply("restKlassDef");
                        this._applyWithArgs("token", ")");
                        return (function () {
                            spec["classElems"].forEach((function (ea) {
                                (ea["layerName"] = layerName);
                                (ea["className"] = n);
                                (ea["_isStatic"] = true)
                            }));
                            return ({
                                "name": n,
                                "layerName": layerName,
                                "subElements": spec["classElems"]
                            })
                        }).call(this)
                    }).call(this)
                }))
            },
            "klassExtensionDef": function () {
                var $elf = this,
                    p, spec;
                return (function () {
                    p = this._apply("pos");
                    spec = this._apply("basicKlassExt");
                    this._apply("defEnd");
                    return (function () {
                        var categories = [];
                        spec["subElements"].forEach((function (ea) {
                            (ea["className"] = spec["name"]);
                            if (ea["category"]) {
                                categories.push(ea["category"])
                            } else {
                                undefined
                            }
                        }));
                        (categories = categories.uniq());
                        return this._fragment(spec["name"], "klassExtensionDef", p, (this.pos() - (1)), spec["subElements"], ({
                            "traits": spec["traits"],
                            "categories": categories
                        }))
                    }).call(this)
                }).call(this)
            },
            "restObjDef": function () {
                var $elf = this,
                    propsAndMethodDescrs;
                return (function () {
                    propsAndMethodDescrs = this._apply("classElems");
                    this._apply("spaces");
                    return (function () {
                        propsAndMethodDescrs.forEach((function (ea) {
                            (ea["_isStatic"] = true)
                        }));
                        return propsAndMethodDescrs
                    }).call(this)
                }).call(this)
            },
            "objectDef": function () {
                var $elf = this,
                    p, o, o, propsAndMethodDescrs;
                return (function () {
                    p = this._apply("pos");
                    this._or((function () {
                        return (function () {
                            this._applyWithArgs("token", "var");
                            this._apply("spaces");
                            return o = this._apply("namespaceId")
                        }).call(this)
                    }), (function () {
                        return o = this._apply("namespaceId")
                    }));
                    this._apply("spaces");
                    this._applyWithArgs("exactly", "=");
                    this._apply("spaces");
                    propsAndMethodDescrs = this._apply("restObjDef");
                    this._apply("defEnd");
                    return this._fragment(o, "objectDef", p, (this.pos() - (1)), propsAndMethodDescrs)
                }).call(this)
            },
            "ometaParameter": function () {
                var $elf = this,
                    n;
                return (function () {
                    this._applyWithArgs("exactly", ":");
                    n = this._apply("name");
                    this._apply("spaces");
                    return n
                }).call(this)
            },
            "ometaParameters": function () {
                var $elf = this;
                return this._many((function () {
                    return this._apply("ometaParameter")
                }))
            },
            "ometaRuleDef": function () {
                var $elf = this,
                    p, n, a, body;
                return (function () {
                    p = this._apply("pos");
                    n = this._apply("name");
                    this._apply("spaces");
                    a = this._apply("ometaParameters");
                    this._or((function () {
                        return (function () {
                            switch (this._apply('anything')) {
                            case "=":
                                return "=";
                            default:
                                throw fail
                            }
                        }).call(this)
                    }), (function () {
                        return this._applyWithArgs("token", "->")
                    }));
                    body = this._many((function () {
                        return (function () {
                            this._not((function () {
                                return this._applyWithArgs("exactly", ",")
                            }));
                            return this._or((function () {
                                return this._applyWithArgs("chunk", "(", ")")
                            }), (function () {
                                return this._applyWithArgs("chunk", "{", "}")
                            }), (function () {
                                return this._applyWithArgs("chunk", "\'", "\'")
                            }), (function () {
                                return this._applyWithArgs("chunk", "\"", "\"")
                            }), (function () {
                                return this._applyWithArgs("chunk", "[", "]")
                            }), (function () {
                                return (function () {
                                    this._not((function () {
                                        return this._applyWithArgs("exactly", "}")
                                    }));
                                    return this._apply("anything")
                                }).call(this)
                            }))
                        }).call(this)
                    }));
                    this._or((function () {
                        return (function () {
                            switch (this._apply('anything')) {
                            case ",":
                                return ",";
                            default:
                                throw fail
                            }
                        }).call(this)
                    }), (function () {
                        return this._apply("empty")
                    }));
                    return this._fragment(n, "ometaRuleDef", p, (this.pos() - (1)), [], ({
                        "parameters": a
                    }))
                }).call(this)
            },
            "ometaInherit": function () {
                var $elf = this,
                    sn;
                return this._or((function () {
                    return (function () {
                        this._applyWithArgs("token", "<:");
                        this._apply("spaces");
                        sn = this._apply("name");
                        return sn
                    }).call(this)
                }), (function () {
                    return (function () {
                        this._apply("empty");
                        return null
                    }).call(this)
                }))
            },
            "ometaDef": function () {
                var $elf = this,
                    p, n, sn, d, defs;
                return (function () {
                    p = this._apply("pos");
                    this._applyWithArgs("token", "ometa");
                    this._apply("spaces");
                    n = this._apply("name");
                    this._apply("space");
                    sn = this._apply("ometaInherit");
                    this._apply("spaces");
                    this._applyWithArgs("exactly", "{");
                    this._apply("spaces");
                    defs = this._many((function () {
                        return (function () {
                            d = this._apply("ometaRuleDef");
                            this._apply("spaces");
                            return d
                        }).call(this)
                    }));
                    this._apply("spaces");
                    this._applyWithArgs("exactly", "}");
                    this._apply("defEnd");
                    this._apply("spaces");
                    return this._fragment(n, "ometaDef", p, (this.pos() - (1)), defs, ({
                        "superclassName": sn
                    }))
                }).call(this)
            },
            "comment": function () {
                var $elf = this,
                    p;
                return (function () {
                    p = this._apply("pos");
                    this._many1((function () {
                        return this._apply("space")
                    }));
                    return this._fragment(null, "comment", p, (this.pos() - (1)))
                }).call(this)
            },
            "blankLine": function () {
                var $elf = this,
                    p, c;
                return (function () {
                    p = this._apply("pos");
                    this._or((function () {
                        return this._apply("nl")
                    }), (function () {
                        return (function () {
                            this._many((function () {
                                return (function () {
                                    c = this._apply("char");
                                    return this._pred((c.charCodeAt((0)) === (32)))
                                }).call(this)
                            }));
                            return this._apply("nl")
                        }).call(this)
                    }));
                    return this._fragment(null, "blankLine", p, (this.pos() - (1)))
                }).call(this)
            },
            "copDef": function () {
                var $elf = this,
                    p, n, subs;
                return (function () {
                    p = this._apply("pos");
                    this._applyWithArgs("token", "cop.create(");
                    n = this._apply("nameString");
                    this._applyWithArgs("token", ")");
                    this._apply("spacesNoNl");
                    this._many((function () {
                        return this._apply("nl")
                    }));
                    subs = this._many((function () {
                        return this._apply("copSubElement")
                    }));
                    this._apply("spaces");
                    this._apply("defEnd");
                    return this._fragment(n, "copDef", p, (this.pos() - (1)), subs)
                }).call(this)
            },
            "copSubElement": function () {
                var $elf = this,
                    p, blob, spec;
                return (function () {
                    p = this._apply("pos");
                    this._apply("spaces");
                    this._applyWithArgs("exactly", ".");
                    spec = this._or((function () {
                        return this._apply("copRefinement")
                    }), (function () {
                        return (function () {
                            blob = this._apply("somethingBigRelated");
                            return ({
                                "name": blob.flatten().join("").replace("\n", ""),
                                "subElementSpec": ({})
                            })
                        }).call(this)
                    }));
                    return this._fragment(spec["name"], "copSubElement", p, (this.pos() - (1)), spec["subElementSpec"]["classElems"], ({
                        "traits": spec["subElementSpec"]["traits"],
                        "refineSelector": spec["refineSelector"]
                    }))
                }).call(this)
            },
            "copRefinement": function () {
                var $elf = this,
                    sel, n, spec;
                return (function () {
                    sel = this._or((function () {
                        return this._applyWithArgs("token", "refineClass")
                    }), (function () {
                        return this._applyWithArgs("token", "refineObject")
                    }));
                    this._applyWithArgs("exactly", "(");
                    n = this._apply("klass");
                    spec = this._apply("restKlassDef");
                    this._applyWithArgs("exactly", ")");
                    return ({
                        "name": n,
                        "refineSelector": sel,
                        "subElementSpec": spec
                    })
                }).call(this)
            },
            "traitDef": function () {
                var $elf = this,
                    p, n, spec, subs;
                return (function () {
                    p = this._apply("pos");
                    this._applyWithArgs("token", "Trait(");
                    n = this._apply("nameString");
                    spec = this._apply("restKlassDef");
                    this._applyWithArgs("token", ")");
                    this._apply("spacesNoNl");
                    this._many((function () {
                        return this._apply("nl")
                    }));
                    subs = this._many((function () {
                        return this._apply("traitSubElement")
                    }));
                    this._apply("spaces");
                    this._apply("defEnd");
                    return this._fragment(n, "traitDef", p, (this.pos() - (1)), spec["classElems"].concat(subs))
                }).call(this)
            },
            "realTraitReference": function () {
                var $elf = this,
                    n;
                return (function () {
                    this._applyWithArgs("token", "Trait(");
                    n = this._apply("nameString");
                    this._applyWithArgs("token", ")");
                    this._or((function () {
                        return (function () {
                            switch (this._apply('anything')) {
                            case ".":
                                return this._apply("somethingBigRelated");
                            default:
                                throw fail
                            }
                        }).call(this)
                    }), (function () {
                        return this._apply("empty")
                    }));
                    return n
                }).call(this)
            },
            "traitSubElement": function () {
                var $elf = this,
                    p, spec;
                return (function () {
                    p = this._apply("pos");
                    this._apply("spaces");
                    this._applyWithArgs("exactly", ".");
                    spec = this._apply("traitApplication");
                    return this._fragment(spec["name"], "traitSubElement", p, (this.pos() - (1)), spec["subElementSpec"]["classElems"])
                }).call(this)
            },
            "traitApplication": function () {
                var $elf = this,
                    n, spec;
                return (function () {
                    this._applyWithArgs("token", "applyTo");
                    this._applyWithArgs("exactly", "(");
                    n = this._apply("klass");
                    spec = this._apply("restKlassDef");
                    this._applyWithArgs("exactly", ")");
                    return ({
                        "name": (" -> " + n),
                        "subElementSpec": spec
                    })
                }).call(this)
            },
            "unknown": function () {
                var $elf = this,
                    _fromIdx = this.input.idx,
                    p;
                return (function () {
                    p = this._apply("pos");
                    this._apply("somethingBigRelated");
                    this._apply("defEnd");
                    return this._fragment(null, "unknown", p, (this.pos() - (1)))
                }).call(this)
            },
            "quote": function () {
                var $elf = this,
                    _fromIdx = this.input.idx,
                    x;
                return (function () {
                    x = this._apply("char");
                    this._pred(((x === "\'") || (x === "\"")));
                    return x
                }).call(this)
            },
            "buildspecDef": function () {
                var $elf = this,
                    _fromIdx = this.input.idx,
                    p, n;
                return (function () {
                    p = this._apply("pos");
                    this._applyWithArgs("token", "lively.BuildSpec");
                    this._applyWithArgs("exactly", "(");
                    n = this._apply("nameString");
                    this._applyWithArgs("token", ",");
                    this._apply("spaces");
                    this._applyWithArgs("chunk", "{", "}");
                    this._applyWithArgs("exactly", ")");
                    this._apply("spaces");
                    this._apply("defEnd");
                    return this._fragment(n, "buildspecDef", p, (this.pos() - (1)), [])
                }).call(this)
            }
        });
        (LKFileParser["stack"] = []);
        (LKFileParser["_manualFail"] = (function () {
            throw Global["fail"]
        }));
        (LKFileParser["_fragment"] = (function (name, type, startIndex, stopIndex, subElems, custom) {
            var klass = lively["ide"]["FileFragment"];
            var ff = new klass(name, type, startIndex, stopIndex, null, subElems);
            if (custom) {
                Object.extend(ff, custom)
            } else {
                undefined
            };
            return ff
        }));
        LKFileParser
    }
});
