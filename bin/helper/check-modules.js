var exec  = require("child_process").exec,
    path  = require("path"),
    fs    = require("fs"),
    lkDir = path.join(__dirname, '../..');

function ensureNodeBin(thenDo) {
    // looks like not all platforms have a "node" binary. on kubuntu it
    // seems to be called "nodejs". Lively is actually aware of those
    // issues since we detect various kinds of nodejs bins in env.js.
    // However, when installing the dependencies we can run into trouble b/c
    // e.g. websocket directly references the node bin. in order to allow
    // the install to succeed we but a "node" bin into PATH
    console.log('Checking if "node" exists...');
    exec("which node", function(code) {
        if (!code) { /*node exists*/
            thenDo(null);
            console.log('... yes');
            return;
        }
        console.log('... no');
        var binPath = path.join(process.env.WORKSPACE_LK, 'bin'),
            nodeBin = path.join(binPath, 'node'),
            realNodeBin = process.env.npm_node_execpath || process.execPath,
            nodeBinScript = "#!/usr/bin/env sh\n\n"
                      + realNodeBin + " \"$@\"\n";
        fs.writeFileSync(nodeBin, nodeBinScript);
        fs.chmodSync(nodeBin, 0755);
        process.env.PATH = binPath + ':' + process.env.PATH;
        thenDo(null);
    }).on("error", function(err) {});
}

function findMissingNPMPackages(thenDo) {
    var packageJson        = path.join(lkDir, "package.json"),
        packageJsonContent = fs.readFileSync(packageJson),
        packageJso         = JSON.parse(packageJsonContent),
        requiredDepNames   = Object.keys(packageJso.dependencies),
        nodeModulesDir     = path.join(lkDir, "node_modules"),
        actualDepNames     = fs.existsSync(nodeModulesDir) ? fs.readdirSync(nodeModulesDir) : [],
        uninstalled        = requiredDepNames.reduce(function(reqDeps, name) {
            if (actualDepNames.indexOf(name) == -1) reqDeps.push(name);
            return reqDeps;
        }, []);
    thenDo(null, uninstalled);
}

function sanityCheckWithNpmList(thenDo) {
    exec('npm list --depth 1 --json', function(code, out, err) {
        try {
            var npmList = JSON.parse(out),
                depNames = Object.getOwnPropertyNames(npmList.dependencies),
                toFix = depNames.reduce(function(depsToFix, name) {
                    var dep = npmList.dependencies[name];
                    if (dep.missing || dep.invalid) depsToFix.push(name);
                    return depsToFix;
                }, []);
            thenDo(null, toFix);
        } catch (e) { 
            console.error(e);
            // ignore npm list errors for now
            thenDo(null, []);
        }
    });
}

function installAll(pkgNames, thenDo) {
    if (!pkgNames.length) { thenDo(null); return; }
    var pkgName = pkgNames.pop();
    console.log("Installing package %s...", pkgName);
    install(pkgName, function(code, out, err) {
        if (code) {
            console.warn('Problem installing npm package %s:\n%s\n%s', pkgName, out, err);
        } else {
            console.log("Package %s successfully installed.", pkgName);
        }
        installAll(pkgNames, thenDo);
    });
}

function install(pkgName, thenDo) {
    exec("npm install " + pkgName, {cwd: lkDir}, thenDo);
}

function checkNPMPackages(thenDo) {
    findMissingNPMPackages(function(err, missing) {
        err && console.error(err);
        missing = missing || [];
        sanityCheckWithNpmList(function(err, missing2) {
            err && console.error(err);
            missing2 = missing2 || [];
            var it; while ((it = missing2.shift())) {
                if (missing.indexOf(it) === -1) missing.push(it);
            }
            if (!missing || !missing.length) return thenDo(null);
            console.log('Not all required npm packages are installed! Installing packages %s', missing);
            installAll(missing, function(err) {
                console.log("Finished installing lively server dependencies.");
                thenDo(null);
            });
        })
    });
}

module.exports = checkNPMPackages;
