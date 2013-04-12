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

runGit('status')

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
res.removeHeader('Content-Length');
res.set({
  'Content-Type': 'text/plain',
  'Transfer-Encoding': 'chunked',
//   'Content-Length': "-1",
//   'Accept-Ranges': 'bytes'
//   // 'ETag': '12345'
})
// res.set(200, {
//                        'Transfer-Encoding': 'chunked'
//                      , 'Content-Type': 'application/json'
//                      , 'Accept-Ranges': 'bytes'
// });
// console.dir(res);
        stdoutCount = 0;
        git.process.stdout.on('data', function (data) {
            console.log('stdout: ' + data);
            // console.log('stdoutCount: %s', ++stdoutCount);
            // res.write(JSON.stringify({stdout: data.toString()}));
            var s = data.toString();
            res.write('<GITCONTROL$STDOUT' + s.length + '>' + s);
        });

        stderrCount = 0;
        git.process.stderr.on('data', function (data) {
            // console.log('stderr: ' + data);
            // console.log('stderrcount: %s', ++stderrCount);
            // res.write(data.toString());
            var s = data.toString();
            res.write('<GITCONTROL$STDERR' + s.length + '>' + s);
        });

        git.process.on('close', function (code) {
            var s = String(git.lastExitCode);
            res.write('<GITCONTROL$CODE' + s.length + '>' + s);
            res.end();
        });

    });

}
