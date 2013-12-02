/*global process*/
var life_star = require('life_star'),
    args = process.argv,
    env = require('./env');

life_star({
    host:                env.LIFE_STAR_HOST,
    port:                parseInt(args[2], 10),
    fsNode:              args[3], // LivelyKernel directory to serve from
    dbConf:              args[4]  !== 'undefined' ? args[4] : null, // lively-davfs
    enableTesting:       args[5]  !== 'notesting',
    logLevel:            args[6], // log level for logger: error, warning, info, debug
    behindProxy:         args[7]   == 'true',
    subservers:          args[8]  !== 'undefined' ? JSON.parse(args[8]) : null,
    useManifestCaching:  args[9]   == 'true',
    enableSSL:           args[10]  == 'true',
    enableSSLClientAuth: args[11]  == 'true',
    sslServerKey:        args[12] !== 'undefined' ? args[12] : null,
    sslServerCert:       args[13] !== 'undefined' ? args[13] : null,
    sslCACert:           args[14] !== 'undefined' ? args[14] : null
});
