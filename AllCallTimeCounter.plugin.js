/**
 * @name AllCallTimeCounter
 * @author Max, nicola02nb, Witwitchy
 * @description Add call timer to all users in a server voice channel.
 * @source https://github.com/Max-Herbold/AllCallTimersDiscordPlugin/blob/main/AllCallTimeCounter.plugin.js
 * @updateUrl https://raw.githubusercontent.com/Max-Herbold/AllCallTimersDiscordPlugin/main/AllCallTimeCounter.plugin.js
 * @authorLink https://github.com/Max-Herbold
 * @version 1.1.2
 */
const { Webpack, React, Patcher, Utils, Data, DOM, UI, Components } = BdApi;
const DiscordModules = Webpack.getModule(m => m.dispatch && m.subscribe);

const UserStore = Webpack.getStore("UserStore");
const GuildStore = Webpack.getStore("GuildStore");

const userJoinTimes = new Map();

const settings = {};
const config = {
    changelog: [],
    settings: [
        { type: "switch", id: "showWithoutHover", name: "Show Without Hover", note: "Always show the timer without needing to hover", value: true },
        { type: "switch", id: "showRoleColor", name: "Show Role Color", note: "Show the user's role color (if this plugin in enabled)", value: true },
        { type: "switch", id: "trackSelf", name: "Track Self", note: "Also track yourself", value: true },
        { type: "switch", id: "showSeconds", name: "Show Seconds", note: "Show seconds in the timer", value: true },
        { type: "select", id: "format", name: "Format", note: "Compact or human readable format:", options: [
            { label: "Human Readable (e.g. 1h 2m 3s)", value: "human" },
            { label: "HH:mm:ss (e.g. 01:02:03)", value: true }
        ], value: true },
        { type: "switch", id: "watchLargeGuilds", name: "Watch Large Guilds", note: "Track users in large guilds. This may cause lag if you're in a lot of large guilds with active voice users. Tested with up to 2000 active voice users with no issues.", value: false }
    ]
};

function initSettingsValues() {
    for (const setting of config.settings) {
        if (setting.type === "category") {
            for (const settingInt of setting.settings) {
                settingInt.value = Data.load("AllCallTimeCounter", settingInt.id) ?? settingInt.value;
                settings[settingInt.id] = settingInt.value;
            }
        } else {
            setting.value = Data.load("AllCallTimeCounter", setting.id) ?? setting.value;
            settings[setting.id] = setting.value;
        }
    }
}

function setConfigSetting(id, newValue) {
    for (const setting of config.settings) {
        if (setting.id === id) {
            Data.save("AllCallTimeCounter", id, newValue);
            return setting.value = newValue;
        }
        if (setting.settings) {
            for (const settingInt of setting.settings) {
                if (settingInt.id === id) {
                    Data.save("AllCallTimeCounter", id, newValue);
                    settingInt.value = newValue;
                }
            }
        }
    }
}

module.exports = class AllCallTimeCounter {
    constructor(meta) {
        this.meta = meta;
    }

    getSettingsPanel() {
        return UI.buildSettingsPanel({
            settings: config.settings,
            onChange: (category, id, value) => {
                switch (id) {
                    case "watchLargeGuilds":
                        if (value) {
                            subscribeToAllGuilds();
                        }
                        break;
                }
                setConfigSetting(id, value);
                settings[id] = value;
            }
        });
    }

    start() {
        initSettingsValues();
        DOM.addStyle(this.meta.name, `[class^="draggable_"], [class^="voiceUser_"] { height: min-content !important; }
            div[class^='voiceUser_'] div[class^='chipletParent_'] { vertical-align: super; }
            div[class^='list_'][class*='collapsed_'] .timeCounter{display:none;}`)
        
        DiscordModules.subscribe("VOICE_STATE_UPDATES", VOICE_STATE_UPDATES);
        DiscordModules.subscribe("PASSIVE_UPDATE_V1", PASSIVE_UPDATE_V1);
        if (settings.watchLargeGuilds) {
            subscribeToAllGuilds();
        }
        const VoiceUser = Webpack.getBySource("iconPriortySpeakerSpeaking", "avatarContainer", "getAvatarURL");

        Patcher.after(this.meta.name, VoiceUser, "ZP", (thisObject, args, returnValue) => {
            if (settings.showWithoutHover){
                const usernameDiv = Utils.findInTree(returnValue, (n) => n?.props?.className?.includes("username") && n?.props?.children, { walkable: ["props", "children"] });
                usernameDiv.props.children.push(renderTimer(args[0].user.id));
            } else {
                returnValue.props.children.props.children.push(renderTimer(args[0].user.id));
            }
        });
    }

    stop() {
        Patcher.unpatchAll(this.meta.name);
        DiscordModules.unsubscribe("VOICE_STATE_UPDATES", VOICE_STATE_UPDATES);
        DiscordModules.unsubscribe("PASSIVE_UPDATE_V1", PASSIVE_UPDATE_V1);
        userJoinTimes.clear();
        DOM.removeStyle(this.meta.name);
    }
};



function TimerIcon(props) {
    const { height = 16, width = 16, className } = props || {};
    return React.createElement(
        "svg",
        {
            viewBox: "0 0 455 455",
            height: height,
            width: width,
            className: `timeCounter ${className}`,
            style: { color: "var(--channels-default)" }
        },
        React.createElement("path", {
            fill: "currentColor",
            d: "M332.229,90.04l14.238-27.159l-26.57-13.93L305.67,76.087c-19.618-8.465-40.875-13.849-63.17-15.523V30h48.269V0H164.231v30 H212.5v30.563c-22.295,1.674-43.553,7.059-63.171,15.523L135.103,48.95l-26.57,13.93l14.239,27.16 C67.055,124.958,30,186.897,30,257.5C30,366.576,118.424,455,227.5,455S425,366.576,425,257.5 C425,186.896,387.944,124.958,332.229,90.04z M355,272.5H212.5V130h30v112.5H355V272.5z"
        })
    );
}

function TimerText({ text, className }) {
    return React.createElement("div", {
        className: `timeCounter ${className}`,
        style: {
            fontWeight: "bold",
            fontFamily: "monospace",
            fontSize: "12px",
            lineHeight: "8px"
        },
        children: text
    });
}


function useFixedTimer({ interval = 1000, initialTime = Date.now() }) {
    const [time, setTime] = React.useState(Date.now() - initialTime);

    React.useEffect(() => {
        const intervalId = setInterval(() => setTime(Date.now() - initialTime), interval);

        return () => {
            clearInterval(intervalId);
        };
    }, [initialTime]);

    return time;
}

function formatDurationMs(ms, human = false, seconds = true) {
    const format = (n) => human ? n : n.toString().padStart(2, "0");
    const unit = (s) => human ? s : "";
    const delim = human ? " " : ":";

    // thx copilot
    const d = Math.floor(ms / 86400000);
    const h = Math.floor((ms % 86400000) / 3600000);
    const m = Math.floor(((ms % 86400000) % 3600000) / 60000);
    const s = Math.floor((((ms % 86400000) % 3600000) % 60000) / 1000);

    let res = "";
    if (d) res += `${d}${unit("d")}${delim}`;
    if (h || res || !seconds) res += `${format(h)}${unit("h")}${delim}`;
    if (m || res || !human || !seconds) res += `${format(m)}${unit("m")}`;
    if (seconds && (m || res || !human)) res += `${delim}`;
    if (seconds) res += `${format(s)}${unit("s")}`;

    return res;
}

function Timer(props) {
    const durationMs = useFixedTimer({ initialTime: props.time });
    const formatted = formatDurationMs(
        durationMs,
        settings.format === "human",
        settings.showSeconds
    );
    
    const { username, usernameFont } = Webpack.getByKeys("username", "usernameFont");
    const defaultColorClassName = settings.showRoleColor ? "" : `${username} ${usernameFont}`;

    if (settings.showWithoutHover) {
        return React.createElement(TimerText, { text: formatted, className: defaultColorClassName });
    } else {
        return React.createElement(
            Components.Tooltip,
            { text: formatted },
            function ({ onMouseEnter, onMouseLeave }) {
                return React.createElement(
                    "div",
                    {
                        onMouseEnter: onMouseEnter,
                        onMouseLeave: onMouseLeave,
                        role: "tooltip"
                    },
                    React.createElement(TimerIcon, null)
                );
            }
        );
    }
}

function addUserJoinTime(userId, channelId, guildId) {
    // create a random number
    userJoinTimes.set(userId, { channelId, time: Date.now(), guildId });
}

function removeUserJoinTime(userId) {
    userJoinTimes.delete(userId);
}


let myLastChannelId;

// Allow user updates on discord first load
let runOneTime = true;

function VOICE_STATE_UPDATES({ voiceStates }) {
    const myId = UserStore.getCurrentUser().id;

    for (const state of voiceStates) {
        const { userId, channelId, guildId } = state;
        const isMe = userId === myId;

        if (!guildId) {
            // guildId is never undefined here
            continue;
        }

        // check if the state does not actually has a `oldChannelId` property
        if (!("oldChannelId" in state) && !runOneTime && !settings.watchLargeGuilds) {
            // batch update triggered. This is ignored because it
            // is caused by opening a previously unopened guild
            continue;
        }

        let { oldChannelId } = state;
        if (isMe && channelId !== myLastChannelId) {
            oldChannelId = myLastChannelId;
            myLastChannelId = channelId;
        }

        if (channelId !== oldChannelId) {
            if (channelId) {
                // move or join
                addUserJoinTime(userId, channelId, guildId);
            } else if (oldChannelId) {
                // leave
                removeUserJoinTime(userId);
            }
        }
    }
    runOneTime = false;
}

function PASSIVE_UPDATE_V1(passiveUpdate) {
    if (settings.watchLargeGuilds) {
        return;
    }

    const { voiceStates } = passiveUpdate;
    if (!voiceStates) {
        // if there are no users in a voice call
        return;
    }

    // find all users that have the same guildId and if that user is not in the voiceStates, remove them from the map
    const { guildId } = passiveUpdate;

    // check the guildId in the userJoinTimes map
    for (const [userId, data] of userJoinTimes) {
        if (data.guildId === guildId) {
            // check if the user is in the voiceStates
            const userInVoiceStates = voiceStates.find(state => state.userId === userId);
            if (!userInVoiceStates) {
                // remove the user from the map
                removeUserJoinTime(userId);
            }
        }
    }

    // since we were gifted this data let's use it to update our join times
    for (const state of voiceStates) {
        const { userId, channelId } = state;

        if (!channelId) {
            // channelId is never undefined here
            continue;
        }

        // check if the user is in the map
        if (userJoinTimes.has(userId)) {
            // check if the user is in a channel
            if (channelId !== userJoinTimes.get(userId)?.channelId) {
                // update the user's join time
                addUserJoinTime(userId, channelId, guildId);
            }
        } else {
            // user wasn't previously tracked, add the user to the map
            addUserJoinTime(userId, channelId, guildId);
        }
    }
}

function subscribeToAllGuilds() {
    // we need to subscribe to all guilds' events because otherwise we would miss updates on large guilds
    const guilds = Object.values(GuildStore.getGuilds()).map(guild => guild.id);
    const subscriptions = guilds.reduce((acc, id) => ({ ...acc, [id]: { typing: true } }), {});
    DiscordModules.dispatch({ type: "GUILD_SUBSCRIPTIONS_FLUSH", subscriptions });
}

function renderTimer(userId) {
    // get the user join time from the users object
    const joinTime = userJoinTimes.get(userId);
    if (!joinTime?.time) {
        return;
    }
    if (userId === UserStore.getCurrentUser().id && !settings.trackSelf) {
        // don't show for self
        return;
    }

    return React.createElement(Timer, { time: joinTime.time });
}
