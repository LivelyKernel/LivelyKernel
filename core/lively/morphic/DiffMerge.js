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



});

}) // end of module