import Command from "../../../structures/Command";
import SubCommand from "../../../structures/SubCommand";
import CommandContext from "../../../structures/CommandContext";
import { Message } from "discord.js";
import BulbBotClient from "../../../structures/BulbBotClient";

export default class extends SubCommand {
	constructor(client: BulbBotClient, parent: Command) {
		super(client, parent, {
			name: "create",
			minArgs: 1,
			maxArgs: -1,
			argList: ["poolName:string"],
			usage: "<poolName>",
			clearance: 100,
		});
	}

	public async run(context: CommandContext, args: string[]): Promise<void | Message> {
		context.reply("Successfully created the banpool");
	}
}
