const { REST, Routes, SlashCommandBuilder } = require('discord.js');

const commands = [
  new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Répond pong')
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log('⏳ Déploiement des slash commands...');

    await rest.put(
      Routes.applicationCommands('1500891961320542338'),
      { body: commands },
    );

    console.log('✅ Slash commands déployées.');
  } catch (error) {
    console.error(error);
  }
})();
