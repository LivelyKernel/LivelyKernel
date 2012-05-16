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

        if (sibling.getPartsBinMetaInfo().revisionOnLoad == parent.getPartsBinMetaInfo().revisionOnLoad) {
            return false;
        }

        var myDiffList = this.diffTo(parent),
            siblingDiffList = sibling.diffTo(parent);

        resultList = myDiffList.diffAgainst(siblingDiffList);

        return resultList;

    },
    parseDiffTo: function(otherMorph, optBlackList) {
        var blacklist = ["getTextChunks", "getShape", "getPartsBinMetaInfo", "getTransform", "getRichText"];
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
        return this.getPartItem().loadPart(false).part;
    },
    findDerivationParent: function (optScope) {
        //returns the nearest ancestor in line that can be found in scope or world
        if (!this.derivationIds) return undefined;

        var scope = optScope || $world,
            result = undefined,
            commonIds = new Array(),
            self = this;

        scope.withAllSubmorphsDo(function (ea) {
            var idsShouldContain = ea.derivationIds.concat([ea.id]);
            // var tempCommonIds = self.derivationIds.intersect(ea.derivationIds);
            // if (tempCommonIds.equals(ea.derivationIds)
                // && tempCommonIds.length <= self.derivationIds.length
                // && tempCommonIds.length > commonIds.length) {
                // commonIds = tempCommonIds;
                // result = ea;
            // }
            if (self.derivationIds.intersect(idsShouldContain).length == idsShouldContain.length)
                result = ea
         })

        return result;
    },
    findDerivationSibling: function (optScope) {
        //returns the nearest sibling in line that can be found in scope or world
        if (!this.derivationIds) return undefined;
        var scope = optScope || $world,
            result = undefined,
            commonIds = new Array(),
            self = this;

        optScope.withAllSubmorphsDo(function (ea) {
            var tempCommonIds = self.derivationIds.intersect(ea.derivationIds);
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
                return new AtomicDiff(this.type, this.newValue, otherDiff.newValue);
            } else if (this.newValue.equals(otherDiff.newValue)) {
                return undefined;
            } else {
                return new AtomicDiff(this.type, this.newValue, otherDiff.newValue);
            }
        } else {
            if (this.type == 'script') {
                if (this.newValue.toString() == otherDiff.newValue.toString()) {
                    return undefined;
                } else {
                    return new AtomicDiff(this.type, this.newValue, otherDiff.newValue)
                }
            } else {
                if (this.newValue == otherDiff.newValue) {
                    return undefined;
                } else {
                    return new AtomicDiff(this.type, this.newValue, otherDiff.newValue)
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
            added: this.joinDiffs(otherDiff.added, given.added),
            removed: this.joinDiffs(diffRemoved.removed, given.removed),
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
                result.conflicted[ea].push(new AtomicDiff("removed", "submorph", {}, self.removed[ea]))
            } else {
                result.removed[ea] = self.removed[ea]
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
                d && (modified.conflicted[ea] = d);
            }
        })
        Properties.own(otherDiff.modified).each(function (ea) {
            if (!self.modified[ea]) {
                modified.updated[ea] = new AtomicDiff(otherDiff.modified[ea].type, otherDiff.modified[ea].oldValue, otherDiff.modified[ea].newValue);
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
            self[ea] = otherList[ea];
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
            modified = this.collectModified(),
            removed = this.collectRemoved(),
            added = this.collectAdded(),
            result = new DiffList();

        Properties.own(otherList).each(function (ea) {
            var against = new Diff(),
                curId = undefined;
            Properties.own(self).each(function (each) {
                if (self[each].matchingId == otherList[ea].matchingId) {
                    var r = self[each].diffAgainst(otherList[ea], modified, added, removed, result[each])
                    if (r) result[each] = r;
                    curId = each
                }
            })
            if (!curId && !otherList[ea].isEmpty()) {
                var parId;
                curId = Properties.own(self).find(function (each) {
                    if (removed.intersect(self[each].removed).length >= 0) {
                        parId = each;
                        return true
                    }
                    else return false
                })
                result[curId] = result[curId] || {"added": {}, "removed": {}, "updated": {}, "conflicted": {}};
                result[curId].conflicted[ea] = new AtomicDiff("submorph", {}, self[parId].removed[otherList[ea].matchingId])
            }
        })
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
            added.pushAll(self[ea].added);
        })
        return added;
    },
    collectRemoved: function() {
        // returns a list of morphs that were removed
        var removed = [],
            self = this;
        Properties.own(self).each(function (ea) {
            removed.pushAll(self[ea].removed);
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