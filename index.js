const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder
} = require('discord.js');

const money = {};

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const commands = [

  new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Répond pong'),

  new SlashCommandBuilder()
    .setName('balance')
    .setDescription('Voir son argent'),

  new SlashCommandBuilder()
    .setName('shop')
    .setDescription('Voir la boutique'),

  new SlashCommandBuilder()
    .setName('buy')
    .setDescription('Acheter un objet')
    .addStringOption(option =>
      option.setName('objet')
        .setDescription('Objet à acheter')
        .setRequired(true)
    )

].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

client.once('ready', async () => {

  console.log('👑 L’Empire est en ligne');

  try {

    console.log('⏳ Synchronisation des slash commands...');

    await rest.put(
      Routes.applicationGuildCommands(
        '1500891961320542338',
        '1465673686043328526'
      ),
      { body: commands }
    );

    console.log('✅ Slash commands synchronisées.');

  } catch (error) {
    console.error(error);
  }
});

client.on('interactionCreate', async interaction => {

  if (!interaction.isChatInputCommand()) return;

  // PING
  if (interaction.commandName === 'ping') {
    await interaction.reply('🏓 pong');
  }

  // BALANCE
  if (interaction.commandName === 'balance') {

    const coins = money[interaction.user.id] || 0;

    await interaction.reply(
      `💰 Tu as ${coins} crédits Empire`
    );
  }

  // SHOP
  if (interaction.commandName === 'shop') {

    await interaction.reply(`
🛒 Boutique Empire

⚔️ Épée → 100 crédits
👑 VIP → 500 crédits
🔥 Coffre → 250 crédits
    `);
  }

  // BUY
  if (interaction.commandName === 'buy') {

    const objet = interaction.options.getString('objet');

    const prices = {
      "épée": 100,
      "vip": 500,
      "coffre": 250
    };

    if (!prices[objet]) {
      return interaction.reply("❌ Objet inconnu");
    }

    const userId = interaction.user.id;

    if (!money[userId]) {
      money[userId] = 0;
    }

    if (money[userId] < prices[objet]) {
      return interaction.reply("❌ Pas assez d'argent");
    }

    money[userId] -= prices[objet];

    await interaction.reply(
      `✅ Tu as acheté ${objet} pour ${prices[objet]} crédits`
    );
  }
});

// ARGENT PAR MESSAGE
client.on('messageCreate', message => {

  if (message.author.bot) return;

  const userId = message.author.id;

  if (!money[userId]) {
    money[userId] = 0;
  }

  money[userId] += Math.floor(Math.random() * 10) + 1;

  // COMMANDE TEXTE
  if (message.content === '!ping') {
    message.reply('🏓 pong');
  }
});

client.login(process.env.TOKEN);
