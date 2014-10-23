module('lively.morphic.DiffMerge').requires('lively.morphic.Complete').toRun(function() {

lively.morphic.Morph.addMethods(
'diffing', {
    equals: function(otherMorph) {
        // migrated
        var diff = this.diffTo(otherMorph);
        var diffPropsToConsider = ["added", "removed", "modified"]
        return Properties.own(diff).select(function (ea) {
            return diffPropsToConsider.select(function (prop) {
                return Properties.own(diff[ea][prop]).length > 0
            }).length > 0
        }).length == 0
    },

    diffTo: function(parent) {
        // returns a list of changes between the morph and parent, including its submorphs.
        if (parent == undefined) return undefined;
        var self = this,
            diffList = new DiffList(),
            foundMorphs = [],
            diff = new Diff();

        // Limitation: Cannot find morphs that changed their owner
        this.submorphs.each(function (ea) {
            var myParent = ea.findDerivationParent(parent);

            if (myParent) {
                diffList.mixWith(ea.diffTo(myParent));
                foundMorphs.push(myParent.id);
            }
            else {
                diff.added[ea.id] = ea;
            }
        })
        parent.submorphs.each(function (ea) {
            if (foundMorphs && (foundMorphs.indexOf(ea.id) < 0)) {
                diff.removed[ea.id] = ea
            }
        })
        if (diffList.isEmpty()) diff.submorphsModified = [];

        diff.modified = this.parseDiffTo(parent)

        diff.matchingId = parent.id;
        diffList[self.id] = diff;
        return diffList;
    },
    newThreeWayDiff: function(optSibling, optParent) {
        // performs a threeWayDiff based on the Parts PartsBin versions
        var self = this,
            parent = optParent || this.findParentPartVersion(),
            sibling = optSibling || this.findCurrentPartVersion(),
            resultList = new DiffList();

        /*if (sibling.getPartsBinMetaInfo().revisionOnLoad == parent.getPartsBinMetaInfo().revisionOnLoad) {
            return false;
        }*/

        var myDiffList = this.diffTo(parent);
        var siblingDiffList = sibling.diffTo(parent);

        debugger;
        resultList = myDiffList.diffAgainst(siblingDiffList);

        return resultList;

    },
    parseDiffTo: function(otherMorph, optBlackList) {
        var blacklist = ["getTextChunks", "getShape", "getPartsBinMetaInfo", "getTransform", "getRichText", "getRichText2"];
        if(optBlackList) blacklist = blacklist.concat(optBlackList);
        var diff = {};

        this.parsePropertiesOfDiffTo(otherMorph, diff, blacklist);
        this.parseScriptsOfDiffTo(otherMorph, diff)

        return diff;
    },

    parsePropertiesOfDiffTo: function(otherMorph, diff, blacklist) {
        var self = this;

        // whoooohaaa, this assumes quite a lot about "get" and "set" methods
        // is this really a good idea?
        Functions.all(this).withoutAll(blacklist).forEach(function(sel) {
            if (!sel.startsWith("get") || !otherMorph[sel] || !self["set" + sel.substring(3)]) return;
            try {
                var myProp = self[sel](),
                    otherProp = otherMorph[sel](),
                    // consider using Objects.equal here
                    areEqual = myProp.equals ? myProp.equals(otherProp) : myProp == otherProp;
                if (!areEqual) {
                    var propName = sel.substring(3); // remove "get"
                    diff[propName] = new AtomicDiff("property", myProp, otherProp);
                }
            } catch (ex) { return; }
        });
    },

    parseScriptsOfDiffTo: function (otherMorph, diff) {
        var self = this;
        Functions.own(self).each(function (ea) {
            if (otherMorph[ea]) {
                if (self[ea].toString() != otherMorph[ea].toString())
                    diff[ea] = new AtomicDiff("script", self[ea].toString(), otherMorph[ea].toString())
            } else {
                diff[ea] = new AtomicDiff("script", self[ea].toString());
            }
        })

        Functions.own(otherMorph).each(function (ea) {
            if (!self[ea])
                diff[ea] = new AtomicDiff('script', undefined, otherMorph[ea].toString())
        })
    },
    showThreeWayDiff: function() {
        // opens a diff viewer tool with the threeWayDiff()
        var diff = this.newThreeWayDiff();
        $world.openPartItem("MorphDiffer", "PartsBin/Tools").get("MorphDiffer").initializeWith(this, diff);
    },
    mergeWith: function(otherMorph, optAncestor) {
        
        // get the common ancestor
        var commonAncestor = optAncestor || this.findCommonAncestorWith(otherMorph);
        
        // if we can not find it the user is on his own
        if (!commonAncestor) {
            return;
        }
        // morph where we can apply the mergeable changes
        var target = otherMorph.copy();
        
        // get all diffs
        var diffList = this.newThreeWayDiff(otherMorph, commonAncestor);
        
        for (var diffId in diffList) {
            if (!diffList.hasOwnProperty(diffId)) {
                continue;
            }
            var diff = diffList[diffId];
            var targetElement = this.findSiblingInTargetElement(target, diffId);
            // everything that has been added can be added to the merged object
            for (var property in diff.added) {
                if (!diff.added.hasOwnProperty(property)) {
                    continue;
                }
                targetElement.addMorphFront(diff.added[property].copy());
            };
            
            // everything that has been removed may be removed
            for (var property in diff.removed) {
                if (!diff.removed.hasOwnProperty(property)) {
                    continue;
                }
                targetElement.submorphs.each(function (subMorph) {
                    // there might a better way to do this
                    var areEqual = subMorph.equals ? 
                        subMorph.equals(diff.removed[property]) : subMorph == diff.removed[property];
                    if (areEqual) {
                        subMorph.remove();
                    }
                });
            };
            
            // everything that has been updated can be merged into the new thing without any problem
            // as the diff merge code this assumes quite a lot about getters and setters and should be somehow 
            // improved in the future
            for (var property in diff.updated) {
                if (!diff.updated.hasOwnProperty(property)) {
                    continue;
                }
                var atomicUpdateDiff = diff.updated[property];
                if (atomicUpdateDiff.type != 'script') {
                    var setterFunction = "set" + property;
                    targetElement[setterFunction](atomicUpdateDiff.newValue);
                } else {
                    var updateValue = atomicUpdateDiff.newValue || atomicUpdateDiff.oldValue;
                    targetElement.addScript(updateValue);
                }
                
            };
        }
        
        // return the merged morph to the user
        return {mergedMorph: target, list: diffList};
    },
    findSiblingInTargetElement: function(target, ancestorId) {
        // check whether it is the target as such
        if (target.derivationIds.intersect([ancestorId]).length > 0) {
            return target;
        }
    
        // check whether it is one of the submorphs
        for (var each in target.submorphs) {
            if (!target.submorphs.hasOwnProperty(each)) {
                continue;
            }
            var submorph = target.submorphs[each];
            if (submorph.derivationIds.intersect([ancestorId]).length > 0) {
                return submorph;
            }
        } 
    },
    findCommonAncestorWith: function(otherMorph) {
        // find intersection in derivationIDs
        var intersectingDerivationIDs = this.derivationIds.intersect(otherMorph.derivationIds);
        // NOTE: by calling intersect on ourItem's derivationIds and not on
        // the sibling's we make sure that the order from ourItem's derivationIds
        // is maintained. We need this soon.
        
        // start looking for the one that's latest in our items derivationIDs
        intersectingDerivationIDs.reverse();
        
        // search in same PartsSpace
        for (var i = 0; i < intersectingDerivationIDs.length; i++) {
            
            var fromSameSpace = this.findItemsByID(intersectingDerivationIDs[i], 
                this.getItemsFromSamePartsSpace(this));
            if (fromSameSpace.length > 0) {
                // we found an ancestor yay!
                if (!fromSameSpace.length == 1) {
                    console.log("We have a problem here this should not happen!");
                }
                return fromSameSpace[0].part;
            }
            
            // search in Basic PartsSpace    
            var fromBasicSpace = this.findItemsByID(intersectingDerivationIDs[i], 
                this.getItemsFromBasicSpace);
            if (fromBasicSpace.length > 0) {
                // we found an ancestor yay!
                if (!fromBasicSpace.length == 1) {
                    console.log("We have a problem here this should not happen!");
                }
                return fromBasicSpace[0].part;
            }
        }
    },
    findItemsByID: function(id, partItems) {
        var list = [];
        var count = 0;
        for (var pi in partItems) {
            if (!partItems.hasOwnProperty(pi)) {
                continue;
            }
        
            try {
                if (partItems[pi].loadPart().part.derivationIds.last() == id)
                    list.push(partItems[pi]);
            } catch (err) {
                continue;
            }
        }
        return list;
    },
    getItemsFromSamePartsSpace: function(item) {
        return item.getPartItem().getPartsSpace().load().partItems;
    }
},
'inheritance', {
    findById: function (id) {
        // this method returns the submorph of this that matches the given id
        var morph = undefined;
        this.withAllSubmorphsDo(function (ea) {
            if (ea.id == id) morph = ea;
        });
        return morph;
    },

    findParentPartVersion: function () {
        //this returns the PartsBin version of the morph that matches the morphs revisionOnLoad
        var revision = this.partsBinMetaInfo? this.getPartsBinMetaInfo().revisionOnLoad : null ;
        return this.getPartItem().loadPart(false, null, revision).part;
    },
    findCurrentPartVersion: function () {
        // returns the current version in PartsBin as morph
        var partItem = this.getPartItem();
        if (new partItem.getFileURL().asWebResource().exists()) {
            return partItem.loadPart(false).part;
        }
    },
    findDerivationParent: function (optScope) {
        //returns the nearest ancestor in line that can be found in scope or world
        if (!this.derivationIds) return undefined;

        var scope = optScope || $world,
            result = undefined,
            commonIds = new Array(),
            self = this;

        scope.withAllSubmorphsDo(function (ea) {
            var idsShouldContain = [ea.id].concat(ea.derivationIds || []);
            if (self.derivationIds.intersect(idsShouldContain).length == idsShouldContain.length) {result = ea};
            // we might have copied the object from parts bin that is why it has one id too much! That's why we will delete the last and try again
            if (!result) {idsShouldContain.removeAt(0)};
            if (self.derivationIds.intersect(idsShouldContain).length == idsShouldContain.length) {result = ea};
         })

        return result;
    },
    findDerivationSibling: function (optScope) {
        //returns the nearest sibling in line that can be found in scope or world
        if (!this.derivationIds) return undefined;
        var scope = optScope || $world,
            result = undefined,
            commonIds = new Array(),
            myIds = this.derivationIds.concat([this.id]);

        // todo: implement a limit


        optScope.withAllSubmorphsDo(function (ea) {
            var otherIds = ea.derivationIds.concat([ea.id]),
                tempCommonIds = myIds.intersect(otherIds);
            if (tempCommonIds.length > commonIds.length) {
                commonIds = tempCommonIds;
                result = ea;
            }
        })

        return result;
    },
    findSiblingInRelative: function(sibling, parent) {
        // Finds the siblings submorph that matches the morph. The common parent is manually given, and must be computed beforehand.
        if(!sibling || !parent) return;

        //if the morph is the pendent to the sibling, return the whole sibling
        if (this.isDirectDescendentOf(parent)) return sibling

        var denotedSibling = this.findDerivationSibling(sibling);
        if (!denotedSibling) return undefined

        //find the matching morph in parent
        var denotedParent1 = this.findDerivationParent(parent);
        var denotedParent2 = denotedSibling.findDerivationParent(parent);
        if ((!denotedParent1 || !denotedParent2) || (denotedParent1 != denotedParent2)) return undefined

        if (denotedSibling.derivationIds.intersect(this.derivationIds).length > denotedParent1.derivationIds.length) {
            return denotedSibling
        }
        else return undefined;
    },


    isDirectDescendentOf: function(parent) {
        //returns true if I am in a copy row of a parent morph
        if (this.derivationIds.equals(parent.derivationIds)) return false
        else if (this.derivationIds.intersect(parent.derivationIds).equals(parent.derivationIds)) return true
        else return false
    },

    existsAlreadyIn: function(parent) {
        // returns true, if this submorph already exists as submorph in parent morph

        // true, if I am in direct ancestors line
        if (this.isDirectDescendentOf(parent)) return true;

        var parentPendent = this.findDerivationParent(parent);
        if (parentPendent.derivationIds.intersect(this.derivationIds) == this.findParentPartVersion().derivationIds) return false;
        else return parentPendent || false;
    },
    findCommonParentPartVersion: function(sibling) {
        //returns the youngest PartVersion the morph has in common with the sibling given

        // are revision numbers strictly increasing? if so, following code would do it:
        // var rev = Math.max(this.getPartsBinMetaInfo().revisionOnLoad, sibling.getPartsBinMetaInfo().revisionOnLoad)
        // return this.getPartItem().loadPart(false, null, rev).part;

        var commonAncestorIds = this.derivationIds.intersect(sibling.derivationIds);
        commonAncestorIds.pop();

        var myRevisions = this.getPartItem().loadPartVersions(false).partVersions.clone();
        var siblingRevisions = sibling.getPartItem().loadPartVersions(false).partVersions.clone();

        var rev = undefined;
        if (myRevisions.indexOf(this.getPartsBinMetaInfo().revisionOnLoad) > siblingRevisions.indexOf(sibling.getPartsBinMetaInfo().revisionOnLoad)) {
            rev = sibling.getPartsBinMetaInfo().revisionOnLoad
        }
        else {
            rev = this.getPartsBinMetaInfo().revisionOnLoad
        }
        return this.getPartItem().loadPart(false, null, rev).part;
    },


});

Object.subclass('AtomicDiff',
'initializing', {
    initialize: function(type, newValue, oldValue) {
        this.type = type || undefined;
        this.newValue = (newValue === undefined) ? undefined : newValue;
        this.oldValue = (oldValue === undefined) ? undefined : oldValue;
        return this;
    },
},
'diffing', {
    diffAgainst: function(otherDiff) {
        // performs an atomic diff diff (sic!) based on an atomic merge matrix
        if (this.newValue && typeof(this.newValue.equals) == "function") {
            if (otherDiff.newValue === undefined) {
                return {"conflict": new AtomicDiff(this.type, this.newValue, otherDiff.newValue)};
            } else if (this.newValue.equals(otherDiff.newValue)) {
                return undefined;
            } else {
                return {"conflict": new AtomicDiff(this.type, this.newValue, otherDiff.newValue)};
            }
        } else {
            if (this.type == 'script') {
                if (this.newValue && this.newValue.toString() == otherDiff.newValue && otherDiff.newValue.toString()) {
                    return undefined;
                } else if (!this.newValue && !otherDiff.newValue) {
                    return undefined;
                } else {
                    // try to fix the conflict using the diff match patch algorithm
                    module('apps.DiffMatchPatch').load(true);
                    var dmp = new diff_match_patch();
                    
                    var patch_this = dmp.patch_make(this.oldValue, this.newValue);
                    var patch_other = dmp.patch_make(this.oldValue, otherDiff.newValue);
                    var patches = patch_this.concat(patch_other);
                    var application = dmp.patch_apply(patches, this.oldValue);
                    var merged = application[0];
                    var results = application[1];
                    
                    for (var result in results) {
                        if (!results[result]) {
                            // if we can not apply one diff we can't merge it and we have a merge conflict
                            return {"conflict": new AtomicDiff(this.type, this.newValue, otherDiff.newValue)}
                        }
                    }
                    return {"update": new AtomicDiff(this.type, merged, this.oldValue)};
                    
                }
            } else {
                if (this.newValue == otherDiff.newValue) {
                    return undefined;
                } else {
                    return {"conflict": new AtomicDiff(this.type, this.newValue, otherDiff.newValue)}
                }
            }
        }
    },
});

Object.subclass('Diff',
'initializing', {
    initialize: function(optAdded, optRemoved, optModified, optSubmorphsModified) {
        this.added = optAdded || {}; // morphs that were added
        this.removed = optRemoved || {}; // morphs that were removed
        this.modified = optModified || {}; // properties that were changed
        this.submorphsModified = optSubmorphsModified || new Array(); // submoprhs that are modified
        this.matchingId = undefined;
        return this;
    },
},
'diffing', {
    diffAgainst: function(otherDiff, modifiedList, addedList, removedList, optGiven) {
        // returns a diff between diffs based on a merge matrix.
        var diffModified = this.diffModified(otherDiff),
            diffRemoved = otherDiff.diffRemoved(modifiedList, removedList),
            given = optGiven || {added:{}, removed:{}, updated:{}, conflicted:{}};

        var result = {
            added: this.joinDiffs(otherDiff.added, this.added, given.added),
            removed: this.joinDiffs(diffRemoved.removed, this.removed, given.removed),
            updated: this.joinDiffs(diffModified.updated, given.updated),
            conflicted: this.joinDiffs(diffRemoved.conflicted, diffModified.conflicted, given.conflicted)
        }
        if (Properties.own(result.added).length > 0
          || Properties.own(result.removed).length > 0
          || Properties.own(result.updated).length > 0
          || Properties.own(result.conflicted).length > 0) return result;
        return undefined
    },
    diffAdded: function(otherDiff) {
        // joins two lists of morphs that were added.
        // Extendable: can get a lookup to see whether a morph was just moved
        var added = {}, self = this;

        Properties.own(self.added).each(function (ea) { added[ea] = self.added[ea]; })
        Properties.own(otherDiff.added).each(function (ea) { added[ea] = otherDiff.added[ea]; })
        return added;
    },
    diffRemoved: function(modifiedList, removedList) {
        // merges two lists of morphs that were removed.
        // Extendable: can get a lookup to see whether a morph was just moved
        var result = {removed: {}, conflicted: {}}, self = this;
        Properties.own(self.removed).each(function (ea) {
            if (removedList[ea]) {
            } else if (modifiedList[ea]) {
                result.conflicted[ea] = result.conflicted[ea] || [];
                result.conflicted[ea].push(new AtomicDiff("submorph", {}, self.removed[ea]));
            } else {
                result.removed[ea] = self.removed[ea];
            }
        })
        return result;
    },
    diffModified: function(otherDiff) {
        //joins the modifications, which includes the atomic diffing of conflicting values
        var modified = {updated: {}, conflicted: {}},
            self = this;

        Properties.own(self.modified).each(function (ea) {
            if (otherDiff.modified[ea]) {
                var d = self.modified[ea].diffAgainst(otherDiff.modified[ea]);
                if (d && d.conflict) {
                    modified.conflicted[ea] = d.conflict;
                } else if (d && d.update) {
                    modified.updated[ea] = d.update;
                }
            } else {
                modified.updated[ea] = new AtomicDiff(self.modified[ea].type, self.modified[ea].newValue, self.modified[ea].oldValue);
            }
        })
        Properties.own(otherDiff.modified).each(function (ea) {
            if (!self.modified[ea]) {
                modified.updated[ea] = new AtomicDiff(otherDiff.modified[ea].type, otherDiff.modified[ea].newValue, otherDiff.modified[ea].oldValue);
            }
        })

        return modified
    },
    joinDiffs: function() {
        // joins all diff list objects given
        var result = {},
            args = arguments;

        for (var i = 0; i<args.length; i++) {
            Properties.own(args[i]).each(function (ea) {
                result[ea] = args[i][ea]
            })
        }
        return result
    },
    isEmpty: function() {
        // determines whether the diff contains changes
        var self = this;
        if (Properties.own(self.added).length > 0
            || Properties.own(self.removed).length > 0
            || Properties.own(self.modified).length > 0
            || self.submorphsModified.length > 0) {
            return false
        }
        else return true
    },

});

Object.subclass('DiffList',
'initialization', {
    initialize: function() {
        return this;
    },
},
'maintaining', {
    mixWith: function (otherList) {
        // two diff lists are merged - like array1.concat(array2)
        var self = this;
        Properties.own(otherList).each(function (ea) {
            if (!otherList[ea].isEmpty()) {
                self[ea] = otherList[ea];
            };
        })
        return self;
    },
    isEmpty: function() {
        // determines if any changes were found
        var self = this,
            filled = false;
        Properties.own(self).each(function (ea) {
            if (!self[ea].isEmpty()) filled = true;
        })
        return !filled
    },

    diffAgainst: function(otherList) {
        // diffs two diffLists
        // Returns a diff with added & removed morphs and properties that were
        // updated in the otherList or are conflicted, for each entry in the
        // list.
        var self = this,
            matchingDiffs = {},
            modified = this.collectModified(),
            removed = this.collectRemoved(),
            added = this.collectAdded(),
            result = new DiffList();
        Properties.own(otherList).each(function (ea) {
            var against = new Diff(),
                curId = undefined;
            for (var diffId in self) {
                if (self[diffId].matchingId == otherList[ea].matchingId) {
                    // case something changed in two morphs/submorphs
                    matchingDiffs[diffId] = true;
                    var r = self[diffId].diffAgainst(otherList[ea], modified, added, removed, result[diffId])
                    if (r) result[ea] = r;
                    curId = ea;
                }
            };
            if (!curId && !otherList[ea].isEmpty()) {
                // determine whether the submorph has been removed in our Version
                for (var i=0; i < removed.length; ++i) {
                    debugger;
                    var parentId = otherList[ea].matchingId;
                    var possibleParent = $world.getMorphById(parentId);
                    var realParent = removed[i].findDerivationParent(possibleParent);
                    if (realParent) {
                        // we found a parent a know that the submorph that has been modified in the other version has been removed in our version
                        curId = realParent.id;
                        break;
                    }
                }
                if (curId) {
                    debugger;
                    // case we deleted something that has changed in PartsBin
                    result[curId] = result[curId] || {"added": {}, "removed": {}, "updated": {}, "conflicted": {}};
                    result[curId].conflicted[ea] = new AtomicDiff("submorph", {}, self[curId].removed[otherList[ea].matchingId])
                    return;
                }
                // case something in PartsBin changed, that we did not change
                debugger;
                // creeate an empty diff and let the diff decide what has been updated, added, removed
                var dummyDiff = new Diff();
                dummyDiff.added = {};
                dummyDiff.removed = {};
                dummyDiff.modified = {};
                result[ea] = dummyDiff.diffAgainst(otherList[ea], [], [], [], undefined);
            }
        });
        // case we changed something that hasn't changed in PartsBin
        // check whether we missed a diff in the focused version
        for (var diffId in self) {
            if (!self.hasOwnProperty(diffId)) {
                continue;
            }
            if (!matchingDiffs[diffId]) {
                var diff = self[diffId];
                result[diff.matchingId] = result[diff.matchingId] || {"added": {}, "removed": {}, "updated": {}, "conflicted": {}};
                result[diff.matchingId].updated = diff.modified;
                result[diff.matchingId].added = diff.added;
                result[diff.matchingId].removed = diff.removed;
            }
        }
        return result
    },
    findMatchingDiffPairs: function(otherList) {
        // endless recursion -.-
        var self = this;
        Properties.own(otherList).collect(function (ea) {
            return Properties.own(self).collect(function (each) {
                if (self[each].matchingId == otherList[ea].matchingId) {
                    return [self[each],otherList[ea]];
                }
            })/*.select(function (each) {
                return each;
            })*/
        })
    },

    collectAdded: function() {
        // returns all morphs that were added
        var added = [],
            self = this;
        Properties.own(self).each(function (ea) {
            Properties.own(self[ea].added).each(function (each) {
                var element = self[ea].added[each];
                if (element.isMorph) {
                    added.push(element);
                };
            });
        })
        return added;
    },
    collectRemoved: function() {
        // returns a list of morphs that were removed
        var removed = [],
            self = this;
        Properties.own(self).each(function (ea) {
            Properties.own(self[ea].removed).each(function (each) {
                var element = self[ea].removed[each];
                if (element.isMorph) {
                    removed.push(element);
                };
            });
        })
        return removed;
    },
    collectModified: function() {
        // returns a list of morphs that were modified
        var self = this,
            modified = [];
        Properties.own(self).each(function (ea) {
            if(Properties.own(self[ea].modified).length > 0) modified.push(ea)
        })
        return modified;
    },
    collectConflicted: function() {
        // returns a list of morphs that were conflicted
        var self = this,
            conflicted = [];
        Properties.own(self).each(function (ea) {
            if(Properties.own(self[ea].conflicted).length > 0) conflicted.push(ea)
        })
        return conflicted;
    },
});

}) // end of module
