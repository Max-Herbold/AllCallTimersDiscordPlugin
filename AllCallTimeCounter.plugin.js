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
 * @source https://github.com/Max-Herbold/AllCallTimersDiscordPlugin/blob/main/AllCallTimeCounter.plugin.js
 * @updateUrl https://raw.githubusercontent.com/Max-Herbold/AllCallTimersDiscordPlugin/main/AllCallTimeCounter.plugin.js
 * @authorLink https://github.com/Max-Herbold
 */

module.exports = (_ => {
    class Timer extends window.BdApi.React.Component {
        constructor(props) {
            try {
                super(props);
                this.state = { time_delta: Date.now() - this.props.time };
            } catch (e) { }
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
                    let {channelId} = user;
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

            window.BdApi.Patcher.after("AllCallTimeCounter", VoiceUser.prototype, "render", (e, _, returnValue) => this.processVoiceUser(e, _, returnValue));

            // TODO: Hook this to user join/leave events
            this.interval = setInterval(() => this.runEverySecond(), 1000);
        }

        stop() {
            window.BdApi.Patcher.unpatchAll("AllCallTimeCounter");
            clearInterval(this.interval);
        }

        createUserTimer(user, parent) {
            let time = null;

            try {
                time = this.users[user.id]["actual_start_time"];
            } catch (e) {
                return;
            }
            let tag = window.BdApi.React.createElement(Timer, { time: time });

            parent.splice(3, 0, tag);
        }

        processVoiceUser(e, _, returnValue) {
            let {user} = e.props;
            let parent = returnValue.props.children.props.children;
            this.createUserTimer(user, parent);
        }
    };
})();
