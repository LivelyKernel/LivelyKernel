module('lively.morphic.Graffle').requires('lively.morphic.Events', 'lively.morphic','cop.Layers','lively.PartsBin', 'lively.LogHelper').toRun(function() {


cop.create('GraffleLayer')
    .beGlobal()
    .refineClass(lively.morphic.World, {
    get doNotSerialize() {
        return  cop.proceed().concat(['keyPressed'])
    },

    getKeysPressed: function() {
        if (!this.keyPressed)
            this.keyPressed = {}
        return this.keyPressed
    },

    onKeyUp: function(evt) {
        var char = String.fromCharCode(evt.keyCode).toLowerCase();
        this.getKeysPressed()[char] = false;
        this.updateHandLabel(evt.hand); 
        return cop.proceed(evt)
    },

    onKeyDown: function(evt) {
        var char = String.fromCharCode(evt.keyCode).toLowerCase();
        if (char.match(/[A-Za-z]/)) {
            this.getKeysPressed()[char] = true;
        }
        this.updateHandLabel(evt.hand);                

        return cop.proceed(evt)
    },

    onMouseDown: function(evt) {
        // alert("mouse down " + evt.hand)
        return cop.proceed(evt)
    },
    onDragStart: function(evt) {
        if (this.constructMorph) {
            return; // what?
        };
        if (this.getKeysPressed()["s"]) {
            this.constructMorph = new lively.morphic.Morph.makeRectangle(0,0,10,10);
            this.constructMorph.openInWorld();
            this.constructMorph.setPosition(evt.getPosition());
            this.dragStartHandPos = evt.getPosition();
        } else if (this.getKeysPressed()["t"]) {
            this.constructMorph = new lively.morphic.Text(0,0,100,20, "some text");
            this.constructMorph.openInWorld();
            this.constructMorph.setPosition(evt.getPosition());
            this.dragStartHandPos = evt.getPosition();
        } else if (this.getKeysPressed()["c"]) {
            var line = new lively.morphic.Path([pt(0,0), pt(100,100)]);
            line.isConnector = true;
            line.getControlPoints()[0].setPos(evt.getPosition());        
            line.getControlPoints()[1].setPos(evt.getPosition().addPt(pt(10,10)));        
            line.openInWorld();

            line.showControlPointsHalos();
            var halos = line.halos.select(function(ea) {
                return ea instanceof lively.morphic.PathVertexControlPointHalo
            })
            this.constructControlPointHalo = halos[1]
            if (this.constructControlPointHalo)
                this.constructControlPointHalo.onDragStart(evt)
        } else{
            return cop.proceed(evt)
        }
    },
    onDrag: function(evt) {
        if(this.constructMorph) {
            var bounds = Rectangle.unionPts([this.dragStartHandPos, evt.getPosition()])
            this.constructMorph.setBounds(bounds)
            return true
        }
        if(this.constructControlPointHalo) {
            this.constructControlPointHalo.onDrag(evt);
            return true;
        }
        return cop.proceed(evt)
    },
    onDragEnd: function(evt) {
        if(this.constructMorph) {
            this.constructMorph = null;
            return;
        }
        if(this.constructControlPointHalo) {
            this.constructControlPointHalo.onDragEnd(evt)
            this.constructControlPointHalo = null;
            return;
        }
        return cop.proceed(evt)
    },



    ensureHandLabel: function(hand) {
        // $world.firstHand().label.remove()
        // $world.firstHand().label = null
        // $world.ensureHandLabel($world.firstHand())
        // alert("hand " + hand)
        if (!hand) return;
        if (!hand.label) {
            var m = new lively.morphic.Text(new Rectangle(0,0,40,20),"hello").beLabel()
            hand.label = m;
            m.isEpiMorph = true;
            m.ignoreEvents();
            m.openInWorld();
            hand.label.updatePositionConnection = lively.bindings.connect(
                hand, '_Position', 
                m, 'setPosition', {
                converter: function(p) { 
                    return p.addPt(pt(0,10))
                }
                })

            hand.label.updatePositionConnection.isWeakConnection = true;
        }
        hand.label.openInWorld();
        return hand.label
    },
    updateHandLabel: function(hand) {

        var dict = this.getKeysPressed();
        var label = this.ensureHandLabel(hand);

        if(this.focusedMorph() !== this) {
            label.setTextString("")
            return;
        } 

        map = {s: "shape", t: "text", c: "connect"}

        var pressed = Properties.own(dict).select(function(ea) {
            return dict[ea] 
        }).collect(function(ea) {
            return map[ea]
        }).join(" ")
        label.setTextString("" + pressed)
    },


});




})