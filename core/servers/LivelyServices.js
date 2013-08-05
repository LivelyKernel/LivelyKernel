module.exports = function(route, app) {
    app.get(route, function(req, res) {
        res.end("LivelyServices is running!");
    });
}

if (!module.exports.services)
    module.exports.services = {};