lively.morphic.Morph.subclass('Counter',
'initializing', {
    initialize: function($super, shape, initialCount) {
        $super(shape);
        this.count = initialCount || 0;
        this.setBounds(lively.rect(20,20,40,40));
        this.setFill(Color.red);
        
        this.label = new lively.morphic.Text(lively.rect(0,0,40,40), this.count.toString());
        this.addMorph(this.label);
    },
},
'changing', {
    increase: function() {
        this.count += 1;
        this.updateLabel();
    },
    descrease: function() {
        this.count -= 1;
        this.updateLabel();
    },
    increaseBy: function(increment) {
        this.count -= increment;
        this.updateLabel();
    },
    decreaseBy: function(decrement) {
        this.count -= decrement;
        this.updateLabel();
    },
    updateLabel: function() {
        this.label.setTextString(this.count.toString());
    }
},
'testing', {
    isZero: function() {
        return this.count === 0;
    },
});

// this is necessary when proxying was not used on Base.js, as classes
// then are not automatically proxied
if (lively.versions.tests.Benchmarks.isExecutingProxyBenchmark &&
        !ObjectVersioning.isProxy(Counter)) {
    Counter = ObjectVersioning.proxyFor(Counter);
}

Counter.subclass('DoubleCounter',
'changing', {
    increase: function() {
        this.count += 2;
    },
    descrease: function() {
        this.count -= 2;
    },
    increaseBy: function($super, increment) {
        $super(increment * 2);
    },
    decreaseBy: function($super, decrement) {
        $super(decrement * 2);
    }
});

if (lively.versions.tests.Benchmarks.isExecutingProxyBenchmark &&
        !ObjectVersioning.isProxy(DoubleCounter)) {
    DoubleCounter = ObjectVersioning.proxyFor(DoubleCounter);
}

for (var i = 0; i < 100; i++) {
    var c = new Counter();
    c.openInWorld();
    c.increase();
    c.increase();
    c.increase();
    c.decreaseBy(3);
    c.isZero();
    c.remove();

    var dc = new DoubleCounter();
    dc.openInWorld();
    dc.increase();
    dc.increaseBy(4);
    dc.decreaseBy(5);
    dc.isZero();
    dc.remove();
}
