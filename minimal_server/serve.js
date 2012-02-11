var express = require('express'),
    app = express.createServer();

app.use(express.logger());
app.use("/", express.static(__dirname + '/../'));
app.use(express.errorHandler({dumpExceptions: true, showStack: true}));

app.listen(9001);