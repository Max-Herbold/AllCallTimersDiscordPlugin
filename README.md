# AllCallTimers Discord Plugin
This is a plugin designed for Discord that adds a timer to each user in a voice channel.

This can be installed using any plugin manager.

## View
<img height="500rem" alt="image" src="https://github.com/Max-Herbold/Vencord/assets/49804267/b11a5845-1bf1-42fe-8d83-65b51c50b60c"> <img height="500rem" alt="image" src="https://github.com/Max-Herbold/Vencord/assets/49804267/28c28fa3-1a26-4563-8dbf-6d283d3f7630">

### Todo
- Hook to user join/leave events (Only for BD Version)

## Versions available
[allCallTimers/*](https://github.com/Max-Herbold/AllCallTimersDiscordPlugin/tree/main/allCallTimers) is made for [Vencord](https://vencord.dev/).<br/>
[AllCallTimeCounter.plugin.js](https://github.com/Max-Herbold/AllCallTimersDiscordPlugin/tree/main/AllCallTimeCounter.plugin.js) is made for [BD](https://betterdiscord.app/). (Outdated: No option to subscribe to all servers on load, read *clarification*)

## Installation
Installation is available through inbuilt plugin managers.

## Clarification
**TL;DR**, until a *large* server is opened timers will only be accurate to somewhere between 7-15 minutes, but also could be much longer, it is not clear how passive updates work.<br/><br/>
Discord does not automatically subscribe to updates for large servers (a server with ~>200 members, it's not exactly clear how "large server" is defined, this is a Discord term). Discord does get passive (bulk) updates for large servers but they occur only after some arbitrary period of time (generally seen to occur between 7-15 minutes per server) and only for one server at a time. However, as soon as a large server is opened once by a user, Discord subscribes to it, and only then all updates are given in real time. This was solved in the Vencord version by adding a toggle setting to subscribe to all servers on Discord launch but may not always be desired or even necessary.<br/><br/>
"Update" refers to some communication from Discord containing updated information about the state of voice users/messages/channels.


<details>
  <summary>Disclaimer</summary>
The following code ("AllCallTimers") provided herewith is for informational purposes only and is not intended for installation or use. By accessing or utilizing this Code, you agree that you do so at your own risk.

The author of this Code hereby expressly disclaims any and all liability for any damages, losses, or injuries arising out of the installation, use, or reliance on the Code. The Code is provided on an "as is" and "as available" basis without any warranties, express or implied, including but not limited to the implied warranties of merchantability, fitness for a particular purpose, or non-infringement.

You acknowledge and agree that the Code may involve modifications to proprietary code owned by third parties, and that such modifications may be prohibited under the terms and conditions governing the use of the proprietary code. You expressly agree that the Author shall not be held liable for any breach of the terms and conditions associated with the proprietary code resulting from your installation, use, or reliance on the Code provided herein. It is your sole responsibility to ensure compliance with all applicable terms and conditions governing the use of the proprietary code.

Furthermore, the Author does not have any affiliation with the original company or entity from which the Code may have been derived. Any resemblance to code owned or produced by any other entity is purely coincidental.

You acknowledge and agree that the Author shall not be held liable for any claims, damages, losses, or liabilities arising from your installation, use, or reliance on the Code. It is your responsibility to ensure compliance with all applicable laws and regulations before installing or using the Code.

By accessing or utilizing the Code, you agree to indemnify, defend, and hold harmless the Author from any claims, damages, losses, or liabilities, including reasonable attorneys' fees, arising out of or related to your installation, use, or reliance on the Code.

By accessing or utilizing the Code, you acknowledge that you have read, understood, and agreed to be bound by this disclaimer.
</details>
