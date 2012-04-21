module('lively.morphic.Styles').requires('lively.morphic.Shapes' /*for gradients*/,'lively.CrayonColors').toRun(function() {

                          Color.web = {
    maroon:               Color.rgb(128,0,0),
    darkred:              Color.rgb(139,0,0),
    firebrick:            Color.rgb(178,34,34),
    brown:                Color.rgb(165,42,42),
    crimson:              Color.rgb(220,20,60),
    red:                  Color.rgb(255,0,0),
    orangered:            Color.rgb(255,69,0),
    indianred:            Color.rgb(205,92,92),
    darksalmon:           Color.rgb(233,150,122),
    lightsalmon:          Color.rgb(255,160,122),
    coral:                Color.rgb(255,127,80),
    tomato:               Color.rgb(253,99,71),
    salmon:               Color.rgb(250,128,114),
    lightcoral:           Color.rgb(240,128,128),
    palevioletred:        Color.rgb(219,112,147),
    mediumvioletred:      Color.rgb(199,21,133),
    deeppink:             Color.rgb(255,20,147),
    fuchsia:              Color.rgb(255,0,255),
    magenta:              Color.rgb(255,0,255),
    hotpink:              Color.rgb(255,105,180),
    lightpink:            Color.rgb(255,182,193),
    pink:                 Color.rgb(255,192,203),
    thistle:              Color.rgb(216,191,216),
    plum:                 Color.rgb(221,160,221),
    violet:               Color.rgb(238,130,238),
    orchid:               Color.rgb(218,112,214),
    mediumorchid:         Color.rgb(186,85,211),
    darkorchid:           Color.rgb(153,50,204),
    darkviolet:           Color.rgb(148,0,211),
    purple:               Color.rgb(128,0,128),
    darkmagenta:          Color.rgb(139,0,139),
    indigo:               Color.rgb(75,0,130),
    blueviolet:           Color.rgb(138,43,226),
    mediumpurple:         Color.rgb(147,112,219),
    mediumslateblue:      Color.rgb(123,104,238),
    slateblue:            Color.rgb(106,90,205),
    darkslateblue:        Color.rgb(72,61,139),
    midnightblue:         Color.rgb(25,25,112),
    navy:                 Color.rgb(0,0,128),
    darkblue:             Color.rgb(0,0,139),
    mediumblue:           Color.rgb(0,0,205),
    blue:                 Color.rgb(0,0,255),
    royalblue:            Color.rgb(65,105,225),
    cornflowerblue:       Color.rgb(100,149,237),
    steelblue:            Color.rgb(70,130,180),
    dodgerblue:           Color.rgb(30,144,255),
    deepskyblue:          Color.rgb(0,191,255),
    lightskyblue:         Color.rgb(135,206,250),
    skyblue:              Color.rgb(135,206,235),
    lightsteelblue:       Color.rgb(176,196,222),
    lightblue:            Color.rgb(173,216,230),
    powderblue:           Color.rgb(176,224,230),
    paleturquoise:        Color.rgb(175,238,238),
    mediumturquoise:      Color.rgb(72,209,204),
    lightseagreen:        Color.rgb(32,178,170),
    darkcyan:             Color.rgb(0,139,139),
    teal:                 Color.rgb(0,128,128),
    cadetblue:            Color.rgb(95,158,160),
    darkturquoise:        Color.rgb(0,206,209),
    aqua:                 Color.rgb(0,255,255),
    cyan:                 Color.rgb(0,255,255),
    turquoise:            Color.rgb(64,224,208),
    aquamarine:           Color.rgb(127,255,212),
    mediumaquamarine:     Color.rgb(102,205,170),
    darkseagreen:         Color.rgb(143,188,143),
    mediumseagreen:       Color.rgb(60,179,113),
    seagreen:             Color.rgb(46,139,87),
    darkgreen:            Color.rgb(0,100,0),
    green:                Color.rgb(0,128,0),
    forestgreen:          Color.rgb(34,139,34),
    limegreen:            Color.rgb(50,205,50),
    springgreen:          Color.rgb(0,255,127),
    mediumspringgreen:    Color.rgb(0,250,154),
    palegreen:            Color.rgb(152,251,152),
    lightgreen:           Color.rgb(144,238,144),
    lime:                 Color.rgb(0,255,0),
    chartreuse:           Color.rgb(127,255,0),
    lawngreen:            Color.rgb(124,252,0),
    greenyellow:          Color.rgb(173,255,47),
    yellowgreen:          Color.rgb(154,205,50),
    darkolivegreen:       Color.rgb(85,107,47),
    olivedrab:            Color.rgb(107,142,35),
    olive:                Color.rgb(128,128,0),
    darkkhaki:            Color.rgb(189,183,107),
    darkgoldenrod:        Color.rgb(184,134,11),
    goldenrod:            Color.rgb(218,165,32),
    gold:                 Color.rgb(255,215,0),
    yellow:               Color.rgb(255,255,0),
    khaki:                Color.rgb(240,230,140),
    palegoldenrod:        Color.rgb(238,232,170),
    sandybrown:           Color.rgb(244,164,96),
    orange:               Color.rgb(255,165,0),
    darkorange:           Color.rgb(255,140,0),
    chocolate:            Color.rgb(210,105,30),
    saddlebrown:          Color.rgb(139,69,19),
    sienna:               Color.rgb(160,82,45),
    peru:                 Color.rgb(205,133,63),
    burlywood:            Color.rgb(222,184,135),
    tan:                  Color.rgb(210,180,140),
    wheat:                Color.rgb(245,222,179),
    navajowhite:          Color.rgb(255,222,173),
    moccasin:             Color.rgb(255,228,181),
    blanchedalmond:       Color.rgb(255,255,205),
    rosybrown:            Color.rgb(188,143,143),
    mistyrose:            Color.rgb(255,228,225),
    lavenderblush:        Color.rgb(255,240,245),
    lavender:             Color.rgb(230,230,250),
    ghostwhite:           Color.rgb(248,248,255),
    azure:                Color.rgb(240,255,255),
    lightcyan:            Color.rgb(224,255,255),
    aliceblue:            Color.rgb(240,248,255),
    mintcream:            Color.rgb(245,255,250),
    honeydew:             Color.rgb(240,255,240),
    lightgoldenrodyellow: Color.rgb(250,250,210),
    lemonchiffon:         Color.rgb(255,250,205),
    beige:                Color.rgb(245,245,220),
    lightyellow:          Color.rgb(255,255,224),
    ivory:                Color.rgb(255,240,240),
    floralwhite:          Color.rgb(255,250,240),
    linen:                Color.rgb(250,240,230),
    oldlace:              Color.rgb(253,245,230),
    cornsilk:             Color.rgb(255,248,220),
    antiquewhite:         Color.rgb(250,235,215),
    bisque:               Color.rgb(255,228,196),
    peachpuff:            Color.rgb(255,239,213),
    papayawhip:           Color.rgb(255,239,213),
    seashell:             Color.rgb(255,245,238),
    snow:                 Color.rgb(255,250,250),
    white:                Color.rgb(255,255,255),
    whitesmoke:           Color.rgb(245,245,245),
    gainsboro:            Color.rgb(220,220,220),
    lightgrey:            Color.rgb(211,211,211),
    silver:               Color.rgb(192,192,192),
    darkgray:             Color.rgb(169,169,169),
    gray:                 Color.rgb(128,128,128),
    dimgray:              Color.rgb(105,105,105),
    lightslategray:       Color.rgb(119,136,153),
    slategray:            Color.rgb(112,128,144),
    darkslategray:        Color.rgb(47,79,79),
    black:                Color.rgb(0,0,0)
};

Object.extend(Color, {

    webColorTableMorph: function() {
        var colors = Properties.own(Color.web)
        var h = 20
        var y = 0;
        var x = 0;
        container = Morph.makeRectangle(0,0,600,480);
        container.name = "WebColors"
        container.setFill(Color.gray)
        colors.each(function(name) {
            var morph = new TextMorph(new Rectangle(x, y, 100,h), name)
            morph.ignoreEvents()
            y += h;
            morph.setFill(Color.web[name])
            container.addMorph(morph);
            if (y > 460) {
                y = 0;
                x += 100;
            }

        })
        return container
    },

    showWebColorTable: function(){
        this.webColorTableMorph().openInWorld()
    }
});

lively.Styles = Object.subclass('Styles');
Object.extend(Styles, {
    titleBarButtonGradient: function(color) {
        return new lively.morphic.RadialGradient([
                {offset: 0, color: color.mixedWith(Color.white, 0.3)},
                {offset: 0.5, color: color},
                {offset: 1, color: color.mixedWith(Color.black, 0.6)}],
            pt(0.4, 0.2))
    },

    linearGradient: function(stops, fillDirection) {
        fillDirection = fillDirection || 'EastWest';
        return new lively.morphic.LinearGradient(
                stops.collect(function(stop) {
                    return {offset: stop[0], color: stop[1]}
                }),
            lively.morphic.LinearGradient[fillDirection])
    },

    radialGradient: function(stops, optVector) {
        return new lively.morphic.RadialGradient(
                stops.collect(function(stop) {
                    return {offset: stop[0], color: stop[1]}
                }),
            optVector)
    },

    sliderGradient: function(color, fillDirection) {
        color = color || Color.gray;
        fillDirection = fillDirection || 'EastWest';
        return new lively.morphic.LinearGradient([
                {offset: 0, color: color.mixedWith(Color.white, 0.4)},
                {offset: 0.5, color: color.mixedWith(Color.white, 0.8)},
                {offset: 1, color: color.mixedWith(Color.black, 0.9)}],
            lively.morphic.LinearGradient[fillDirection])
    },

    sliderBackgroundGradient: function(color, fillDirection) {
        var gfx = lively.paint;
        color = color || Color.gray;
        fillDirection = fillDirection || 'EastWest';
        return new lively.morphic.LinearGradient([
                {offset: 0, color:  color},
                {offset: 0.4, color: color.mixedWith(Color.white, 0.3)},
                {offset: 1, color: color.mixedWith(Color.white, 0.2)}],
            lively.morphic.LinearGradient[fillDirection])

    },

})

if (!Global.DisplayThemes)
    Global.DisplayThemes = {};

Object.extend(DisplayThemes, {
    /* Display Themes can inherit propeties from each other. We use JavaScript prototypes to implement such inheritance */

    primitive: {},
    lively: {},
    hpi: {},
});

DisplayThemes.lively.__proto__ = DisplayThemes.primitive;
DisplayThemes.hpi.__proto__ = DisplayThemes.lively;

Object.extend(DisplayThemes.primitive, {
     // Primitive look and feel -- flat fills and no rounding or translucency
    styleName: 'primitive',

/* styles */

    widgetPanel: {
        borderColor: Color.red,
        borderWidth: 2,
        borderRadius: 0,
        fill: Color.blue.lighter()
    },

    panel: {
        fill: Color.gray.lighter(2),
        borderWidth: 2,
        borderColor: Color.black
    },

    link: {
        borderColor: Color.green,
        borderWidth: 1,
        fill: Color.blue
    },

    helpText: {
        borderRadius: 15,
        fill: Color.primary.yellow.lighter(3),
        fillOpacity: .8
    },



    button: {
        borderColor: Color.black,
        borderWidth: 1,
        borderRadius: 2,
        fill: Color.lightGray
    },

/* Browser */

    Browser_codePane: {
        fill: Color.white,
    },

    Browser_codePaneText: {
        fill: Color.white,
        focusHaloBorderWidth: 1,
        focusHaloBorderWidth: 0.5,
        fontFamily: 'Courier',
    },

    Browser_locationInput: {
        fill: Color.white,
    },

    Browser_resizer: {
        fill: lively.Styles.sliderGradient(Color.gray),
        scaleProportional: true,
        // borderColor: Color.darkGray,
        borderRadius: 3,
        // borderWidth: 1
    },

    Browser_commentPane: {
        fill: Color.white,
    },

    Browser_commentPaneText: {
        fill: Color.white,
    },


/* Slider */

    slider: {
        borderColor: Color.black,
        borderWidth: 1,
        borderRadius: 1,
        fill: Color.neutral.gray.lighter()
    },

    slider_background: {
        borderColor: Color.darkGray,
        borderWidth: 1,
        fill: Color.white,
    },

    slider_horizontal: {
        borderColor: Color.black,
        borderWidth: 1,
        borderRadius: 1,
        fill: Color.neutral.gray.lighter()
    },

    slider_background_horizontal: {
        borderColor: Color.darkGray,
        borderWidth: 1,
        fill: Color.white,
    },

/* TitleBar */

    titleBar: {
        borderRadius: 0,
        borderWidth: 2,
        bordercolor: Color.black,
        fill: Color.neutral.gray.lighter()
    },

    titleBar_closeButton: {
        fill: Color.primary.orange
    },

    titleBar_menuButton: {
        fill: Color.green,
    },

    titleBar_collapseButton: {
        fill: Color.primary.yellow,
    },

/* Specific Morphs */

    clock:         {
        borderColor: Color.black,
        borderWidth: 1,
        fill: Styles.radialGradient([
                [0,  Color.yellow.lighter(2)],
                [1,  Color.yellow]])
    },

    fabrik: {
        borderColor: Color.black,
        borderWidth: 2,
        borderRadius: 0,
        fill: Color.gray.lighter(),
        opacity: 1
    },

    fabrik_componentBox: {
        borderColor: Color.gray,
        borderWidth: 2,
        borderRadius: 6,
        fill: Color.gray.lighter(),
        opacity: 1
    },

    fabrik_listPane: {
        fill: Color.white,
    },

    world: {
        fill: Color.white,
    },


});

Object.extend(DisplayThemes.lively, {
    styleName: 'lively',

/* styles */

    raisedBorder: { // conenience grouping
        borderColor: Styles.linearGradient([
                [0.0, Color.lightGray],
                [1.0, Color.darkGray.darker(3)]],
            "SouthEast")
    },

    button: {
        borderColor: Color.neutral.gray,
        borderWidth: 0.3, borderRadius: 4,
        fill: Styles.linearGradient([
            [0, Color.darkGray],
            [1, Color.darkGray.lighter(2)]],
            "SouthNorth")
    },

    widgetPanel: {
        borderColor: Color.blue,
        borderWidth: 4,
        borderRadius: 16,
        fill: Color.blue.lighter(), opacity: 0.4
    },

    panel: {
        fill: Color.primary.blue.lighter(2),
        borderWidth: 2,
        borderColor: Color.black
    },

    link: {
        borderColor: Color.green,
        borderWidth: 1,
        fill: Color.blue
    },

    helpText: {
        borderRadius: 15,
        fill: Color.primary.yellow.lighter(3),
        fillOpacity: .8
    },

/* Slider */

    slider: {
        borderColor: Color.darkGray,
        borderWidth: 1,
        borderRadius: 6,
        fill: Styles.linearGradient([
                [0.0, Color.gray.mixedWith(Color.white, 0.9)],
                [0.5, Color.gray.mixedWith(Color.white, 0.6)],
                [1.0, Color.gray.mixedWith(Color.white, 0.9)]],
            "SouthNorth")
    },

    slider_background: {
        borderColor: Color.gray,
        borderWidth: 1,
        strokeOpacity: 1,
        fill: Styles.linearGradient([
                [0,   Color.gray.mixedWith(Color.white, 0.4)],
                [0.5, Color.gray.mixedWith(Color.white, 0.2)],
                [1,   Color.gray.mixedWith(Color.white, 0.4)]],
            "EastWest")
    },

    slider_horizontal: {
        borderColor: Color.darkGray,
        borderWidth: 1,
        borderRadius: 6,
        fill: Styles.linearGradient([
                [0,   Color.gray.mixedWith(Color.white, 0.9)],
                [0.5, Color.gray.mixedWith(Color.white, 0.6)],
                [1,   Color.gray.mixedWith(Color.white, 0.9)]],
            "EastWest")
    },

    slider_background_horizontal: {
        borderColor: Color.darkGray,
        borderWidth: 1,
        fill: Styles.linearGradient([
                [ 0,   Color.gray.mixedWith(Color.white, 0.4)],
                [0.5,  Color.gray.mixedWith(Color.white, 0.2)],
                [1,    Color.gray.mixedWith(Color.white, 0.4)]],
            "NorthSouth")
    },


/* TitleBar */

    titleBar: {
        borderRadius: 8,
        borderWidth: 2,
        bordercolor: Color.black,
        fill: Styles.linearGradient([
                [0.0, Color.primary.blue.lighter()],
                [0.5, Color.primary.blue],
                [1.0, Color.primary.blue.lighter(2)]],
            "SouthNorth")
    },

    titleBar_closeButton: {
        fill: Styles.titleBarButtonGradient(Color.primary.orange)
    },

    titleBar_menuButton: {
        fill: Styles.titleBarButtonGradient(Color.primary.blue),
    },

    titleBar_collapseButton: {
        fill: Styles.titleBarButtonGradient(Color.primary.yellow),
    },


/* Morphs */

    clock: {
        borderColor: Color.black, borderWidth: 4,
        fill: Styles.radialGradient([
                    [0, Color.primary.blue.lighter(2)],
                    [1, Color.primary.blue.lighter()]])
    },


    fabrik: {
        borderColor: Color.gray.darker(),
        borderWidth: 1.0 ,
        borderRadius: 2,
        fill: Color.gray,
        opacity: 1
    },

    world: {
        fill: Styles.linearGradient([
                    [0.00,  Color.primary.blue.lighter()],
                    [0.25,  Color.primary.blue],
                    [0.50,  Color.primary.blue.lighter()],
                    [0.75,  Color.primary.blue],
                    [1.00,  Color.primary.blue]])

    }
});

Object.extend(DisplayThemes.hpi, {
    styleName: 'hpi',


/* styles */

    raisedBorder: {
        borderColor: Styles.linearGradient([
                [0,  Color.lightGray],
                [1,  Color.darkGray.darker(3)]],
            "SouthEast")
    },

    button: {
        borderColor: Color.neutral.gray,
        borderWidth: 0.6,
        borderRadius: 5,
        fill: Styles.linearGradient([
                [0,   Color.gray.mixedWith(Color.white, 0.9)],
                [0.5, Color.gray.mixedWith(Color.white, 0.5)],
                [1,   Color.gray.mixedWith(Color.white, 0.9)]],
            "SouthNorth")
    },

    widgetPanel: {
        borderColor: Color.gray.darker(),
        borderWidth: 4,
        borderRadius: 16,
        fill: Color.gray.lighter(),
        opacity: 0.4
    },

    focusHalo: {
        fill: null,
        borderColor: Color.gray.darker(),
        strokeOpacity: 0.5
    },

    panel: {
        fill: Color.gray.lighter(2),
        borderWidth: 2,
        borderColor: Color.darkGray.darker()
    },

    link: {
        borderColor: Color.green,
        borderWidth: 1,
        fill: Color.gray
    },

    helpText: {
        borderRadius: 15,
        fill: Color.primary.yellow.lighter(3),
        fillOpacity: .8
    },


/* Menu */


    menu_items: {
        fontSize: 14,
        textColor: CrayonColors.lead,
    },

    menu_list: {
        fill: CrayonColors.snow,
    },

/* Slider */

    slider: {
        borderColor: new Color(0.4,0.4, 0.4),
        borderOpacity: 1,
        borderWidth: 1,
        borderRadius: 6,
        fill: Styles.sliderGradient(Color.primary.blue.mixedWith(Color.gray, 0.8), 'EastWest')
    },

    slider_background: {
        borderColor: Color.gray,
        borderWidth: 1,
        strokeOpacity: 1,
        borderRadius: 6,
        fill: Styles.sliderBackgroundGradient(Color.gray, 'EastWest'),
    },

    slider_horizontal: {
        borderColor: Color.darkGray,
        borderWidth: 1,
        borderRadius: 6,
        fill: Styles.sliderGradient(Color.primary.blue.mixedWith(Color.gray, 0.8), "NorthSouth")
    },

    slider_background_horizontal: {
        borderColor: Color.darkGray,
        borderWidth: 1,
        borderRadius: 6,
        fill: Styles.sliderBackgroundGradient(Color.gray, "NorthSouth")
    },

/* TitleBar */

    titleBar: {
        borderRadius: 8,
        borderWidth: 2,
        bordercolor: Color.darkGray,
        fill: Styles.linearGradient([
                    [0.0,  Color.gray.mixedWith(Color.black, 0.9)],
                    [0.6,  Color.gray.mixedWith(Color.white, 0.5)],
                    [1.0,  Color.gray.mixedWith(Color.black, 0.9)]],
            "SouthNorth")
    },

    titleBar_label: {
        fill: null,
    },

    titleBar_label_highlight: {
        fill: Color.white,
        fillOpacity: 0.5,
    },

    titleBar_button_label: {
        textColor: new Color(0.5,0.5,0.5,0.5),
        fontStyle: 'bold',
    },

    titleBar_closeButton: {
        fill: Styles.titleBarButtonGradient(Color.gray)
    },

    titleBar_menuButton: {
        fill: Styles.titleBarButtonGradient(Color.gray),
    },

    titleBar_collapseButton: {
        fill: Styles.titleBarButtonGradient(Color.gray),
     },

    titleBar_closeButton_highlight: {
        fill: Styles.titleBarButtonGradient(CrayonColors.cayenne)
    },

    titleBar_menuButton_highlight: {
        fill: Styles.titleBarButtonGradient(Color.green.mixedWith(Color.black, 0.65)),
    },

    titleBar_collapseButton_highlight: {
        fill: Styles.titleBarButtonGradient(Color.rgb(255,215,102) ), // Color.primary.yellow
     },

/* Morphs */

    clock: {
        borderColor: Color.black, borderWidth: 4,
        fill: Styles.radialGradient([
                [0, Color.gray.lighter(2)],
                [1, Color.gray.lighter()]])
    },



    fabrik: {
        borderColor: Color.gray.darker(),
        borderWidth: 1.0 ,
        borderRadius: 2,
        fill: Color.gray,
        opacity: 1
    },

    world: {
        fill: Color.white,
    },


});

}) // end of module