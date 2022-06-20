import BulbBotClient from "../structures/BulbBotClient";
import { Permissions } from "discord.js";
import DatabaseManager from "./managers/DatabaseManager";
import { AutoMod_INVITE, AutoMod_WEBSITE, UserMention } from "./Regex";
import { set } from "../structures/AutoModCache";
import AutoModManager from "./managers/AutoModManager";
import LoggingManager from "./managers/LoggingManager";
import CommandContext from "../structures/CommandContext";
import { isGuildChannel } from "./typechecks";
import { Automod } from "@prisma/client";

const databaseManager: DatabaseManager = new DatabaseManager();
const automodManager: AutoModManager = new AutoModManager();
const loggingManager: LoggingManager = new LoggingManager();

export default async function (client: BulbBotClient, context: CommandContext): Promise<void> {
	if (!context.guild?.available || !isGuildChannel(context.channel)) return;
	const dbGuild = await databaseManager.getAutoModConfig(context.guild);

	if (!dbGuild.enabled) return;
	if (context.member?.permissions.has(Permissions.FLAGS.MANAGE_MESSAGES)) return;
	if (dbGuild.ignoreUsers.includes(context.author.id)) return;
	if (dbGuild.ignoreChannels.includes(context.channel.id) || (context.channel.parent && dbGuild.ignoreChannels.includes(context.channel.parent.id))) return;

	if (!context.member?.roles.cache.values()) return;
	for (const role of context.member.roles.cache.values()) {
		if (dbGuild.ignoreRoles.includes(role.id)) return;
	}

	let shouldDelete = false;

	if (hasWebsite(context, dbGuild)) {
		const punishment: string = await automodManager.resolveAction(
			client,
			context,
			dbGuild.punishmentWebsite,
			await client.bulbutils.translate("automod_violation_website_reason", context.guild.id, {
				channel: context.channel,
			}),
		);

		await loggingManager.sendAutoModLog(
			client,
			context.guild,
			await client.bulbutils.translate("automod_violation_website_log", context.guild.id, {
				target: context.author,
				channel: context.channel,
				punishment,
				message: context.content,
			}),
		);
		shouldDelete = true;
	}

	if (hasInvite(context, dbGuild)) {
		const punishment: string = await automodManager.resolveAction(
			client,
			context,
			dbGuild.punishmentInvites,
			await client.bulbutils.translate("automod_violation_invites_reason", context.guild.id, {
				channel: context.channel,
			}),
		);

		await loggingManager.sendAutoModLog(
			client,
			context.guild,
			await client.bulbutils.translate("automod_violation_invites_log", context.guild.id, {
				target: context.author,
				channel: context.channel,
				punishment,
				message: context.content,
			}),
		);
		shouldDelete = true;
	}

	let word: string;
	if ((word = hasSwearWords(context, dbGuild))) {
		const punishment: string = await automodManager.resolveAction(
			client,
			context,
			dbGuild.punishmentWords,
			await client.bulbutils.translate("automod_violation_words_reason", context.guild.id, {
				channel: context.channel,
			}),
		);

		await loggingManager.sendAutoModLog(
			client,
			context.guild,
			await client.bulbutils.translate("automod_violation_words_log", context.guild.id, {
				target: context.author,
				channel: context.channel,
				punishment,
				words: word,
				message: context.content,
			}),
		);
		shouldDelete = true;
	}

	const mentionCount: number = hasMentions(context, dbGuild);
	if (mentionCount) {
		if (dbGuild.punishmentMentions) await set(client, context, context.guild.id, "mentions", context.author.id, mentionCount, dbGuild.timeoutMentions ?? undefined);
		if (dbGuild.limitMentions) shouldDelete ||= mentionCount >= dbGuild.limitMentions;
	}

	await set(client, context, context.guild.id, "messages", context.author.id, 1, dbGuild.timeoutMessages ?? undefined);
	if (shouldDelete) await context.delete();
}

function hasSwearWords(context: CommandContext, guild: Pick<Automod, "punishmentWords" | "wordBlacklist" | "wordBlacklistToken">): string {
	if (!guild.punishmentWords) return "";
	const wordBlacklist: string[] = guild.wordBlacklist;

	for (const word of wordBlacklist) {
		const regex = new RegExp(`(?:^|\\s)${word}(?:$|\\s)`, "i");
		if (regex.test(context.content)) return word;
	}

	const wordBlacklistToken: string[] = guild.wordBlacklistToken.map((t) => t.toLowerCase());
	const content: string = context.content.toLowerCase();

	for (const token of wordBlacklistToken) {
		if (content.includes(token)) return token;
	}

	return "";
}

function hasWebsite(context: CommandContext, guild: Pick<Automod, "punishmentWebsite" | "websiteWhitelist">): boolean {
	if (!guild.punishmentWebsite) return false;
	const blocked_websites: string[] = guild.websiteWhitelist;
	AutoMod_WEBSITE.lastIndex = 0;
	if (!blocked_websites) return false;

	let match: RegExpExecArray | null;
	while ((match = AutoMod_WEBSITE.exec(context.content))) {
		if (blocked_websites.includes(match[2])) return true;
	}

	return false;
}

function hasInvite(context: CommandContext, guild: Pick<Automod, "punishmentInvites" | "inviteWhitelist">): boolean {
	if (!guild.punishmentInvites) return false;
	const allowed_invites: string[] = guild.inviteWhitelist;
	AutoMod_INVITE.lastIndex = 0;
	if (!allowed_invites) return AutoMod_INVITE.test(context.content);

	let match: RegExpExecArray | null;
	while ((match = AutoMod_INVITE.exec(context.content))) {
		if (!allowed_invites.includes(match[3])) return true;
	}

	return false;
}

function hasMentions(context: CommandContext, guild: Pick<Automod, "punishmentMentions" | "limitMentions">): number {
	if (!(guild.punishmentMentions || guild.limitMentions)) return 0;
	return context.content.match(UserMention)?.length ?? 0;
}
