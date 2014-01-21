module('lively.tests.ChartsTests').requires().toRun(function() {

TestCase.subclass('lively.tests.ChartsTests.ComponentTest', {
    setUp: function() {
		this.helper = new lively.tests.ChartsTests.Helper();
    },
    testFanInInputs: function() {
        // Test whether the FanIn Components gets as many input data as there are components above
        
        var components = this.helper.createComponents(3,[pt(0,0),pt(1,0),pt(2,0)]);
        var fanIn = new lively.morphic.Charts.FanIn();
        $world.addMorph(fanIn);
        fanIn.setPosition(pt(0,300));
        fanIn.setExtent(pt(components[2].getPosition().x + components[2].getExtent().x,250));
        
        components.each(function(ea) {
            ea.data = 42;
            ea.arrows[0].activate();
        });
        
        this.assertEquals(fanIn.data.length, 3);
        
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
    
    testNotify: function() {
        // test that following components are notified
        
        var components = this.helper.createComponents(3);
        components[0].arrows[0].activate();
        components[1].arrows[0].activate();
        
        components[0].data = 42;
        components[0].notifyNextComponent();
        
        this.assertEquals(components[1].data, 42);
        this.assertEquals(components[2].data, 42);
    },
    
    testNoNotifyWhenError: function() {
        // test that propagation is stopped, when an error occurs in the flow
        
        var components = this.helper.createComponents(3);
        components[0].arrows[0].activate();
        components[1].arrows[0].activate();
        // components[1] will always fail to update itself
        components[1].updateComponent = function() {
            throw "Error";
        }
        
        components[0].data = 123;
        components[1].data = 142;
        components[2].data = 42;
        
        // do not let test fail because of thrown error
        try {
            components[0].notifyNextComponent();
        } catch(e) {}
        
        // assert that components[2] is not affected
        this.assertEquals(components[2].data, 42);
        
    },
    
    testNoNotifyWhenDeactivated: function() {
        // test that no data is propagated, when the arrow is not activated
        
        var components = this.helper.createComponents(2);
        components[0].data = "newData";
        components[0].notifyNextComponent();
        
        this.assertEquals(components[1].data, null);
    },
    
    testResizeOnDropBelow: function() {
        // test that component resizes on drop below a component
        
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
        // test that preview has size of component above before drop below
        
        var components = this.helper.createComponents(2, [pt(0,0), pt(1,1)]);
        
        components[1].setExtent(components[1].getExtent().subPt(pt(100,0)));
        
        this.mouseEvent('down', pt(20,20), components[1]);
        this.mouseEvent('move', pt(-300,20), components[1]);
        this.mouseEvent('move', pt(-305,20), components[1]);
        
        var extent0 = components[0].getExtent();
        var extentPrev = $morph("PreviewMorph" + components[1]).getExtent();
        
        // finish dragging before assert, so that morph is dropped even if the test fails
        this.mouseEvent('up', pt(-310,20), components[1]);
        
        // preview should have been as wide as component above
        this.assertEquals(extent0.x, extentPrev.x);
    },
    

    testFindingNeighbours: function() {
        // test that correct neighbours are found
        
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
        // test that preview appears and disappears while dragging
        
        // there is no preview
        var component = this.helper.createComponents(1).first();
        this.assertEquals($morph("PreviewMorph" + component), null);
        // preview appears
        this.mouseEvent('down', pt(20,20), component);
        this.mouseEvent('move', pt(300,300), component);
        this.assert($morph("PreviewMorph" + component) != null);

        // preview disappears
        this.mouseEvent('up', pt(300,300), component);
        this.assertEquals($morph("PreviewMorph" + component), null);

    },
    
    testSnapToGrid: function() {
        // test that component snaps to a grid position
        
        var component = this.helper.createComponent();
        
        this.mouseEvent('down', pt(20,20), component);
        this.mouseEvent('move', pt(123,456), component);
        this.mouseEvent('up', pt(123,456), component);
        
        var position = component.getPosition();
        
        this.assertEquals(position.x % component.gridWidth, 0);
        this.assertEquals(position.y % component.gridWidth, 0);
    },
    testSettingExtentSnapsToGrid: function() {
        // test that the omponent snaps to the grid after resizing
        
        var component = this.helper.createComponent();
        component.setExtent(component.getExtent().addPt(pt(20,20)));
        
        // invoke this event manually, since this is normally called by the resize halo
        component.onResizeEnd();
        
        var extent = component.getExtent();
        
        this.assertEquals(extent.x % component.gridWidth, 0);
        this.assertEquals(extent.y % component.gridWidth, 0);
    },

    testNoInput: function() {
        // test that refreshing data does not fail when there is no component above
        
        var component = this.helper.createComponent();
        component.notify();
        
        this.assertEquals(component.data, null);
    },

    
    testDragBetween: function() {
        // test that component creates space between components and snaps into that gap
        
        var components = this.helper.createComponents(2);
        var newComponent = this.helper.createComponent(pt(1, 1));
        
        this.mouseEvent('down', pt(20,20), newComponent);
        this.mouseEvent('move', pt(-400,-20), newComponent);
        this.mouseEvent('move', pt(-405,-20), newComponent);
        this.mouseEvent('up', pt(-400,-20), newComponent);
        
        // assert that newComponent is below the component[0]
        var position = newComponent.getPosition();
        var posBelow = components[0].getPosition().addPt(pt(0, components[0].getExtent().y + components[0].componentOffset));
        
        this.assertEquals(position, posBelow);
        
        // assert that component[1] is below the newComponent
        position = components[1].getPosition();
        posBelow = newComponent.getPosition().addPt(pt(0, newComponent.getExtent().y + components[0].componentOffset));
        
        this.assertEquals(position, posBelow);
    },
    
    testPreviewDragBetween: function() {
        // test that the preview creates space between two components
        
        var components = this.helper.createComponents(2);
        var newComponent = this.helper.createComponent(pt(1, 1));
        
        // drag new component between the two others
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
