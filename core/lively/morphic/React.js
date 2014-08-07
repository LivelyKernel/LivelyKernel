module('lively.morphic.React').requires('lively.morphic.Rendering', 'lively.morphic.PathShapes', 'lively.Traits', 'lively.morphic.Lists').toRun(function() {
$.getScript('react.js');

lively.morphic.ReactMorph.addMethods({
    defineReactComponents: function() {
        // extract a state object from the current values of this morph
        var shapeState = this.getState(this.getShape());
        var morphState = this.getState(this);
        this.reactComponent = this.componentFromDescription({shape: shapeState, morph: morphState, submorphs: []})
    },
    getState: function(obj) {
        var state = {};
        var props = obj.getBuildSpecProperties && obj.getBuildSpecProperties();
        for (var attr in obj) {
            if(attr.startsWith('_') && attr != '_renderContext' && (!props || (props && props.include(attr)))){
                var attrName = attr.replace(/^_/, '').capitalize()
                state[attrName] = obj['get' + attrName]();
            }
        }
        return state;
    },
    componentFromDescription: function(description) {
        /* React morphs render, by being passed a declarative description
           of a specific morph hierarchy (i.e. analogous to a buildSpec)
           
          The idea is that lively objects just operate on this description 
          structure, which we eventually dump into a React Rendering canvas, that
          knows how to interpret this description and render it. */
        var self = this;
        var state = {morph: this.extractPropsFrom(description.morph),
                     shape: this.extractPropsFrom(description.shape)};
                     
        var component = React.createClass({
            self: self,
            //event handling... should the component directly modify state,
            // or delegate this back to the morph owner object?
            
            // state methods
            getInitialState: function() {
                return state;
            },
            getInitialProps: function() {
                return {style: this.state.morph.style,
                        className: 'morphNode'
                };
            },
            
            //rendering
            renderSubmorphs: function() {
                if(this.state.submorphs) {
                    return React.DOM.div({id: 'origin-node'}, 
                                this.state.submorphs.map(this.self.componentFromDescription));
                } else {
                    return [];
                }
            },
            render: function() {
                return React.DOM.div(this.state.shape, this.renderSubmorphs());
            }
        })
        
        return component();
    },
    extractPropsFrom: function(state) {
        var props = {style: {}};
        for( var attr in state ) {
            this['set' + attr + 'Props'](state[attr], props);
        }
        return props;
    },
    setPositionProps: function(position, props) {
        props = props || this.reaceComponent.props;
        props.style.position = 'absolute';
        props.style.left = position.x + 'px';
        props.style.top = position.y + 'px';
    },

    setFillProps: function(fill, props) {
        props = props || this.reaceComponent.props;
        props.style.background = fill.toRGBAString();
    },

    setExtentProps: function(extent, props) {
        props = props || this.reaceComponent.props;
        props.style.width = extent.x + 'px';
        props.style.height = extent.y + 'px';
    },
    addMorph: function(subMorphDescription) {
        // for now this method just accepts a description of a morph
        // wich is then rendered as a reactComponent
        var morphs = this.reactComponent.state.submorphs;
        this.reactComponent.setState({submorphs: morphs.concat([subMorphDescription])});
    },

    defaultShape: function(optBounds) {
        return new lively.morphic.Shapes.ReactShape(optBounds || new lively.Rectangle(0,0,0,0));
    },
})

lively.morphic.Shapes.ReactShape.addMethods({
    
})

}) // end of module
