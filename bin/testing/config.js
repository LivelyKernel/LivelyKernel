/*globals */
var path = require('path'),
    env = require('../env');

// see http://peter.sh/experiments/chromium-command-line-switches/
var chromeTmpDir = path.join(env.TEMP_DIR, 'chrome-for-lively/'),
    chromeArgs   = [// "--enable-logging",
                    // "--v=1",
                    // "--enable-logging=stderr",
                    "--no-sandbox", // for chrome/ubuntu bug
                    "--no-process-singleton-dialog",
                    "--user-data-dir=" + chromeTmpDir,
                    "--no-first-run",
                    "--js-flags=--harmony",
                    "--disable-default-apps",
                    "--disable-history-quick-provider",
                    "--disable-history-url-provider",
                    "--disable-breakpad",
                    "--disable-restore-session-state",
                    "--disable-restore-background-contents",
                    "--disable-tab-closeable-state-watcher",
                    "--disable-background-mode",
                    "--disable-background-networking",
                    "--disable-preconnect",
                    "--disabled"],
    firefoxArgs =  [];

var Config = {
    platformConfigs: {
        "darwin": {
            "chrome": {
                path: env.CHROME_BIN,
                args: chromeArgs,
                tmpDir: chromeTmpDir
            },
            "firefox": {
                path: env.FIREFOX_BIN,
                args: firefoxArgs
            }
        },
        "linux": {
            "chrome": {
                path: env.CHROME_BIN,
                args: chromeArgs,
                tmpDir: chromeTmpDir
            },
            "firefox": {
                path: env.FIREFOX_BIN,
                args: firefoxArgs
            }
        },
	"win32": {
	    "chrome": {
		path: env.CHROME_BIN,
		args: chromeArgs,
		tmpDir: chromeTmpDir
	    },
            "firefox": {
                path: env.FIREFOX_BIN,
                args: firefoxArgs
            }
	}
    }
};

module.exports = Config;
