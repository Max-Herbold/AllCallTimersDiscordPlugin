/**
 * @name AllCallTimeCounter
 * @author Max
 * @authorId
 * @version 1.0.0
 * @description Add call timer to all users in a voice channel.
 * @invite
 * @donate
 * @patreon
 * @website
 * @source
 * @updateUrl
 * @authorLink https://github.com/Max-Herbold
 */

module.exports = (_ => {
    const changeLog = {

    };

    return !window.BDFDB_Global || (!window.BDFDB_Global.loaded && !window.BDFDB_Global.started) ? class {
        constructor(meta) { for (let key in meta) this[key] = meta[key]; }
        getName() { return this.name; }
        getAuthor() { return this.author; }
        getVersion() { return this.version; }
        getDescription() { return `The Library Plugin needed for ${this.name} is missing. Open the Plugin Settings to download it. \n\n${this.description}`; }

        downloadLibrary() {
            BdApi.Net.fetch("https://mwittrien.github.io/BetterDiscordAddons/Library/0BDFDB.plugin.js").then(r => {
                if (!r || r.status != 200) throw new Error();
                else return r.text();
            }).then(b => {
                if (!b) throw new Error();
                else return require("fs").writeFile(require("path").join(BdApi.Plugins.folder, "0BDFDB.plugin.js"), b, _ => BdApi.showToast("Finished downloading BDFDB Library", { type: "success" }));
            }).catch(error => {
                BdApi.alert("Error", "Could not download BDFDB Library Plugin. Try again later or download it manually from GitHub: https://mwittrien.github.io/downloader/?library");
            });
        }

        load() {
            if (!window.BDFDB_Global || !Array.isArray(window.BDFDB_Global.pluginQueue)) window.BDFDB_Global = Object.assign({}, window.BDFDB_Global, { pluginQueue: [] });
            if (!window.BDFDB_Global.downloadModal) {
                window.BDFDB_Global.downloadModal = true;
                BdApi.showConfirmationModal("Library Missing", `The Library Plugin needed for ${this.name} is missing. Please click "Download Now" to install it.`, {
                    confirmText: "Download Now",
                    cancelText: "Cancel",
                    onCancel: _ => { delete window.BDFDB_Global.downloadModal; },
                    onConfirm: _ => {
                        delete window.BDFDB_Global.downloadModal;
                        this.downloadLibrary();
                    }
                });
            }
            if (!window.BDFDB_Global.pluginQueue.includes(this.name)) window.BDFDB_Global.pluginQueue.push(this.name);
        }
        start() {
            console.log("ALLCALL: first start");
            this.load();
        }
        stop() { }
        getSettingsPanel() {
            let template = document.createElement("template");
            template.innerHTML = `<div style="color: var(--header-primary); font-size: 16px; font-weight: 300; white-space: pre; line-height: 22px;">The Library Plugin needed for ${this.name} is missing.\nPlease click <a style="font-weight: 500;">Download Now</a> to install it.</div>`;
            template.content.firstElementChild.querySelector("a").addEventListener("click", this.downloadLibrary);
            return template.content.firstElementChild;
        }
    } : (([Plugin, BDFDB]) => {


        class Timer extends BDFDB.ReactUtils.Component {
            constructor(props) {
                try {
                    super(props);
                    this.state = { time_delta: Date.now() - this.props.time };
                } catch (e) {
                    console.log(e);
                }
            }

            render() {
                let time = new Date(Date.now() - this.props.time).toISOString().substr(11, 8);
                return BDFDB.ReactUtils.createElement("div", {
                    className: "counter_number",
                    children: time,
                    style: {
                        color: "red",
                        fontSize: "13px",
                        fontWeight: "bold",
                        position: "absolute",
                        left: "90px",
                        // backgroundColor: "white",
                        borderRadius: "5px",
                        padding: "2px",
                        margin: "2px",
                        // border: "1px solid black"
                    }
                });
            }

            // create a 1 second timer
            componentDidMount() {
                this.interval = setInterval(() => this.setState({ time: Date.now() }), 1000);
            }

            // remove the timer when we don't need it anymore
            componentWillUnmount() {
                // getUserChannelId(this.userId);
                clearInterval(this.interval);
            }
        }

        return class AllCallTimeCounter extends Plugin {
            users = {};
            onLoad() {
                this.modulePatches = {
                    before: [
                    ],
                    after: [
                        "VoiceUser"
                    ]
                };
            }

            allUsers(guilds) {
                // return an array of all users in all guilds
                let users = [];
                for (let guildId in guilds) {
                    let guild = guilds[guildId];
                    for (let userId in guild) {
                        users.push(userId);
                    }
                }
                return users;
            }

            runEverySecond() {
                const ChannelListVoiceCategoryStore = window.BdApi.Webpack.getStore("VoiceStateStore");
                let states = ChannelListVoiceCategoryStore.getAllVoiceStates();

                let current_users = this.allUsers(states);
                for (let userId in this.users) {
                    if (!current_users.includes(userId)) {
                        delete this.users[userId];
                    }
                }

                // states is an array of {guildId: {userId: {channelId: channelId}}}
                // iterate through all guilds and update the users, check if the user is in the same channel as before
                // if userId is not in any guild it should be deleted from the users object
                for (let guildId in states) {
                    let guild = states[guildId];
                    for (let userId in guild) {
                        let user = guild[userId];
                        let channelId = user.channelId;
                        if (channelId) {
                            if (this.users[userId]) {
                                // user is already in the users object
                                if (this.users[userId]["channelId"] !== channelId) {
                                    // user changed the channel
                                    this.users[userId]["channelId"] = channelId;
                                    this.users[userId]["actual_start_time"] = Date.now();
                                }
                            } else {
                                // user is not in the users object
                                this.users[userId] = {
                                    "channelId": channelId,
                                    "actual_start_time": Date.now()
                                };
                            }
                        }
                    }
                }
            }

            onStart() {
                // run every second
                // TODO: Hook this to user join/leave events
                this.interval = setInterval(() => this.runEverySecond(), 1000);

                this.forceUpdateAll();
            }

            onStop() {
                clearInterval(this.interval);

                this.forceUpdateAll();
            }

            forceUpdateAll() {
                BDFDB.PatchUtils.forceAllUpdates(this);
                BDFDB.MessageUtils.rerenderAll();
            }

            createUserTimer(e) {
                let user = e.instance.props.user;
                let id = user.id;

                let content = BDFDB.ReactUtils.findChild(e.returnvalue, { props: [["className", BDFDB.disCN.voicecontent]] });
                let children = content.props.children;
                let insertIndex = 3;

                let tag = null;

                let time = this.users[id]["actual_start_time"];

                tag = BDFDB.ReactUtils.createElement(Timer, {
                    time: time
                });

                children.splice(insertIndex, 0, tag);
            }

            processVoiceUser(e) {
                this.createUserTimer(e);
            }

        };
    })(window.BDFDB_Global.PluginUtils.buildPlugin(changeLog));
})();
