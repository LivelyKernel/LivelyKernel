module('lively.tests.ChartsTests').requires('lively.morphic.Charts').toRun(function() {

TestCase.subclass('lively.tests.ChartsTests.ComponentTest',
'setup/teardown', {
    
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
        
        // delete the dashboard, if it exists
        var dashboard = $morph("Dashboard");
        if (dashboard) dashboard.remove();
    },
}, 'component functionality', {
    
    test_FIX_ME_MorphCreator: function() {
        //
        // this test is depricated and should be rewritten!!
        //
        
        // data of script should be sent to morphCreator which adds morphs to the data
        // var scriptComponent = this.helper.createComponent();
        // var morphCreator = this.helper.createComponent(pt(0, 1), "MorphCreator");

        // scriptComponent.arrows[0].activate();
        // morphCreator.arrows[0].activate();
        
        // scriptComponent.data = [10];
        // scriptComponent.notifyNextComponent();
        
        // var morph = morphCreator.data[0].morphs[Properties.own(morphCreator.data[0].morphs)[0]];
        
        // this.assertEquals(scriptComponent.data[0], 10);
        // this.assertEquals(morphCreator.data[0], 10);
        // this.assert(morph instanceof lively.morphic.Morph);
    }
    
}, 'connection line', {
    
    testToggleWithTarget: function() {
        var components = this.helper.createComponents(2);
        
        // there is no line before activation
        this.assertEquals(components[0].arrows[0].connectionLine, null);
        
        components[0].arrows[0].activate();
        
        // there is a line after activation
        this.assert(components[0].arrows[0].connectionLine != null);
        
        components[0].arrows[0].deactivate();
        
        // there is no line after deactivation
        this.assertEquals(components[0].arrows[0].connectionLine, null);
    },


    
    testToggleWithoutTarget: function() {
        var component = this.helper.createComponent();
        
        // there is no line before activation
        this.assertEquals(component.arrows[0].connectionLine, null);
        
        component.arrows[0].activate();
        
        // there is no line after activation
        this.assertEquals(component.arrows[0].connectionLine, null);
        
        component.arrows[0].deactivate();
        
        // there is no line after deactivation
        this.assertEquals(component.arrows[0].connectionLine, null);
    },
    
    testDrawIncomingLineOnDragBelow: function() {
        var components = this.helper.createComponents(2, [pt(0,0), pt(1,1)]);
        components[0].arrows[0].activate();
        
        // there is no line before dragging
        this.assertEquals(components[0].arrows[0].connectionLine, null);
        
        this.drag([pt(-40,20), pt(-400,20)], components[1]);
        
        // there is a line after dragging
        this.assert(components[0].arrows[0].connectionLine != null);
    },
    
    testRemoveIncomingLineOnDragAway: function() {
        var components = this.helper.createComponents(2);
        components[0].arrows[0].activate();
        
        // there is a line before dragging
        this.assert(components[0].arrows[0].connectionLine != null);
        
        this.drag([pt(40,20), pt(600,20)], components[1]);
        
        // there is no line after dragging
        this.assertEquals(components[0].arrows[0].connectionLine, null);
    },
    
    testRefreshLineOnDragBetween: function() {
        var components = this.helper.createComponents(3, [pt(0,0), pt(0,1), pt(1,1)]);
        
        components[0].arrows[0].activate();
        components[2].arrows[0].activate();
        
        // there is a line between component 0 and 1
        this.assert(components[0].arrows[0].connectionLine != null);
        this.assertEquals(components[0].arrows[0].target, components[1]);
        
        this.drag([pt(0,-50), pt(-405,-50)], components[2]);
        
        // there is a line between 0 and 2
        this.assert(components[0].arrows[0].connectionLine != null);
        this.assertEquals(components[0].arrows[0].target, components[2]);
        
        // there is a line between 2 and 1
        this.assert(components[2].arrows[0].connectionLine != null);
        this.assertEquals(components[2].arrows[0].target, components[1]);
    },
    
    testRefreshLineOnDragFromBetween: function() {
        var components = this.helper.createComponents(3);
        
        components[0].arrows[0].activate();
        components[1].arrows[0].activate();
        
        // there is a line between component 0 and 1
        this.assert(components[0].arrows[0].connectionLine != null);
        this.assertEquals(components[0].arrows[0].target, components[1]);
        
        // there is a line between component 1 and 2
        this.assert(components[1].arrows[0].connectionLine != null);
        this.assertEquals(components[1].arrows[0].target, components[2]);
        
        this.drag([pt(50,20), pt(405,20)], components[1]);
        
        // there is a line between component 0 and 2
        this.assert(components[0].arrows[0].connectionLine != null);
        this.assertEquals(components[0].arrows[0].target, components[2]);
        
        // component 1 has no line anymore
        this.assertEquals(components[1].arrows[0].connectionLine, null);
    },
    
    testRefreshLineOnDeleteFromBetween: function() {
        var components = this.helper.createComponents(3);
        
        components[0].arrows[0].activate();
        components[1].arrows[0].activate();
        
        // there is a line between component 0 and 1
        this.assert(components[0].arrows[0].connectionLine != null);
        this.assertEquals(components[0].arrows[0].target, components[1]);
        
        // there is a line between component 1 and 2
        this.assert(components[1].arrows[0].connectionLine != null);
        this.assertEquals(components[1].arrows[0].target, components[2]);
        
        components[1].remove();
        
        // there is a line between component 0 and 2
        this.assert(components[0].arrows[0].connectionLine != null);
        this.assertEquals(components[0].arrows[0].target, components[2]);
    }
}, 'dragging', {
    
    testDragBetween: function() {
        // test that component creates space between components and snaps into that gap
        var components = this.helper.createComponents(2);
        var newComponent = this.helper.createComponent(pt(1, 1));
        
        this.drag([pt(-400,-20), pt(-405,-20)], newComponent);
        
        // assert that newComponent is below the component[0]
        var position = newComponent.getPosition();
        var posBelow = components[0].getGlobalScrollBounds().bottomLeft().addXY(0, components[0].componentOffset);
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
        
        // drag new component between the two others without dropping
        this.drag([pt(-400,-20), pt(-405,-20)], newComponent, false);
        
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
        this.mouseEvent('up', pt(-405,-20), newComponent);
    },
    
    testPreviewOnDrag: function() {
        // test that preview appears and disappears while dragging
        
        // there is no preview
        var component = this.helper.createComponents(1).first();
        this.assertEquals($morph("PreviewMorph" + component), null);
        
        // preview appears
        this.drag([pt(300,300)], component, false);
        this.assert($morph("PreviewMorph" + component) != null);

        // preview disappears
        this.mouseEvent('up', pt(300,300), component);
        this.assertEquals($morph("PreviewMorph" + component), null);

    },
}, 'grid', {
    
    testSnapToGrid: function() {
        // test that component snaps to a grid position
        
        var component = this.helper.createComponent();
        
        this.drag([pt(123,456)], component);
        
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
}, 'fan', {
    
    testFanInInputs: function() {
        // Test whether the FanIn Components gets as many input data as there are components above
        
        var components = this.helper.createComponents(3,[pt(0,0), pt(1,0), pt(2,0)]);
        var fanIn = new lively.morphic.Charts.FanIn();
        $world.addMorph(fanIn);
        fanIn.setPosition(pt(0,300));
        fanIn.setExtent(pt(components[2].getPosition().x + components[2].getExtent().x, 250));
        
        components.each(function(ea) {
            ea.data = 42;
            ea.arrows[0].activate();
        });
        
        this.assertEquals(fanIn.data.length, 3);
        
    },
    
    testFanOutDataFlow : function(){
        var componentTop = this.helper.createComponent();
        var fanOut = new lively.morphic.Charts.FanOut();
        fanOut.setPosition(pt(0,300));
        $world.addMorph(fanOut);
        var componentsBottom = this.helper.createComponents(2,[pt(0,2),pt(1,2)]);
        componentTop.arrows[0].activate();
        componentTop.data=42;
        
        fanOut.setExtent(pt(800,50));
       
        //drag componentBottom to create and active arrow of FanOut
        this.drag([pt(10,10)], componentsBottom[0]);
        this.drag([pt(10,10)], componentsBottom[1]);
       
        this.assertEquals(componentsBottom[0].data, 42);
        this.assertEquals(componentsBottom[1].data, 42);
    },
    
    testFanOutMoving : function(){
        
        var fanOut = new lively.morphic.Charts.FanOut();
        $world.addMorph(fanOut);
        fanOut.setPosition(pt(0,600));

        var components = this.helper.createComponents(3,[pt(0,0),pt(0,1),pt(0,3)]);
        
        components[1].arrows[0].activate();
        components[0].arrows[0].activate();
        //drag componentBottom to create and active arrow of FanOut
        this.drag([pt(10,10)], components[2]);

        components[0].data = 42;
        components[0].notifyNextComponent();
        
        components[1].data = components[1].data+1;
        components[1].notifyNextComponent();
        
        this.assertEquals(components[2].data, 43);

        //move fanOut up
        this.drag([pt(10,10),pt(20,-500)], fanOut);

        components[0].data = 8;
        components[0].notifyNextComponent();
        
        this.assertEquals(components[2].data, 8);
    },
    testFanOutArrows: function() {
        
        var fanOut = new lively.morphic.Charts.FanOut();
        $world.addMorph(fanOut);
        fanOut.setPosition(pt(0,200));
        fanOut.onResizeStart();
        fanOut.setExtent(pt(1000, fanOut.getExtent().y));
        fanOut.onResizeEnd();

        var components = this.helper.createComponents(3, [pt(0,2), pt(1,2), pt(2,2)]);
        
        // drag componentBottom to create and active arrow of FanOut
        components[0].refreshData();
        components[1].refreshData();
        components[2].refreshData();

        components[0].remove();
        
        this.assertEquals(fanOut.arrows.length, 2);

        // move component[1] away
        this.drag([pt(10, 10), pt(1500,0)], components[1]);
        
        this.assertEquals(fanOut.arrows.length, 1);
        
        // resize fanOut so that component[2] is no longer below it
        fanOut.onResizeStart();
        fanOut.setExtent(pt(500, fanOut.getExtent().y));
        fanOut.onResizeEnd();
        
        this.assertEquals(fanOut.arrows.length, 0);
    },
    
}, 'notification', {
    
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
    
     testNoInput: function() {
        // test that refreshing data does not fail when there is no component above
        
        var component = this.helper.createComponent();
        component.notify();
        
        this.assertEquals(component.data, null);
    },
}, 'resizing', {
    
    testResizeOnDropBelow: function() {
        // test that component resizes on drop below a component
        
        var components = this.helper.createComponents(2, [pt(0,0), pt(1,1)]);
        
        components[1].setExtent(components[1].getExtent().subPt(pt(100,0)));
    
        this.drag([pt(-500,0)], components[1]);
        
        var extent0 = components[0].getExtent();
        var extent1 = components[1].getExtent();
        
        this.assertEquals(extent0.x, extent1.x);
    },
    
    testPreviewResizeOnDropBelow: function() {
        // test that preview has size of component above before drop below
        
        var components = this.helper.createComponents(2, [pt(0,0), pt(1,1)]);
        
        components[1].setExtent(components[1].getExtent().subPt(pt(100,0)));
        this.drag([pt(-300,20), pt(-305,20)], components[1], false);
        
        var extent0 = components[0].getExtent();
        var extentPrev = $morph("PreviewMorph" + components[1]).getExtent();
        
        // finish dragging before assert, so that morph is dropped even if the test fails
        this.mouseEvent('up', pt(-310,20), components[1]);
        
        // preview should have been as wide as component above
        this.assertEquals(extent0.x, extentPrev.x);
    },
}, 'neighbor interaction', {

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
}, 'helper', {
    
    mouseEvent: function(type, pos, target, button) {
        if (button == undefined)
            button = 0;
        
        this.doMouseEvent({type: 'mouse' + type, pos: pos, target: target, button: button});
    },
    
    drag: function(via, component, drop) {
        if (drop == undefined) {
            drop = true;
        }
        
        this.mouseEvent('down', pt(0,0), component);
        
        var _that = this;
        via.each( function(ea) {
            _that.mouseEvent('move', ea, component);
        });
        if (drop) {
            this.mouseEvent('up', via.last(), component);
        }
    }
},
'layout components', {
    
    testLinearLayoutCreatesMorphs: function() {
		var component = this.helper.createComponent();
        $world.addMorph(component);
        
	    component.arrows[0].activate();
        var data = [{Test: 10}]
	    data[0].morph = new lively.morphic.Box(new rect(0, 0, 10, 10));
	    data[0].morph.setFill(Color.red);
	    component.data = data;
	    
	    var linearLayout = new lively.morphic.Charts.DataFlowComponent(new lively.morphic.Charts.LinearLayout());
	    linearLayout.setPosition(pt(10, 400));
	    $world.addMorph(linearLayout);
	    
	    component.notifyNextComponent();
	    
	    this.assertEquals(component.data[0], data[0]);
        this.assertEquals(linearLayout.data[0], data[0]);
        this.assert(linearLayout.data[0].morph instanceof lively.morphic.Morph);
    },
    
    testFreeLayoutCreatesMorphs: function() {
		var component = this.helper.createComponent();
	
		$world.addMorph(component);
        component.arrows[0].activate();
        
		var morph = new lively.morphic.Box(new rect(0, 0, 10, 10));
		morph.setFill(Color.red);
		morph.setPosition(pt(132, 56));
		var data = [{test: 10, morphs: {morph: morph}}]
		component.data = data;
		
	    var freeLayout = new lively.morphic.Charts.DataFlowComponent(new lively.morphic.Charts.Canvas());
	    freeLayout.setPosition(pt(10, 250));
	    $world.addMorph(freeLayout);
	    
	    component.notifyNextComponent();
	    
	    var morph = freeLayout.data[0].morphs[Properties.own(freeLayout.data[0].morphs)[0]];
        this.assertEquals(component.data[0], data[0]);
        this.assertEquals(freeLayout.data[0], data[0]);
        this.assert(morph instanceof lively.morphic.Morph);
        this.assertEquals(morph.getPosition(), pt(132, 56));
    },
});

AsyncTestCase.subclass('lively.tests.ChartsTests.AsyncComponentTest',
'setup/teardown', {
    
    setUp: function($super) {
        $super();
		this.helper = new lively.tests.ChartsTests.Helper();
    },
    
    tearDown: function($super) {
        $super();
        
        // delete all dataflow components
        // this fixes the problem that a failing test leaves components behind and affects other tests
        $world.withAllSubmorphsSelect(function(el) {
            return el instanceof lively.morphic.Charts.Component;
        }).each(function(ea) {
            ea.remove();
        });
        
        // delete the dashboard, if it exists
        var dashboard = $morph("Dashboard");
        if (dashboard) dashboard.remove();
    },
}, 
'script',{
    testCodeEditorEval : function(){
        var components = this.helper.createComponents(2);

        components[0].arrows[0].activate();
        components[0].content.codeEditor.setTextString("data='testdata'");
        components[1].content.codeEditor.setTextString("data");
        
        var inited = false;
        var _this = this;
        setTimeout(function() {
            components[0].content.codeEditor.withAceDo(function() { inited = true; });
        }, 100);
        
        // wait for the code editor to be initialized
        this.waitFor(function() { return inited }, 10, function() {
            
            components[0].notify();
            
            _this.assertEquals(components[0].data, "testdata");
            _this.assertEquals(components[1].data, "testdata");
            _this.done();
        });
    }
    
});
TestCase.subclass('lively.tests.ChartsTests.Helper',
'default category', {
    createComponents: function(amount, optPositions, optClass) {
        // optPositions = pt(0, 0), pt(0, 1), pt(0, 2) would lead to three components in a column
        // optClass can be "Script", "MorphCreator" etc.
        if (!Object.isArray(optPositions)) {
            // probably, only one optional parameter was provided; swap the parameters
            var _tmp = optClass;
            optClass = optPositions;
            optPositions = _tmp;
        }
        
        if (optPositions && optPositions.length != amount) {
            alert("Amount doesn't match with length of positions");
            return;
        }
        if (!optClass || !Object.isString(optClass)) {
            optClass = "Script"
        }
        
        var components = [];
        
        for (var i = 0; i < amount; i++) {
            var aComponent = new lively.morphic.Charts.DataFlowComponent(new lively.morphic.Charts[optClass]());
            
            var extent = aComponent.getExtent().addPt(pt(aComponent.componentOffset, aComponent.componentOffset));
            
            var newPosition;
            if (optPositions && optPositions[i]) 
                newPosition = pt(extent.x * optPositions[i].x, extent.y * optPositions[i].y);
            else
                newPosition = pt(0, i * extent.y);

            aComponent.setPosition(newPosition);
            components.push(aComponent);
        }
        
        components.each(function(comp) {
            $world.addMorph(comp);
        });
        
        return components;
    },
    
    createComponent: function(optPosition, optClass) {
        if (optPosition && !(optPosition instanceof lively.Point)) {
            var _tmp = optPosition
            optPosition = optClass;
            optClass = _tmp;
        }
        return this.createComponents(1, [optPosition], optClass).first();
    },

    removeComponents: function(components) {
        components.each(function(each) {
            each.remove();
        });
    },
    getAndDropWidget: function() {
        var interactionArea = $world.get("InteractionArea");
        var targetPos = interactionArea.getPositionInWorld().addPt(pt(50, 50));
        
        // open the first widget in hand
        var widget = interactionArea.getContextMenuComponents()[0].create();
        widget.openInHand();
        
        // drag and drop the widget into the InteractionArea
        this.doMouseEvent({type: 'mousemove', pos: targetPos, target: $world});
        this.doMouseEvent({type: 'mouseup', pos: targetPos, target: $world});
        
        return widget;
    },
    createDashboard: function() {
        var dashboard = new lively.morphic.Charts.Dashboard({}).openInWorld();
        dashboard.update();
        return dashboard;
    },

});

TestCase.subclass('lively.tests.ChartsTests.UtilsTest',
'default category', {
    testAggregateBy: function() {
        var sampleData = [
            {country: "Germany", continent : "Europe", population: 80000000},
            {country: "Spain", continent : "Europe"},
            {country: "England", continent : "Europe"},
            
            {country: "China", continent : "Asia", population: 100},
            {country: "Japan", continent : "Asia", population: 200},
            {country: "India", continent : "Asia", population: 30},
            {country: "Korea", continent : "Asia", population: 50},
            
            {country: "USA", continent: "North America"},
            {country: "Canada", continent: "North America"}
        ];
        
        var expectedData = [
            {continent: "Europe", children: [
                {country: "Germany", continent : "Europe", population: 80000000},
                {country: "Spain", continent : "Europe"},
                {country: "England", continent : "Europe"}
            ]},
            
            {continent: "Asia", children: [
                {country: "China", continent : "Asia", population: 100},
                {country: "Japan", continent : "Asia", population: 200},
                {country: "India", continent : "Asia", population: 30},
                {country: "Korea", continent : "Asia", population: 50}
            ]},
            
            {continent: "North America", children: [
                {country: "USA", continent: "North America"},
                {country: "Canada", continent: "North America"}
            ]}
        ];
        expectedData.totalLength = 12;
        
        var aggregatedData = lively.morphic.Charts.Utils.aggregateBy(sampleData, "continent");

        this.assertEquals(expectedData.totalLength, aggregatedData.totalLength);
        var aggregatedAsia = aggregatedData.find(function(ea) { return ea.continent == "Asia" });
        var expectedAsia = expectedData.find(function(ea) { return ea.continent == "Asia" });
        
        this.assertEquals(aggregatedAsia.length, expectedAsia.length);
        this.assertEquals(aggregatedAsia.get("population", "sum"), 380);
        
        var aggregatedGermany = aggregatedData.find(function(ea) { return ea.continent == "Europe" })
            .children.find(function(ea) { return ea.country == "Germany"});
        var expectedGermany = expectedData.find(function(ea) { return ea.continent == "Europe" })
            .children.find(function(ea) { return ea.country == "Germany"});
        
        this.assertEquals(aggregatedGermany.population, expectedGermany.population);
        this.assertEquals(aggregatedGermany.parent.continent, "Europe");
    },
    
    testSubtreeJoin: function() {
        var employmentData = [
            {2006: 56,  2007: 55.70000076, country: "Afghanistan"},
            {2006: 51.40000153, 2007: 51.40000153, country: "Albania"},
        ];

        var cellphoneData = [
            {2006: 35.072609372, 2007: 41.4160788358, country: "Afghanistan"},
            {2006: 103.7751487718, 2007: 116.6229320736, country: "Albania"},
            {2006: 76.6446034137, 2007: 82.4719584424, country: "United States"}
        ];
        
        var populationData = [
            {2006: 100000, 2007: 100001, country: "Germany"},
            {2006: 23421348, 2008: 9320736, country: "Albania"},
            {2006: 34137, 2007: 19584424, country: "United States"}
        ];
        
        var expectedResult = [
            { 
                country: "Afghanistan",
                cellphones: { 2006: 35.072609372, 2007: 41.4160788358 },
                employment: { 2006: 56,  2007: 55.70000076},
            },
            {
                country: "Albania",
                cellphones: { 2006: 103.7751487718, 2007: 116.6229320736 },
                employment: { 2006: 51.40000153, 2007: 51.40000153 },
                population: {2006: 23421348, 2008: 9320736}
            },
            {
                country: "Germany",
                population: {2006: 100000, 2007: 100001}
            },
            {
                country: "United States",
                cellphones: { 2006: 76.6446034137, 2007: 82.4719584424 },
                population: {2006: 34137, 2007: 19584424}
            }
        ];
        
        var dataToJoin = [employmentData, cellphoneData, populationData];
        var joinedAttributes = ["employment", "cellphones", "population"];
        var join = lively.morphic.Charts.Utils.join(dataToJoin, "country", joinedAttributes);
        join = join.sort(function(a, b) {
            return a.country > b.country;
        });
        
        this.assertEquals(expectedResult[0].cellphones[2006], join[0].cellphones[2006]);
        this.assertEquals(expectedResult[1].employment[2007], join[1].employment[2007]);
        this.assertEquals(join[3].employment, undefined);
        this.assertEquals(expectedResult.length, join.length);
        this.assertEquals(expectedResult[1].country, join[1].country);
        
        this.assertEquals(expectedResult[2].country, join[2].country);
        this.assertEquals(expectedResult[2].population[2007], join[2].population[2007]);
        this.assertEquals(expectedResult[2].employment, undefined);
        
    },
    testSimpleJoin: function() {
        var bipData = [{country: "D", bip:4}, {country: "EN", bip:2}, {country: "FR", bip: 3}];
        var popData = [{country: "D", pop:8}, {country: "EN", pop:10}];
        
        var expectedData = [
            {bip: 4, country: "D", pop: 8},
            {bip: 2, country: "EN", pop: 10},
            {bip: 3, country: "FR"}
            ];
        
        var joined = lively.morphic.Charts.Utils.join([bipData, popData], "country");
        
        joined = joined.sort(function(a, b) {
            return a.country > b.country;
        });
        
        this.assertEquals(joined[0].bip, expectedData[0].bip);
        this.assertEquals(joined[1].pop, expectedData[1].pop);
        this.assertEquals(joined[2].country, expectedData[2].country);
    }
});

TestCase.subclass('lively.tests.ChartsTests.EntityTest',
'default category', {
    getSampleData: function() {
      return [
          {
            author: {name: "author1"},
            id: "commitsha1",
            files: [{name: "file1"}, {name: "file2"}, {name: "file3"}]
          },
          {
            author: {name: "author2"},
            id: "commitsha2",
            files: [
              {name: "file2"},
              {
                name: "file4",
                commitSpecificInfo: 1
            }
            ]
          },
          { author: {name: "author3"},
            id: "commitsha3",
            files: [{
                name: "file4",
                commitSpecificInfo: 2
                }]
          },
          { author: {name: "author3"},
            id: "commitsha4",
            files: [{name: "file5"}]
          }
        ];
    },
    
    testEntityCreation: function() {
        // create entity with name, source and ID
        var data = this.getSampleData();
        var EntityFactory = new lively.morphic.Charts.EntityFactory();
        
        var Commit = EntityFactory.createEntityTypeFromList("Commit", data, "id");
        this.assertEquals(Commit.getAll().length, 4);
        
        var Author = Commit.extractEntityFromAttribute("Author", "name", "author");
        this.assertEquals(Author.getAll().length, 3);
        
        var File = Commit.extractEntityFromList("File", "name" , "files");
        this.assertEquals(File.getAll().length, 5);
        
        var totalFileChanges = File.getAll().map(function (file) { return file.getCommits()} ).flatten().length;
        this.assertEquals(totalFileChanges, 7);
    },
    
    testReferenceReplacement: function() {
        var data = this.getSampleData();
        var EntityFactory = new lively.morphic.Charts.EntityFactory();
        
        var Commit = EntityFactory.createEntityTypeFromList("Commit", data, "id");
        var Author = Commit.extractEntityFromAttribute("Author", "name", "author");
        var File = Commit.extractEntityFromList("File", "name" , "files");
        
        File.getAll().each(function(eachFile) {
            eachFile.testAttribute = true;
        });
        
        var allFilesHaveAttribute = Commit.getAll().pluck("files").flatten().every(function(eachFile) {
           return eachFile.testAttribute == true;
        });
        this.assertEquals(allFilesHaveAttribute, true);
        
        Author.getAll().each(function(eachAuthor) {
            eachAuthor.testAttribute = true;
        });
        
        var allAuthorsHaveAttribute = Commit.getAll().pluck("author").every(function(eachAuthor) {
           return eachAuthor.testAttribute == true;
        });
        
        this.assertEquals(allAuthorsHaveAttribute, true);
    },
    
    testPreservingOfEntityIndependentData: function() {
        var data = this.getSampleData();
        var EntityFactory = new lively.morphic.Charts.EntityFactory();
        
        var Commit = EntityFactory.createEntityTypeFromList("Commit", data, "id");
        var Author = Commit.extractEntityFromAttribute("Author", "name", "author");
        var File = Commit.extractEntityFromList("File", "name" , "files");
    },
    
    testStateLessEntities: function() {
        // create entity with name, source and ID
        var data = this.getSampleData();
        var EntityFactory = new lively.morphic.Charts.EntityFactory();
        
        var Commit = EntityFactory.createEntityTypeFromList("Commit", data, "id");
        this.assertEquals(Commit.getAll().length, 4);
        
        var Author = Commit.extractEntityFromAttribute("Author", "name", "author");
        this.assertEquals(Author.getAll().length, 3);
        
        var File = Commit.extractEntityFromList("File", "name" , "files");
        this.assertEquals(File.getAll().length, 5);
        
        var totalFileChanges = File.getAll().map(function (file) { return file.getCommits()} ).flatten().length;
        this.assertEquals(totalFileChanges, 7);
        
        
        // data = this.getSampleData();
        EntityFactory = new lively.morphic.Charts.EntityFactory();
        
        Commit = EntityFactory.createEntityTypeFromList("Commit", data, "id");
        this.assertEquals(Commit.getAll().length, 4);
        
        Author = Commit.extractEntityFromAttribute("Author", "name", "author");
        this.assertEquals(Author.getAll().length, 3);
        
        File = Commit.extractEntityFromList("File", "name" , "files");
        this.assertEquals(File.getAll().length, 5);
        
        totalFileChanges = File.getAll().map(function (file) { return file.getCommits()} ).flatten().length;
        this.assertEquals(totalFileChanges, 7);
    }
    
});

AsyncTestCase.subclass('lively.tests.ChartsTests.AsyncDashboardTest',
'creation', {
    
    testCreateDashboard: function() {
        var script = this.helper.createComponent();
        script.content.codeEditor.setTextString("env.db = \"test\"");
        
        var inited = false;
        var _this = this;
        setTimeout(function() {
            script.content.codeEditor.withAceDo(function() { inited = true; });
        }, 100);
        
        // wait for the code editor to be initialized
        this.waitFor(function() { return inited }, 10, function() {
            script.notify();
            script.notifyDashboard();
            
            // test that dashboard exists
            var dashboard = $morph("Dashboard");
            _this.assert(dashboard != undefined);
            _this.done();
        });
    },
    testCreateViewer: function() {
        var script = this.helper.createComponent();
        script.content.codeEditor.setTextString("env.db = \"test\"");
        
        var inited = false;
        var _this = this;
        setTimeout(function() {
            script.content.codeEditor.withAceDo(function() { inited = true; });
        }, 100);
        
        // wait for the code editor to be initialized
        this.waitFor(function() { return inited }, 10, function() {
            script.notify();
            script.notifyDashboard();
            
            // test that a viewer for env.db exists
            var viewer = $world.get("dbViewer");
            _this.assert(viewer != undefined);
            _this.done();
        });
    },
    testComponentNotification: function() {
        // create a dashboard and an interaction variable
        var dashboard = this.helper.createDashboard();
        var widget = this.helper.getAndDropWidget();
        var varName = widget.getName();
        
        // create a script that uses this variable
        var script = this.helper.createComponent();
        script.content.codeEditor.setTextString(varName);
        
        var inited = false;
        var _this = this;
        setTimeout(function() {
            script.content.codeEditor.withAceDo(function() { inited = true; });
        }, 100);
        
        // wait for the code editor to be initialized
        this.waitFor(function() { return inited }, 10, function() {
            // update the script once to register the variable usage
            script.notify();
            script.notifyDashboard();
            script.notified = false;
            
            // override onContentChanged to notice the notification
            var oldOnContentChanged = script.onContentChanged;
            script.onContentChanged = function() {
                oldOnContentChanged.apply(script, arguments);
                this.notified = true;
            }
            
            // set the widgets value to change the interaction variable
            widget.setValue(1);
            
            // wait some seconds because setValue calls onContentChanged and this is asynchronous
            setTimeout(function(){
                // test that the script was notified
                _this.assert(script.notified);
               
                // do not use the variable anymore
                script.content.codeEditor.setTextString("");
                script.notify();
                script.notifyDashboard();
                
                // reset notification flag
                script.notified = false;
                // set the widgets value to change the interaction variable
                widget.setValue(0);
                
                // wait some seconds because setValue calls onContentChanged and this is asynchronous
                setTimeout(function() {
                    // test that the script was not notified this time
                    _this.assert(!script.notified);
                    
                    _this.done();
                }, 30);
            }, 30);
        });
    },
    testAppropriateViewerSelection: function() {
        var script = this.helper.createComponent();
        script.content.codeEditor.setTextString("env.db = \"test\"; env.canvas = [];");
        
        var inited = false;
        var _this = this;
        setTimeout(function() {
            script.content.codeEditor.withAceDo(function() { inited = true; });
        }, 100);
        
        // wait for the code editor to be initialized
        this.waitFor(function() { return inited }, 10, function() {
            script.notify();
            script.notifyDashboard();
            
            var db = $world.get("dbViewer");
            var canvas = $world.get("canvasViewer");
            var interaction = $world.get("interactionViewer");
            
            _this.assert(db.content instanceof lively.morphic.Charts.JsonViewer, "Not a JsonViewer");
            _this.assert(canvas.content instanceof lively.morphic.Charts.Canvas, "Not a FreeLayout");
            _this.assert(interaction.content instanceof lively.morphic.Charts.InteractionPanel, "Not an InteractionPanel");
            _this.done();
        });
    }
    
}, 'setup/teardown', {
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
        
        // delete the dashboard, if it exists
        var dashboard = $morph("Dashboard");
        if (dashboard) dashboard.remove();
    },
});

TestCase.subclass('lively.tests.ChartsTests.DashboardTest',
'creation', {
    testCreateInteractionPanel: function() {
        var dashboard = this.helper.createDashboard();
        
        // test that interaction area is created
        var interactionArea = dashboard.get("interactionViewer");
        this.assert(interactionArea != undefined);
    },
    testInteractionVariableLifecycle: function() {
        var dashboard = this.helper.createDashboard();
        var widget = this.helper.getAndDropWidget();
        var varName = widget.getName();
        
        // test that the appropriate variable has been created
        this.assert(dashboard.env.interaction[varName] != undefined);
        
        // remove the container of the widget
        var container = dashboard.get(varName + "Container");
        container.remove();
        
        // test that the variable is being removed
        this.assert(dashboard.env.interaction[varName] == undefined);
    },
    testInteractionVariableRenaming: function() {
        var dashboard = this.helper.createDashboard();
        var widget = this.helper.getAndDropWidget();
        var varName = widget.getName();
        
        // test that the appropriate variable exists
        this.assert(dashboard.env.interaction[varName] != undefined);
        
        var newVarName = "newName";
        widget.setName(newVarName);
        
        // test that the old variable was removed
        this.assert(dashboard.env.interaction[varName] == undefined);
        
        // test that the renamed variable exists
        this.assert(dashboard.env.interaction[newVarName] != undefined);
        
    },
    
}, 'setup/teardown', {
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
        
        // delete the dashboard, if it exists
        var dashboard = $morph("Dashboard");
        if (dashboard) dashboard.remove();
    },
});

TestCase.subclass('lively.tests.ChartsTests.CoordinateSystemTest',
'transformation', {
    testTransformationFunction: function() {
        var coordinateSystem = new lively.morphic.Charts.CoordinateSystem(lively.rect(0, 0, 200, 200));
        var element = new lively.morphic.Box(lively.rect(0, 0, 20, 20));
        // set the position explicitely
        element.setPosition(pt(0, 0));
        
        // add the element to the coordinate system
        coordinateSystem.addElement(element);
        
        // test that the element is positioned in the bottom left corner
        this.assert(element.getPosition().equals(pt(0, 200)));
    }
});

TestCase.subclass('lively.tests.ChartsTests.MorphCreatorTest',
'setup/teardown', {
    
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
        
        // delete the dashboard, if it exists
        var dashboard = $morph("Dashboard");
        if (dashboard) dashboard.remove();
    },
    
    testSubmorphHandling: function() {
        var creator = this.helper.createComponent("MorphCreator").content;
        var prototypeMorph = creator.getPrototypeMorph();
        
        // create submorph
        var submorph = creator.prototypeArea.getPrototypeComponents().first().create();
        submorph.isPrototypeMorph = true;
        prototypeMorph.addMorph(submorph);
        
        var mappingCategory = creator.getMappingCategoryFor(submorph);
        this.assert(mappingCategory, "No new category was created for submorph");
        
        // remove submorph
        submorph.remove();
        setTimeout(function() {
            mappingCategory = creator.getMappingCategoryFor(submorph);
            this.assert(!mappingCategory, "MappingCategory was not removed when submorph was removed");
        }, 0);
        
    },
    testSimpleMapping: function() {
        var script = this.helper.createComponent();
        script.arrows[0].activate();
        script.data = [1, 2, 3];
        
        var morphCreator = this.helper.createComponent("MorphCreator", pt(0, 1));
        var prototypeMorph = morphCreator.content.getPrototypeMorph();
        var mappingCategory = morphCreator.content.getMappingCategoryFor(prototypeMorph);
        var lines = mappingCategory.mappingLines;

        // fill the fields with some mapping values
        lines[0].attributeField.setTextString("height");
        lines[0].valueField.setTextString("datum * datum");
        
        script.notifyNextComponent();
        
        var _this = this;
        var expectedValues = [1, 4, 9];
        expectedValues.each(function(expectedValue, index) {
            _this.assertEquals(
                morphCreator.data[index].getExtent().y,
                expectedValue,
                index + ". value false in simple range"
            );
        });
    },
    
    testLineManagement: function() {
        var creator = this.helper.createComponent("MorphCreator").content;
        var prototypeMorph = creator.getPrototypeMorph();
        var mappingCategory = creator.getMappingCategoryFor(prototypeMorph);
        var lines = mappingCategory.mappingLines;
        
        // There should be only one initial line
        this.assertEquals(mappingCategory.mappingLines.length, 1, "More than one initial mapping line");
        
        // Setup one mapping
        lines[0].attributeField.setTextString("height");
        
        // Now there should be a new line
		this.assertEquals(mappingCategory.mappingLines.length, 2, "no new line was created");
        
        // Clear the first line
        lines[0].attributeField.setTextString("");
        
        // The additional line should be gone
        this.assertEquals(mappingCategory.mappingLines.length, 1, "unused line was not removed");
    },
    testReOrdering: function() {
        var creator = this.helper.createComponent("MorphCreator").content;
        var prototypeMorph = creator.getPrototypeMorph();
        var mappingCategory = creator.getMappingCategoryFor(prototypeMorph);
        var lines = mappingCategory.mappingLines;

        // create 3 lines
        for (var i = 0; i < 3; i++) {
            lines[i].attributeField.setTextString("attr" + i);
        }
        
        // clear the first line
        var empty = lines[0];
        lines[0].attributeField.setTextString("");
        
        var last = mappingCategory.getLastLine();
       
        // the empty line should now be the last one
        this.assertEquals(empty, last, "re-ordering failed");
    },
    testGetMappings: function() {
        var component = this.helper.createComponent("MorphCreator");
        var prototypeMorph = component.content.getPrototypeMorph();
        var mappingCategory = component.content.getMappingCategoryFor(prototypeMorph);
        var lines = mappingCategory.mappingLines;
        
        // fill the fields with some mapping values
        for (var i = 0; i < 4; i++) {
            lines[i].attributeField.setTextString("attr" + i);
            lines[i].valueField.setTextString("value" + i);
        }
        
        // create an array with the expected mappings
        var expected = [];
        for (var i = 0; i < 4; i++) {
            expected.push({
                attribute: "attr" + i,
                value: "value" + i
            });
        }
        
        // get the real mappings
        var mappings = mappingCategory.getAllMappings();
        
        // those should equal the expected ones
        this.assertEquals(JSON.stringify(mappings), JSON.stringify(expected));
    },
    testRange: function() {
        var script = this.helper.createComponent();
        script.arrows[0].activate();
        script.data = [1, 2, 3];
        
        var morphCreator = this.helper.createComponent("MorphCreator", pt(0, 1));
        var prototypeMorph = morphCreator.content.getPrototypeMorph();
        var mappingCategory = morphCreator.content.getMappingCategoryFor(prototypeMorph);
        var lines = mappingCategory.mappingLines;

        // fill the fields with some mapping values
        lines[0].attributeField.setTextString("height");
        lines[0].valueField.setTextString("range([100, 200])(datum)");
        
        script.notifyNextComponent();
        
        var _this = this;
        var expectedValues = [100, 150, 200];
        expectedValues.each(function(expectedValue, index) {
            _this.assertEquals(
                morphCreator.data[index].getExtent().y,
                expectedValue,
                index + ". value false in simple range"
            );
        });
        
        // more complex valueFunction
        script.data = [1, 4, 16]; // and their sqrt: [1, 2, 4]
        lines[0].valueField.setTextString("range([100, 200])(Math.sqrt(datum))");
        
        script.notifyNextComponent();
        
        expectedValues = [100, 133.33, 200];
        expectedValues.each(function(expectedValue, index) {
            _this.assertEquals(
                Math.floor(morphCreator.data[index].getExtent().y),
                Math.floor(expectedValue),
                index + ". value false in complex range"
            );
        });
        
    },
    testExtractMappings: function() {
        
        var creator = this.helper.createComponent("MorphCreator").content;
        var sampleData = {
            population: 100,
            hiv: 2,
            caption: "Caption",
            complex: {anAttribute: 1234}
        };
        
        var mappings = [
            {attribute: "x", value: "population"},
            {attribute: "y", value: "Math.sqrt(hiv)"},
            {attribute: "height", value: "complex.anAttribute + 100"},
            {attribute: "width", value: "population + Math.sqrt(hiv) + complex.anAttribute + 100 * population"},
            {attribute: "label", value: "caption + '!'"},
            {attribute: "position", value: "notExistentAttribute"},
        ];

        var dependencies = creator.extractDependencies(mappings, sampleData).pluck("dependentAttributes");
        
        var expectedDependencies = [
            ["population"],
            ["hiv"],
            ["complex"],
            ["population", "hiv", "complex"],
            ["caption"],
            []
        ];
        
        var _this = this;
        expectedDependencies.map(function(dependency, index) {
            _this.assertEquals(JSON.stringify(dependency), JSON.stringify(dependencies[index]));
        });
    }
});
    

}) // end of module
