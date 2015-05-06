module('lively.experimental.ExperimentalFeatures').requires('cop.Layers', 'lively.morphic.Widgets').toRun(function() {


cop.create("ExperimentalFeaturesLayer").refineClass(lively.morphic.World, {

    getExperimentalFeatures: function() {
        // todo: make tim happy, by adding more experimental features!
        try {
            var s = lively.LocalStorage.get("ExperimentalFeatures")
            return JSON.parse(s) || []
        } catch(e) {
            return [];
        }
    },

    activateFeature: function(feature) {
        alertOK("activate experimental feature " + feature)
        this.getModuleForFeature(feature).load(true);
        var all = this.getExperimentalFeatures()
        debugger
        if (!all.include(feature)) {
            all.push(feature)
            lively.LocalStorage.set("ExperimentalFeatures", JSON.serialize(all))
        }
        var layer = this.getLayerForFeature(feature);
        if (layer) {
            layer.beGlobal()
            alertOK("activate " + layer.name)
        }
    },
    deactivateFeature: function(feature) {
        alertOK("deactivate experimental feature " + feature)
        var all = this.getExperimentalFeatures()
        if (all.include(feature)) {
            all.remove(feature)
            lively.LocalStorage.set("ExperimentalFeatures", JSON.serialize(all))
        }
        var layer = this.getLayerForFeature(feature);
        if (layer) {
            layer.beNotGlobal()
            alertOK("deactivate " + layer.name)
        }

    },
    getLayerForFeature: function(feature) {
        var layer =  Global[feature +"Layer"]
        if (layer instanceof Layer)
            return layer
        return null
    },
    getModuleForFeature: function(feature) {
        return module("lively.experimental." + feature)
    },
    isFeatureActive: function(feature) {
        // return $world.isFeatureActive("TextPaste")
        return this.getExperimentalFeatures().include(feature)
    },
    morphMenuItems: function() {
        var items = cop.proceed()
        var pref = items.detect(function(ea) {
            return ea[0] == "Preferences"
        })
        var world = this;
        pref[1].push(["Experimental Features", {
            getExperimentalFeatures: function() {
                return new WebResource(URL.codeBase.withFilename("lively/experimental"))
                    .getSubElements(1)
                    .subDocuments
                    .invoke('getURL')
                    .invoke('filename')
                    .collect(function(ea) {
                        return ea.replace(/\.js$/,"")
                    })
            },
            getItems: function() {
                return this.getExperimentalFeatures().collect(function(ea){
                    var isLoaded = world.isFeatureActive(ea)
                    return [(isLoaded ? "[X] " : "[ ] ") + ea, function() {
                        if (isLoaded) {
                            world.deactivateFeature(ea)
                        } else {
                            world.activateFeature(ea)
                        }
                    }]
                })
            }
        }])
        return items
    },
}).beGlobal();

}) // end of module
