// see http://peter.sh/experiments/chromium-command-line-switches/
var chromeArgs =   ["--no-process-singleton-dialog",
                    "--user-data-dir=/tmp/", "--no-first-run",
                    "--disable-default-apps",
                    //"--no-startup-window",
                    "--disable-history-quick-provider",
                    "--disable-history-url-provider",
                    "--disable-breakpad",
                    "--disable-background-mode",
                    "--disable-background-networking",
                    "--disable-preconnect", "--disabled"],
    firefoxArgs =  [];

module.exports = Config = {

    timeout: 60,
// ------------- what system do you want to test on?
    os: "Darwin", // should be: `uname -s`
    browser: "Chrome",

    browsers: {
        "Darwin": {
            "Chrome": {
                path: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
                args: chromeArgs
            },
            "Firefox": {
                path: "/Applications/Firefox.app/Contents/MacOS/firefox",
                args: firefoxArgs
            }
        },
        "Linux": {
            "Chrome": {
                path: "/usr/bin/chromium-browser",
                args: chromeArgs
            },
            "Firefox": {
                path: "/usr/bin/firefox",
                args: firefoxArgs
            }

        }
    }
};
