module('games.TowerDefense').requires().toRun(function() {

Object.extend(games.TowerDefense, {
start: function() {
    var towerDefense = new games.TowerDefense.TowerDefense();
    var window = new lively.morphic.Window(towerDefense, "Towerefense");
    window.name = "TowerDefense";
    window.openInWorld();
    return window;
}
});

Morph.subclass('games.TowerDefense.TowerDefense', {
settings: {
    borderWidth: 1
},
buildMap: function() {
    this.map = new games.TowerDefense.Map();
    
    this.addMorph(this.map);
    this.map.setPosition(pt(this.settings.borderWidth, this.settings.menuHeight + this.settings.borderWidth));
    this.map.setExtent(pt(
        this.settings.tileSize*this.settings.xTiles,
        this.settings.tileSize*this.settings.yTiles
    ));
},
buildMenu: function() {
    this.menu = new games.TowerDefense.Menu();
    
    this.addMorph(this.menu);
    this.menu.setPosition(pt(this.settings.borderWidth, this.settings.borderWidth));
    this.menu.setExtent(pt(this.settings.tileSize*this.settings.xTiles, this.menu.settings.height));
},
isPaused: function() {
    return this.paused;
},
initializeGame: function() {
    this.setFill(Color.white);
    //this.setBorderColor(Color.black);
    //this.setBorderWidth(s.borderWidth);
    this.setExtent(pt(
        this.settings.tileSize*this.settings.xTiles + 2*this.settings.borderWidth,
        this.settings.tileSize*this.settings.yTiles + 2*this.settings.borderWidth + this.settings.menuHeight
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

Morph.subclass('games.TowerDefense.Menu', {
settings: {
    height: 25,
    buttonHeight: 23,
    buttonWidth: 80,
    buttonMargin: 1
},
initialize: function($super) {
    $super();
    
    this.initializeButtons();
    this.initializeSize();
},
towerDefense: function() {
    return this.owner;
},
initializeButtons: function() {
    var newGameButton = new lively.morphic.Button();
    newGameButton.setPosition(pt(1, 1));
    newGameButton.setExtent(pt(80, this.settings.height-2));
    newGameButton.setLabel("Restart");
    lively.bindings.connect(newGameButton, 'fire', this, 'restartClicked');
    menuMorph.addMorph(newGameButton);
    this.newButton = newGameButton;
    
    var pauseGameButton = new lively.morphic.Button();
    pauseGameButton.setPosition(pt(82, 1));
    pauseGameButton.setExtent(pt(80, this.settings.height-2));
    pauseGameButton.setLabel("Pause");
    lively.bindings.connect(newGameButton, 'fire', this, 'pauseClicked');
    menuMorph.addMorph(pauseGameButton);
    this.pauseButton = pauseGameButton;
},
pauseClicked: function() {
    return this.pauseCallback();
},
restartClicked: function() {
    return this.restartCallback();
},
});

Morph.subclass('games.TowerDefense.Map', {
settings: {
    xTiles: 15,
    yTiles: 15
},
initialize: function($super) {
    $super();

    this.initializeTiles();
    this.initializeSize();
},
towerDefense: function() {
    return this.owner;
},
initializeTiles: function() {
    for(i=0; i<this.settings.yTiles; ++i) {
        for (j=0; j<this.settings.xTiles; ++j) {
            var tile = new games.TowerDefense.Tile();
            tile.setExtent(pt(tile.edgeLength(), tile.edgeLength()));
            tile.setPosition(pt(
                j*tile.edgeLength(),
                i*tile.edgeLength()
            ));
            tile.setFill((j+i)%2?Color.black:Color.white);
            this.addMorph(tile);
        }
    }
},
initializeSize: function() {
    this.setExtent(pt(
        this.settings.xTiles * games.TowerDefense.Tile.edgeLength,
        this.settings.yTiles * games.TowerDefense.Tile.edgeLength
    ));
}
});

Morph.subclass('games.TowerDefense.Tile', {
edgeLength: function() {
    return this.class.edgeLength;
},
map: function() {
    return this.owner();
},
towerDefense: function() {
    return this.owner.towerDefense();
},
});

Object.extend(games.TowerDefense.Tile, {
edgeLength: 32,
});

}); // end of modulee