var util = require('util');
module.exports = function(route, app) {
    app.post(route, function(req, res) {
        var data = '';
        req.on('data', function(d) { data += d.toString() });
        req.on('end', function(d) {
            try {
                res.end(String(eval(data)));
            } catch(e) {
                res.status(400).end(String(e));
            }
        });
    });
}
