module('lively.persistence.MassMorphCreation').requires('lively.persistence.Serializer').toRun(function() {

Object.extend(lively.persistence, {
    OptimizedMorphCreator: {
        initShape: function(protoShape, newMorph, newCtx) {
            var newShape = newMorph.getShape();
            newShape.renderContextTable = protoShape.renderContextTable;
            newShape._renderContext = newCtx;
        },

        initNodes: function(morphNode, shapeNode, optTextNode, newCtx) {
            newCtx.morphNode = morphNode.cloneNode(true);
            newCtx.shapeNode = newCtx.morphNode.childNodes[0];
            if (optTextNode) {
                newCtx.textNode = optTextNode.cloneNode(true);
            }
        },

        prepareForNewRenderContextFunc: function(morph, shape, morphNode, shapeNode, optTextNode, ctx) {
            // this.setRenderContext(newCtx);
            this.renderContextTable = morph.renderContextTable;
            this._renderContext = ctx;

            // this.getShape().setRenderContext(newCtx);
            lively.persistence.OptimizedMorphCreator.initShape(shape, this, ctx);

            // this.renderContextDispatch('init');
            lively.persistence.OptimizedMorphCreator.initNodes(morphNode, shapeNode, optTextNode, ctx);

            // this.renderContextDispatch('append');
            // Not necessary if no owner

            // this.getShape().renderUsing(newCtx);
            // already done above

            // this.submorphs[i].prepareForNewRenderContext(newCtx.newForChild());
            // currently submorphs are not supported

            // this.registerForEvents(Config.handleOnCapture);
            this.registerForEvents(Config.handleOnCapture);

            // this.resumeStepping();
            // TODO

            // onLoad
            // TODO
        },

        nullRenderInstallerFor: function(obj) {
            var renderSelectors = Object.values(obj.renderContextTable),
                exceptions = ['getTextExtentHTML'],
                replacementInstallers = renderSelectors.collect(function(renderMethodSelector) {
                    if (exceptions.include(renderMethodSelector)) return null;
                    var klass = obj.constructor,
                        own = klass.prototype.hasOwnProperty(renderMethodSelector),
                        original = klass.prototype[renderMethodSelector],
                        replacementSpec = {};
                    replacementSpec.methodName = renderMethodSelector;
                    replacementSpec.klass = klass;
                    replacementSpec.installNop = function() {
                        klass.prototype[renderMethodSelector] = Functions.Null;
                    }
                    replacementSpec.clean = function() {
                        if (own) {
                            klass.prototype[renderMethodSelector] = original;
                        } else {
                            delete klass.prototype[renderMethodSelector];
                        }
                    }
                    return replacementSpec;
                }).select(function(ea) { return ea });
            return {
                install: function() {
                    replacementInstallers.invoke('installNop');
                },
                clean: function() {
                    replacementInstallers.invoke('clean');
                }
            }
        }
    }
});

Object.extend(lively.morphic.Morph, {

    // the unoptimized versions:
    createN: function(n, createFunc) {
        return Array.range(1, n).collect(createFunc);
    },

    // optimized:
    createN: function(n, createFunc) {
        var first = createFunc(),
            firstShape = first.getShape(),
            firstNode = first.renderContext().morphNode,
            firstShapeNode = first.renderContext().shapeNode,
            firstTextNode = first.renderContext().textNode,
            morphProto = lively.morphic.Morph.prototype,
            initRenderFunc = morphProto.prepareForNewRenderContext;

        if (first.owner) {
            throw new Error('createN currently does not work for morphs'
                           + 'having an owner');
        }
        if (first.submorphs.length) {
            throw new Error('createN currently does not work for morphs'
                           + 'having submorphs');
        }

        // replace prepareForNewRenderContext
        morphProto.prepareForNewRenderContext = function(ctx) {
            return lively.persistence.OptimizedMorphCreator.prepareForNewRenderContextFunc.call(
                this, first, firstShape, firstNode, firstShapeNode, firstTextNode, ctx);
        };

        // replace render methods in shape and morph
        var morphNullRenderer = lively.persistence.OptimizedMorphCreator.nullRenderInstallerFor(first),
        shapeNullRenderer = lively.persistence.OptimizedMorphCreator.nullRenderInstallerFor(firstShape);
        morphNullRenderer.install();
        shapeNullRenderer.install();

        // // replace #defaultShape
        // var originalDefaultSHapeFunc = morphProto.defaultShape;
        // morphProto.defaultShape = function

        var morphs = new Array(n);
            morphs[0] = first;
        try {
            for (var i = 1; i < n; i++) {
                morphs[i] = createFunc();
            }
            return morphs;
        } finally {
            morphProto.prepareForNewRenderContext = initRenderFunc;
            morphNullRenderer.clean();
            shapeNullRenderer.clean();
        }
    }

});



}) // end of module