/**
 * @name AllCallTimeCounter
 * @author Max
 * @description Add call timer to all users in a server voice channel.
 * @source https://github.com/Max-Herbold/AllCallTimersDiscordPlugin/blob/main/AllCallTimeCounter.plugin.js
 * @updateUrl https://raw.githubusercontent.com/Max-Herbold/AllCallTimersDiscordPlugin/main/AllCallTimeCounter.plugin.js
 * @authorLink https://github.com/Max-Herbold
 * @version 1.0.12
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
                className: "timeCounter",
                children: time,
                style: {
                    fontWeight: "bold",
                    fontFamily: "monospace",
                    fontSize: 11,
                    position: "absolute",
                    color: "var(--channels-default)",
                    marginTop: 23,
                    marginLeft: 32,
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
        users = new Map();  // value format: [channelId, lastUpdatedTime]

        load() { }

        allUsers(guilds) {
            // return an array of all users in all guilds
            let users = [];
            for (const guildId in guilds) {
                const guild = guilds[guildId];
                for (const userId in guild) {
                    users.push(userId);
                }
            }
            return users;
        }

        updateInternal(userId, channelId) {
            this.users.set(userId, [channelId, Date.now()]);
        }

        updateSingleUser(userId, channelId) {
            // if channelId is undefined return
            if (!channelId) {
                return;
            }
            // Used to keep track of currently rendered users in real time
            if (this.users.has(userId) && this.users.get(userId)[0] !== channelId) {
                // User moved to a different channel
                this.updateInternal(userId, channelId);
            } else if (!this.users.has(userId)) {
                // User just joined a channel
                this.updateInternal(userId, channelId);
            }
        }

        runEverySecond() {
            // Keeps track of users in the background at 1Hz
            const states = this.VoiceStateStore.getAllVoiceStates();

            const current_users = this.allUsers(states);
            for (let userId of Array.from(this.users.keys())) {
                if (!current_users.includes(userId)) {
                    this.users.delete(userId);
                }
            }

            // states is an array of {guildId: {userId: {channelId: channelId}}}
            // iterate through all guilds and update the users, check if the user is in the same channel as before
            // if userId is not in any guild it should be deleted from the users object
            for (const guildId in states) {
                let guild = states[guildId];
                for (const userId in guild) {
                    const user = guild[userId];
                    const { channelId } = user;
                    if (channelId) {
                        if (this.users.has(userId)) {
                            // user is already in the users object
                            if (this.users.get(userId)[0] !== channelId) {
                                // user changed the channel
                                this.updateInternal(userId, channelId);
                            }
                        } else {
                            // user is not in the users object
                            this.updateInternal(userId, channelId);
                        }
                    }
                }
            }
        }

        start() {
            const VoiceUser = window.BdApi.Webpack.getBySource("iconPriortySpeakerSpeaking", "avatarContainer", "getAvatarURL");

            this.VoiceStateStore = window.BdApi.Webpack.getStore("VoiceStateStore");

            window.BdApi.Patcher.after("AllCallTimeCounter", VoiceUser.ZP, "render", (_, [props], returnValue) => this.processVoiceUser(_, [props], returnValue));

            // TODO: Hook this to user join/leave events
            this.interval = setInterval(() => this.runEverySecond(), 1000);
        }

        stop() {
            window.BdApi.Patcher.unpatchAll("AllCallTimeCounter");
            clearInterval(this.interval);
        }

        createUserTimer(user, parent) {
            const time = this.users.get(user.id)[1]
            const tag = window.BdApi.React.createElement(Timer, { time: time });

            try {
                parent.splice(3, 0, tag);
                // parent[2].props.children.props.children.props.children.push(tag);
            } catch (e) { }
        }

        processVoiceUser(_, [props], returnValue) {
            // console.log(_, props, returnValue);
            const { user } = props;
            this.updateSingleUser(user.id, props.channelId);  // update user entry before trying to render
            const parent = returnValue.props.children.props.children;
            this.createUserTimer(user, parent);
        }
    };
})();
