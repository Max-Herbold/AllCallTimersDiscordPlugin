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

    class Timer extends window.BdApi.React.Component {
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
            return window.BdApi.React.createElement("div", {
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

        componentDidMount() {
            this.interval = setInterval(() => this.setState({ time: Date.now() }), 1000);
        }

        componentWillUnmount() {
            clearInterval(this.interval);
        }
    }

    return class AllCallTimeCounter {
        users = {};
        load() { }

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

        start() {
            const searchProps = ["renderPrioritySpeaker", "renderIcons", "renderAvatar"];
            const VoiceUser = window.BdApi.Webpack.getAllByPrototypeKeys(...searchProps)[0];

            window.BdApi.Patcher.after("AllCallTimeCounter", VoiceUser.prototype, "render", (thisObject, _, returnValue) => this.processVoiceUser(thisObject, _, returnValue));

            // run every second
            // TODO: Hook this to user join/leave events
            this.interval = setInterval(() => this.runEverySecond(), 1000);
        }

        stop() {
            // unpatch all functions
            window.BdApi.Patcher.unpatchAll("AllCallTimeCounter");
            clearInterval(this.interval);
        }

        findChild(root, props) {
            let children = root.props.children;
            let found = null;
            for (let i = 0; i < children.length; i++) {
                let child = children[i];
                if (child.props) {
                    let found = this.findChild(child, props);
                    if (found) {
                        return found;
                    }
                }
                if (props(child, root)) {
                    return child;
                }
            }
            return found;
        }

        createUserTimer(e, returnvalue) {
            let user = e.props.user;
            let id = user.id;

            let children = returnvalue.props.children.props.children;
            let insertIndex = 3;
            let time = null;

            try {
                time = this.users[id]["actual_start_time"];
            } catch (e) {
                return;
            }
            let tag = window.BdApi.React.createElement(Timer, {
                time: time
            });

            children.splice(insertIndex, 0, tag);
        }

        processVoiceUser(thisObject, _, returnValue) {
            this.createUserTimer(thisObject, returnValue);
        }
    };
})();
