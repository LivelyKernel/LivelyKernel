module('lively.net.tools.Wiki').requires('lively.morphic.Complete', 'lively.persistence.BuildSpec').toRun(function() {

lively.BuildSpec("lively.wiki.LoginInfo", {
    _BorderColor: null,
    _Extent: lively.pt(360.0,320.0),
    className: "lively.morphic.Window",
    contentOffset: lively.pt(3.0,22.0),
    draggingEnabled: true,
    droppingEnabled: false,
    layout: {
        adjustForNewBounds: true
    },
    name: "LoginInfo",
    submorphs: [{
        _BorderColor: Color.rgb(95,94,95),
        _Extent: lively.pt(354.0,295.0),
        _Fill: Color.rgb(255,255,255),
        _Position: lively.pt(3.0,22.0),
        _StyleSheet: "span.doit:hover {\n\
    	font-weight: bold;\n\
    }",
        className: "lively.morphic.Box",
        layout: {
            adjustForNewBounds: true,
            resizeHeight: true,
            resizeWidth: true
        },
        name: "LoginInfo",
        submorphs: [{
            _ClipMode: "auto",
            _Extent: lively.pt(354.0,295.0),
            _FontFamily: "Arial, sans-serif",
            _FontSize: 11,
            _HandStyle: "default",
            _InputAllowed: false,
            _Padding: lively.rect(4,2,0,0),
            _TextColor: Color.rgb(0,0,0),
            allowInput: false,
            className: "lively.morphic.Text",
            droppingEnabled: false,
            fixedHeight: true,
            fixedWidth: true,
            grabbingEnabled: false,
            layout: {
                resizeHeight: true,
                resizeWidth: true
            },
            name: "userText"
        }],
        actionChangeEmail: function actionChangeEmail() {
        var context = this;
        Functions.composeAsync(
            function(next) {
                $world.passwordPrompt("enter password for " + context.user.name, function(input) {
                    context.morph.httpCheckPassword(context.user.name, input, next);
                });
            },
            function(matches, next) {
                $world.prompt("enter new email for " + context.user.name, function(input) {
                    context.morph.validateEmail(input, function(err, match) {
                        next(err || !match && "email invalid", input); }); });
            },
            function(email, next) { context.morph.httpModifyUser({email: email}, next); }
        )(function(err, data) {
            if (err) {
                context.morph.update(function() { context.morph.uiShowError(String(err)); });
            } else context.morph.update();
        });
    },
        actionChangeUser: function actionChangeUser() {
        // this is the cookie auth user change!!
        var context = this;
        $world.askForUserName(null, function(newUsername) {
            context.morph.update(function() {
                if (newUsername)
                    context.morph.uiInform("Username changed!");
            });
        });
    },
        actionChangePassword: function actionChangePassword() {
        var context = this;
        Functions.composeAsync(
            function(next) {
                $world.passwordPrompt("enter current password for " + context.user.name, function(input) {
                    context.morph.httpCheckPassword(context.user.name, input, next);
                });
            },
            function(matches, next) {
                show("%s", matches);
                $world.passwordPrompt("enter new password", function(password1) { next(null, password1); });
            },
            function(password1, next) {
                $world.passwordPrompt("repeat new password", function(password2) {
                    next(password1 !== password2 ? "repeated password does not match initial input" : null, password2);
                });
            },
            function(password, next) { context.morph.httpModifyUser({password: password}, next); }
        )(function(err, data) {
            if (err) {
                context.morph.uiShowError(String(err));
            } else {
                context.morph.update(function() { context.morph.uiInform("password changed"); });
            }
        });
    },
        actionJoinGroup: function actionJoinGroup() {
        var context = this;
        Functions.composeAsync(
            function(next) {
                $world.prompt("Which group to join?", function(input) {
                    if (!input || !input.length) context.morph.uiShowError("Invalid input " + input);
                    else next(null, input);
                })
            },
            function(groupName, next) {
                context.user.custom.groups = context.user.custom.groups || [];
                context.user.custom.groups.push(groupName);
                context.morph.httpModifyUser({custom: context.user.custom}, next); }
        )(function(err, data) {
            if (err) {
                context.morph.uiShowError(String(err));
                context.morph.update.bind(context.morph).delay(5);
            } else context.morph.update();
        });
    },
        actionLeaveGroup: function actionLeaveGroup() {
        var context = this;
        Functions.composeAsync(
            function(next) {
                $world.confirm("Do you really want to leave the group " + context.group, function(input) {
                    if (!input) context.morph.uiInform("Not leaving group " + context.group);
                    else next();
                })
            },
            function(next) {
                var groups = (context.user.custom.groups || []).without(context.group);
                context.user.custom.groups = groups
                context.morph.httpModifyUser({custom: context.user.custom}, next); }
        )(function(err, data) {
            if (err) {
                context.morph.uiShowError(String(err));
                context.morph.update.bind(context.morph).delay(5);
            } else context.morph.update();
        });
    },
        actionLogoutAndExit: function actionLogoutAndExit() {
        var context = this;
        Functions.composeAsync(
            function(next) {
                $world.confirm("Are you sure to close this world? Unsaved changes will be lost.", function(ok) {
                    if (!ok) {
                        context.morph.uiInform("logout canceled");
                        context.morph.update.bind(context.morph).delay(3);
                    } else next();
                });
            },
            function(next) { context.morph.httpLogout(next); },
            function(next) {
                lively.Config.set("askBeforeQuit", false);
                window.close();
                next();
            },
            function(next) {
                ;(function() { document.location.reload(); next(); }).delay(0.1);
            }
        )(function(err, user) {
            if (err) {
                context.morph.uiShowError(String(err));
                context.morph.update.bind(context.morph).delay(5);
            } else context.morph.uiInform("you should not see this");
        });

    },
        actionOpenMyWorkspace: function actionOpenMyWorkspace() {
        var context = this;
        var user = context.user.name, msg;

        // user workspace doit snippet
        // Step 1: create user directory
        var userDir = $world.ensureUserDir(user);
        var startFile = 'start.html';
        var start = userDir.withFilename(startFile);
        function visit() {
            $world.confirm('Visit ' + start + '?', function(bool) {
                if (bool) window.open(start)
            });
        }


        // Step 2: create first world, without overwriting an existing world
        var startWorldExists = start.asWebResource().get().exists();
        var templateDir = $world.ensureUserDir('template');

        if (!startWorldExists && templateDir) {
            var startTemplate = templateDir.withFilename(startFile);
            startTemplate.asWebResource().beAsync().get().whenDone(function(content, status) {
                content = content.replace(/%USERNAME%/g, user);
                start.asWebResource().beAsync().put(content).whenDone(function(_, status) {
                    visit(); })
            })
        } else {
            // Step 3: offer to open the world in a new window
            visit()
        }
    },
        actionShowGroupMembers: function actionShowGroupMembers() {
        var context = this;
        Functions.composeAsync(
            function(next) { context.morph.httpGetGroupMembers(context.group, next); }
        )(function(err, members) {
            if (err) {
                context.morph.uiShowError(String(err));
                context.morph.update.bind(context.morph).delay(5);
            } else $world.addCodeEditor({
                title: "Members of group " + context.group,
                textMode: "text",
                content: members.join('\n')
            })
        });
    },
        actionShowGroupResources: function actionShowGroupResources() {
        var context = this;
        Functions.composeAsync(
            function(next) { context.morph.httpGetGroupResources(context.group, next); }
        )(function(err, resources) {
            if (err) {
                context.morph.uiShowError(String(err));
                context.morph.update.bind(context.morph).delay(5);
            } else if (false) {
                $world.addCodeEditor({
                    title: "Resources of group " + context.group,
                    textMode: "text",
                    content: resources.join('\n')
                });
            } else context.morph.openResource(resources, "group " + context.group);
        });
    },
        actionShowMyResources: function actionShowMyResources() {
        var context = this;
        Functions.composeAsync(
            function(next) { context.morph.httpGetUserResources(context.user.name, next); }
        )(function(err, resources) {
            if (err) {
                context.morph.uiShowError(String(err));
                context.morph.update.bind(context.morph).delay(5);
            } else if (false) $world.addCodeEditor({
                title: "Resources of user " + context.user.name,
                textMode: "text",
                content: resources.join('\n')
            }); else context.morph.openResource(resources, "user " + context.user.name);
        });
    },
        actionSwitchUser: function actionSwitchUser() {
        var context = this, newUserName, password;
        Functions.composeAsync(
            function(next) {
                $world.prompt("enter user name", function(input) {
                    next(!input || !input.length ? new Error("not a valid user name: " + input) : null, input);
                });
            },
            function(userName, next) {
                $world.passwordPrompt("enter password for user " + userName, function(input) {
                    newUserName = userName;
                    password = input;
                    context.morph.httpCheckPassword(userName, input, next)
                });
            },
            function(matches, next) {
                if (!matches) next(new Error("Could not login as " + newUserName));
                else context.morph.httpLogin(newUserName, password, next)
            },
            function(user, next) { $world.setCurrentUser(user.name); next(null, user); }
        )(function(err, user) {
            if (err) {
                context.morph.uiShowError(String(err));
                context.morph.update.bind(context.morph).delay(5);
            } else context.morph.update();
        });
    },
        actionUpdate: function actionUpdate() {
        this.morph.update();
    },
        httpCheckPassword: function httpCheckPassword(userName, password, thenDo) {
        Global.URL.root.withFilename("uvic-check-password").asWebResource()
            .beAsync()
            .post(JSON.stringify({name: userName, password: password}), 'application/json')
            .withJSONWhenDone(function(json, status) {
                var err = json && json.error;
                if (!err && !status.isSuccess()) err = new Error("Could not login as " + userName);
                thenDo(err, status.isSuccess());
            });
    },
        httpCurrentGroupData: function httpCurrentGroupData(thenDo) {
        var self = this;
        Global.URL.nodejsBase.withFilename("AuthServer/groups/of-user/" + $world.getUserName(true))
            .asWebResource().beAsync().get()
            .withJSONWhenDone(function(json, status) {
                var err = json && json.error;
                if (!err && !status.isSuccess()) err = new Error(json.error || "Could not get groups");
                thenDo.call(self, err, json.groups || []);
            });

    },
        httpCurrentUserData: function httpCurrentUserData(doFunc) {
        this.httpDataRequest("get", doFunc);
    },
        httpDataRequest: function httpDataRequest(method, doFunc) {
        var self = this;
        // FIXME: should not say uvic-...
        Global.URL.root.withFilename('uvic-current-user').asWebResource()
            .beAsync()[method]()
            .withJSONWhenDone(function(json, status) {
                var err = null;
                if (status.isSuccess()) {
                    if (json && json.error) // logged out?
                        err = new Error(json.error);
                } else {
                    // lively-auth not present
                    err = json.error || new Error(String(status));
                }
                doFunc.call(self, err, json);
            });
    },
        httpGetGroupMembers: function httpGetGroupMembers(groupName, thenDo) {
        // this.httpGetGroupMembers("admin", show.bind(null, "%s %s"));
        var self = this;
        Global.URL.nodejsBase.withFilename("AuthServer/groups/members-of/" + groupName)
            .asWebResource().beAsync().get()
            .withJSONWhenDone(function(json, status) {
                var err = json && json.error;
                if (!err && !status.isSuccess()) err = new Error(json.error || "Could not get group members");
                thenDo.call(self, err, json.users || []);
            });

    },
        httpGetGroupResources: function httpGetGroupResources(groupName, thenDo) {
        // this.httpGetGroupResources("admin", show.bind(null, "%s %s"))
        var self = this;
        Global.URL.nodejsBase.withFilename("AuthServer/groups/resources-of/" + groupName)
            .asWebResource().beAsync().get()
            .withJSONWhenDone(function(json, status) {
                var err = json && json.error;
                if (!err && !status.isSuccess()) err = new Error(json.error || "Could not get resources of group " + groupName);
                thenDo.call(self, err, json.resources || []);
            });
    },
        httpGetUserResources: function httpGetUserResources(userName, thenDo) {
        // this.httpGetUserResources("robertkrahn", show.bind(null, "%s %s"))
        var self = this;
        Global.URL.nodejsBase.withFilename("AuthServer/users/resources-of/" + userName)
            .asWebResource().beAsync().get()
            .withJSONWhenDone(function(json, status) {
                var err = json && json.error;
                if (!err && !status.isSuccess()) err = new Error(json.error || "Could not get resources of user " + userName);
                thenDo.call(self, err, json.resources || []);
            });
    },
        httpLogin: function httpLogin(name, password, thenDo) {
        var self = this;
        Global.URL.root.withFilename("uvic-login").asWebResource()
            .beAsync()
            .post(JSON.stringify({name: name, password: password}), 'application/json')
            .withJSONWhenDone(function(json, status) {
                thenDo.call(self, !json || json.error || !status.isSuccess() ? new Error(json.error || String(status)) : null, json);
            });
    },
        httpLogout: function httpLogout(thenDo) {
        var self = this;
        Global.URL.root.withFilename("uvic-logout").asWebResource()
            .beAsync().post()
            .whenDone(function(_, status) {
                thenDo.call(self, !status.isSuccess() ? new Error(String(status)) : null);
            });
    },
        httpModifyUser: function httpModifyUser(data, thenDo) {
        var self = this;
        Global.URL.root.withFilename("uvic-current-user").asWebResource()
            .beAsync()
            .post(JSON.stringify(data), 'application/json')
            .withJSONWhenDone(function(json, status) {
                thenDo.call(self, !json || json.error || !status.isSuccess() ? new Error(json.error || String(status)) : null, json);
            });
    },
        onFromBuildSpecCreated: function onFromBuildSpecCreated() {
        this.onLoad();
    },
        onLoad: function onLoad() {
        this.update();
    },
        openResource: function openResource(resources, title) {
        var nGroups = 0;
        var grouped = groupResources(resources);

        var container = makeContainer();

        if (grouped.partsbin && grouped.partsbin.length) {
            nGroups++;
            // container.openInWorld()
            var partItemList = makeList();
            var partItems = createPartItemList(grouped.partsbin);
            var label1 = makeLabel("PartsBin items");
            partItems.forEach(function(ea) { partItemList.addMorph(ea) });
            container.addMorph(label1);
            container.addMorph(partItemList);
        }

        // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

        if (grouped.world && grouped.world.length) {
            nGroups++;
            var list = makeList();
            setStringList(grouped.world, list);
            container.addMorph(makeLabel("Worlds"));
            container.addMorph(list);
            lively.bindings.connect(list, 'selection', {visitWorld: function(morph) {
                $world.confirm("open world " + morph.item.value + '?', function(input) {
                    if (input) window.open(Global.URL.root.withFilename(morph.item.value).toString() , '_blank');
                });
            }}, 'visitWorld');
        }

        // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

        if (grouped.module && grouped.module.length) {
            nGroups++;
            var list = makeList();
            setStringList(grouped.module, list);
            container.addMorph(makeLabel("Modules and files"));
            container.addMorph(list);
            lively.bindings.connect(list, 'selection', {open: function(morph) {
                lively.ide.browse(morph.item.value);
            }}, 'open');
        }

        // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

        if (grouped.other && grouped.other.length) {
            nGroups++;
            var list = makeList();
            setStringList(grouped.other, list);
            container.addMorph(makeLabel("Other resources"));
            container.addMorph(list);
            lively.bindings.connect(list, 'selection', {open: function(morph) {
                lively.ide.openFile(Global.URL.root.withFilename(morph.item.value));
            }}, 'open');
        }

        if (nGroups === 0) {
            nGroups++;
            container.addMorph(makeLabel("You have no resources yet"));
        }

        container.setExtent(pt(630, (140+20)*nGroups));
        container.setVisible(false);
        container.openInWorld();

        (function() {
            container.openInWindow({title: "Resources of " + title})
            container.applyLayout();
            container.setVisible(true);
        }).delay(0);


        // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
        // helper
        // -=-=-=-

        function makeContainer() {
            var container = lively.morphic.Morph.makeRectangle(0,0, 630, 20);
            container.setLayouter({type: "vertical"})
            container.getLayouter().setSpacing(5)
            container.applyStyle({fill: Global.Color.white})
            return container;
        }

        function makeLabel(string) {
            var label = lively.morphic.Text.makeLabel(string);
            label.emphasizeAll({fontWeight: 'bold'});
            return label;
        }

        function makeList() {
            var list = new lively.morphic.MorphList()
            list.setLayouter({type: 'tiling'})
            list.getLayouter().setSpacing(10);
            // list.openInWorldCenter()
            list.setExtent(lively.pt(630.0,140));
            return list
        }

        function groupResources(resources) {
            return resources.groupBy(function(ea) {
                if (ea.startsWith("PartsBin/")) return "partsbin";
                if (ea.endsWith(".html")) return "world";
                if (ea.endsWith(".js")) return "module";
                return "other";
            });
        }

        function setStringList(listItems, list) {
            var items = listItems.map(function(path) { return {isListItem: true, value: path, string: path}; })
            list.setList(items);
            list.getItemMorphs().forEach(function(ea) {
                ea.setWhiteSpaceHandling("nowrap")
                return ea.fitThenDo(function() {})
            });
        }

        function createPartItemList(partResources) {
            return partResources
                .map(function(ea) { return ea.replace(/\.[^\.]+$/, ''); }).uniq()
                .map(function(ea) {
                    return {partsSpace: ea.slice(0, ea.lastIndexOf('/')),
                            name: ea.slice(ea.lastIndexOf('/') + 1)};
                })
                .map(function(ea) {
                    var item = {
                        isListItem: true,
                        value: lively.PartsBin.getPartItem(ea.name, ea.partsSpace).asPartsBinItem(),
                        string: ea.name,
                    }
                    item.value.item = item;
                    item.value.disableGrabbing();
                    return item.value;
                });
        }
    },
        reset: function reset() {
        this.get("userText").setTextString("")
    },
        textDoit: function textDoit(actionName, context) {
        return {
            doit: {
                code: Strings.format(";(%s).call(this);", this['action' + actionName.capitalize()]),
                context: context
            },
            hover: {
                inAction: function(evt) {
                    lively.$(evt.target).parent().find('span').removeClass("highlight-doit")
                    lively.$(evt.target).addClass("highlight-doit")
                }, outAction: function(evt) {
                    lively.$(evt.target).parent().find('span').removeClass("highlight-doit")
                }
            }
        }
    },
        uiInform: function uiInform(msg) {
        var markup = this.get("userText").getRichTextMarkup();
        markup.unshift([String(msg) + '\n', {italics: "italic"}])
        // markup.unshift(['Error' + (action ? 'while trying ' + action : "") + ":", {}])
        this.get("userText").setRichTextMarkup(markup);
    },
        uiShowError: function uiShowError(err, action) {
        var markup = this.get("userText").getRichTextMarkup();
        markup.unshift([String(err) + '\n', {color: Global.Color.red, fontWeight: 'bold'}])
        // markup.unshift(['Error' + (action ? 'while trying ' + action : "") + ":", {}])
        this.get("userText").setRichTextMarkup(markup);
    },
        update: function update(thenDo) {
        this.get("userText").setRichTextMarkup([["Loading", {fontWeight: "bold"}]]);
        this.httpCurrentUserData(function(err, data) {
            if (err) {
                if (String(err).match("not logged in")) {
                    var context = {morph: this}
                    this.get("userText").setRichTextMarkup([
                        ["login", this.textDoit("switchUser", context)]]);
                    this.uiShowError(err);
                } else {
                    // lively-auth not present, fallback to cookie auth
                    var data = { name: $world.getUserName(true), email: '@' },
                        context = {morph: this, user: data};

                    var markup = [
                        ["You are logged in as ", {}],  [data.name, {fontWeight: "bold"}],      ["\n", {}],
                        // ["Your email is ",        {}],  [data.email, {fontWeight: "bold"}],     ["\n", {}],
                        ["switch user",                 this.textDoit("changeUser", context)],  [" ", {}],
                        // ["change email",                this.textDoit("changeEmail", context)], [" ", {}],
                        ["\n\nRefresh",                 this.textDoit("update", context)],      [" ", {}]
                    ];
                    this.get("userText").setRichTextMarkup(markup);
                }
                thenDo && thenDo(err, data);
                return;
            }

            this.httpCurrentGroupData(function(groupErr, groups) {
                var context = {morph: this, user: data};

                var markup = [
                    ["You are logged in as ", {}], [data.name, {fontWeight: "bold"}],           ["\n", {}],
                    ["Your email is ",        {}], [data.email, {fontWeight: "bold"}],          ["\n", {}],
                    ["switch user",           this.textDoit("switchUser", context)],    [" ", {}],
                    ["change email",          this.textDoit("changeEmail", context)],   [" ", {}],
                    ["change password",          this.textDoit("changePassword", context)],   ["\n\n", {}],
                    ["Show resources I have created or modified", this.textDoit("showMyResources", context)], ["\n", {}],
                    ["Open my workspace", this.textDoit("openMyWorkspace", context)], ["\n", {}],
                    ["\nYour groups:",        {}],                                              ["\n", {}]
                ];

                markup = markup.concat.apply(markup, groups.map(function(group) {
                    return [
                        [group + " ", {fontWeight: "bold"}],
                        ['show members',   this.textDoit("showGroupMembers", Object.extend({group: group}, context))], [" ", {}],
                        ['show resources', this.textDoit("showGroupResources", Object.extend({group: group}, context))],    [" ", {}],
                        ['leave',          this.textDoit("leaveGroup", Object.extend({group: group}, context))],    [" ", {}],
                        ["\n", {}]]
                }, this));

                markup.push(["Join group", this.textDoit("joinGroup", context)]);

                markup.push(["\n\nRefresh", this.textDoit("update", context)], [" ", {}]);
                markup.push(["Logout and exit", this.textDoit("logoutAndExit", context)], ["\n", {}]);

                this.get("userText").setRichTextMarkup(markup);
                if (groupErr) this.uiShowError(groupErr);

                thenDo && thenDo(groupErr || null, data);
            });
        });
    },
        validateEmail: function validateEmail(email, thenDo) {
        var matches = Object.isString(email) && /^[^@]+@[^@]+/.test(email);
        thenDo(matches ? null : new Error(email + " is not a valid email"), matches);
    }
    }],
    titleBar: "Login info"
});

lively.BuildSpec('lively.wiki.VersionViewer', {
    _Extent: lively.pt(354.0,196.0),
    _Position: lively.pt(812.0,61.0),
    className: "lively.morphic.Window",
    contentOffset: lively.pt(3.0,22.0),
    draggingEnabled: true,
    layout: {adjustForNewBounds: true},
    name: "lively.wiki.VersionViewer",
    sourceModule: "lively.morphic.Widgets",
    submorphs: [{
        _BorderColor: Color.rgb(95,94,95),
        _BorderWidth: 1,
        _Extent: lively.pt(348.0,171.0),
        _Fill: Color.rgb(255,255,255),
        _Position: lively.pt(3.0,22.0),
        _path: null,
        className: "lively.morphic.Box",
        droppingEnabled: true,
        isCopyMorphRef: true,
        layout: {
            adjustForNewBounds: true,
            borderSize: 4.185,
            extentWithoutPlaceholder: lively.pt(396.0,146.0),
            resizeHeight: true,
            resizeWidth: true,
            spacing: 2.65,
            type: "lively.morphic.Layout.VerticalLayout"
        },
        morphRefId: 1,
        name: "VersionViewer",
        sourceModule: "lively.morphic.Core",
        submorphs: [{
            _ClipMode: "hidden",
            _Extent: lively.pt(339.0,19.0),
            _FontFamily: "Arial, sans-serif",
            _HandStyle: null,
            _InputAllowed: true,
            _MaxTextWidth: 120.695652,
            _MinTextWidth: 120.695652,
            _Padding: lively.rect(5,5,0,0),
            _Position: lively.pt(4.2,4.2),
            allowInput: true,
            className: "lively.morphic.Text",
            emphasis: [[0,0,{
                fontWeight: "normal",
                italics: "normal"
            }]],
            fixedHeight: true,
            isInputLine: true,
            layout: {
                resizeHeight: false,
                resizeWidth: true
            },
            name: "pathText",
            sourceModule: "lively.morphic.TextCore",
            connectionRebuilder: function connectionRebuilder() {
            lively.bindings.connect(this, "savedTextString", this.get("VersionViewer"), "setPath", {});
        }
        },{
            _ClipMode: { x: "hidden", y: "scroll" },
            _Extent: lively.pt(339.6,109.2),
            _Fill: Color.rgb(243,243,243),
            _Position: lively.pt(4.2,25.8),
            isMultipleSelectionList: true,
            multipleSelectionMode: "multiSelectWithShift",
            className: "lively.morphic.List",
            droppingEnabled: true,
            itemMorphs: [],
            layout: {
                adjustForNewBounds: true,
                extent: lively.pt(339.6,109.2),
                listItemHeight: 19,
                maxExtent: lively.pt(339.6,109.2),
                maxListItems: 6,
                noOfCandidatesShown: 1,
                padding: 0,
                resizeHeight: true,
                resizeWidth: true
            },
            name: "VersionList",
            sourceModule: "lively.morphic.Lists",
            submorphs: []
        },{
            _Extent: lively.pt(339.6,29.1),
            _Fill: Color.rgb(255,255,255),
            _Position: lively.pt(4.2,137.7),
            className: "lively.morphic.Box",
            droppingEnabled: true,
            layout: {
                borderSize: 3.975,
                extentWithoutPlaceholder: lively.pt(378.6,100.0),
                resizeHeight: false,
                resizeWidth: true,
                spacing: 4.25,
                type: "lively.morphic.Layout.HorizontalLayout"
            },
            name: "Rectangle",
            sourceModule: "lively.morphic.Core",
            submorphs: [{
                _BorderColor: Color.rgb(189,190,192),
                _BorderRadius: 5,
                _BorderWidth: 1,
                _Extent: lively.pt(163.7,21.2),
                _Position: lively.pt(171.9,4.0),
                className: "lively.morphic.Button",
                isPressed: false,
                label: "Visit",
                layout: {
                    resizeWidth: true
                },
                name: "VisitButton",
                sourceModule: "lively.morphic.Widgets",
                connectionRebuilder: function connectionRebuilder() {
                lively.bindings.connect(this, "fire", this.get("VersionViewer"), "visitVersion", {});
            }
            },{
                _BorderColor: Color.rgb(189,190,192),
                _BorderRadius: 5,
                _BorderWidth: 1,
                _Extent: lively.pt(163.7,21.2),
                _Position: lively.pt(4.0,4.0),
                className: "lively.morphic.Button",
                isPressed: false,
                label: "Revert",
                layout: {
                    resizeWidth: true
                },
                name: "RevertButton",
                sourceModule: "lively.morphic.Widgets",
                connectionRebuilder: function connectionRebuilder() {
                lively.bindings.connect(this, "fire", this.get("VersionViewer"), "revertToVersion", {});
            }
            }, {
                _BorderColor: Color.rgb(189,190,192),
                _BorderRadius: 5,
                _BorderWidth: 1,
                _Extent: lively.pt(163.7,21.2),
                _Position: lively.pt(4.0,4.0),
                className: "lively.morphic.Button",
                isPressed: false,
                label: "Diff",
                layout: {resizeWidth: true},
                name: "DiffButton",
                connectionRebuilder: function connectionRebuilder() {
                lively.bindings.connect(this, "fire", this.get("VersionViewer"), "diffSelectedVersions", {});
            }
            }]
        }],
        getPath: function getPath() {
        return this._path;
    },
        getTimemachineBasePath: function getTimemachineBasePath() {
            return URL.root.withFilename('timemachine/');
        },
        getVersions: function getVersions() {
        var p = this.getPath();
        if (!p) return;
        var self = this;
        lively.require('lively.store.Interface').toRun(function() {
            new lively.store.ObjectRepository().getRecords({
                paths: [p],
                attributes: ['path', 'date', 'author', 'change', 'version']
            }, function(err, rows) {
                self.showResult(err, rows);
            });
        });
    },
        onLoad: function onLoad() {
        // this.getVersions();
    },
        reset: function reset() {
            // lively.bindings.connect(this.get('UpdateButton'), 'fire', this, 'getVersions');
            lively.bindings.connect(this.get('pathText'), 'savedTextString', this, 'setPath');
            lively.bindings.connect(this.get('VisitButton'), 'fire', this, 'visitVersion');
            lively.bindings.connect(this.get('RevertButton'), 'fire', this, 'revertToVersion');
            this.get('pathText').beInputLine();
            this._path = null;
            this.get('VersionList').setList([]);
            this.get('pathText').textString = '';
        },
        revertToVersion: function revertToVersion() {
        var sel = this.get('VersionList').selection;
        if (!sel) { $world.inform('No version selected'); return; }
        var path = this.getPath(),
            getURL = this.getTimemachineBasePath().withFilename(sel.date + '/').withFilename(path),
            putURL = URL.root.withFilename(this.getPath()),
            prompt = 'Do you really want to revert \n'
                    + path
                    + '\nto its version from\n'
                    + new Date(sel.date).format('yy/mm/dd hh:MM:ss') + '?';
            $world.confirm(prompt, function(input) {
                if (!input) { $world.alertOK('Revert aborted.'); return; }
                getURL.asWebResource().createProgressBar('getting reverted content ...').enableShowingProgress().beAsync().get().whenDone(function(content, status) {
                    if (!status.isSuccess()) {
                        $world.alert('Revert failed.\nCould not read version: ' + status);
                        return;
                    }
                    putURL.asWebResource().createProgressBar('reverting ...').enableShowingProgress().beAsync().put(content).whenDone(function(_, status) {
                        if (!status.isSuccess()) {
                            $world.alert('Revert failed.\nCould not write version: ' + status);
                            return;
                        }
                        $world.alertOK(path + ' successfully reverted.');
                    });
                });
            });
    },
        setPath: function setPath(path) {
        try {
            // we expect a relative path to be entered, if it's a full URL try
            // to make it into a path
            var url = new URL(path);
            path = url.relativePathFrom(URL.root);
        } catch (e) {}
        this.get('pathText').textString = path;
        this._path = path;
        this.getVersions();
    },
        setAndSelectPath: function setAndSelectPath(path) {
            this.setPath(path);
            (function() {
               this.get('pathText').focus();
               this.get('pathText').selectAll();
           }).bind(this).delay(0);
        },
        showResult: function showResult(err, versions) {
            if (err) { show(err); versions && show(versions); return; }
            var items = versions.map(function(version) {
                try {
                    var date = new Date(version.date).format('yy/mm/dd HH:MM:ss tt');
                } catch (e) { show(e); date = 'Invalid date'; }
                return {
                    isListItem: true,
                    string: version.author + ' - ' + date + ' (' + version.change + ')',
                    value: version
                }
            });
            this.get('VersionList').setList(items);
        },
        visitVersion: function visitVersion() {
            var sel = this.get('VersionList').selection;
            if (!sel) { show('nothing selected'); return; }
            var url = this.getTimemachineBasePath()
                .withFilename(encodeURIComponent(sel.date)+'/')
                .withFilename(this.getPath());
            window.open(''+url);
        },
        diffSelectedVersions: function diffSelectedVersions() {
            var selections = this.get('VersionList').getSelections()
            if (selections.length < 2) {
                this.world().inform('Please select two versions (shift click).');
                return;
            }
            var versions = selections.slice(-2),
                path = versions[0].path,
                v1 = versions[0].version,
                v2 = versions[1].version;
            // lively.ide.diffVersions(path, v1, v2, {type: "unified"});
            lively.net.Wiki.diff(path, path, {
                versionA: v1,
                versionB: v2,
                isJSON: path.endsWith('.html') || path.endsWith('.json'),
                isLivelyWorld: path.endsWith('.html')
            }, function(err, diff) {
                    $world.addCodeEditor({
                        extent: pt(600, 700),
                        title: Strings.format('Diff %s@%s with %s@%s', path, v1, path, v2),
                        content: err || diff.diff,
                        textMode: 'diff'
                    }).getWindow().comeForward();
                });
        },
    }],
    titleBar: "VersionViewer",
    setPath: function setPath(p) {
    this.targetMorph.setPath(p);
},
    setAndSelectPath: function setAndSelectPath(p) {
    this.targetMorph.setAndSelectPath(p);
}
});
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

lively.BuildSpec('lively.wiki.ToolFlap', {
    _FixedPosition: true,
    _BorderRadius: 20,
    _Extent: lively.pt(130.0,30.0),
    _Fill: Color.rgba(255,255,255,0.8),
    _HandStyle: "pointer",
    className: "lively.morphic.Box",
    currentMenu: null,
    doNotSerialize: ["currentMenu"],
    droppingEnabled: true,
    grabbingEnabled: false,
    isEpiMorph: true,
    menu: null,
    name: "lively.wiki.ToolFlap",
    style: {zIndex: 997},
    statusText: {isMorphRef: true,name: "statusText"},
    submorphs: [{
        _Align: "center",
        _ClipMode: "hidden",
        _Extent: lively.pt(87.0,20.0),
        _FontFamily: "Helvetica",
        _HandStyle: "pointer",
        _InputAllowed: false,
        _Position: lively.pt(21.5,12.0),
        allowInput: false,
        className: "lively.morphic.Text",
        evalEnabled: false,
        eventsAreIgnored: true,
        fixedHeight: true,
        fixedWidth: true,
        isLabel: true,
        name: "statusText",
        sourceModule: "lively.morphic.TextCore",
        textString: "Wiki"
    }],
    alignInWorld: function alignInWorld() {
    this.world().cachedWindowBounds = null;
    var topRight = pt(this.world().visibleBounds().width-(40+2*130),-10);
    this.setPosition(topRight);
    this.alignSubmorphs();
},
alignSubmorphs: function alignSubmorphs() {
    this.statusText.align(this.statusText.bounds().center(), this.innerBounds().bottomCenter().addXY(0,-8));
    this.menu && this.menu.align(
        this.menu.bounds().bottomCenter(),
        this.innerBounds().bottomCenter().addXY(2, -8-20));
},
    collapse: function collapse() {
    // this.collapse()
    this.withCSSTransitionForAllSubmorphsDo(function() {
        this.setExtent(lively.pt(130.0,30.0));
        this.alignSubmorphs();
    }, 500, function() {
        if (this.menu) {
            this.menu.remove();
            this.menu = null;
        }
    });
},
    expand: function expand() {
    var self = this;
    var items = [
        ['world versions', function() {
            var versionViewer = lively.BuildSpec('lively.wiki.VersionViewer').createMorph().openInWorldCenter();
            versionViewer.setPath(URL.source.relativePathFrom(URL.root));
            // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
            self.collapse();
        }]
    ];
    this.menu = new lively.morphic.Menu(null, items);
    this.menu.openIn(this, pt(0,0), false);
    this.menu.setBounds(lively.rect(0,-66,130,23*1));
    this.withCSSTransitionForAllSubmorphsDo(function() {
        this.setExtent(pt(140, 46+23*1));
        this.alignSubmorphs();
    }, 500, function() {});
},
    onFromBuildSpecCreated: function onFromBuildSpecCreated() {
        $super();
        this.onLoad();
    },
    onLoad: function onLoad() {
    // this.startStepping(5*1000, 'update');
    this.whenOpenedInWorld(function() {
        this.alignInWorld(); });
    this.openInWorld();
    this.statusText.setHandStyle('pointer');
    this.isEpiMorph = true;
},
    onMouseDown: function onMouseDown(evt) {
    if (evt.getTargetMorph() !== this.statusText && evt.getTargetMorph() !== this) return false;
    if (this.menu) this.collapse();
    else this.expand();
    evt.stop(); return true;
},
    onWorldResize: function onWorldResize() {
    this.alignInWorld();
},
    reset: function reset() {
    this.setExtent(lively.pt(100.0,30.0));
    this.statusText = lively.morphic.Text.makeLabel('Wiki', {align: 'center', textColor: Color.rgb(33,33,33), fill: null});
    // this.statusText = this.get('statusText')
    this.addMorph(this.statusText);
    this.statusText.name = 'statusText'
    this.setFixed(true);
    this.isEpiMorph = true;
    this.setHandStyle('pointer');
    this.statusText.setHandStyle('pointer');
    this.startStepping(5*1000, 'update');
    this.grabbingEnabled = false;
    this.lock();
    this.doNotSerialize = ['currentMenu']
    this.currentMenu = null;
    this.buildSpec();
}
});

}) // end of module
