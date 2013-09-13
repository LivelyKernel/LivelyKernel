module('lively.ide.SimpleBrowser').requires('lively.morphic.MorphAddons', 'lively.morphic.Widgets').toRun(function() {

lively.morphic.WindowedApp.subclass('lively.morphic.SimpleBrowser',
'initializing', {
	buildView: function(extent) {
		var panel = lively.morphic.Panel.makePanedPanel(extent, [
			['classPane', this.newList, new Rectangle(0, 0, 0.5, 0.6)],
			['methodPane', this.newList, new Rectangle(0.5, 0, 0.5, 0.6)],
			['codePane', newTextPane, new Rectangle(0, 0.6, 1, 0.4)],
		]);

        lively.bindings.connect(panel.classPane, "selection", this, "setMethodList", {});
        lively.bindings.connect(panel.methodPane, "selection", this, "setMethodSourceString", {});
        
        panel.codePane.enableSyntaxHighlighting();
        panel.codePane.evalEnabled = true;
        panel.codePane.doSave = function() {
            this.cachedTextString = null;
            this.savedTextString = this.textString;
            if (panel.methodPane.selection) {
                alertOK('eval'); 
                this.tryBoundEval('this.' + panel.methodPane.selection + ' = ' + this.savedTextString)
            }
        }
        
		this.panel = panel;
		panel.ownerWidget = this;

		this.updateClassesList();

		return panel;
	}
},
'actions', {
    openIn: function openIn(world, pos, ext) {
        var extent = ext || pt(640, 480),
            panel = this.buildView(extent),
            window = world.addFramedMorph(panel, 'Simple Code Browser');
        if (pos) window.setPosition(pos);
        if (world.currentScene) world.currentScene.addMorph(window); // FIXME
        panel.ownerApp = this;
        this.view = window;
        return window;
    },
    reset: function reset() {
        this.panel.classPane.setList([]);
    },
    setMethodList: function setMethodList(aClass) {
        if(!aClass) {
            this.panel.methodPane.setList([]);
            return;
        }
        var names = Properties.allOwnPropertiesOrFunctions(aClass.prototype, 
                        function(obj, prop) {return typeof obj[prop] == 'function'});
        names.sort();
        var list = this.panel.methodPane.setList(names);
        this.panel.codePane.doitContext = aClass.prototype;
    },
    setMethodSourceString: function setMethodSourceString(aMethodName) {
        if(!aMethodName) {
            this.panel.codePane.setTextString('');
            return;
        }
        var method = this.panel.classPane.selection.prototype[aMethodName];
        this.panel.codePane.setTextString(Function.prototype.toString.call(method));
    },
	updateClassesList: function updateClassesList() {
        var cls = classes(true);
        var displayName = function(a) {
            var name = a.name || a.displayName || a.type;
            var i = name.lastIndexOf('.');
            if(i >= 0)
                name = name.substr(i) + ' (' + name + ')';
            else {
                if(a.type) {
                    if(a.type.indexOf('.') >= 0)
                        name = name + ' (' + a.type + ')';
                } else if(a.displayName) {
                    if(a.displayName.indexOf('.') >= 0)
                        name = name + ' (' + a.displayName + ')';
                }
            }
            return name;
        }
        cls.sort(function(a,b){return displayName(a) <= displayName(b) ? -1 : 1});
        var list = this.panel.classPane;
        list.renderFunction = displayName;
        list.setList(cls);
    }
},
'constructors', {
    newList: function newList(extent) {
        return new lively.morphic.List(extent);
    }
}
)
}) // end of module