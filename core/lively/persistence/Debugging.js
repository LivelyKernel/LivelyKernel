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

ObjectGraphLinearizer.addMethods(
'debugging', {
    serializedPropertiesOfId: function(id) {
        // return property names of obj behind id
        return Properties.all(this.getRegisteredObjectFromId(id))
    },
    referencesAndClassNamesOfId: function(id) {
        // given an id, the regObj behind it is taken and for all its references a list is assembled
        // [id:ClassName]
        return this.referencesOfId(id).collect(function(id) {
            return id + ':' + this.classNameOfId(id)
        }, this)
    },
    classNameOfId: function(id) {
        var refRegisteredObj = this.getRegisteredObjectFromId(id);
        return refRegisteredObj[ClassPlugin.prototype.classNameProperty] || 'no class name found!';
    },

    referencesOfId: function(id) {
        // all the ids an regObj (given by id) points to
        var registeredObj = this.getRegisteredObjectFromId(id), result = []
        Properties.forEachOwn(registeredObj, function(key, value) {
            if (Object.isArray(value)) {
                result = result.concat(this.referencesInArray(value));
                return
            };
            if (!value || !this.isReference(value)) return;
            var refRegisteredObj = this.getRegisteredObjectFromId(value.id)
            result.push(value.id);
        }, this);
        return result;
    },
    referencesInArray: function(arr) {
        // helper for referencesOfId
        var result = [];
        arr.forEach(function(value) {
            if (Object.isArray(value)) {
                result = result.concat(this.referencesInArray(value));
                return
            };
            if (!value || !this.isReference(value)) return;
            var refRegisteredObj = this.getRegisteredObjectFromId(value.id)
            result.push(value.id);
        }, this)
        return result
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
            func(this.getRegisteredObjectFromId(id), id)
        }, this);
    },
    findIdReferencePathFromToId: function(fromId, toId, showClassNames) {
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
            if (fromId === toId) { alert('found ' + stack); found = stack.clone() }
            if (visited[fromId]) return;
            visited[fromId] = true;
            stack.push(fromId);
            var refIds = s.referencesOfId(fromId);
            for (var  i = 0; i < refIds.length; i++)
                pathFromIdToId(refIds[i], toId, depth + 1);
            stack.pop();
        }
        pathFromIdToId(fromId, toId, 0)

        if (showClassNames)
            return found.collect(function(id) {
                return id + ':' + s.getRegisteredObjectFromId(id)[ClassPlugin.prototype.classNameProperty];
            });

        return found
    },
    findNamedReferencePathFromToId: function(fromId, toId) {
        var ids = this.findIdReferencePathFromToId(fromId, toId),
            path = [];
        for (var i = 0; i < ids.length; i++) {
            var obj = this.getRegisteredObjectFromId(path[i])
            path.push(this.propertyOfIdRefId(obj, path[i+1]))
        }
        return path
    },

    showPosOfId: function(id) {
        var o = this.getRegisteredObjectFromId(id).origin;
        if (!o) {
            alert('Cannot show pos, no origin property found!');
            return;
        }
        var posObj = this.getRegisteredObjectFromId(o.id),
            pos = pt(posObj.x, posObj.y);
        Global.showPt(pos, 3)
    },
    inlineForDebug: function(root) {
        root = root || 0;
var count = 0;
        var serializer = this;
        function inlineId(id) {
count++;
if (count > 1000) throw new Error('endless recursion?')
            var registeredObj = serializer.getRegisteredObjectFromId(id);
            if (registeredObj.wasInlined) return registeredObj;
            registeredObj.wasInlined = true;
            for (var key in registeredObj)
                registeredObj[key] = patchObj(registeredObj[key]);
            return registeredObj;
        };

        function patchObj(obj) {
            if (serializer.isReference(obj))
                return inlineId(obj.id)
            if (Object.isArray(obj))
                return obj.collect(function(item, idx) { return patchObj(item) })
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
                if (!Object.isArray(arr)) return false;
                var item = arr.detect(function(item) {
                    return obj[item] && obj[item].__isSmartRef__ && obj[item].id === idOfRef });
                if (item) result = arrName + '[' + arr.indexOf(item) + ']';
            });
        }
        return result || '???';
    },



});

Object.subclass('lively.persistence.Debugging.Helper',
'object sizes', {
    listObjectsOfWorld: function(url) {
        var doc = new WebResource(url).beSync().get().contentDocument;
        if (!doc) { alert('Could not get ' + url); return };
        var worldMetaElement = doc.getElementById(lively.persistence.Serializer.jsonWorldId);
        if (!worldMetaElement) { alert('Could not get json from ' + url); return };
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
                return Strings.format('all: %s (%s - %s per obj)',
                                Numbers.humanReadableByteSize(bytesAltogether), objCount,
                                Numbers.humanReadableByteSize(bytesAltogether / objCount))  +
                    '\nclasses:\n' + this.sortedEntries().collect(function(tuple) {
                            return Strings.format('%s: %s (%s - %s per obj)',
                                tuple.name, Numbers.humanReadableByteSize(tuple.bytes), tuple.count,
                                Numbers.humanReadableByteSize(tuple.bytes / tuple.count))

                        }, this).join('\n')
            },
            biggestObjectsOfType: function(typeString) {
                return this[typeString].objects
                    .collect(function(ea) { return JSON.stringify(ea) })
                    .sortBy(function(ea) { return ea.length }).reverse()
                    .collect(function(ea) { return JSON.parse(ea) })
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
            var className = value[ClassPlugin.prototype.classNameProperty] || 'plain object';
            if (!classes[className])
                classes[className] = {
                    count: 0,
                    bytes: 0,
                    name: className,
                    objects: []
                };
            classes[className].count++
            classes[className].bytes += JSON.stringify(value).length;
            classes[className].objects.push(value);
        });

        return classes;
    },
},
'filtering', {
    getObjectsByType: function(linearizerRegistry, typeString) {
        var result = [];
        ObjectGraphLinearizer.allRegisteredObjectsDo(linearizerRegistry, function(key, value) {
            var className = value[ClassPlugin.prototype.classNameProperty] || 'plain object';
            if (className === typeString) result.push(value);
        });
        return result;
    },
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
        return result
    },
    prettyPrintJSON: function(json) { return JSON.prettyPrint(json) },
    getObjectsByType: function(jso, typeString) {
        return new this().getObjectsByType(jso.registry, typeString);
    },
    inlineRegistry: function(json) {
        var jso = JSON.parse(json);
            serializer = ObjectGraphLinearizer.forLively();
        serializer.registry = serializer.createRealRegistry(jso.registry);;
        return serializer.inlineForDebug(jso.id);
    },

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
serializer.showPosOfId(77)
serializer.referencesAndClassNamesOfId(216)
serializer.findIdReferencePathFromToId(0, 216) // [0, 77, 197, 198, 199, 215]
serializer.classNameOfId(77)
*/
);

}) // end of module