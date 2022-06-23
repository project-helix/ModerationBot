import { ContextMenuInteraction, Message, MessageActionRow, MessageSelectMenu, User } from "discord.js";
import BulbBotClient from "../../structures/BulbBotClient";
import InfractionsManager from "../../utils/managers/InfractionsManager";

const infractionManager: InfractionsManager = new InfractionsManager();

export default async function (client: BulbBotClient, interaction: ContextMenuInteraction, message: Message): Promise<void> {
	const user: User = message.author;

	if (!interaction.guild) return;
	const options: any[] = [];
	const infs = await infractionManager.getAllUserInfractions({ guildId: interaction.guild.id, targetId: user.id, pageSize: 0 });

	if (!infs?.length) return interaction.reply({ content: await client.bulbutils.translate("infraction_search_not_found", interaction.guild.id, { target: user }), ephemeral: true });

	for (let i = 0; i < 25; i++) {
		if (infs[i] === undefined) continue;

		options.push({
			label: `${infs[i].action} (#${infs[i].id})`,
			description: await client.bulbutils.translate("infraction_interaction_description", interaction.guild.id, {}),
			value: `inf_${infs[i].id}`,
			emoji: client.bulbutils.formatAction(infs[i].action),
		});
	}

	const row = new MessageActionRow().addComponents(
		new MessageSelectMenu()
			.setPlaceholder(await client.bulbutils.translate("infraction_interaction_placeholder", interaction.guild.id, {}))
			.setCustomId("infraction")
			.addOptions(options),
	);

	await interaction.reply({
		content: await client.bulbutils.translate("infraction_interaction_reply", interaction.guild.id, {
			target: user,
		}),
		components: [row],
		ephemeral: true,
	});
}
