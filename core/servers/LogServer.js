/*
 * records what is written by process.stdout and process.stderr
 */

var util = require('util');

function safeLog(msg) {
    var log = process.stderr.write.originalFunction.bind(process.stderr);
    log(msg);
}

function writeLog(logger, type, chunk) {
    if (!chunk) return logger;
    logger[type + 'Index'] += chunk.length;
    if (typeof chunk === 'string') chunk = new Buffer(chunk);
    logger[type] = Buffer.concat([logger[type], chunk]).slice(-logger.maxLength);
    return logger;
}

function readLog(logger, type, length, lastReadIndex) {
    var buffer = logger[type],
        result = {},
        index = result[type+'Index'] = logger[type+'Index'];
    if (lastReadIndex === index) { // nothing new
        result[type] = ''; return result; }
    lastReadIndex = Math.min(index, lastReadIndex || 0);
    length = length || buffer.length;
    var answerChunkSize = Math.min(length, index - lastReadIndex);
    result[type] = buffer.slice(-answerChunkSize).toString();
    return result;
}

global.ensureLivelyLogger = function ensureLivelyLogger() {
    // delete global.livelyLog; ensureLivelyLogger()
    if (global.livelyLog) return global.livelyLog;
    return global.livelyLog = {
        activated: true,
        maxLength: Math.pow(2,20), // 1MB
        stdout: new Buffer(''), stderr: new Buffer(''),
         // complete length, not just buffer length to know where we are
        stdoutIndex: 0, stderrIndex: 0,
    }
}

function disableLoggingWhile(func) {
    var logger = ensureLivelyLogger();
    logger.activated = false;
    try { func(); } finally { logger.activated = true; }
}

function installLivelyLogger(type, logger) {
    var stream = process[type];
    if (stream.write.isLivelyLogger) return;
    var original = stream.write.originalFunction || stream.write;
    stream.write = function (chunk, encoding, cb) {
        if (logger.activated) {
            try {
                writeLog(logger, type, chunk);
            } catch(e) {
                safeLog(e.stack);
            }
        }
        return original.call(this, chunk, encoding, cb);
    }
    stream.write.originalFunction = original;
    stream.write.isLivelyLogger = true;
}

(function setup() {
    var logger = ensureLivelyLogger();
    installLivelyLogger('stdout', logger);
    installLivelyLogger('stderr', logger);
})();

(function test() {
    var assert = require('assert');

    // test data
    var buf = new Buffer('some long string'),
        logIndex = buf.length,
        logger = {
            maxLength: 16,
            stdout: buf,
            stdoutIndex: logIndex
        };

    // read test 1: read simple
    var result = readLog(logger, 'stdout', 6);
    assert.deepEqual(result, {stdout: 'string', stdoutIndex: buf.length});
    
    // read test 2: read with start index
    result = readLog(logger, 'stdout', 15, 4);
    assert.deepEqual(result, {stdout: ' long string', stdoutIndex: buf.length});
    
    // write test 1: simple
    result = writeLog(logger, 'stdout', new Buffer(' doing'));
    assert.deepEqual(result, {
        stdout: new Buffer('ong string doing'),
        stdoutIndex: logIndex + ' doing'.length,
        maxLength: 16
    });
})();

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
module.exports = function(route, app, subserver) {
    
    app.get(route + 'read', function(req, res) {
        // get log starting from lastReadIndex. If log is longer
        // than length then only get the tail of the log fitting length
        var length = Number(req.query.length) || 1024,
            index = Number(req.query.lastReadIndex) || 0,
            type = req.query.type || 'stdout', result;
        try {
            result = readLog(ensureLivelyLogger(), type, length, index);
        } catch (e) { result = {error: String(e)}; }
        disableLoggingWhile(function() {
            res.json(result).end();
        })
    });

    app.get(route + 'serverStatus', function(req, res) {
        disableLoggingWhile(function() {
            res.json({
                platform: process.platform,
                arch: process.arch,
                pid: process.pid,
                version: process.version,
                uptime: process.uptime(), // seconds
                memoryUsage: process.memoryUsage()
            }).end();
        });
    });
}
