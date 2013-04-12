spawn = require('child_process').spawn;
dir = process.env.WORKSPACE_LK;

git = {process: null, stdout: '', stderr: '', lastExitCode: null}
defaultOptions = ['--no-pager']

runGit = function(/*args, thenDo*/) {
    var args = [], thenDo;
    for (var i = 0; i < arguments.length; i++) {
        if (typeof arguments[i] === 'function') { thenDo = arguments[i]; break;}
        args.push(arguments[i]);
    }

    git.process = spawn('git', defaultOptions.concat(args), {cwd: dir});
    git.process.stdout.on('data', function (data) {
        // console.log('stdout: ' + data);
        git.stdout += data;
    });

    git.process.stderr.on('data', function (data) {
        // console.log('stderr: ' + data);
        git.stderr += data;
    });

    git.process.on('close', function (code) {
        console.log('git process exited with code ' + code);
        git.process = null;
        git.lastExitCode = code;
    });

}

function formattedResponseText(type, data) {
    var s = String(data);
    return '<GITCONTROL$' + type.toUpperCase() + s.length + '>' + s;
}

module.exports = function(route, app) {

    app.get(route, function(req, res) {
        res.json({cwd: dir});
    });

    app.post(route, function(req, res, next) {
        var command = req.body && req.body.command;
        if (!command) { res.status(400).end(); return; }
        if (git.process) { res.status(400).end({error: 'Git process still running!'}); return; }
        runGit.apply(null, command.split(' '));
        if (!git.process) { res.status(400).end({error: 'Could not start git!'}); return; }

        // make ir a streaming response:
        res.removeHeader('Content-Length');
        res.set({
          'Content-Type': 'text/plain',
          'Transfer-Encoding': 'chunked'
        });

        git.process.stdout.on('data', function (data) {
            res.write(formattedResponseText('STDOUT', data));
        });

        git.process.stderr.on('data', function (data) {
            res.write(formattedResponseText('STDERR', data));
        });

        git.process.on('close', function(code) {
            res.write(formattedResponseText('CODE', git.lastExitCode));
            res.end();
        });
    });

}
