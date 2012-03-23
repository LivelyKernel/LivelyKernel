module('lively.morphic.DiffMerge').requires().toRun(function() {

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
    newThreeWayDiff: function() {
        // performs a threeWayDiff based on the Parts PartsBin versions
        var self = this,
            parent = this.findParentPartVersion(),
            sibling = this.findCurrentPartVersion(),
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
    parsePropertiesOfDiffTo: function (otherMorph, diff, blacklist) {
        var self = this;

        Functions.all(this).withoutAll(blacklist).each(function (ea) {
            if ( ea.startsWith("get") && otherMorph[ea] && self["set"+ea.substring(3)]) {
                try {
                    if (self[ea]().equals) {
                        if(!self[ea]().equals(otherMorph[ea]())) {
                            diff[ea.substring(3)] = new AtomicDiff("property", self[ea](), otherMorph[ea]())
                        }
                    }
                    else {
                        if (self[ea]() != otherMorph[ea]()) {
                            diff[ea.substring(3)] = new AtomicDiff("property", self[ea](), otherMorph[ea]());
                        }
                    }
                }
                catch (ex) {
                    return false
                }
            }
        })
    },
    parseScriptsOfDiffTo: function (otherMorph, diff) {
        var self = this;
        Functions.own(self).each(function (ea) {
            if (otherMorph[ea]) {
                if (self[ea].toString() != otherMorph[ea].toString()) {
                    diff[ea] = new AtomicDiff("script", self[ea], otherMorph[ea])
                }
            }
            else {
                diff[ea] = new AtomicDiff("script", self[ea], otherMorph[ea])
            }
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
            var tempCommonIds = self.derivationIds.intersect(ea.derivationIds);
            if (tempCommonIds.equals(ea.derivationIds)
                //&& tempCommonIds.length <= self.derivationIds.length
                && tempCommonIds.length > commonIds.length) {
                commonIds = tempCommonIds;
                result = ea;
            }
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
        this.newValue = newValue || undefined; 
        this.oldValue = oldValue || undefined;
        return this;
    },
},
'diffing', {
    diffAgainst: function(otherDiff) {
        // performs an atomic diff diff (sic!) based on an atomic merge matrix
        if (this.newValue && typeof(this.newValue.equals) == "function") {
            if (this.newValue.equals(otherDiff.newValue)) return undefined
            else {
                return new AtomicDiff(this.type, this.newValue, otherDiff.newValue)
            }
        }
        else {
            if (this.type == 'script') {
                if (this.newValue.toString() == otherDiff.newValue.toString()) return undefined
                else { 
                    return new AtomicDiff(this.type, this.newValue, otherDiff.newValue)
                }
            }
            else {
                if (this.newValue == otherDiff.newValue) return undefined
                else { 
                    return new AtomicDiff(this.type, this.newValue, otherDiff.newValue)
                }
            }
        }
    },
});

}) // end of module