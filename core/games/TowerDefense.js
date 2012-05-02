module('games.TowerDefense').requires().toRun(function(TD) {

Object.extend(games.TowerDefense, {
start: function() {
    var towerDefense = new TD.TowerDefense();
    var window = new lively.morphic.Window(towerDefense, "TowerDefense");
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
    this.map = new TD.Map();
    
    this.addMorph(this.map);
    this.map.setPosition(pt(this.settings.borderWidth, this.menu.getExtent().y + this.settings.borderWidth));
},
buildMenu: function() {
    this.menu = new TD.Menu({
        restart: { name: 'Restart', receiver: this, slot: 'initializeTowerDefense' },
        pause: { name: 'Paused', receiver: this, slot: 'togglePaused' }
    });
    
    this.addMorph(this.menu);
    this.menu.setPosition(pt(this.settings.borderWidth, this.settings.borderWidth));
},
isPaused: function() {
    return this.paused;
},
initializeColor: function() {
    this.setFill(Color.white);
},
initializeSize: function() {
    this.setExtent(pt(
        this.map.getExtent().x + 2*this.settings.borderWidth,
        this.map.getExtent().y + this.settings.borderWidth + this.menu.getExtent().y
    ));
},
initialize: function($super) {
    $super();
    
    this.initializeTowerDefense();
},
initializeTowerDefense: function() {
    this.resetMorphs();
    this.initializeColor();
    this.buildMenu();
    this.buildMap();
    this.initializeSize();
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
    
    this.menu.entries.pause.setLabel(this.paused?"Resume":"Pause");
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
initialize: function($super, entries) {
    $super();
    
    this.initializeButtons(entries);
    this.initializeSize();
},
initializeButtons: function(entries) {
    this.entries = {};
    this.entrySize = 0;
    
    var lastX = this.settings.buttonMargin;
    for (identifier in entries) {
        var button = new lively.morphic.Button();
        
        button.setPosition(pt(lastX, this.settings.buttonMargin));
        button.setExtent(pt(this.settings.buttonWidth, this.settings.buttonHeight));
        button.setLabel(entries[identifier].name);
        
        lively.bindings.connect(button, 'fire', entries[identifier].receiver, entries[identifier].slot);
        
        this.addMorph(button);
        this.entries[identifier] = button;
        this.entrySize++;

        lastX += this.settings.buttonWidth + this.settings.buttonMargin;
    }
},
initializeSize: function() {
    this.setExtent(pt(
        this.entrySize * (this.settings.buttonWidth + this.settings.buttonMargin) + this.settings.buttonMargin,
        this.settings.height
    ));
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
            var tile = new TD.Tile();
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
        this.settings.xTiles * TD.Tile.edgeLength,
        this.settings.yTiles * TD.Tile.edgeLength
    ));
}
});

Morph.subclass('games.TowerDefense.Tile', {
edgeLength: function() {
    return TD.Tile.edgeLength;
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

Object.subclass('games.TowerDefense.Way', {
initialize: function($super, description) {
    $super();
    
    this.parse(description);
},
parse: function(description) {
    
},
});

Object.subclass('games.TowerDefense.Direction', {

});

TD.Direction.subclass('games.TowerDefense.UpDirection', {

});

TD.Direction.subclass('games.TowerDefense.LeftDirection', {

});

TD.Direction.subclass('games.TowerDefense.DownDirection', {

});

TD.Direction.subclass('games.TowerDefense.RightDirection', {

});

Object.extend(games.TowerDefense.Direction, {
up: new TD.UpDirection(),
left: new TD.LeftDirection(),
down: new TD.DownDirection(),
right: new TD.RightDirection(),
});

}); // end of module