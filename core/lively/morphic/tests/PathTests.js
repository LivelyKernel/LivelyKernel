module('lively.morphic.tests.PathTests').requires('lively.morphic.tests.Morphic').toRun(function() {

lively.morphic.tests.MorphTests.subclass('lively.morphic.tests.LineTest',
'testing', {
    test00ReflectsBorderWidth: function() {
        var path = new lively.morphic.Path([pt(50,50), pt(50,100), pt(100,100)]);
        path.setBorderWidth(10);
        this.world.addMorph(path);
        
        var expected = {
            tagName: 'div', // line morph
            childNodes: [{ // extra div, svg specific
                tagName: 'div', 
                style: {top: '45px', left: '45px'},
                childNodes: [{ // shape
                    tagName: 'svg',
                    attributes: {height: '60', width: '60', viewBox: '45 45 60 60'}
                }]
            }]
        };
        this.assertNodeMatches(expected, path.renderContext().getMorphNode(), "morph, shape and viewBox reflect the borderWidth, extended by borderWidth/2 in all directions");
        this.assertEquals(rect(pt(45.0,45.0),pt(105.0,105.0)), path.shape.getBounds());  
        this.assertEquals(rect(pt(45.0,45.0),pt(105.0,105.0)), path.bounds());
    },
    test01AddMorph: function() {
        var m = new lively.morphic.Path([pt(0,0), pt(20,100), pt(100,100)])
        this.world.addMorph(m);
        var expected = {
            tagName: 'div', // line morph
            childNodes: [{
                tagName: 'div', childNodes: [{
                    tagName: 'svg', childNodes: [ // shape
                        {tagName: 'path', attributes: {
                            d: /M0[\.0]*,0\s*L20[\.0]*,100\s*L100[\.0]*,100\s*/ }}
                    ]}
                ]}
            ]};
        this.assertNodeMatches(expected, m.renderContext().getMorphNode());
        this.assertEquals(new Rectangle(-1,-1, 101, 101), m.bounds());
    },
    test02SecondPointWithNegativeY: function() {
        var m = new lively.morphic.Path([pt(0,0), pt(100,-20)])
        this.world.addMorph(m);
        
        var expected = {
            tagName: 'div', // line morph
            childNodes: [{
                tagName: 'div', 
                style: {top: '-21px', left: '-1px'},
                childNodes: [{
                    tagName: 'svg',
                    childNodes: [{tagName: 'path', attributes: {d: /M0[\.0]*,0\s*L100[\.0]*,-20\s*/}}],
                    attributes: {height: '21', width: '101', viewBox: '-1 -21 101 21'}
                }]
            }]
        };
        this.assertNodeMatches(expected, m.renderContext().getMorphNode());
        this.assertEquals(new Rectangle(-1, -21, 101, 21), m.bounds());
        this.assertEquals(new Rectangle(-1, -21, 101, 21), m.shape.getBounds());
    },
    test03aMoveControlPoint: function() {
        var m = new lively.morphic.Path([pt(0,0), pt(100,100)])
        this.world.addMorph(m);

        m.getControlPoint(1).moveBy(pt(10,10));
        var expected = {
            tagName: 'div', // line morph
            childNodes: [{
                tagName: 'div', childNodes: [{
                    tagName: 'svg', childNodes: [ // shape
                        {tagName: 'path', attributes: {d: /M0[\.0]*,0\s*L110[\.0]*,110\s*/ }}
                    ]
                }]
            }]
        };
        this.assertNodeMatches(expected, m.renderContext().getMorphNode());
        this.assertEquals(rect(pt(-1,-1),pt(110,110)), m.bounds());
    },

    test03bMoveControlPoint2AboveStart: function() {
        var m = new lively.morphic.Path([pt(0,0), pt(100,100)])
        this.world.addMorph(m);

        m.getControlPoint(1).moveBy(pt(0,-150));

        var expected = {
            tagName: 'div', // line morph
            childNodes: [{
                tagName: 'div', childNodes: [{
                    tagName: 'svg', childNodes: [ // shape
                        {tagName: 'path', attributes: {d: /M0[\.0]*,0\s*L100[\.0]*,-50\s*/ }}
                    ]
                }]
            }]
        };
        this.assertNodeMatches(expected, m.renderContext().getMorphNode());
        this.assertEquals(rect(pt(-1,-51),pt(100,0)), m.bounds());
    },
    test03cMoveControlPoint2AboveStart: function() {
        var m = new lively.morphic.Path([pt(0,0), pt(100,0)])
        this.world.addMorph(m);

        // m.getControlPoint(1).moveControlPointBy(pt(0,-150));
        m.getControlPoint(1).moveBy(pt(0,-5));
        m.getControlPoint(1).moveBy(pt(0,10));
        m.getControlPoint(1).moveBy(pt(0,-5));
        var expected = {
            tagName: 'div', // line morph
            childNodes: [{
                tagName: 'div', childNodes: [{
                    tagName: 'svg', childNodes: [ // shape
                        {tagName: 'path', attributes: {d: /M0[\.0]*,0\s*L100[\.0]*,0\s*/ }}
                    ]
                }]
            }]
        };
        this.assertNodeMatches(expected, m.renderContext().getMorphNode());
        // bounds include space for the line's extent (borderWidth), it extends to both sides of
        // line
        this.assertEquals(new Rectangle(-1,-1, 101, 1), m.bounds());
    },
    test04InsertPoint: function() {
        var m = new lively.morphic.Path([pt(0,0), pt(100,100)])
        this.world.addMorph(m);

        m.insertControlPointBetween(0, 1, pt(20, 50));

        var expected = {
            tagName: 'div', // line morph
            childNodes: [{
                tagName: 'div', childNodes: [{
                    tagName: 'svg', childNodes: [ // shape
                        {tagName: 'path', attributes: {d: /M0[\.0]*,0\s*L20[\.0]*,50\s*L100[\.0]*,100\s*/ }}
                    ]
                }]
            }]
        };
        this.assertNodeMatches(expected, m.renderContext().getMorphNode());
    },
    test05MergeControlPoints: function() {
        var m = new lively.morphic.Path([pt(0,0), pt(100,100), pt(100,120)]);
            ctrlPoint = m.getControlPoint(1);

        ctrlPoint.remove();

        this.assertEquals(pt(0,0), m.getControlPoint(0).getPos());
        this.assertEquals(pt(100,120), m.getControlPoint(0).next().getPos());

        this.assertEquals(2, m.controlPoints.length, 'ctrl point not removed');
    },


    xtest05aadjustOrigin: function() {
        var m = new lively.morphic.Path([pt(0,0), pt(0,100)])
        this.world.addMorph(m);

        m.adjustOrigin(pt(-10, -10))
        var expected = {
            tagName: 'div', // line morph
            childNodes: [
                {tagName: 'svg',
                    // attributes: {viewBox: "0 0 110 10"},
                    childNodes: [ // shape
                    {tagName: 'path', attributes: {d: /M10,10\s*L10,110\s*/ }}
                ]}
            ]};
        this.assertNodeMatches(expected, m.renderContext().getMorphNode());
        this.assertEquals(pt(-10,-10), m.getPosition(), 'morph pos');
        this.assertEquals(pt(10,10), m.getPosition(), 'shape pos');
    },
    test07ControlPointsAreStable: function() {
        var m = new lively.morphic.Path([pt(0,0), pt(100,100)]),
            ctrlPts1 = m.getControlPoints();
        m.setVertices([pt(0,0), pt(100,110), pt(100,120)]);
        var ctrlPts2 = m.getControlPoints();

        this.assertEquals(2, ctrlPts1.length, 'length 1')
        this.assertEquals(3, ctrlPts2.length, 'length 2')
        this.assertIdentity(ctrlPts1[0], ctrlPts2[0], 'ctronolpoints not identical 0');
        this.assertIdentity(ctrlPts1[1], ctrlPts2[1], 'ctronolpoints not identical 1');

        this.assertEquals(pt(0,0), ctrlPts2[0].getPos());
        this.assertEquals(pt(100,120), ctrlPts2[2].getPos());
    },
    test08GetNextAndPrevControlPoint: function() {
        var m = new lively.morphic.Path([pt(0,0), pt(100,110), pt(100,120)]);
            ctrlPoint = m.getControlPoint(0);

        this.assertEquals(pt(0,0), ctrlPoint.getPos());
        ctrlPoint = ctrlPoint.next();
        this.assertEquals(pt(100,110), ctrlPoint.getPos());
        ctrlPoint = ctrlPoint.next();
        this.assertEquals(pt(100,120), ctrlPoint.getPos());

        ctrlPoint = ctrlPoint.prev();
        this.assertEquals(pt(100,110), ctrlPoint.getPos());
    },
    test09aSetArrowHead: function() {
        var m = new lively.morphic.Path([pt(0,0), pt(100,100)]),
            arrowHead = new lively.morphic.Path([pt(0,0), pt(0,20), pt(20,10), pt(0,0)]);

        arrowHead.adjustOrigin(pt(20,10))
        m.addArrowHeadEnd(arrowHead);

        this.assertEquals(45, arrowHead.getRotation().toDegrees());
    },
    test09bArrowHeadDoesntMoves: function() {
        var m = new lively.morphic.Path([pt(0,0), pt(100,0)]),
            arrowHead = new lively.morphic.Path([pt(0,0), pt(0,20), pt(20,10), pt(0,0)]),
            expectedPosition = pt(100.0, 100.0), // off-by-0.5 fbo 2011-11-07
            expectedPosition2 = pt(100.0, -100.0); // off-by-0.5 fbo 2011-11-07

        this.world.addMorph(m);

        arrowHead.adjustOrigin(pt(20,10))
        m.addArrowHeadEnd(arrowHead);
        this.assertEquals(0, arrowHead.getRotation().toDegrees());

        m.getControlPoint(1).moveBy(pt(0,100));
        this.assertEquals(45, arrowHead.getRotation().toDegrees());
        this.assertEquals(expectedPosition, arrowHead.getPosition());
        this.assertEquals(expectedPosition, arrowHead.worldPoint(pt(0,0)), 'ctrl down, arrowhead global pos');
        
        m.getControlPoint(1).moveBy(pt(0,-200));
        this.assertEquals(-45, arrowHead.getRotation().toDegrees(), 'ctrl up, arrowhead rot');
        this.assertEquals(expectedPosition2, arrowHead.getPosition(), 'ctrl up, arrowhead pos');
        this.assertEquals(expectedPosition2, arrowHead.worldPoint(pt(0,0)), 'ctrl up, arrowhead global pos');
    },
    test10aConvertControlPointTocurve: function() {
        var m = new lively.morphic.Path([pt(0,0), pt(100,100)])
        this.world.addMorph(m);

        m.convertToCurve();

        var expected = {
            tagName: 'div', // line morph
            childNodes: [{
                tagName: 'div', childNodes: [{
                    tagName: 'svg', childNodes: [ // shape
                        {tagName: 'path', attributes: {d: /M0[\.0]*,0\s*T100[\.0]*,100\s*/ }}
                    ]
                }]
            }]
        };
        this.assertNodeMatches(expected, m.renderContext().getMorphNode());
    },

});
lively.morphic.tests.MorphTests.subclass('lively.morphic.tests.PathOriginTest',
'testing', {
    test01SettingOriginDoesNotChangeBounds: function() {
        var verts = [pt(0,0), pt(100, 0), pt(100,100), pt(0,0)],
            path = new lively.morphic.Path(verts),
            expectedBounds = new Rectangle(-1,-1, 101.0, 101.0); // can differ by +/- 1.0
        this.world.addMorph(path);
        this.assertEquals(expectedBounds, path.bounds(), 'not working at all?');
        path.adjustOrigin(pt(50,50));
        this.assertEquals(expectedBounds, path.bounds(), 'bounds after origin is wrong');
    },
    test02SubmorphIsNotAffectedByOrigin: function() {
        var verts = [pt(0,0), pt(100, 0), pt(100,100), pt(0,0)],
            path = new lively.morphic.Path(verts),
            submorph = new lively.morphic.Box(new Rectangle(10,10, 100,100));
        this.world.addMorph(path);
        this.world.addMorph(submorph);
        path.adjustOrigin(pt(50,50));
        path.addMorph(submorph);
        // adjustMorph will cause to stay submorphs at their absolute position
        this.assertEquals(pt(-39,-39), submorph.getPosition(), 'position of submorph is wrong');
    },

});

}) // end of module