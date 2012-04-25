module('games.TowerDefense').requires().toRun(function() {

Object.subclass('games.TowerDefense.TowerDefense', {
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
    
});

Object.subclass('games.TowerDefense.Menu', {
    
});

Object.subclass('games.TowerDefense.Map', {
    
});

Object.subclass('games.TowerDefense.Tile', {
    
});

}) // end of module