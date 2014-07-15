/*
 * For usage as EDITOR env variable.
 */
require("./commandline2lively")({
    action: 'openEditor',
    data: {args: process.argv.slice(2)}
}, function(err, answer) {
    console.log("Lively EDITOR session done, result: %s", answer.data.status);
    var isError = err || answer.data.error || answer.data.status === "aborted";
    process.exit(isError ? 1 : 0);
});
