module('lively.morphic.Examples').requires('lively.morphic.Widgets', 'lively.morphic.MorphAddons').toRun(function() {

Object.extend(lively.morphic.Examples, {
    populateDemoWorld: function(w) {
        w.setBounds(new Rectangle(0,0, 800, 600))
        var m,
            worldBounds = w.getBounds(),
            width = worldBounds.width, height = worldBounds.height,
            morphBounds = rect(pt(200, 200), pt(width-100, height-100));

        // two stationary morphs
        this.addRect(w, new Rectangle(60, 200, 120, 90), Color.green);
        this.addText(w, new Rectangle(60, 480, 120, 25), Color.gray.lighter());
        var ellipse = this.addEllipse(w, new Rectangle(60, 340, 100, 100), Color.yellow);

var color1 = Color.random(), color2 = color1.invert();
ellipse.setFill(
    new lively.morphic.RadialGradient([
        {offset: 0, color: color1},
        {offset: 0.5, color: color2},
        {offset: 1, color: color1}], pt(0.5,0.5)))
ellipse.offset = 0.5;
ellipse.offsetChange = 0.1;
ellipse.moveWave = function() {
    try {
        var gradient = this.getFill();
        if (this.offset >= 0.8 || this.offset <= 0.1)
            this.offsetChange = -this.offsetChange
        this.offset += this.offsetChange;
        var stops = gradient.stops;
        stops[1].offset = this.offset;
        this.setFill(gradient)
    } catch(e) {
        alert('error in move wave ' + e)
        this.stopStepping();
    }
}.asScriptOf(ellipse, 'moveWave')
ellipse.startStepping(60, 'moveWave')



        // some random morphs that move
        m = this.addRect(w, morphBounds.randomPoint().extent(lively.Point.random(pt(100,100)).addXY(20,20)));
        this.letMorphStepAndBounce(m);
        var m = this.addRect(w, morphBounds.randomPoint().extent(lively.Point.random(pt(100,100)).addXY(20,20)));
        this.letMorphStepAndBounce(m);
        var m = this.addRect(w, morphBounds.randomPoint().extent(lively.Point.random(pt(100,100)).addXY(20,20)));        
        this.letMorphStepAndBounce(m);
        var m = this.addEllipse(w, morphBounds.randomPoint().extent(lively.Point.random(pt(100,100)).addXY(20,20)));
        this.letMorphStepAndBounce(m);
        var m = this.addEllipse(w, morphBounds.randomPoint().extent(pt(100,50)), Color.random());
        this.letMorphStepAndBounce(m);

        var btn, btnX = 120, btnY = height - 40;
        btn = this.addButton(w, new Rectangle(btnX, btnY, 123, 20), 'convert to HTML')
        connect(btn, 'fire', w, 'renderWithHTML');

        btnX += width/3 - 20;
        btn = this.addButton(w, new Rectangle(btnX, btnY, 123, 20), 'convert to SVG')
        connect(btn, 'fire', w, 'renderWithSVG');

        btnX += width/3 - 20;
        btn = this.addButton(w, new Rectangle(btnX, btnY, 123, 20), 'convert to CANVAS')
        connect(btn, 'fire', w, 'renderWithCANVAS');

        btn = this.addButton(w, new Rectangle(0,0 , 123, 20), 'remove')
        connect(btn, 'fire', w, 'remove');

        m = this.addFrameRateMorph(w, new Rectangle(width-350, 0 , 350, 20))
        m.startSteppingScripts();

        return w;
    },
    createWorld: function(bounds, color) {
        var world = lively.morphic.World.createOn(document.body, bounds)
        world.setFill(color);
        return world;
    },
    addRect: function(owner, bounds, color) {
        color = color || Color.random();
        var rect = lively.morphic.Morph.makeRectangle(bounds)
        rect.applyStyle({fill: color});
        owner.addMorph(rect);
        return rect;
    },
    addEllipse: function(owner, bounds, color) {
        var ellipse = this.addRect(owner, bounds, color);
        ellipse.setShape(new lively.morphic.Shapes.Ellipse(bounds.extent().extentAsRectangle()))
        ellipse.applyStyle({fill: color});
        return ellipse;
    },
    addButton: function(owner, bounds, label) {
        var btn = new lively.morphic.Button()
        btn.label.setTextString(label)
        btn.setBounds(bounds);
        owner.addMorph(btn);
        return btn;
    },
    addText: function(owner, bounds, color) {
        var m = new lively.morphic.Text()
        m.setTextString('This is a test text!!!')
        m.setBounds(bounds);
        m.setFill(color || Color.random())
        owner.addMorph(m)
        return m;
    },

    addFrameRateMorph: function(owner, bounds) {
        var morph = new lively.morphic.FrameRateMorph();
        morph.setBounds(bounds);
        owner.addMorph(morph);
        return morph
    },
    letMorphStepAndBounce: function(morph) {
        morph.velocity = pt(Numbers.random(3, 6), Numbers.random(3, 10));
        morph.startStepping(20, 'stepAndBounce');
    },
});

}) // end of module