import BulbBotClient from "../structures/BulbBotClient";
import { discordApi, developerGuild } from "../Config";
import axios from "axios";
import { LocalCode, Localization, ApplicationCommand } from "./types/ApplicationCommands";
import i18next from "i18next";

export function translateSlashCommands(key: string) {
	const TRANSLATED_LANGS: LocalCode[] = ["es-ES", "hu", "fr", "cs", "sv-SE", "hi"];
	const obj: Localization = {
		"es-ES": "",
		fr: "",
		hu: "",
		"sv-SE": "",
		cs: "",
		hi: "",
	};

	for (let i = 0; i < TRANSLATED_LANGS.length; i++) {
		obj[TRANSLATED_LANGS[i]] = i18next.t(key, {
			lng: TRANSLATED_LANGS[i],
		});
	}
	return obj;
}

export async function registerSlashCommands(client: BulbBotClient) {
	const isDev: boolean = process.env.ENVIRONMENT === "dev";

	const data = () => {
		const cmds: ApplicationCommand[] = [];
		for (const command of client.commands.values()) {
			cmds.push({
				name: command.name,
				type: command.type,
				description: command.description,
				name_localizations: translateSlashCommands(`sc_${command.name}_name`),
				description_localizations: translateSlashCommands(`sc_${command.name}_desc`),
				default_permissions: command.default_member_permissions,
				options: command.options,
			});
		}

		return cmds;
	};

	const options: { method: "PUT" | "GET" | "POST" | "PATCH"; url: string; headers: any; data: ApplicationCommand[] } = {
		method: "PUT",
		url: `${discordApi}/applications/${client.user?.id}/${isDev ? `guilds/${developerGuild}/` : ""}commands`,
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bot ${process.env.TOKEN}`,
		},
		data: data(),
	};

	try {
		const response = await axios.request(options);
		client.log.info(`[APPLICATION COMMANDS] Registered all of the slash commands, amount: ${response.data.length}`);
	} catch (err: any) {
		client.log.error(`[APPLICATION COMMANDS] Failed to register slash commands: ${err.response.statusText} (${err})`);
	}
}
