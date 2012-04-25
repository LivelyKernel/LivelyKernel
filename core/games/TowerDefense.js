module('games.TowerDefense').requires().toRun(function() {

Object.extend(games.TowerDefense, {
    start: function() {
        var towerDefense = new games.TowerDefense.TowerDefense();
        var window = new lively.morphic.Window(towerDefense, "TowerDefense");
        return window;
    }
});

Morph.subclass('games.TowerDefense.TowerDefense', {
buildMap: function() {
    var mapMorph = new Morph();
    
    mapMorph.settings = {
        tileSize: 32,
        xTiles: 15,
        yTiles: 15
    };
    
    this.addMorph(mapMorph);
    mapMorph.setPosition(pt(this.settings.borderWidth, this.settings.menuHeight + this.settings.borderWidth));
    mapMorph.setExtent(pt(
        this.settings.tileSize*this.settings.xTiles,
        this.settings.tileSize*this.settings.yTiles
    ));
    //mapMorph.setBorderColor(Color.black);
    //mapMorph.setBorderWidth(this.settings.borderWidth);
    mapMorph.addScript(function towerDefense() {
        return this.owner;
    });
    this.map = mapMorph;
    
    for(i=0; i<this.settings.yTiles; ++i) {
        for (j=0; j<this.settings.xTiles; ++j) {
            var tile = new Morph();
            tile.setExtent(pt(this.settings.tileSize, this.settings.tileSize));
            tile.setPosition(pt(
                j*this.settings.tileSize,
                i*this.settings.tileSize
            ));
            tile.setFill((j+i)%2?Color.black:Color.white);
            this.map.addMorph(tile);
        }
    }
},
buildMenu: function() {
        var towerDefense = this;
    
    var menuMorph = new Morph();
    
    menuMorph.settings = {
        buttonHeight: 23,
        buttonWidth: 80,
        buttonMargin: 1,
        height: 25
    };
    
    this.addMorph(menuMorph);
    menuMorph.setPosition(pt(this.settings.borderWidth, this.settings.borderWidth));
    menuMorph.setExtent(pt(this.settings.tileSize*this.settings.xTiles, this.settings.menuHeight));
    menuMorph.addScript(function towerDefense() {
        return this.owner;
    });
    this.menu = menuMorph;
    
    var newGameButton = new lively.morphic.Button();
    newGameButton.setPosition(pt(1, 1));
    newGameButton.setExtent(pt(80, this.settings.menuHeight-2));
    newGameButton.setLabel("Restart");
    newGameButton.addScript(function towerDefense() {
        return this.owner.towerDefense();
    });
    newGameButton.addScript(function onMouseUp(evt) {
        this.towerDefense().initializeTowerDefense();
    });
    menuMorph.addMorph(newGameButton);
    this.newButton = newGameButton;
    
    var pauseGameButton = new lively.morphic.Button();
    pauseGameButton.setPosition(pt(82, 1));
    pauseGameButton.setExtent(pt(80, this.settings.menuHeight-2));
    pauseGameButton.setLabel("Pause");
    pauseGameButton.addScript(function towerDefense() {
        return this.owner.towerDefense();
    });
    pauseGameButton.addScript(function onMouseUp(evt) {
        this.towerDefense().togglePaused();
    });
    menuMorph.addMorph(pauseGameButton);
    this.pauseButton = pauseGameButton;
},
isPaused: function() {
    return this.paused;
},
initializeGame: function() {
    this.settings = {
        tileSize: 32,
        xTiles: 15,
        yTiles: 15,
        menuHeight: 25,
        borderWidth: 1
    };
    var s = this.settings;
    
    this.setFill(Color.white);
    //this.setBorderColor(Color.black);
    //this.setBorderWidth(s.borderWidth);
    this.setExtent(pt(
        s.tileSize*s.xTiles + 2*s.borderWidth,
        s.tileSize*s.yTiles + 2*s.borderWidth + s.menuHeight
    ));
},
initialize: function($super) {
    $super();
    
    this.initializeTowerDefense();
},
initializeTowerDefense: function() {
    this.resetMorphs();
    this.initializeGame();
    this.buildMap();
    this.buildMenu();
    this.setPaused(true);
    this.resetLastTimestamp();
    this.startSteppingScripts();
},
mainIteration: function() {
    if (this.isPaused()) {
        return;
    }
    var newTimestamp = new Date();
    var delta = newTimestamp - this.lastTimestamp;
    
    this.update(delta / 1000.0);

    this.lastTimestamp = newTimestamp;
},
resetLastTimestamp: function() {
    this.lastTimestamp = new Date();
},
resetMorphs: function() {
    this.removeAllMorphs();
},
setPaused: function(paused) {
    this.paused = paused;

    this.resetLastTimestamp();
    
    this.pauseButton.setLabel(this.paused?"Resume":"Pause");
},
startSteppingScripts: function() {
    this.stopStepping();
    this.startStepping(50, "mainIteration");
},
togglePaused: function() {
    this.setPaused(!this.isPaused());
},
update: function(delta) {
    alert(delta);
},
});

Object.subclass('games.TowerDefense.Menu', {
    
});

Object.subclass('games.TowerDefense.Map', {
    
});

Object.subclass('games.TowerDefense.Tile', {
    
});

}) // end of modulele