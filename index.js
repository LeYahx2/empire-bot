const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder
} = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// =========================
// CONFIG
// =========================

const CLIENT_ID = '1500891961320542338';
const GUILD_ID = '1465673686043328526';

// =========================
// XP + LEVEL
// =========================

const xp = {};
const level = {};
const cooldowns = {};

// =========================
// RANKS
// =========================

const rankRoles = [

  {
    level: 5,
    roleId: '1500537533975756810',
    name: 'Bronze'
  },

  {
    level: 10,
    roleId: '1500537634659762367',
    name: 'Argent'
  },

  {
    level: 20,
    roleId: '1500537697511538831',
    name: 'Or'
  },

  {
    level: 35,
    roleId: '1500537820954099792',
    name: 'Platine'
  },

  {
    level: 50,
    roleId: '1500538432231837916',
    name: 'Diamant'
  },

  {
    level: 75,
    roleId: '1500538512741502987',
    name: 'Légende'
  }

];

// =========================
// COMMANDES
// =========================

const commands = [

  // RANK
  new SlashCommandBuilder()
    .setName('rank')
    .setDescription('Voir son niveau'),

  // LEADERBOARD
  new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Top niveaux serveur')

].map(command => command.toJSON());

// =========================
// REST
// =========================

const rest = new REST({
  version: '10'
}).setToken(process.env.TOKEN);

// =========================
// READY
// =========================

client.once('ready', async () => {

  console.log('👑 Empire Ranked connecté');

  try {

    // SUPPRIME COMMANDES GLOBALES
    await rest.put(
      Routes.applicationCommands(CLIENT_ID),
      { body: [] }
    );

    // AJOUTE COMMANDES SERVEUR
    await rest.put(
      Routes.applicationGuildCommands(
        CLIENT_ID,
        GUILD_ID
      ),
      { body: commands }
    );

    console.log('✅ Slash commands synchronisées');

  } catch (error) {
    console.error(error);
  }
});

// =========================
// MESSAGE XP
// =========================

client.on('messageCreate', async message => {

  if (message.author.bot) return;

  const userId = message.author.id;

  // INIT
  if (!xp[userId]) {
    xp[userId] = 0;
  }

  if (!level[userId]) {
    level[userId] = 1;
  }

  // COOLDOWN 30s
  if (cooldowns[userId]) {

    const diff =
      Date.now() - cooldowns[userId];

    if (diff < 30000) return;
  }

  cooldowns[userId] = Date.now();

  // GAIN XP
  const gain =
    Math.floor(Math.random() * 15) + 5;

  xp[userId] += gain;

  // XP REQUIS
  const needed =
    level[userId] * 100;

  // LEVEL UP
  if (xp[userId] >= needed) {

    xp[userId] = 0;

    level[userId]++;

    message.channel.send(
      `👑 ${message.author} passe niveau ${level[userId]}`
    );

    // ROLE RANK
    const rank = rankRoles.find(
      r => r.level === level[userId]
    );

    if (rank) {

      const role =
        message.guild.roles.cache.get(
          rank.roleId
        );

      if (role) {

        await message.member.roles.add(role);

        message.channel.send(
          `🏆 ${message.author} obtient le rank ${rank.name}`
        );
      }
    }
  }
});

// =========================
// INTERACTIONS
// =========================

client.on('interactionCreate', async interaction => {

  if (!interaction.isChatInputCommand()) return;

  const userId = interaction.user.id;

  // INIT
  if (!xp[userId]) {
    xp[userId] = 0;
  }

  if (!level[userId]) {
    level[userId] = 1;
  }

  // =========================
  // RANK
  // =========================

  if (interaction.commandName === 'rank') {

    const needed =
      level[userId] * 100;

    return interaction.reply(
      `🏆 Niveau : ${level[userId]}\n⭐ XP : ${xp[userId]} / ${needed}`
    );
  }

  // =========================
  // LEADERBOARD
  // =========================

  if (interaction.commandName === 'leaderboard') {

    const sorted = Object.entries(level)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    let texte =
      '🏆 Leaderboard Empire\n\n';

    for (let i = 0; i < sorted.length; i++) {

      texte +=
        `${i + 1}. <@${sorted[i][0]}> → Niveau ${sorted[i][1]}\n`;
    }

    return interaction.reply(texte);
  }
});

// =========================
// LOGIN
// =========================

client.login(process.env.TOKEN);
