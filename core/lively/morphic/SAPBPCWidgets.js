module('lively.morphic.SAPBPCWidgets').requires('lively.morphic.Core', 'lively.morphic.Events', 'lively.WidgetsTraits', 'lively.morphic.Styles').toRun(function() {

lively.morphic.Morph.subclass('lively.morphic.SAPButton',
'settings', {
    style: {
        enableGrabbing: false,
        enableDropping: false,
        borderColor: Color.neutral.lightGray,
        borderWidth: 1,
        borderRadius: 5,
        padding: Rectangle.inset(0,3),
        fill: new lively.morphic.LinearGradient(
            [{offset: 0, color: Color.gray.mixedWith(Color.white, 0.2)},
            {offset: 0.4, color: Color.gray.mixedWith(Color.white, 0.9)},
            {offset: 0.6, color: Color.gray.mixedWith(Color.white, 0.9)},
            {offset: 1, color: Color.gray.mixedWith(Color.white, 0.3)}],
            "NorthSouth")
    },
    labelStyle: {
        borderWidth: 0,
        fill: null,
        padding: Rectangle.inset(0,3),
        fontSize: 10,
        align: 'center',
        fixedWidth: true,
        fixedHeight: true,
        textColor: Color.black
    }
},
'initializing', {
    initialize: function($super, bounds, labelString) {
        $super(this.defaultShape());
        if (bounds) this.setBounds(bounds);

        this.value = false;
        this.toggle = false;
        this.isActive = true;
        this.normalFill = this.getFill();
        this.lighterFill = this.normalFill.lighter();
        this.setFill(this.normalFill);

        this.label = new lively.morphic.Text(this.getExtent().extentAsRectangle(), labelString);
        this.addMorph(this.label);
        this.label.beLabel(this.labelStyle);
    },
},
'accessing', {
    setLabel: function(label) {
        this.label.setTextString(label);
        this.label.setExtent(this.getExtent());
        // FIXME what about labelStyle defined in my prototype?
        this.label.applyStyle({
            align: 'center',
            fixedHeight: true,
            fixedWidth: true,
            clipMode: 'hidden',
            padding: Rectangle.inset(0,0)
        });
        return this;
    },
    getLabel: function(label) { return this.label.textString },

    setValue: function(bool) {
        this.value = bool;
        // buttons should fire on mouse up
        if (!bool || this.toggle) lively.bindings.signal(this, 'fire', bool);
        this.changeAppearanceFor(bool);
    },
    setExtent: function($super, extent) {
        // FIXME use layout! spaceFill!
        $super(extent);
        this.label && this.label.setExtent(extent)
    },
    setPadding: function(padding) { this.label && this.label.setPadding(padding) },
},
'styling', {
    changeAppearanceFor: function(value) {
        this.setFill(value ? this.lighterFill : this.normalFill);
    },
},
'events', {

    onMouseDown: function (evt) {
        if (this.isActive && evt.isLeftMouseButtonDown()
            && !this.toggle && !evt.isCommandKey()) {
            this.setValue(true);
        }
        return false;
    },
    onMouseUp: function(evt) {
        if (this.isActive && evt.isLeftMouseButtonDown()
                && !evt.isCommandKey()) {
            var newValue = this.toggle ? !this.value : false;
            this.setValue(newValue);
            return false;
        }
        return false;
    },
    simulateButtonClick: function() {
        var world = this.world() || lively.morphic.World.current(),
            hand = world.firstHand();
        function createEvent() {
            return {
                isLeftMouseButtonDown: Functions.True,
                isRightMouseButtonDown: Functions.False,
                isCommandKey: Functions.False,
                isAltDown: Functions.False,
                world: world,
                hand: hand,
                getPosition: function() { return hand.getPosition() }
            }
        }
        this.onMouseDown(createEvent());
        this.onMouseUp(createEvent());
    },
},
'menu', {
    morphMenuItems: function($super) {
        var self = this, items = $super();
        items.push([
            'set label', function(evt) {
            $world.prompt('Set label', function(input) {
                if (input !== null)
                    self.setLabel(input || '');
            }, self.getLabel());
        }])
        return items;
    },
});


}) // end of module