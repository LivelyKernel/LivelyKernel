module.exports = function(route, app) {
    app.get(route, function(req, res) {
        res.end("LivelyServices is running!");
    });
    app.get(route + 'list', function(req, res) {
        res.json(Object.keys(module.exports.services));
    });
}

if (!global.LivelyServices) global.LivelyServices = {};
module.exports.services = global.LivelyServices;