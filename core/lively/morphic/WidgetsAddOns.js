module('lively.morphic.WidgetsAddOns').requires('lively.LayerableMorphs', 'lively.morphic.Widgets').toRun(function() {

cop.create('FilterableListLayer').refineClass(lively.morphic.List, {
    filterItems: function(regex) {
        this.filterRegex = regex
        if (!regex && !this.unfilteredItems) return;
        this.unfilteredItems = this.unfilteredItems || this.getList();
        if (!regex) {
            var newList = this.unfilteredItems;
            this.unfilteredItems = null;
        } else {
            var newList = this.unfilteredItems.select(function(ea) {
                return String((ea.isListItem ? ea.string : ea)).match(regex);
            })
        }
        withoutLayers([FilterableListLayer], function() {
            this.updateList(newList)
        }.bind(this))
    },
    updateList: function(items) {
        this.unfilteredItems = items;
        if (this.filterRegex)
            return this.filterItems(this.filterRegex)
        else 
            return cop.proceed(items);
    }
});

}) // end of module