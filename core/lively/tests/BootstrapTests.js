module('lively.tests.BootstrapTests').requires('lively.TestFramework').toRun(function() {

TestCase.subclass('lively.tests.BootstrapTests.WorldDataTest',
'accessing', {
    doc: function() {
        // blank world
        var str =  "<!DOCTYPE html PUBLIC \"-//W3C//DTD XHTML 1.0 Transitional//EN\" \"http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd\">\n" +
            "<html xmlns=\"http://www.w3.org/1999/xhtml\">\n" +
            "  <head>\n" +
            "    <title>blank</title>\n" +
            "    <script>Config={isNewMorphic: true}</script>\n" +
            "    <script src=\"core/lively/bootstrap.js\"></script>\n" +
            "    <meta id=\"LivelyMigrationLevel\"><![CDATA[4]]></meta>\n" +
            "    <meta id=\"WorldChangeSet\">\n" +
            "      <code xmlns=\"http://www.w3.org/2000/svg\">\n" +
            "        <doit name=\"local requirements\" automaticEval=\"true\"><![CDATA[[]]]></doit>\n" +
            "        <doit name=\"initializer\"><![CDATA[]]></doit>\n" +
            "      </code>\n" +
            "    </meta>\n" +
            "    <meta id=\"LivelyJSONWorld\"><![CDATA[{\n" +
            "  \"id\": 0,\n" +
            "  \"registry\": {\n" +
            "    \"0\": {\n" +
            "      \"submorphs\": [\n" +
            "        {\n" +
            "          \"__isSmartRef__\": true,\n" +
            "          \"id\": 1\n" +
            "        }\n" +
            "      ],\n" +
            "      \"scripts\": [],\n" +
            "      \"shape\": {\n" +
            "        \"__isSmartRef__\": true,\n" +
            "        \"id\": 12\n" +
            "      },\n" +
            "      \"id\": 1,\n" +
            "      \"eventHandler\": {\n" +
            "        \"__isSmartRef__\": true,\n" +
            "        \"id\": 19\n" +
            "      },\n" +
            "      \"grabbingEnabled\": false,\n" +
            "      \"droppingEnabled\": true,\n" +
            "      \"showsMorphMenu\": true,\n" +
            "      \"halosEnabled\": true,\n" +
            "      \"__layered_draggingEnabled__\": true,\n" +
            "      \"_Position\": {\n" +
            "        \"__isSmartRef__\": true,\n" +
            "        \"id\": 20\n" +
            "      },\n" +
            "      \"priorExtent\": {\n" +
            "        \"__isSmartRef__\": true,\n" +
            "        \"id\": 21\n" +
            "      },\n" +
            "      \"hands\": [\n" +
            "        {\n" +
            "          \"__isSmartRef__\": true,\n" +
            "          \"id\": 1\n" +
            "        }\n" +
            "      ],\n" +
            "      \"changeSet\": {\n" +
            "        \"__isSmartRef__\": true,\n" +
            "        \"id\": 22\n" +
            "      },\n" +
            "      \"__SourceModuleName__\": \"Global.lively.morphic.ObjectMigration\",\n" +
            "      \"eventStartPos\": {},\n" +
            "      \"worldMenuOpened\": true,\n" +
            "      \"draggingEnabled\": true,\n" +
            "      \"clickedOnMorphTime\": 1323814652451,\n" +
            "      \"statusMessages\": [],\n" +
            "      \"lastAlert\": \"\",\n" +
            "      \"prevScroll\": [\n" +
            "        0,\n" +
            "        0\n" +
            "      ],\n" +
            "      \"showsHalos\": false,\n" +
            "      \"__LivelyClassName__\": \"lively.morphic.World\"\n" +
            "    },\n" +
            "    \"1\": {\n" +
            "      \"submorphs\": [],\n" +
            "      \"scripts\": [],\n" +
            "      \"shape\": {\n" +
            "        \"__isSmartRef__\": true,\n" +
            "        \"id\": 2\n" +
            "      },\n" +
            "      \"id\": 2,\n" +
            "      \"eventHandler\": {\n" +
            "        \"__isSmartRef__\": true,\n" +
            "        \"id\": 9\n" +
            "      },\n" +
            "      \"droppingEnabled\": false,\n" +
            "      \"halosEnabled\": false,\n" +
            "      \"_world\": {\n" +
            "        \"__isSmartRef__\": true,\n" +
            "        \"id\": 0\n" +
            "      },\n" +
            "      \"eventsAreIgnored\": true,\n" +
            "      \"_HandStyle\": \"default\",\n" +
            "      \"_PointerEvents\": \"none\",\n" +
            "      \"_Position\": {\n" +
            "        \"__isSmartRef__\": true,\n" +
            "        \"id\": 10\n" +
            "      },\n" +
            "      \"priorExtent\": {\n" +
            "        \"__isSmartRef__\": true,\n" +
            "        \"id\": 11\n" +
            "      },\n" +
            "      \"owner\": {\n" +
            "        \"__isSmartRef__\": true,\n" +
            "        \"id\": 0\n" +
            "      },\n" +
            "      \"_Rotation\": 0,\n" +
            "      \"_Scale\": 1,\n" +
            "      \"__SourceModuleName__\": \"Global.lively.morphic.Events\",\n" +
            "      \"scrollFocusMorph\": {\n" +
            "        \"__isSmartRef__\": true,\n" +
            "        \"id\": 0\n" +
            "      },\n" +
            "      \"internalClickedOnMorph\": {\n" +
            "        \"__isSmartRef__\": true,\n" +
            "        \"id\": 0\n" +
            "      },\n" +
            "      \"carriesGrabbedMorphs\": false,\n" +
            "      \"lastScrollTime\": 1322068927121,\n" +
            "      \"__LivelyClassName__\": \"lively.morphic.HandMorph\",\n" +
            "      \"withLayers\": [\n" +
            "        \"Global.NoMagnetsLayer\"\n" +
            "      ]\n" +
            "    },\n" +
            "    \"2\": {\n" +
            "      \"_Position\": {\n" +
            "        \"__isSmartRef__\": true,\n" +
            "        \"id\": 3\n" +
            "      },\n" +
            "      \"_Extent\": {\n" +
            "        \"__isSmartRef__\": true,\n" +
            "        \"id\": 5\n" +
            "      },\n" +
            "      \"_Fill\": {\n" +
            "        \"__isSmartRef__\": true,\n" +
            "        \"id\": 6\n" +
            "      },\n" +
            "      \"__SourceModuleName__\": \"Global.lively.morphic.Shapes\",\n" +
            "      \"_ClipMode\": \"visible\",\n" +
            "      \"_Padding\": {\n" +
            "        \"__isSmartRef__\": true,\n" +
            "        \"id\": 7\n" +
            "      },\n" +
            "      \"__LivelyClassName__\": \"lively.morphic.Shapes.Rectangle\"\n" +
            "    },\n" +
            "    \"3\": {\n" +
            "      \"x\": 0,\n" +
            "      \"y\": 0,\n" +
            "      \"__SourceModuleName__\": \"Global\",\n" +
            "      \"__LivelyClassName__\": \"Point\"\n" +
            "    },\n" +
            "    \"5\": {\n" +
            "      \"x\": 2,\n" +
            "      \"y\": 2,\n" +
            "      \"__SourceModuleName__\": \"Global\",\n" +
            "      \"__LivelyClassName__\": \"Point\"\n" +
            "    },\n" +
            "    \"6\": {\n" +
            "      \"r\": 0.8,\n" +
            "      \"g\": 0,\n" +
            "      \"b\": 0,\n" +
            "      \"a\": 1,\n" +
            "      \"__LivelyClassName__\": \"Color\",\n" +
            "      \"__SourceModuleName__\": \"Global\"\n" +
            "    },\n" +
            "    \"7\": {\n" +
            "      \"x\": 0,\n" +
            "      \"y\": 0,\n" +
            "      \"width\": 0,\n" +
            "      \"height\": 0,\n" +
            "      \"__SourceModuleName__\": \"Global\",\n" +
            "      \"__LivelyClassName__\": \"Rectangle\"\n" +
            "    },\n" +
            "    \"9\": {\n" +
            "      \"morph\": {\n" +
            "        \"__isSmartRef__\": true,\n" +
            "        \"id\": 1\n" +
            "      },\n" +
            "      \"__SourceModuleName__\": \"Global.lively.morphic.Events\",\n" +
            "      \"__LivelyClassName__\": \"lively.morphic.EventHandler\"\n" +
            "    },\n" +
            "    \"10\": {\n" +
            "      \"x\": 425,\n" +
            "      \"y\": 253,\n" +
            "      \"__LivelyClassName__\": \"Point\",\n" +
            "      \"__SourceModuleName__\": \"Global\"\n" +
            "    },\n" +
            "    \"11\": {\n" +
            "      \"x\": 0,\n" +
            "      \"y\": 0,\n" +
            "      \"__SourceModuleName__\": \"Global\",\n" +
            "      \"__LivelyClassName__\": \"Point\"\n" +
            "    },\n" +
            "    \"12\": {\n" +
            "      \"_Position\": {\n" +
            "        \"__isSmartRef__\": true,\n" +
            "        \"id\": 13\n" +
            "      },\n" +
            "      \"_Extent\": {\n" +
            "        \"__isSmartRef__\": true,\n" +
            "        \"id\": 15\n" +
            "      },\n" +
            "      \"_Fill\": {\n" +
            "        \"__isSmartRef__\": true,\n" +
            "        \"id\": 16\n" +
            "      },\n" +
            "      \"__SourceModuleName__\": \"Global.lively.morphic.Shapes\",\n" +
            "      \"_ClipMode\": \"visible\",\n" +
            "      \"_Padding\": {\n" +
            "        \"__isSmartRef__\": true,\n" +
            "        \"id\": 17\n" +
            "      },\n" +
            "      \"__LivelyClassName__\": \"lively.morphic.Shapes.Rectangle\"\n" +
            "    },\n" +
            "    \"13\": {\n" +
            "      \"x\": 0,\n" +
            "      \"y\": 0,\n" +
            "      \"__SourceModuleName__\": \"Global\",\n" +
            "      \"__LivelyClassName__\": \"Point\"\n" +
            "    },\n" +
            "    \"15\": {\n" +
            "      \"x\": 1024,\n" +
            "      \"y\": 768,\n" +
            "      \"__SourceModuleName__\": \"Global\",\n" +
            "      \"__LivelyClassName__\": \"Point\"\n" +
            "    },\n" +
            "    \"16\": {\n" +
            "      \"r\": 1,\n" +
            "      \"g\": 1,\n" +
            "      \"b\": 1,\n" +
            "      \"a\": 1,\n" +
            "      \"__LivelyClassName__\": \"Color\",\n" +
            "      \"__SourceModuleName__\": \"Global\"\n" +
            "    },\n" +
            "    \"17\": {\n" +
            "      \"x\": 0,\n" +
            "      \"y\": 0,\n" +
            "      \"width\": 0,\n" +
            "      \"height\": 0,\n" +
            "      \"__SourceModuleName__\": \"Global\",\n" +
            "      \"__LivelyClassName__\": \"Rectangle\"\n" +
            "    },\n" +
            "    \"19\": {\n" +
            "      \"morph\": {\n" +
            "        \"__isSmartRef__\": true,\n" +
            "        \"id\": 0\n" +
            "      },\n" +
            "      \"__SourceModuleName__\": \"Global.lively.morphic.Events\",\n" +
            "      \"__LivelyClassName__\": \"lively.morphic.EventHandler\"\n" +
            "    },\n" +
            "    \"20\": {\n" +
            "      \"x\": 0,\n" +
            "      \"y\": 0,\n" +
            "      \"__SourceModuleName__\": \"Global\",\n" +
            "      \"__LivelyClassName__\": \"Point\"\n" +
            "    },\n" +
            "    \"21\": {\n" +
            "      \"x\": 0,\n" +
            "      \"y\": 0,\n" +
            "      \"__SourceModuleName__\": \"Global\",\n" +
            "      \"__LivelyClassName__\": \"Point\"\n" +
            "    },\n" +
            "    \"22\": {\n" +
            "      \"name\": \"Local code\",\n" +
            "      \"__LivelyClassName__\": \"ChangeSet\",\n" +
            "      \"__SourceModuleName__\": \"Global.lively.ChangeSet\"\n" +
            "    },\n" +
            "    \"isSimplifiedRegistry\": true\n" +
            "  }\n" +
            "}]]></meta>\n" +
            "  </head>\n" +
            "  <body style=\"margin:0px\"></body>\n" +
            "</html>";
        return stringToXML(str).ownerDocument;
	}

},
'testing', {

	  testGetChangesetAndWorldFromJSON: function() {
		    var doc = this.doc(),
            canvas = doc.getElementById('LivelyJSONWorld'),
			      sut = lively.Main.WorldDataAccessor.forCanvas(canvas),
			      cs = sut.getChangeSet(),
			      world = sut.getWorld();
		    this.assertEquals(ChangeSet, cs.constructor, 'ChangeSet not deserialized');
		    this.assertEquals(2, cs.subElements().length)
		    this.assertEquals(lively.morphic.World, world.constructor, 'World not deserialized');
	  },

});

TestCase.subclass('lively.tests.BootstrapTests.BrowserDetectorTest',
    'accessing', {
        mockUserAgent: function (uaString) {
            navigator.__defineGetter__('userAgent', function () {
                return uaString;
            });
        },
        originalUserAgent: (function () {
            return navigator.userAgent;
        })(),
        restoreUserAgent: function () {
            this.mockUserAgent(this.originalUserAgent);
        },
        spec: function () {
            return [
                {
                    browser: "Chrome",
                    version: "10"
                },
                {
                    browser: "Safari",
                    version: "5",
                    versionPrefix: "Version"
                },
            ];
        },
        detector: function () {
            return new BrowserDetector();
        },
        ie6UserAgent: function () {
            return ("Mozilla/4.0 (X11; MSIE 6.0; i686; .NET CLR 1.1.4322; "
                    + ".NET CLR 2.0.50727; FDM)");
        },
        chrome9UserAgent: function () {
            return ("Mozilla/5.0 (X11; U; Linux i686 (x86_64); en-US) "
                    + "AppleWebKit/534.12 (KHTML, like Gecko) Chrome/9.0.576.0 "
                    + "Safari/534.12");
        },
        chrome24UserAgent: function () {
            return ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_2) "
                    + "AppleWebKit/537.17 (KHTML, like Gecko) "
                    + "Chrome/24.0.1309.0 Safari/537.17");
        },
        safari4UserAgent: function () {
            return ("Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_5_7; en-us) "
                    + "AppleWebKit/531.2+ (KHTML, like Gecko) Version/4.0.1 "
                    + "Safari/530.18");
        },
        safari5UserAgent: function () {
            return ("Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_7; da-dk) "
                    + "AppleWebKit/533.21.1 (KHTML, like Gecko) Version/5.0.5 "
                    + "Safari/533.21.1");
        }
    },
    'testing', {
        testBrowserWithHigherVersion: function () {
            this.mockUserAgent(this.chrome24UserAgent());
            this.assertEquals(true, this.detector().isSpecSatisfied());
            this.restoreUserAgent();
        },
        testBrowserWithHigherVersionAndVersionPrefix: function () {
            this.mockUserAgent(this.safari5UserAgent());
            this.assertEquals(true, this.detector().isSpecSatisfied());
            this.restoreUserAgent();
        },
        testBrowserWithLowerVersion: function () {
            this.mockUserAgent(this.chrome9UserAgent());
            this.assertEquals(false, this.detector().isSpecSatisfied());
            this.restoreUserAgent();
        },
        testBrowserWithLowerVersionAndVersionPrefix: function () {
            this.mockUserAgent(this.safari4UserAgent());
            this.assertEquals(false, this.detector().isSpecSatisfied());
            this.restoreUserAgent();
        },
        testBrowserIncompatible: function () {
            this.mockUserAgent(this.ie6UserAgent());
            this.assertEquals(false, this.detector().isSpecSatisfied());
            this.restoreUserAgent();
        }
    }
);

}) // end of module
