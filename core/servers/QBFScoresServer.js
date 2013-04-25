module.exports = function(route, app) {
app.get(route + ':person', function(req, res) {
    // Retrieve a given player's scores
    if (!fs.existsSync(filePath)) res.end("Cannot access scores");
    else {
        scoresString = fs.readFileSync(filePath);
        scores = JSON.parse(scoresString);  // inspect(scores['Dan'])
        result = JSON.stringify(scores[req.params.person] || {})
        res.end(result);
        }
    });
app.post(route + ':person', function(req, res) {
    // Update a player's posted scores
    if (!fs.existsSync(filePath)) res.end("Cannot access scores");
    else {
        scoresString = scores = newScores = LastReq = null;
        LastReq = req;
        scoresString = fs.readFileSync(filePath);
        scores = JSON.parse(scoresString);
        newScores = req.body;
        scores[req.params.person] = newScores;
        fs.writeFileSync(filePath, JSON.stringify(scores));
        res.end("written new scores for " + req.params.person + " " + inspect(req.body));
        }
    });
app.get(route, function(req, res) {
    // Retrieve all scores as a pile of JSON text
        if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, '{}');
        var content = fs.readFileSync(filePath);
        res.end(content);
    });
};

process.env.PWD;  // can print the process working directory
path = require('path');
inspect = require('util').inspect;
fs = require('fs');

localFileName = 'QBFHighScores.json';
filePath = path.join(process.env.WORKSPACE_LK, localFileName);
