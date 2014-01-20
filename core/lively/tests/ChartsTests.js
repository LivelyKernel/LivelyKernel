module('lively.tests.ChartsTests').requires().toRun(function() {

TestCase.subclass('lively.tests.ChartsTests.ComponentTest', {
    setUp: function() {
		this.helper = new lively.tests.ChartsTests.Helper();
    },

    tearDown: function() {
        // delete all dataflow components
        // this fixes the problem that a failing test leaves components behind and affects other tests
        $world.withAllSubmorphsSelect(function(el) {
            return el instanceof lively.morphic.Charts.Component;
        }).each(function(ea) {
            ea.remove();
        });
    },
    
    testResizeOnDropBelow: function() {
        var components = this.helper.createComponents(2, [pt(0,0), pt(1,1)]);
        
        components[1].setExtent(components[1].getExtent().subPt(pt(100,0)));
        
        this.mouseEvent('down', pt(20,20), components[1]);
        this.mouseEvent('move', pt(-500,0), components[1]);
        this.mouseEvent('up', pt(-500,0), components[1]);
        
        var extent0 = components[0].getExtent();
        var extent1 = components[1].getExtent();
        
        this.assertEquals(extent0.x, extent1.x);
    },
    
    testPreviewResizeOnDropBelow: function() {
        var components = this.helper.createComponents(2, [pt(0,0), pt(1,1)]);
        
        components[1].setExtent(components[1].getExtent().subPt(pt(100,0)));
        
        debugger;
        this.mouseEvent('down', pt(20,20), components[1]);
        this.mouseEvent('move', pt(-300,20), components[1]);
        this.mouseEvent('move', pt(-305,20), components[1]);
        this.mouseEvent('move', pt(-310,20), components[1]);
        
        var extent0 = components[0].getExtent();
        var extentPrev = $morph("PreviewMorph" + components[1]).getExtent();
        
        this.assertEquals(extent0.x, extentPrev.x);
        
        this.mouseEvent('up', pt(-310,20), components[1]);
    },
    

    testFindingNeighbours: function() {
        var components = this.helper.createComponents(2);
        var firstComponent = components[0];
        var secondComponent = components[1];
        var foundComponent;
        
        // find component below
        foundComponent = firstComponent.getComponentInDirection(1);
        this.assertEquals(foundComponent, secondComponent);
        
        // find component above
        foundComponent = secondComponent.getComponentInDirection(-1);
        this.assertEquals(foundComponent, firstComponent);
        
        // find no component below
        foundComponent = secondComponent.getComponentInDirection(1);
        this.assertEquals(foundComponent, null);
        
        //find no component above
        foundComponent = firstComponent.getComponentInDirection(-1);
        this.assertEquals(foundComponent, null);

    },
    
    mouseEvent: function(type, pos, target, button) {
        if (button == undefined)
            button = 0;
        
        this.doMouseEvent({type: 'mouse' + type, pos: pos, target: target, button: button});
    },
    
    testPreviewOnDrag: function() {
        var component = this.helper.createComponents(1).first();
        this.assertEquals($morph("PreviewMorph" + component), null);
        
        this.mouseEvent('down', pt(20,20), component);
        this.mouseEvent('move', pt(300,300), component);
        this.assert($morph("PreviewMorph" + component) != null);

        this.mouseEvent('up', pt(300,300), component);
        this.assertEquals($morph("PreviewMorph" + component), null);

    },
    
    testSnapToGrid: function() {
        var component = this.helper.createComponent();
        
        this.mouseEvent('down', pt(20,20), component);
        this.mouseEvent('move', pt(123,456), component);
        this.mouseEvent('up', pt(123,456), component);
        
        var position = component.getPosition();
        this.assertEquals(position.x % component.gridWidth, 0);
        this.assertEquals(position.y % component.gridWidth, 0);
    },
    
    testDragBetween: function() {
        var components = this.helper.createComponents(2);
        var newComponent = this.helper.createComponent(pt(1, 1));
        
        this.mouseEvent('down', pt(20,20), newComponent);
        this.mouseEvent('move', pt(-400,-20), newComponent);
        this.mouseEvent('move', pt(-405,-20), newComponent);
        this.mouseEvent('up', pt(-400,-20), newComponent);
        
        var position = newComponent.getPosition();
        var posBelow = components[0].getPosition().addPt(pt(0, components[0].getExtent().y + components[0].componentOffset));
        
        this.assertEquals(position, posBelow);
        
        // assert that component[1] is below the newComponent
        position = components[1].getPosition();
        posBelow = newComponent.getPosition().addPt(pt(0, newComponent.getExtent().y + components[0].componentOffset));
        
        this.assertEquals(position, posBelow);
    },
    
    testPreviewDragBetween: function() {
        var components = this.helper.createComponents(2);
        var newComponent = this.helper.createComponent(pt(1, 1));
        
        this.mouseEvent('down', pt(20,20), newComponent);
        this.mouseEvent('move', pt(-400,-20), newComponent);
        this.mouseEvent('move', pt(-405,-20), newComponent);
        
        // assert that preview snaps below component[0]
        var preview = $morph('PreviewMorph' + newComponent);
        var position = preview.getPosition();
        var posBelow = components[0].getPosition().addPt(pt(0, components[0].getExtent().y + components[0].componentOffset));
        
        this.assertEquals(position, posBelow);
        
        // assert that component[1] is below the preview
        position = components[1].getPosition();
        posBelow = preview.getPosition().addPt(pt(0, preview.getExtent().y + components[0].componentOffset));
        
        this.assertEquals(position, posBelow);
        
        // drop it to finish the drag
        this.mouseEvent('up', pt(-400,-20), newComponent);
    },

});
Object.subclass('lively.tests.ChartsTests.Helper',
'default category', {
    createComponents: function(amount, optPositions) {
        // optPositions = pt(0, 0), pt(0, 1), pt(0, 2) would lead to three components in a column
        if (optPositions && optPositions.length != amount) {
            alert("Amount doesn't match with length of positions");
            return;
        }
        
        var components = [];
        
        for (var i = 0; i < amount; i++) {
            var aComponent = new lively.morphic.Charts.Component();
            $world.addMorph(aComponent);
            var extent = aComponent.getExtent().addPt(pt(20, 20));
            
            var newPosition;
            if (optPositions && optPositions[i]) 
                newPosition = pt(extent.x * optPositions[i].x, extent.y * optPositions[i].y);
            else
                newPosition = pt(0, i * extent.y);

            aComponent.setPosition(newPosition);
            components.push(aComponent);
        }
        
        return components;
    },
    
    createComponent: function(optPosition) {
        return this.createComponents(1, [optPosition]).first();
    },

    removeComponents: function(components) {
        components.each(function(each) {
            each.remove();
        });
    }
});
layouting

}) // end of module
