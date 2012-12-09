///////////////////////////////////////////////////////////////////////////////
// Extensions to Number instances
///////////////////////////////////////////////////////////////////////////////

Object.extend(Number.prototype, {
    // random integer in 0 .. n-1
    randomSmallerInteger: function() {
        return Math.floor(Math.random() * this);
    },

    roundTo: function(quantum) {
        // quantum is something like 0.01,
        // however for JS rounding to work we need the reciprocal
        quantum = 1 / quantum;
        return Math.round(this * quantum) / quantum;
    },

    detent: function(detent, grid, snap) {
        // Map all values that are within detent/2 of any multiple of grid to
        // that multiple. Otherwise, if snap is true, return self, meaning that
        // the values in the dead zone will never be returned. If snap is
        // false, then expand the range between dead zone so that it covers the
        // range between multiples of the grid, and scale the value by that
        // factor.
        var r1 = this.roundTo(grid); // Nearest multiple of grid
        if (Math.abs(this - r1) < detent / 2) return r1; // Snap to that multiple...
        if (snap) return this // ...and return this
        // or compute nearest end of dead zone
        var r2 = this < r1 ? r1 - (detent / 2) : r1 + (detent / 2);
        // and scale values between dead zones to fill range between multiples
        return r1 + ((this - r2) * grid / (grid - detent));
    },

    toDegrees: function() {
        return (this * 180 / Math.PI) % 360;
    },

    toRadians: function() {
        return this / 180 * Math.PI;
    }
});

///////////////////////////////////////////////////////////////////////////////
// Global Helper - Numbers
///////////////////////////////////////////////////////////////////////////////

Global.Numbers = {

    random: function(min, max) {
        // both min and max are included
        min = min || 0;
        max  = max || 100;
        return Math.round(Math.random() * (max-min) + min)
    },

    humanReadableByteSize: function(n) {
        function round(n) { return Math.round(n * 100) / 100 }
        if (n < 1000) return String(round(n)) + 'B'
        n = n / 1024;
        if (n < 1000) return String(round(n)) + 'KB'
        n = n / 1024;
        return String(round(n)) + 'MB'
    },

    average: function(numbers) {
        return numbers.sum() / numbers.length;
    },

    median: function(numbers) {
        var sorted = numbers.sort(), len = numbers.length;
        return len % 2 === 0 ?
            0.5 * (sorted[len/2-1] + sorted[len/2]) :
            sorted[(len-1)/2];
    },

    between: function(x, a, b, eps) {
        // is a <= x <= y?
        eps = eps || 0;
        var min, max;
        if (a < b) { min = a, max = b }
        else { max = a, min = b }
        return (max - x + eps >= 0) && (min - x - eps <= 0);
    }

}
