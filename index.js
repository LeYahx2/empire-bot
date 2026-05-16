  const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  PermissionFlagsBits
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
// DATA
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
    .setDescription('Top niveaux serveur'),

  // ADD XP
  new SlashCommandBuilder()
    .setName('addxp')
    .setDescription('Ajouter XP')
    .setDefaultMemberPermissions(
      PermissionFlagsBits.Administrator
    )

    .addUserOption(option =>
      option.setName('membre')
        .setDescription('Membre')
        .setRequired(true)
    )

    .addIntegerOption(option =>
      option.setName('montant')
        .setDescription('XP')
        .setRequired(true)
    ),

  // REMOVE XP
  new SlashCommandBuilder()
    .setName('removexp')
    .setDescription('Retirer XP')
    .setDefaultMemberPermissions(
      PermissionFlagsBits.Administrator
    )

    .addUserOption(option =>
      option.setName('membre')
        .setDescription('Membre')
        .setRequired(true)
    )

    .addIntegerOption(option =>
      option.setName('montant')
        .setDescription('XP')
        .setRequired(true)
    ),

  // RESET XP
  new SlashCommandBuilder()
    .setName('resetxp')
    .setDescription('Reset XP')
    .setDefaultMemberPermissions(
      PermissionFlagsBits.Administrator
    )

    .addUserOption(option =>
      option.setName('membre')
        .setDescription('Membre')
        .setRequired(true)
    ),

  // ADD LEVEL
  new SlashCommandBuilder()
    .setName('addlevel')
    .setDescription('Ajouter niveaux')
    .setDefaultMemberPermissions(
      PermissionFlagsBits.Administrator
    )

    .addUserOption(option =>
      option.setName('membre')
        .setDescription('Membre')
        .setRequired(true)
    )

    .addIntegerOption(option =>
      option.setName('montant')
        .setDescription('Niveaux')
        .setRequired(true)
    )

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

    // DELETE GLOBAL COMMANDS
    await rest.put(
      Routes.applicationCommands(CLIENT_ID),
      { body: [] }
    );

    // GUILD COMMANDS
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
// XP PAR MESSAGE
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

  // =========================
  // XP REQUIS HARD
  // =========================

  let needed = 0;

  if (level[userId] < 5) {

    needed = level[userId] * 100;

  } else if (level[userId] < 10) {

    needed = level[userId] * 250;

  } else if (level[userId] < 20) {

    needed = level[userId] * 500;

  } else if (level[userId] < 35) {

    needed = level[userId] * 1000;

  } else if (level[userId] < 50) {

    needed = level[userId] * 2000;

  } else {

    needed = level[userId] * 5000;

  }

  // =========================
  // LEVEL UP
  // =========================

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
  // XP NEEDED
  // =========================

  let needed = 0;

  if (level[userId] < 5) {

    needed = level[userId] * 100;

  } else if (level[userId] < 10) {

    needed = level[userId] * 250;

  } else if (level[userId] < 20) {

    needed = level[userId] * 500;

  } else if (level[userId] < 35) {

    needed = level[userId] * 1000;

  } else if (level[userId] < 50) {

    needed = level[userId] * 2000;

  } else {

    needed = level[userId] * 5000;

  }

  // =========================
  // RANK
  // =========================

  if (interaction.commandName === 'rank') {

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

  // =========================
  // ADD XP
  // =========================

  if (interaction.commandName === 'addxp') {

    const membre =
      interaction.options.getUser('membre');

    const montant =
      interaction.options.getInteger('montant');

    if (!xp[membre.id]) {
      xp[membre.id] = 0;
    }

    xp[membre.id] += montant;

    return interaction.reply(
      `✅ ${montant} XP ajoutés à ${membre}`
    );
  }

  // =========================
  // REMOVE XP
  // =========================

  if (interaction.commandName === 'removexp') {

    const membre =
      interaction.options.getUser('membre');

    const montant =
      interaction.options.getInteger('montant');

    if (!xp[membre.id]) {
      xp[membre.id] = 0;
    }

    xp[membre.id] -= montant;

    if (xp[membre.id] < 0) {
      xp[membre.id] = 0;
    }

    return interaction.reply(
      `❌ ${montant} XP retirés à ${membre}`
    );
  }

  // =========================
  // RESET XP
  // =========================

  if (interaction.commandName === 'resetxp') {

    const membre =
      interaction.options.getUser('membre');

    xp[membre.id] = 0;
    level[membre.id] = 1;

    return interaction.reply(
      `🔄 XP reset pour ${membre}`
    );
  }

  // =========================
  // ADD LEVEL
  // =========================

  if (interaction.commandName === 'addlevel') {

    const membre =
      interaction.options.getUser('membre');

    const montant =
      interaction.options.getInteger('montant');

    if (!level[membre.id]) {
      level[membre.id] = 1;
    }

    level[membre.id] += montant;

    return interaction.reply(
      `👑 ${montant} niveaux ajoutés à ${membre}`
    );
  }
});

// =========================
// LOGIN
// =========================

client.login(process.env.TOKEN);
