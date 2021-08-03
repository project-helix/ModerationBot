import BulbBotClient from "../../../structures/BulbBotClient";
import { Message, Snowflake } from "discord.js";
import { NonDigits } from "../../../utils/Regex";
import ClearanceManager from "../../../utils/managers/ClearanceManager";

const clearanceManager: ClearanceManager = new ClearanceManager();

export default async function (client: BulbBotClient, message: Message, args: string[]): Promise<void | Message> {
	const part = args[1];
	const name = args[2];
	let clearance = Number(args[3]);

	if (!["role", "command"].includes(part))
		return message.channel.send(await client.bulbutils.translate("override_edit_invalid_part", message.guild?.id));
	if (!name) return message.channel.send(await client.bulbutils.translate("override_edit_missing_name", message.guild?.id));
	if (!clearance) return message.channel.send(await client.bulbutils.translate("override_edit_missing_clearance", message.guild?.id));
	if (isNaN(clearance))
		return message.channel.send(await client.bulbutils.translate("override_edit_non_number", message.guild?.id, { clearance: args[3] }));
	if (clearance <= 0) return message.channel.send(await client.bulbutils.translate("override_edit_less_than_0", message.guild?.id));
	if (clearance >= 100) return message.channel.send(await client.bulbutils.translate("override_edit_more_than_100", message.guild?.id));
	if (clearance > client.userClearance)
		return message.channel.send(await client.bulbutils.translate("override_edit_higher_than_yourself", message.guild?.id));

	switch (part) {
		case "role":
			const rTemp = message.guild?.roles.cache.get(name.replace(NonDigits, ""));
			if (rTemp === undefined) return message.channel.send(await client.bulbutils.translate("override_edit_invalid_role", message.guild?.id));

			if (await clearanceManager.getRoleOverride(<Snowflake>message.guild?.id, rTemp.id) === undefined)
				return message.channel.send(await client.bulbutils.translate("override_edit_non_existent_override_role", message.guild?.id));
			await clearanceManager.editRoleOverride(<Snowflake>message.guild?.id, name.replace(NonDigits, ""), clearance)
			break;

		case "command":
			const command = client.commands.get(name.toLowerCase()) || client.commands.get(<string>client.aliases.get(name.toLowerCase()));
			if (command === undefined)
				return message.channel.send(await client.bulbutils.translate("override_edit_invalid_command", message.guild?.id, { command: name }));

			if (await clearanceManager.getCommandOverride(<Snowflake>message.guild?.id, name) === undefined)
				return message.channel.send(await client.bulbutils.translate("override_edit_non_existent_override_command", message.guild?.id));
			await clearanceManager.editCommandOverride(<Snowflake>message.guild?.id, command.name, clearance)

			break;
		default:
			break;
	}
	await message.channel.send(await client.bulbutils.translate("override_edit_success", message.guild?.id, { clearance }));
}
