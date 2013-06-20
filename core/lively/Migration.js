// with migrationLevel 3
if (LivelyMigrationSupport.documentMigrationLevel < 3) {
    LivelyMigrationSupport.addModuleRename(
        'lively.morphic.BindingsExtension',
        'lively.bindings.GeometryBindings', 3);
    LivelyMigrationSupport.addModuleRename(
        'lively.morphic.BindingsTests',
        'lively.bindings.GeometryBindingsTest', 3);
}

LivelyMigrationSupport.addModuleRename('lively.ide.LocalBrowser', 'lively.ide', 7);
LivelyMigrationSupport.addModuleRename('lively.ide.ChangeSet', 'lively.ide', 7);

if (LivelyMigrationSupport.documentMigrationLevel < 7) {
    LivelyMigrationSupport.addWorldJsoTransform(function(jso) {
        for (var id in jso.registry) {
            var obj = jso.registry[id];
            if (!obj || !obj.__LivelyClassName__ || obj.__LivelyClassName__ !== "ChangeSet") continue;
            jso.registry[id] = {
                isChangeSetReplacement: true,
                toString: function() {
                    return "This is a replacement of a lkml ChangeSet object."
                         + "ChangeSets are no longer used."
                }
            }
        }
        return jso;
    });
}
