module('lively.morphic.tests.Canvas').requires('lively.morphic.tests.Helper', 'lively.morphic.AdditionalMorphs').toRun(function() {

AsyncTestCase.subclass("lively.morphic.tests.CanvasAccessTest",
'running', {
    setUp: function(run) {
        var width = 4, height = 3,
            testCanvasData = [
                0,0,0,255, 0,0,0,255,       0,0,0,255,       0,0,0,255,
                0,0,0,255, 200,200,200,255, 190,190,190,255, 0,0,0,255,
                0,0,0,255, 0,0,0,255,       0,0,0,255,       0,0,0,255];
        this.sut = new lively.morphic.CanvasMorph();
        this.sut.putImageData(testCanvasData, width, height);
        run.delay(0);
    },
},
'testing', {

    testColorAt: function() {
        var result = this.sut.colorAt(5*4);
        this.assertEquals([200,200,200,255], result);
        this.done();
    },

    testSameColor: function() {
        var col1 = [0,20,30,255],
            col2 = [0,20,30,255],
            col3 = [255,255,255,255];
        this.assert(this.sut.isSameColor(col1, col1), '1');
        this.assert(this.sut.isSameColor(col1, col2), '2');
        this.assert(!this.sut.isSameColor(col1, col3), '3');
        this.done();
    },

    testGetRows: function() {
        var result = this.sut.getRows();
        this.assertEquals([
            [[0,0,0,255],[0,0,0,255],      [0,0,0,255],      [0,0,0,255]],
            [[0,0,0,255],[200,200,200,255],[190,190,190,255],[0,0,0,255]],
            [[0,0,0,255],[0,0,0,255],      [0,0,0,255],      [0,0,0,255]]
        ], result);
        this.done();
    },

    testGetCols: function() {
        var result = this.sut.getCols();
        this.assertEquals([
            [[0,0,0,255],[0,0,0,255],[0,0,0,255]],
            [[0,0,0,255],[200,200,200,255],[0,0,0,255]],
            [[0,0,0,255],[190,190,190,255],[0,0,0,255]],
            [[0,0,0,255],[0,0,0,255],[0,0,0,255]]
        ], result);
        this.done();
    },

    testFindFirstRow: function() {
        var cvs = this.sut;
        var result = cvs.findFirstIndex(
            function(row) { return cvs.isSameColor(row[1], [200,200,200,255]); },
            cvs.getRows(), false);
        this.assertEquals(1, result);
        this.done();
    },

    testFindFirstColReverse: function() {
        var cvs = this.sut;
        var result = cvs.findFirstIndex(
            function(col) { return cvs.isSameColor(col[1], [200,200,200,255]); },
            cvs.getCols(), true);
        this.assertEquals(2, result);
        this.done();
    },

    testReplaceColor: function() {
        var cvs = this.sut;
        cvs.replaceColor([0,0,0,255], [20,20,20,255]);
        this.delay(function() {
            var result = this.sut.getRows();
            this.assertEquals([
                [[20,20,20,255],[20,20,20,255],   [20,20,20,255],   [20,20,20,255]],
                [[20,20,20,255],[200,200,200,255],[190,190,190,255],[20,20,20,255]],
                [[20,20,20,255],[20,20,20,255],   [20,20,20,255],   [20,20,20,255]]
            ], result);
            this.done();
        }, 0);
    },

    testReplaceColorInRect: function() {
        var cvs = this.sut;
        cvs.replaceColor([0,0,0,255], [20,20,20,255], lively.rect(0,0,2,3));
        this.delay(function() {
            var result = cvs.toImageDataArray(),
                expected = [
                    20,20,20,255, 20,20,20,255,    0, 0, 0,255,     0,0,0,255,
                    20,20,20,255, 200,200,200,255, 190,190,190,255, 0,0,0,255,
                    20,20,20,255, 20,20,20,255,    0, 0, 0,255,     0,0,0,255];
            this.assertEquals(expected, result);
            this.done();
        }, 0);
    },

    testCropColor: function() {
        var cvs = this.sut;
        cvs.cropColor([0,0,0,255], Rectangle.inset(0,1,1,0));
        this.delay(function() {
            var result = cvs.toImageDataArray(),
                expected = [  0,  0,  0,255,   0,  0,  0,255, 0,0,0,255,
                            200,200,200,255, 190,190,190,255, 0,0,0,255];
            this.assertEquals(expected, result);
            this.done();
        }, 0);
    },

    testPositionToColor: function() {
        var cvs = this.sut;
        this.assertEquals([200,200,200,255], cvs.positionToColor(pt(1,1)));
        this.assertEquals([190,190,190,255], cvs.positionToColor(pt(2,1)));
        this.assertEquals([0,0,0,255], cvs.positionToColor(pt(3,2)));
        this.done();
    },

    testCreateSample: function() {
        var width = 7, height = 5, y = Color.yellow, r = Color.red,
            testCanvasData = [y,r,r,y,y,r,r,
                              r,y,y,r,r,y,y,
                              y,r,r,y,y,r,r,
                              r,y,y,r,r,y,y,
                              y,r,r,y,y,r,r],
            expected1 = [[pt(0,0),y],[pt(1,0),r],[pt(2,0),r],[pt(3,0),y],[pt(4,0),y],[pt(5,0),r],[pt(6,0),r],
                         [pt(0,1),r],[pt(1,1),y],[pt(2,1),y],[pt(3,1),r],[pt(4,1),r],[pt(5,1),y],[pt(6,1),y],
                         [pt(0,2),y],[pt(1,2),r],[pt(2,2),r],[pt(3,2),y],[pt(4,2),y],[pt(5,2),r],[pt(6,2),r],
                         [pt(0,3),r],[pt(1,3),y],[pt(2,3),y],[pt(3,3),r],[pt(4,3),r],[pt(5,3),y],[pt(6,3),y],
                         [pt(0,4),y],[pt(1,4),r],[pt(2,4),r],[pt(3,4),y],[pt(4,4),y],[pt(5,4),r],[pt(6,4),r]],
            expected2 = [[pt(0,0),y],[pt(3,0),y],[pt(6,0),r],
                         [pt(0,3),r],[pt(3,3),r],[pt(6,3),y]],
            data = testCanvasData.invoke('toTuple8Bit').flatten(),
            sut = this.sut = new lively.morphic.CanvasMorph();
        this.sut.putImageData(data, width, height);
        this.delay(function() {
            var result = sut.sampleImageData();
            this.assertEqualState(expected1, result);
            var result = sut.sampleImageData(3)
            this.assertEqualState(expected2, result);
            this.done();
        }, 0);

    },

    testCreateSample2: function() {
        var width = 4, height = 5,
            testCanvasData = [
                0,0,0,255, 0,0,0,255,       0,0,0,255,       0,0,0,255,
                0,0,0,255, 200,200,200,255, 190,190,190,255, 0,0,0,255,
                0,0,0,255, 200,200,200,255, 190,190,190,255, 0,0,0,255,
                0,0,0,255, 200,200,200,255, 190,190,190,255, 1,2,3,255,
                0,0,0,255, 0,0,0,255,       0,0,0,255,       0,0,0,255];

        var sut = this.sut = new lively.morphic.CanvasMorph();
        this.sut.putImageData(testCanvasData, width, height);
        var expected = {
            width: 2, height: 3,
            data: new Uint8ClampedArray([
                0,0,0,255, 0,0,0,255,
                0,0,0,255, 190,190,190,255,
                0,0,0,255, 0,0,0,255      ])
        }

        this.delay(function() {
            // downscales image
            var result = sut.sampleImageData2(2);
            this.assertEqualState(expected, result);
            this.done();
        }, 0);

    }

});

}) // end of module
