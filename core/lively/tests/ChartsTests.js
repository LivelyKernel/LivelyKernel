module('lively.tests.ChartsTests').requires().toRun(function() {

TestCase.subclass('lively.tests.ChartsTests.ComponentTest', {
    setUp: function() {
		this.helper = new lively.tests.ChartsTests.Helper();
    },

    tearDown: function() {
        // delete all dataflow components
        // this fixes the problem that a failing test leaves components behind and affects other tests
        $world.withAllSubmorphsSelect(function(el) {
            return el instanceof lively.morphic.DataFlowComponent;
        }).each(function(ea) {
            ea.remove();
        });
    },
    

    testFindingNeighbours: function() {
        var components = this.helper.createComponents(2, [pt(0, 0), pt(0, 0)]);
        var firstComponent = components[0];
        var secondComponent = components[1];
        
        // with valid directions
        // up, right, bottom, left
        var directions = [pt(0, -1), pt(1, 0), pt(0, 1), pt(-1, 0)];

        var extent = firstComponent.getExtent();
        var paddedExtent = extent.addPt(pt(100, 100));
        var middleMorphPosition = paddedExtent;
        
        // center firstComponent
        firstComponent.setPosition(middleMorphPosition);
        
        var _this = this;
        directions.each(function(each) {
            // place second in all directions
            var offset = pt(each.x * paddedExtent.x, each.y * paddedExtent.y);
            var eachPosition = middleMorphPosition.addPt(offset);
            secondComponent.setPosition(eachPosition);
            
            var foundComponent = firstComponent.getMorphInDirection(each);
            _this.assertEquals(foundComponent, secondComponent);
        });
        
        // with invalid directions
        directions = [pt(0, 0), pt(1, 1), pt(-1, -1), pt(-1, 1), pt(1, -1)];
        directions.each(function(each) {
           var comp = firstComponent.getMorphInDirection(each); 
           _this.assertEquals(comp, null);
        });

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
        var component = this.helper.createComponent(1);
        
        this.mouseEvent('down', pt(20,20), component);
        this.mouseEvent('move', pt(123,456), component);
        this.mouseEvent('up', pt(123,456), component);
        
        var position = component.getPosition();
        this.assertEquals(position.x % component.gridWidth, 0);
        this.assertEquals(position.y % component.gridWidth, 0);
    },
    
    testDragBetween: function() {
        var components = this.helper.createComponents(2);
        var newComponent = this.helper.createComponent(pt(2, 2));
        
        this.assert(false);
        // this.mouseEvent('down', pt(20,20), newComponent);
        // this.mouseEvent('move', pt(-123,20), newComponent);
        // this.mouseEvent('up', pt(-123,20), newComponent);
        
        // var position = component.getPosition();
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
            var aComponent = new lively.morphic.DataFlowComponent();
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
