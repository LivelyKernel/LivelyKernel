/*
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

module('lively.persistence.Debugging').requires().toRun(function() {

Object.extend(lively.persistence.Debugging, {

  jsonOfWorld: function(url) {
    var html = new URL(url).asWebResource().forceUncached().get().content,
        scriptTag = html.match(/<script type="text\/x-lively-world[^>]+>/);
    if (!scriptTag)
      throw new Error("Cannot find lively world data in " + url);
    var json = html.slice(html.indexOf(scriptTag[0])+scriptTag[0].length, html.lastIndexOf("</script>"));
    return JSON.parse(json);
  },

  writeJsonOfWorld: function(url, newJSON) {
    var preview = "",
        title = "...",
        bootstrapFile = new URL(module("lively.bootstrap").uri()).relativePathFrom(new URL(url)),
        css = [],
        metaTags = [],
        linkTags = [],
        docSpec = {
            title: title,
            metaTags: metaTags,
            linkTags: linkTags,
            migrationLevel: LivelyMigrationSupport.migrationLevel,
            serializedWorld: typeof newJSON === "string" ? newJSON : JSON.stringify(newJSON),
            html: preview,
            styleSheets: css,
            externalScripts: [bootstrapFile]
        },
        doc = lively.persistence.HTMLDocBuilder.documentForWorldSerializationAsString(docSpec);
    return new URL(url).asWebResource().put(doc);
  },

  svgGrawGraph: function(graphMap, snapshot, options) {
    options = lively.lang.obj.merge({
      asWindow: true,
      inverse: true,
      graphSettings: [],
      labelWithReferencePaths: true,

      convertToMorphs: false,
      scrollSelectionIntoView: false
    }, options);

    if (!module("apps.Graphviz").isLoaded()) module("apps.Graphviz").load(true);

    var lines = options.labelWithReferencePaths ?
      createDotLinesForEachRefPath(graphMap, snapshot) :
      createDotLinesSimple(graphMap, snapshot);

    return drawGraph(lines);

    // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

    function createDotLinesSimple(graphMap, snapshot) {
      return lively.lang.arr.flatmap(Object.keys(graphMap), function(id) {
        return lively.lang.arr.flatmap(graphMap[id] || [], function(id2) {
          var lines = [];
          var from = options.inverse ? id2 : id;
          var to = options.inverse ? id : id2;
          lines.push(lively.lang.string.format("%s -> %s", graphName(from, snapshot), graphName(to, snapshot)));
          return lines;
        });
      }).uniq().concat((options.idsToHighlight || []).map(function(id) { return graphName(id, snapshot) + " [style=filled, fillcolor=orange]"; }));
    }

    function createDotLinesForEachRefPath(graphMap, snapshot) {
      var serializer = lively.persistence.Serializer.createObjectGraphLinearizer();
      var refGraph = serializer.referenceGraphWithPaths(snapshot.registry || snapshot);

      return lively.lang.arr.flatmap(Object.keys(graphMap), function(id) {
        return lively.lang.arr.flatmap(graphMap[id] || [], function(id2) {
          var lines = [];
          var from = options.inverse ? id2 : id;
          var to = options.inverse ? id : id2;
          var paths = refGraph[from][to] || [];
          paths.forEach(function(path) {
            lines.push(lively.lang.string.format("%s -> %s [label=%s]",
              graphName(from, snapshot), graphName(to, snapshot),
              labelName(from, to, path)));
          })
          return lines;
        });
      }).uniq().concat((options.idsToHighlight || []).map(function(id) { return graphName(id, snapshot) + " [style=filled, fillcolor=orange]"; }));
    }

    function drawGraph(dotLines) {
      // options = lively.lang.obj.merge(options, {createNodesAndEdges: function() { return dotLines; }});
      // return apps.Graphviz.Renderer.render(options).openInWorld().comeForward();

      var source = "digraph G {\n" + dotLines.join("\n") + "\n}"
      return apps.Graphviz.Simple.renderDotToDisplay(source, options)
        .then(function(display) {
          display.setExtent(pt(500, 400));
          display.zoomOutToSeeEverything();
          var slider = new lively.morphic.Slider(lively.rect(0, 0, 300, 30));
          var win = display.openInWindow().comeForward();
          win.addMorph(slider);
          slider.align(slider.bounds().bottomLeft(), display.bounds().bottomLeft().addXY(5, -5));
          slider.name = 'the-slider';
          lively.bindings.connect(display, 'svgScaleChanged', slider, 'setValue');
          slider.setValue(display.getSVGScale());
          lively.bindings.connect(slider, 'value', display, 'doZoomBy', {
              updater: function($upd, newV, oldV) {
                  var clip = this.targetObj.get('clip');
                  var zoomPos = clip.worldPoint(clip.getScrollBounds().center());
                  $upd(1 + (newV - oldV), zoomPos);
                  this.sourceObj.value = this.targetObj.getSVGScale();
                  this.sourceObj.adjustSliderParts();
              }
          });
          slider.applyStyle({moveVertical: true, moveHorizontal: false});

          return win;
      })
      .then(function(graphWindow) {
        graphWindow.setTitle(options.title || "serialization graph");
        var display = graphWindow.targetMorph;
        display.addScript(function morphMenuItemsFor(selectedElement) {
          show(selectedElement.name);
          return [];
        });

      })
      .catch(function(err) { return $world.logError(err); })
    }

    function graphName(id, snapshot) {
      var obj = snapshot.registry[id],
          name = "obj";
      if (!obj) name = "deleted-object";
      else if (obj[ClassPlugin.prototype.classNameProperty])
        name = obj[ClassPlugin.prototype.classNameProperty]
      return lively.lang.string.format('"%s:%s"', id, name);
    }

    function labelName(fromId, toId, path) {
      return '"' + path.reduce(function(pathString, part) {
        return pathString + (typeof part === "number" ? "[" + part + "]" : "." + part);
      }, "") + '"';
    }

  },

  svgGraphForSerializedObjectGraph: function(snapshot, options) {
    options = lively.lang.obj.merge({inverse: true}, options);
    var serializer = lively.persistence.Serializer.createObjectGraphLinearizer()
    serializer.registry = serializer.createRealRegistry(snapshot.registry);
    var graph = serializer.invertedReferenceGraph(snapshot.registry);
    var graphMethod = options.inverse ? "invertedReferenceGraph" : "referenceGraph";
    var graph = serializer[graphMethod](snapshot.registry);
    return this.svgGrawGraph(graph, snapshot, options);
  },

  svgGraphForWorld: function(url, options) {
    // lively.persistence.Debugging.svgGraphForWorld(URL.root)
    return this.svgGraphForSerializedObjectGraph(this.jsonOfWorld(url), options);
  },

  svgGraphForPart: function(partName, partCategory, options) {
    var url = lively.PartsBin.getPartItem(partName, partCategory).getFileURL();
    var json = url.asWebResource().get().content;
    var jso = JSON.parse(json);
    return this.svgGraphForSerializedObjectGraph(jso, options);
  },

  svgGraphForObject: function(obj, options) {
    options = lively.lang.obj.merge({withoutWorld: true}, options);
    return this.svgGraphForSerializedObjectGraph(snapshot(obj), options);

    function snapshot(obj) {
      var serializer = lively.persistence.Serializer.createObjectGraphLinearizerForCopy(),
          dontCopyWorldPlugin = new GenericFilter();
      dontCopyWorldPlugin.addFilter(function(obj, propName, value) {
          return value === lively.morphic.World.current(); });
      if (options.withoutWorld)
        serializer.addPlugin(dontCopyWorldPlugin);
      serializer.serializeToJso(obj)
      return {registry: serializer.simplifyRegistry(serializer.registry)};
    }
  }
});

ObjectGraphLinearizer.addMethods(
'debugging', {
    serializedPropertiesOfId: function(id) {
        // return property names of obj behind id
        return Properties.all(this.getRegisteredObjectFromId(id));
    },
    referencesAndClassNamesOfId: function(id) {
        // given an id, the regObj behind it is taken and for all its references a list is assembled
        // [id:ClassName]
        return this.referencesOfId(id).collect(function(id) {
            return id + ':' + this.classNameOfId(id);
        }, this);
    },

    classNameOfId: function(id) {
        var refRegisteredObj = this.getRegisteredObjectFromId(id);
        return refRegisteredObj[ClassPlugin.prototype.classNameProperty] || 'no class name found!';
    },

    referencesOfId: function(id, withPath) {
        // all the ids an regObj (given by id) points to
        var registeredObj = this.getRegisteredObjectFromId(id), result = [];
        Properties.forEachOwn(registeredObj, function(key, value) {
            if (Object.isArray(value)) {
                result = result.concat(this.referencesInArray(value, withPath && key));
                return
            };
            if (!value || !this.isReference(value)) return;
            var refRegisteredObj = this.getRegisteredObjectFromId(value.id);
            result.push(withPath ? {key: key, id: value.id} : value.id);
        }, this);
        return result;
    },

    referencesInArray: function(arr, optPath) {
        // helper for referencesOfId
        var result = [];
        arr.forEach(function(value, idx) {
            if (Object.isArray(value)) {
                result = result.concat(this.referencesInArray(value, optPath + '[' + idx + ']'));
                return;
            };
            if (!value || !this.isReference(value)) return;
            var refRegisteredObj = this.getRegisteredObjectFromId(value.id);
            result.push(optPath ? {key: optPath + '[' + idx + ']', id: value.id} : value.id);
        }, this)
        return result;
    },

    idsFromObjectThatReferenceId: function(wantedId) {
        // all ids from regObj pointing to wantedId
        var result = [], serializer = this;
        function searchIn(obj, id) {
            Object.values(obj).forEach(function(ref) {
                if (serializer.isReference(ref) && ref.id == wantedId) result.push(id);
                if (Object.isArray(ref)) searchIn(ref, id);
            })
        }
        Properties.all(this.registry).forEach(function(id) {
            searchIn(this.getRegisteredObjectFromId(id), id);
        }, this)
        return result;
    },

    objectsReferencingId: function(id) {
        // get the regObjs for ids
        return this
            .idsFromObjectThatReferenceId(id)
            .collect(function(id) { return this.getRegisteredObjectFromId(id) }, this);
    },

    objectsDo: function(func, jso) {
        // example:
        // browsers = []
        // serializer.objectsDo(function(obj, id) {
        //     if (obj.__LivelyClassName__ == 'lively.ide.SystemBrowser')
        //        browsers.push(id)
        // })
        Properties.all(jso || this.registry).forEach(function(id) {
            func(this.getRegisteredObjectFromId(id), id);
        }, this);
    },

    findIdReferencePathFromToId: function(fromId, toId, options) {
        // prints path:
        //   serializer.findIdReferencePathFromToId(0, 10);
        // prints ids, classNames, property names:
        //   s.findIdReferencePathFromToId(0, 5, {showPath: false, showPropNames: true});
        options = options || {};
        var showPath = options.showPath === undefined ?  true : options.showPath,
            showClassNames = options.hasOwnProperty('showClassNames') ? options.showClassNames : !showPath,
            showPropNames = options.hasOwnProperty('showPropNames') ? options.showPropNames : showPath,
            hideId = options.hasOwnProperty('hideId') ? options.hideId : showPath;

        // how can one get from obj behind fromId to obj behind toId
        // returns an array of ids
        // serializer.findIdReferencePathFromToId(0, 1548)
        var s = this, stack = [], visited = {}, found;
        function pathFromIdToId(fromId, toId, depth) {
            if (found) return;
            if (depth > 30) {
                alert('' + stack)
                return
            }
            if (fromId === toId) { found = stack.clone() }
            if (visited[fromId]) return;
            visited[fromId] = true;
            stack.push(fromId);
            var refs = s.referencesOfId(fromId);
            for (var  i = 0; i < refs.length; i++) {
                pathFromIdToId(refs[i], toId, depth + 1);
            }
            stack.pop();
        }
        pathFromIdToId(fromId, toId, 0);

        if (!found) return null;

        if (!showClassNames && !showPropNames) return found;

        var result = [];
        for (var i = 0; i < found.length - 1; i++) {
            var currId = found[i],
                nextId = found[i+1],
                strings = [];
            if (!hideId) strings.push(currId);
            if (showClassNames) {
                strings.push(s.getRegisteredObjectFromId(currId)[ClassPlugin.prototype.classNameProperty]);
            }
            if (showPropNames) {
                var ref = s.referencesOfId(currId, true).detect(function(ea) { return ea.id === nextId; })
                strings.push(ref.key);
            }
            result.push(strings.join(':'));
        }
        if (showPath) {
            result = '.' + result.join('.');
        }
        return result;

    },

    findNamedReferencePathFromToId: function(fromId, toId) {
        var ids = this.findIdReferencePathFromToId(fromId, toId),
            path = [];
        for (var i = 0; i < ids.length; i++) {
            var obj = this.getRegisteredObjectFromId(path[i]);
            path.push(this.propertyOfIdRefId(obj, path[i+1]));
        }
        return path;
    },

    showPosOfId: function(id) {
        var o = this.getRegisteredObjectFromId(id).origin;
        if (!o) {
            alert('Cannot show pos, no origin property found!');
            return;
        }
        var posObj = this.getRegisteredObjectFromId(o.id),
            pos = pt(posObj.x, posObj.y);
        Global.showPt(pos, 3);
    },

    inlineForDebug: function(root) {
        root = root || 0;
        var count = 0,
            serializer = this;

        function inlineId(id) {
            count++;
            if (count > 1000) throw new Error('endless recursion?')
            var registeredObj = serializer.getRegisteredObjectFromId(id);
            if (registeredObj.wasInlined) return registeredObj;
            registeredObj.wasInlined = true;
            for (var key in registeredObj) {
                registeredObj[key] = patchObj(registeredObj[key]);
            }
            return registeredObj;
        };

        function patchObj(obj) {
            if (serializer.isReference(obj)) return inlineId(obj.id);
            if (Object.isArray(obj)) return obj.collect(function(item, idx) { return patchObj(item) });
            return obj;
        };

        return inlineId(root);
    },

    propertyOfIdRefId: function(obj, idOfRef) {
        // var obj = this.getRegisteredObjectFromId(idOfObj);
        var result = Properties.all(obj).detect(function(ea) {
            return obj[ea] && obj[ea].__isSmartRef__ && obj[ea].id === idOfRef });
        if (!result) {
            Properties.all(obj).forEach(function(arrName) {
                var arr = obj[arrName];
                if (!Object.isArray(arr)) return;
                var item = arr.detect(function(item) {
                    return obj[item] && obj[item].__isSmartRef__ && obj[item].id === idOfRef });
                if (item) result = arrName + '[' + arr.indexOf(item) + ']';
            });
        }
        return result || '???';
    }

});

Object.subclass('lively.persistence.Debugging.Helper',
'object sizes', {
    listObjectsOfWorld: function(url) {
        var doc = new WebResource(url).beSync().get().contentDocument;
        if (!doc) { alert('Could not get ' + url); return null };
        var worldMetaElement = doc.getElementById(lively.persistence.Serializer.jsonWorldId);
        if (!worldMetaElement) { alert('Could not get json from ' + url); return null };
        var jso = JSON.parse(worldMetaElement.textContent);

        var printer = this.listObjects(jso.registry);
        lively.morphic.World.current().addTextWindow(printer.toString());
        return printer;
    },

    listObjects: function(linearizerRegistry) {
        var bytesAltogether = JSON.stringify(linearizerRegistry).length,
            objCount = Properties.own(linearizerRegistry).length;
        // aggregagator with output
        var classes = {
            sortedEntries: function() {
                return Properties.own(this)
                    .collect(function(prop) { return this[prop]  }, this)
                    .sortBy(function(tuple) { return tuple.bytes }).reverse()
            },
            toString: function() {
                var classItems = this.sortedEntries().collect(function(tuple) {
                        return [Numbers.humanReadableByteSize(tuple.bytes),
                            tuple.count,
                            Numbers.humanReadableByteSize(tuple.bytes / tuple.count),
                            tuple.name];
                    }, this);
                classItems.unshift(['#bytes', '#objs', 'avg', 'class'])
                var classTable = Strings.printTable(classItems, {separator: ' | '});
                return Strings.format('Total: %s (%s objs - %s per obj)',
                                      Numbers.humanReadableByteSize(bytesAltogether), objCount,
                                      Numbers.humanReadableByteSize(bytesAltogether / objCount))  +
                    '\nBy class:\n' + classTable
            },
            biggestObjectsOfType: function(typeString) {
                return this[typeString].objects
                    .collect(function(ea) { return JSON.stringify(ea) })
                    .sortBy(function(ea) { return ea.length }).reverse()
                    .collect(function(ea) { return JSON.parse(ea) });
            },
            toCSV: function() {
                var lines = ['type,size,size in bytes,count,size per object,size perobject in bytes'];
                this.sortedEntries().forEach(function(tuple) {
                    lines.push([tuple.name, Numbers.humanReadableByteSize(tuple.bytes), tuple.bytes, tuple.count,
                    Numbers.humanReadableByteSize(tuple.bytes / tuple.count), tuple.bytes / tuple.count].join(','))
                });
                return lines.join('\n');
            },
        }

        ObjectGraphLinearizer.allRegisteredObjectsDo(linearizerRegistry, function(key, value) {
            var className = value[ClassPlugin.prototype.classNameProperty];
            if (className == null) {
                var props = Properties.own(value);
                if (props.length > 3) className = "{" + props.slice(0, 3).join(", ") + ", ...}";
                    else className = "{" + props.join(", ") + "}";
            }
            if (!classes[className]) {
                classes[className] = {
                    count: 0,
                    bytes: 0,
                    name: className,
                    objects: []
                };
            }
            classes[className].count++;
            classes[className].bytes += JSON.stringify(value).length;
            classes[className].objects.push(value);
        });

        return classes;
    }
},
'filtering', {
    getObjectsByType: function(linearizerRegistry, typeString) {
        var result = [];
        ObjectGraphLinearizer.allRegisteredObjectsDo(linearizerRegistry, function(key, value) {
            var className = value[ClassPlugin.prototype.classNameProperty] || 'plain object';
            if (className === typeString) result.push(value);
        });
        return result;
    }
});

Object.extend(lively.persistence.Debugging.Helper, {
    listObjectsOfWorld: function(url) {
        // lively.persistence.Debugging.Helper.listObjectsOfWorld(URL.source)
        return new this().listObjectsOfWorld(url);
    },
    listObjects: function(jsonOrJso) {
        var jso = Object.isString(jsonOrJso) ? JSON.parse(jsonOrJso) : jsonOrJso;
        if (jso.registry) jso = jso.registry;
        var result = new this().listObjects(jso);
        Global.worldSerializationDebuggingObjects = result;
        return result;
    },
    prettyPrintJSON: function(json) { return JSON.prettyPrint(json) },
    getObjectsByType: function(jso, typeString) {
        return new this().getObjectsByType(jso.registry, typeString);
    },
    inlineRegistry: function(json) {
        var jso = JSON.parse(json),
            serializer = ObjectGraphLinearizer.forLively();
        serializer.registry = serializer.createRealRegistry(jso.registry);
        return serializer.inlineForDebug(jso.id);
    }

});

Object.subclass('README'
/*
s = lively.persistence.Serializer.serialize(obj)
lively.persistence.Debugging.Helper.inlineRegistry(s)
*/
/*
module('lively.persistence.Debugging').load()
serializer = ObjectGraphLinearizer.forLively()
serialized = serializer.serialize(this.world())
// --- or ---
json = lively.PartsBin.getPartItem('ObjectEditor', 'PartsBin/Tools').load().json
serializer.registry = serializer.createRealRegistry(JSON.parse(json).registry);

objs = []
serializer.objectsDo(function(obj, id) {
    if (obj.__LivelyClassName__ == 'SimpleBrowser')
    objs.push(id)
})

objs
serializer.showPosOfId(77);
serializer.findIdReferencePathFromToId(0, 216);
serializer.referencesAndClassNamesOfId(216);
serializer.classNameOfId(77);
*/
);

}) // end of module
