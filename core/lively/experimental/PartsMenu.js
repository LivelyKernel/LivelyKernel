module('lively.experimental.PartsMenu').requires().toRun(function() {
    
    
cop.create("PartsMenuLayer").refineClass(lively.morphic.World, {
    morphMenuItems: function() {
        var items = cop.proceed()
        var addPartsSpaceFromURLToMenu = function(menuItem, name, url) {
            menuItem.push([name, { getItems: function() {
                var space = lively.PartsBin.partsSpaceWithURL(url)
                space.load()
                var partItems = space.getPartItems()
                // partItems = partItems.sortBy(function(ea) { return ea.fetchLastModifiedDate().format("yyyy-mm-dd HH:MM") })
                partItems = partItems.sortBy(function(ea) { return ea.name })
                // if (partItems.length > 20) partItems = partItems.reverse().slice(0,20)
                return partItems
                    .collect(function(ea) { return [ea.name, function() {
                        ea.loadPart()
                        var m = ea.part
                        m.setPosition(pt(0,0))
                        m.openInHand()
                    }]})
                }
            }])
        }.bind(this)
        
        var menuNamed = function(name) { return items.detect(function(ea) { return ea[0] == name })}.bind(this)
        addPartsSpaceFromURLToMenu(menuNamed("Parts")[1], "Jens", URL.root.withFilename("PartsBin/Jens"))
        addPartsSpaceFromURLToMenu(menuNamed("Parts")[1], "WW/Jens", URL.root.withPath("/repository/webwerkstatt/PartsBin/Jens"))
        addPartsSpaceFromURLToMenu(menuNamed("Parts")[1], "WW/Tools", URL.root.withPath("/repository/webwerkstatt/PartsBin/Tools"))
    
        addPartsSpaceFromURLToMenu(menuNamed("Parts")[1], "Dropbox/Tools", new URL("dropbox:///Lively/PartsBin/Tools"))
        var partsMenu = menuNamed("Tools")
        var openTool = function(name, path, func) {
            return [name, function() {
                    var splitedPath = path.split("/")
                    var partName = splitedPath.pop()
                    var spaceName = splitedPath.join("/")
                    var m = $world.openPartItem(partName, spaceName);
                    m.openInWorld()
                    m.align(m.bounds().center(), $world.visibleBounds().center());
                    if (func) func(m)
                }]
        }
        partsMenu[1].push(openTool("Explore World", "PartsBin/Tools/MorphicExplorer", function(m) { m.setTarget($world)}))
        partsMenu[1].push(openTool("Manual Layouter", "PartsBin/Tools/ManualLayouter"))

        return items
    },
}).beGlobal()



}) // end of module
