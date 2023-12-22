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
        start() { this.load(); }
        stop() { }
        getSettingsPanel() {
            let template = document.createElement("template");
            template.innerHTML = `<div style="color: var(--header-primary); font-size: 16px; font-weight: 300; white-space: pre; line-height: 22px;">The Library Plugin needed for ${this.name} is missing.\nPlease click <a style="font-weight: 500;">Download Now</a> to install it.</div>`;
            template.content.firstElementChild.querySelector("a").addEventListener("click", this.downloadLibrary);
            return template.content.firstElementChild;
        }
    } : (([Plugin, BDFDB]) => {


        findAllVoiceChannels = () => {
            // wait for the voice channels to render
            const voices = document.getElementsByClassName("containerDefault__3187b")

            // convert the HTMLCollection to some iterable
            let voiceArray = [];

            for (let i = 0; i < voices.length; i++) {
                let v = voices.item(i);
                // childs (div) child (div) has class `typeVoice_f4ba92`
                if (v.children[0].children[0].classList.contains("typeVoice_f4ba92")) {
                    voiceArray.push(voices.item(i));
                }
            }

            return voiceArray;
        }

        getChannelId = (channel) => {
            // get the `a` element with `data-list-item-id` attribute
            let a = channel.querySelector(`a[data-list-item-id]`);

            // get the `data-list-item-id` attribute
            let dataListItemId = a.getAttribute("data-list-item-id");

            return dataListItemId.split("___").pop();
        }

        findUserId = (user) => {
            let avatar = user.querySelector(`div[class^="userAvatar"]`);
            let avatarUrl = avatar.style.backgroundImage;
            let userId = avatarUrl.split("/");

            // return the second to last element
            let expectedUserId = userId[userId.length - 2];
            if (expectedUserId === "avatars") {
                return userId[userId.length - 3];
            }
            return expectedUserId;
        }

        findChannelUserIds = (channel) => {
            let usersList = channel.querySelector(`div[class^="list"]`);
            if (!usersList) {
                return [];
            }
            let users = usersList.children;
            let userIds = [];
            for (let i = 0; i < users.length; i++) {
                let u = users.item(i);
                userIds.push(findUserId(u));
            }
            return userIds;
        }

        /**
         * The function `getUserChannelId` returns the channel ID of a voice channel that a user is
         * currently in.
         * @param userId - The `userId` parameter is the unique identifier of a user.
         * @returns The channel ID of the voice channel that the user with the given user ID is
         * currently in.
         */
        getUserChannelId = (userId) => {
            let channels = findAllVoiceChannels();
            for (let i = 0; i < channels.length; i++) {
                let c = channels[i];
                let userIds = findChannelUserIds(c);
                if (userIds.includes(userId)) {
                    return getChannelId(c);
                }
            }
        }

        class Timer extends BDFDB.ReactUtils.Component {
            constructor(props) {
                super(props);
                this.state = { time_delta: Date.now() - this.props.time };
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
            onLoad() {

                this.modulePatches = {
                    before: [
                    ],
                    after: [
                        "VoiceUser"
                    ]
                };
                console.log("load");

            }

            onStart() {
                console.log("start");
                this.forceUpdateAll();
            }

            onStop() {
                this.forceUpdateAll();
            }

            forceUpdateAll() {
                BDFDB.PatchUtils.forceAllUpdates(this);
                BDFDB.MessageUtils.rerenderAll();
            }

            users = {};

            processAllUsers(e) {
                // get all voice channels
                let channels = findAllVoiceChannels();

                // iterate through all voice channels
                for (let i = 0; i < channels.length; i++) {
                    let c = channels[i];
                    // get the channel id
                    let channelId = getChannelId(c);
                    // get the user ids of all users in the channel
                    let userIds = findChannelUserIds(c);
                    // iterate through all user ids
                    for (let j = 0; j < userIds.length; j++) {
                        let userId = userIds[j];
                        // if the user is not in the users object, add them
                        if (!this.users[userId]) {
                            // console.log("CREATED!", userId)
                            let data = {
                                updates: 0,
                                actual_start_time: Date.now(),
                                channel: channelId,
                            };
                            this.users[userId] = data;
                        } else if (this.users[userId]["channel"] !== channelId) {
                            // console.log("CHANGED CHANNEL!", userId)
                            this.users[userId]["actual_start_time"] = Date.now();
                            this.users[userId]["updates"] = 0;
                            this.users[userId]["channel"] = channelId;
                        } else {
                            this.users[userId]["updates"] += 1;
                        }
                    }
                }
            }

            _processUser(e) {
                this.processAllUsers(e);
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
                this._processUser(e);
            }

        };
    })(window.BDFDB_Global.PluginUtils.buildPlugin(changeLog));
})();
