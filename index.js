const { AutoClient } = require("discord-auto-rpc");
const d2gsi = require("dota2-gsi");

const server = new d2gsi({
	ip: "localhost",
	port: 4124,
});

var dotaClients = [];

server.events.on("newclient", function (client) {
	console.log("New client connection, IP address: " + client.ip);

	dotaClients.push(client);
});

setInterval(function () {
	dotaClients.forEach(function (client, index) {
		// States Setup
		var state = null;
		if (client.gamestate.map) {
			state = client.gamestate.map.game_state;
		}
		
		const gs = client.gamestate;
		const player = gs.player;
		const hero = gs.hero;
		const map = gs.map;

		// Setting Vars
		var heroName = "";
		var heroNameFix = "";

		var kills = 0;
		var deaths = 0;
		var assists = 0;
		var lastHits = 0;
		var denies = 0;

		var level = 0;

		var clockTimeStr;

		switch (state) {
			case "DOTA_GAMERULES_STATE_PRE_GAME":
			case "DOTA_GAMERULES_STATE_GAME_IN_PROGRESS":
				kills = player.kills;
				deaths = player.deaths;
				assists = player.assists;

				lastHits = player.last_hits;
				denies = player.denies;

				gpm = player.gpm;
				xpm = player.xpm;

				level = hero.level;

				clockTimeStr = new Date(map.clock_time * 1000)
					.toISOString()
					.substring(11, 19);
			case "DOTA_GAMERULES_STATE_STRATEGY_TIME":
				heroName = hero.name.replace("npc_dota_hero_", "");
				heroNameFix = capitalize(heroName.replace("_", " "));
				break;
		}

		const getInProgress = () => {
			return {
				detail: `<${clockTimeStr}> (${kills}/${deaths}/${assists}) [${lastHits}/${denies}]`,
				state: `GPM : ${gpm} | XPM : ${xpm}`,
				largeIcon: `${heroName}`,
				largeText: `${heroNameFix} [${level}⭐]`,
			};
		};

		switch (state) {
			case "DOTA_GAMERULES_STATE_CUSTOM_GAME_SETUP": {
				setActivity("[Lobby] Setup Custom Game", "...", "icon");
				break;
			}
			case "DOTA_GAMERULES_STATE_WAIT_FOR_PLAYERS_TO_LOAD ": {
				setActivity(
					"[Lobby] Waiting for players to load",
					"What's taking them so long :?",
					"icon"
				);
				break;
			}
			case "DOTA_GAMERULES_STATE_HERO_SELECTION": {
				setActivity("[Pre-match] Select Hero", "...", "icon");
				break;
			}
			case "DOTA_GAMERULES_STATE_STRATEGY_TIME": {
				setActivity(
					"[Pre-match] Strategy Time",
					heroNameFix,
					heroName,
					heroNameFix
				);
				break;
			}
			case "DOTA_GAMERULES_STATE_TEAM_SHOWCASE": {
				setActivity(
					"[Pre-match] Showcase Heroes",
					"Lemme hear those trashtalks!",
					heroName,
					heroNameFix
				);
				break;
			}

			case "DOTA_GAMERULES_STATE_WAIT_FOR_MAP_TO_LOAD": {
				setActivity(
					"[Pre-game] Wait for map to load!",
					"Seriously how did this get here?",
					"icon"
				);
				break;
			}
			case "DOTA_GAMERULES_STATE_PRE_GAME": {
				setActivity(
					"[Pre-Game] Rune-snatching time ",
					heroNameFix,
					heroName
				);
				break;
			}
			case "DOTA_GAMERULES_STATE_GAME_IN_PROGRESS": {
				setActivity(
					getInProgress().detail,
					getInProgress().state,
					getInProgress().largeIcon,
					getInProgress().largeText
				);
				break;
			}
			case "DOTA_GAMERULES_STATE_POST_GAME": {
				setActivity(
					"[Post-Game] Chillin...",
					"Welp what a game",
					"icon",
					"Post-Game"
				);
				break;
			}
			case null: {
				setActivity(
					"[Lobby] Chillin...",
					"A match a day keep the doctor away",
					"none",
					"none"
				);
				break;
			}
			default: {
				console.log("Whut...");
				break;
			}
		}
	});
}, 15 * 1000);

// Discord
const startTimestamp = new Date();

var discordClient = new AutoClient({ transport: "ipc" });
var discordClientID = "460631841259651073";

discordClient.once("ready", () => {
	setActivity("Starting...", "Please wait...", "none");
});

discordClient.endlessLogin({ clientId: discordClientID });

const setActivity = (details, state, largeIcon, largeText) => {
	discordClient.setActivity({
		details: details,
		state: state,
		largeImageKey: largeIcon,
		largeImageText: largeText,
		startTimestamp: startTimestamp,
	});
};

// Utils
const capitalize = (string) => {
	return string.replace(/(?:^|\s)\S/g, function (a) {
		return a.toUpperCase();
	});
};
