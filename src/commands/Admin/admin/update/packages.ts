import { Message } from "discord.js";
import Command from "../../../../structures/Command";
import SubCommand from "../../../../structures/SubCommand";
import BulbBotClient from "../../../../structures/BulbBotClient";
import { cd, exec, ShellString } from "shelljs";
import { join } from "path";

export default class extends SubCommand {
	constructor(client: BulbBotClient, parent: Command) {
		super(client, parent, {
			name: "packages",
			usage: "packages",
		});
	}

	public async run(message: Message, args: string[]): Promise<void | Message> {
		// updates the packages in package.json
		// npm install -g npm-check-updates (before, used to update the packages globally use with caution :pleading:)
		const path: string = join(__dirname, "/../../../../../");
		cd(path);

		await exec(`ncu -u --packageFile package.json`);
		await exec(`npm update`);

		const resp: ShellString = exec(`npm install`);

		if (resp.stderr) return message.reply(`Wow pal an error really?\n**Code:** ${resp.code.toString()}\n**Message:**\n\`\`\`${resp.stdout}\`\`\`**Error Message:**\n\`\`\`${resp.stderr}\`\`\``);
		message.reply(`Successfully pulled the latest code\nCode: **${resp.code.toString()}**\n**Message:**\n\`\`\`${resp.stdout}\`\`\``);
	}
}