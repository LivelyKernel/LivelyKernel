function getScores() {
    // make sure our file exissts
    thisMonth = new Date().getMonth();
    if (!fs.existsSync(filePath))
        fs.writeFileSync(filePath, JSON.stringify({month: thisMonth}));
    // reset scores at the end of the month
    var scoresString = fs.readFileSync(filePath);
    var scores = JSON.parse(scoresString);  // inspect(scores['Dan'])
    if (scores.month != thisMonth) {
        scores = {month: thisMonth};
        fs.writeFileSync(filePath, JSON.stringify(scores));
        }
    return scores};
// --------

module.exports = function(route, app) {
app.get(route + ':person', function(req, res) {
    // Retrieve a given player's scores
    var scores = getScores();
    var result = JSON.stringify(scores[req.params.person] || {})
    res.end(result);
    });
app.post(route + ':person', function(req, res) {
    // Update a player's posted scores
    LastReq = req;
    var scores = getScores();
    var newScores = req.body;
    scores[req.params.person] = newScores;
    fs.writeFileSync(filePath, JSON.stringify(scores));
    res.end("written new scores for " + req.params.person + " " + inspect(req.body));
    });
app.get(route, function(req, res) {
    // Retrieve all scores as a pile of JSON text
    getScores();  // just to check the file
    var content = fs.readFileSync(filePath);
    res.end(content);
    });
};

//  Initial settings
pastMonth = new Date().getMonth();
process.env.PWD;  // can print the process working directory
path = require('path');
inspect = require('util').inspect;
fs = require('fs');
localFileName = 'QBFHighScores.json';
filePath = path.join(process.env.WORKSPACE_LK, localFileName);
