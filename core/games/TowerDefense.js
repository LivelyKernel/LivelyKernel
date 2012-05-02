module('games.TowerDefense').requires().toRun(function() {

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
    for (var identifier in entries) {
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

Morph.subclass('games.TowerDefense.Level', {
settings: {
    xTiles: 15,
    yTiles: 15,
    groundColor: Color.rgb(0, 112, 60),
    pathColor: Color.rgb(139, 69, 19)
},
currentDescription: null,
initialize: function($super) {
    $super();
    
    this.map = [];
    
    this.initializeMap();
    this.initializeSize();
},
towerDefense: function() {
    return this.owner;
},
initializeMap: function() {
    for (var y=0; y<this.settings.yTiles; ++y) {
        for (var x=0; x<this.settings.xTiles; ++x) {
            var tile = new games.TowerDefense.Tile();
            tile.setExtent(pt(tile.edgeLength(), tile.edgeLength()));
            tile.setPosition(pt(
                x*tile.edgeLength(),
                y*tile.edgeLength()
            ));
            tile.setFill(this.settings.groundColor);
            
            this.map[y*this.settings.yTiles+x] = tile;
            this.addMorph(tile);
        }
    }
},
initializeSize: function() {
    this.setExtent(pt(
        this.settings.xTiles * games.TowerDefense.Tile.edgeLength,
        this.settings.yTiles * games.TowerDefense.Tile.edgeLength
    ));
},
loadLevel: function(levelDescription) {
    this.currentDescription = levelDescription;
    
    for (var i=0; i<levelDescription.paths.length; ++i) {
        //if (i!=2){ continue; } 
        var path = levelDescription.paths[i];
        var point = path.start;
        
        this.tileAt(point).setFill(this.settings.pathColor);
        
        var _this = this;
        path.foreachDirection(function(direction) {
            point = direction.apply(point);
            
            _this.tileAt(point).setFill(_this.settings.pathColor);
        });
    }
},
tileAt: function(point) {
    if (point.x < 0 || point.x >= this.settings.xTiles || point.y < 0 || point.y >= this.settings.yTiles) {
        throw "Point out of bounds: "+point.toString();
    }
    
    return this.map[point.y*this.settings.yTiles+point.x];
},
});

Object.subclass('games.TowerDefense.LevelDescription', {
initialize: function(description) {
    this.name = 'Unknown Level';
    this.paths = [];
    this.loadFromDescription(description || {});
},
addPathDescription: function(point, description) {
    this.addPath(new games.TowerDefense.Path(point, description));
},
addPath: function(path) {
    this.paths.push(path);
},
loadFromDescription: function(description) {
    this.setName(description.name || 'Unknown Level');
    var paths = description.paths || [];
    for (var i=0; i<paths.length; ++i) {
        this.addPathDescription(pt(paths[i].x, paths[i].y), paths[i].description);
    }
},
setName: function(name) {
    this.name = name;
},
});

Morph.subclass('games.TowerDefense.Tile', {
edgeLength: function() {
    return games.TowerDefense.Tile.edgeLength;
},
});

Object.extend(games.TowerDefense.Tile, {
edgeLength: 32,
});

Morph.subclass('games.TowerDefense.Creep', {
initialize: function($super) {
    $super();
    
    this.setFill(Color.rgb(227, 66, 52));
    this.setShape(new lively.morphic.Shapes.Ellipse(pt(-0.4, -0.4).extent(pt(0.4, 0.4))));
},
});

Object.subclass('games.TowerDefense.Path', {
initialize: function(start, description) {
    this.start = start || pt(0, 0);
    this.directions = [];
    this.compile(description);
},
getLength: function() {
    return this.directions.length;
},
compile: function(description) {
    for (var i=0; i<description.length; ++i) {
        this.appendDirection(this.parseChar(description.charAt(i)));
    }
},
parseChar: function(c) {
    switch (c) {
        case '^':
        case 'U':
            return games.TowerDefense.Direction.up;
        case '>':
        case 'R':
            return games.TowerDefense.Direction.right;
        case 'v':
        case 'D':
            return games.TowerDefense.Direction.down;
        case '<':
        case 'L':
            return games.TowerDefense.Direction.left;
        default:
            throw "Character not supported";
    }
},
up: function() {
    this.appendDirection(games.TowerDefense.Direction.up);
},
right: function() {
    this.appendDirection(games.TowerDefense.Direction.right);
},
down: function() {
    this.appendDirection(games.TowerDefense.Direction.down);
},
left: function() {
    this.appendDirection(games.TowerDefense.Direction.left);
},
appendDirection: function(direction) {
    this.directions.push(direction);
},
foreachDirection: function(callback) {
    for (var i=0; i<this.directions.length; ++i) {
        callback(this.directions[i]);
    }
},
});

Object.subclass('games.TowerDefense.Direction', {
apply: function(point) {
    throw "subclassResponsibility";
},
});

games.TowerDefense.Direction.subclass('games.TowerDefense.UpDirection', {
apply: function(point) {
    return pt(point.x, point.y-1);
},
});

games.TowerDefense.Direction.subclass('games.TowerDefense.LeftDirection', {
apply: function(point) {
    return pt(point.x-1, point.y);
},
});

games.TowerDefense.Direction.subclass('games.TowerDefense.DownDirection', {
apply: function(point) {
    return pt(point.x, point.y+1);
},
});

games.TowerDefense.Direction.subclass('games.TowerDefense.RightDirection', {
apply: function(point) {
    return pt(point.x+1, point.y);
},
});

Object.extend(games.TowerDefense.Direction, {
up: new games.TowerDefense.UpDirection(),
left: new games.TowerDefense.LeftDirection(),
down: new games.TowerDefense.DownDirection(),
right: new games.TowerDefense.RightDirection(),
});

Morph.subclass('games.TowerDefense.TowerDefense', {
settings: {
    borderWidth: 1
},
level1: function() {
    return new games.TowerDefense.LevelDescription({
        name: 'Level 1',
        paths: [
            { x: 0, y: 7, description: 'RRRRRRRRRRRRUUUUULLLLLLLDDDDDDDDDDDD' },
            { x: 14, y: 4, description: 'LLLLLLDDDDDDDDDD' }
        ]
    });
},
buildLevel: function() {
    this.level = new games.TowerDefense.Level();
    
    this.addMorph(this.level);
    this.level.setPosition(pt(this.settings.borderWidth, this.menu.getExtent().y + this.settings.borderWidth));
    this.level.loadLevel(this.level1());
},
buildMenu: function() {
    this.menu = new games.TowerDefense.Menu({
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
        this.level.getExtent().x + 2*this.settings.borderWidth,
        this.level.getExtent().y + this.settings.borderWidth + this.menu.getExtent().y
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
    this.buildLevel();
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

Object.extend(games.TowerDefense, {
start: function() {
    var towerDefense = new games.TowerDefense.TowerDefense();
    var window = new lively.morphic.Window(towerDefense, "TowerDefense");
    window.name = "TowerDefense";
    window.openInWorld();
    return window;
}
});

}); // end of module