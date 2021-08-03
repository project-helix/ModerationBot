import SubCommand from "../../../structures/SubCommand";
import { Message, Role, Snowflake } from "discord.js";
import { NonDigits } from "../../../utils/Regex";
import DatabaseManager from "../../../utils/managers/DatabaseManager";

const databaseManager: DatabaseManager = new DatabaseManager();

export default class extends SubCommand {
	constructor(...args) {
		// @ts-ignore
		super(...args, {
			name: "auto_role",
			aliases: ["autorole"],
			clearance: 75,
			minArgs: 1,
			maxArgs: 1,
			argList: ["role:Role"],
			usage: "configure auto_role <role>",
		});
	}

	public async run(message: Message, args: string[]): Promise<void | Message> {
		let role: Role | null = null;
		role = <Role>message.guild?.roles.cache.get(args[0].replace(NonDigits, ""));

		if (role === undefined && args[0] !== "disable")
			return message.channel.send(
				await this.client.bulbutils.translateNew("global_not_found", message.guild?.id, {
					type: await this.client.bulbutils.translateNew("global_not_found_types.role", message.guild?.id, {}),
					arg_provided: args[0],
					arg_expected: "role:Role",
					usage: this.usage,
				}),
			);

		if (args[0] !== "disable") {
			if (message.guild?.me?.roles.highest && message.guild?.me.roles.highest.rawPosition < role!!.rawPosition)
				return message.channel.send(await this.client.bulbutils.translateNew("config_mute_unable_to_manage", message.guild.id, {}));
		}

		if (role !== undefined) {
			await databaseManager.setAutoRole(<Snowflake>message.guild?.id, role.id);
			return message.channel.send(await this.client.bulbutils.translateNew("config_autorole_success", message.guild?.id, { role: role.name }));
		} else {
			await databaseManager.setAutoRole(<Snowflake>message.guild?.id, null);
			return message.channel.send(await this.client.bulbutils.translateNew("config_autorole_disable", message.guild?.id, {}));
		}
	}
}
