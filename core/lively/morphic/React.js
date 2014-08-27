module('lively.morphic.React').requires('lively.morphic.Rendering', 'lively.morphic.PathShapes', 'lively.Traits', 'lively.morphic.Lists').requiresLib({url: 'core/lib/react.js', loadTest: function() { return Global.React }}).toRun(function() {

lively.morphic.ReactMorph.addMethods(
    'default', {
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
        var Shape =  React.createClass({
            self: self,
            onMouseDown: function() {
                this.self.focusedMorph = this;
                alertOK('mouseDown!');
            },
            onMouseMove: function(evt) {
                if(this.self.focusedMorph) debugger;
                if(this.self.focusedMorph == this){
                    alertOK('moving!')
                    this.self.setPositionProps({Position: pt(evt.screenX, evt.screenY)},
                                                this.props);
                }
            },
            onMouseUp: function() {
                //this.self.focusedMorph = null;
                alertOK('mouseUp!');
            },
            getDefaultProps: function() {
                return {style: {}}
            },
            renderSubmorphs: function() {
                if(this.props.state.submorphs.length) {
                    return [React.DOM.div({id: 'origin-node'}, 
                                this.props.state.submorphs.map(function(morphData) {
                                    return Morph({state: morphData}) 
                                }))];
                } else {
                    return [];
                }
            },
            componentWillUpdate: function(newProps, newState){
                // rescue node state into the old morph state,
                // to make sure that if the same morph is used somewhere else
                // we can recreate the node state
                var oldShape = this.props.state.shape.rescued = {};
                oldShape.scrollTop = this.getDOMNode().scrollTop;
                oldShape.scrollLeft = this.getDOMNode().scrollLeft;
            },
           render: function() {
               this.props.onMouseMove = this.onMouseMove;
               this.props.onMouseDown = this.onMouseDown;
               this.props.onMouseUp = this.onMouseUp;
               this.props.style = this.self.extractStylePropsFrom(this.props.state.shape);
               var rescued = this.props.state.shape.rescued
                if(rescued) {
                    for(var attr in rescued){
                        this.props[attr] = rescued[attr];
                    }
               }
               return React.DOM.div(this.props, this.renderSubmorphs());
           } 
        });
                     
        var Morph = React.createClass({
            self: this,
            getDefaultProps: function() {
                return {style: {},
                        className: 'morphNode'}
            },
            initProps: function() {
                if(this.state)
                    this.props.state = this.state;
                if(!this.props.state)
                    this.props.state = description;
                this.props.style = this.self.extractStylePropsFrom(this.props.state.morph);
            },
            render: function() {
                this.initProps();
                return React.DOM.div(this.props, Shape({state: this.props.state}));
            }
        })
        return Morph();
    },
    extractStylePropsFrom: function(state, propsStore) {
        var props = propsStore || {style: {}};
        for( var attr in state ) {
            this['set' + attr + 'Props'](state, props);
        }
        return props.style;
    },
    exampleDescription: function() {
        /* an example of a description for a morph hierarchy
           for documentation purposes */
           
          return {morph: {},
                  shape: {Fill: Color.red,
                          Position: pt(0,0),
                          Extent: pt(100,100)},
                  submorphs: [{morph: {},
                               shape: {Fill: Color.blue,
                                       Position: pt(42,42),
                                       Extent: pt(42,42)},
                                submorphs: []}]}
    },
    descriptionFromBuildSpec: function(spec) {
        spec = spec.attributeStore;
        var description = {morph: {}, 
                           shape: {}, 
                           submorphs: (spec.submorphs && spec.submorphs.map(this.descriptionFromBuildSpec, this)) || []}
        // we currently place nothing inside the morph part
        for ( var attr in spec ) {
            if (attr.startsWith('_')){
                if(this.renders(attr)){
                    if(this.isShapePart(attr))
                        description.shape[attr.replace('_', "")] = spec[attr];
                    else
                        description.morph[attr.replace('_', "")] = spec[attr];
                }
            }
        }
        return description;
    },
    renders: function(attrName) {
        return ['_Extent', '_Fill', '_Position', 
                '_BorderWidth', '_BorderColor', '_ClipMode', 
                '_Rotation'].include(attrName) || alert('Do not render: ' + attrName);
    },
    renderBuildSpec: function(spec) {
        if(!this.reactComponent) {
            this.reactComponent = React.renderComponent(
                this.componentFromDescription(
                    this.descriptionFromBuildSpec(spec)), this.renderContext().shapeNode);
        } else {
            this.reactComponent.replaceState(
                    this.descriptionFromBuildSpec(spec));
        }
    },
    isShapePart: function(attr) {
        return ![/* this containes all the morph attributes */].include(attr)
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
},
'setting', {
    setPositionProps: function(state, props) {
        var position = state['Position'];
        props.style.position = 'absolute';
        props.style.left = position.x + 'px';
        props.style.top = position.y + 'px';
    },

    setClipModeProps: function(state, props) {
        var state = state['ClipMode'];
        var style = props.style;
        if (typeof state === "string") {
            style.overflowX = state;
            style.overflowY = state;
        } else if (typeof state === "object") {
            if (!state.x) style.removeProperty('overflow-x');
            else style.overflowX = state.x;
            if (!state.y) style.removeProperty('overflow-y');
            else style.overflowY = state.y;
        } else {
            style.removeProperty('overflow-x');
            style.removeProperty('overflow-y');
        }
    },

    setBorderColorProps: function(state, props) {
        this.setBorderProps(state, props);
    },
    setBorderWidthProps: function(state, props) {
        this.setBorderProps(state, props);
    },
    setRotationProps: function(state, props) {
        
    },

    setBorderProps: function(state, props) {
        var opacity = state['Opacity'];
        var fill = state['BorderColor'] || null;
        var width = state['BorderWidth'];
        if (this.getStrokeOpacity() != 1) {
            opacity = this.getStrokeOpacity();
        } else {
            opacity = fill === null ? 0 : fill.a;
        }
        if ((fill instanceof Color) && opacity) fill = fill.withA(opacity);
        if (!fill) fill = Color.rgba(0,0,0,1);
        props.style['border'] = state['BorderStyle'] || 'solid' + ' ' + width + 'px ' +
            fill.toCSSString(state['Bounds']);
    },
    setFillProps: function(state, props) {
        props.style.background = state['Fill'].toRGBAString();
    },
    setExtentProps: function(state, props) {
        var extent = state['Extent']
        props.style.width = extent.x + 'px';
        props.style.height = extent.y + 'px';
    }
}, 'getting', {

})

lively.morphic.Shapes.ReactShape.addMethods({
    
})

}) // end of module
