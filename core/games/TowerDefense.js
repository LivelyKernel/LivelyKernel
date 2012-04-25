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
});

Object.subclass('games.TowerDefense.Menu', {
    
});

Object.subclass('games.TowerDefense.Map', {
    
});

Object.subclass('games.TowerDefense.Tile', {
    
});

}) // end of module