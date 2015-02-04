/*
 * For usage as EDITOR env variable.
 */
require("./commandline2lively")({
    action: process.argv[2],
    data: {args: process.argv.slice(3)}
}, function(err, answer) {
    var isError = err || answer.data.error || answer.data.status === "aborted";
    if (isError) process.stderr.write(String(err))
    else if (answer.data) {
      var out = typeof answer.data.result === "string" ?
        answer.data.result : (typeof answer.data.status === 'string' ? answer.data.status :
          String(answer.data))
      process.stdout.write(out);
    }
    process.exit(isError ? 1 : 0);
});
