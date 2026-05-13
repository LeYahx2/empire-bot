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

// =====================
// DONNÉES
// =====================

const money = {};
const shop = {};
const inventory = {};

// =====================
// COMMANDES
// =====================

const commands = [

  // PING
  new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Répond pong'),

  // BALANCE
  new SlashCommandBuilder()
    .setName('balance')
    .setDescription('Voir son argent'),

  // DAILY
  new SlashCommandBuilder()
    .setName('daily')
    .setDescription('Récompense quotidienne'),

  // WORK
  new SlashCommandBuilder()
    .setName('work')
    .setDescription('Travailler pour gagner de l’argent'),

  // PAY
  new SlashCommandBuilder()
    .setName('pay')
    .setDescription('Donner de l’argent à quelqu’un')

    .addUserOption(option =>
      option.setName('membre')
        .setDescription('Le membre')
        .setRequired(true)
    )

    .addIntegerOption(option =>
      option.setName('montant')
        .setDescription('Montant')
        .setRequired(true)
    ),

  // SHOP
  new SlashCommandBuilder()
    .setName('shop')
    .setDescription('Voir la boutique'),

  // BUY
  new SlashCommandBuilder()
    .setName('buy')
    .setDescription('Acheter un objet')

    .addStringOption(option =>
      option.setName('objet')
        .setDescription('Objet')
        .setRequired(true)
    ),

  // INVENTORY
  new SlashCommandBuilder()
    .setName('inventory')
    .setDescription('Voir son inventaire'),

  // ADD SHOP
  new SlashCommandBuilder()
    .setName('addshop')
    .setDescription('Ajouter un objet à la boutique')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)

    .addStringOption(option =>
      option.setName('nom')
        .setDescription('Nom objet')
        .setRequired(true)
    )

    .addIntegerOption(option =>
      option.setName('prix')
        .setDescription('Prix')
        .setRequired(true)
    ),

  // REMOVE SHOP
  new SlashCommandBuilder()
    .setName('removeshop')
    .setDescription('Supprimer un objet boutique')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)

    .addStringOption(option =>
      option.setName('nom')
        .setDescription('Nom objet')
        .setRequired(true)
    ),

  // ADD MONEY
  new SlashCommandBuilder()
    .setName('addmoney')
    .setDescription('Ajouter argent')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)

    .addUserOption(option =>
      option.setName('membre')
        .setDescription('Membre')
        .setRequired(true)
    )

    .addIntegerOption(option =>
      option.setName('montant')
        .setDescription('Montant')
        .setRequired(true)
    ),

  // REMOVE MONEY
  new SlashCommandBuilder()
    .setName('removemoney')
    .setDescription('Retirer argent')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)

    .addUserOption(option =>
      option.setName('membre')
        .setDescription('Membre')
        .setRequired(true)
    )

    .addIntegerOption(option =>
      option.setName('montant')
        .setDescription('Montant')
        .setRequired(true)
    )

].map(command => command.toJSON());

// =====================
// REST
// =====================

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

// =====================
// READY
// =====================

client.once('ready', async () => {

  console.log('👑 Empire Bot connecté');

  try {

    // SUPPRIME LES COMMANDES GLOBALES
    await rest.put(
      Routes.applicationCommands('1500891961320542338'),
      { body: [] }
    );

    // AJOUTE COMMANDES SERVEUR
    await rest.put(
      Routes.applicationGuildCommands(
        '1500891961320542338',
        '1465673686043328526'
      ),
      { body: commands }
    );

    console.log('✅ Slash commands synchronisées');

  } catch (error) {
    console.error(error);
  }
});

// =====================
// INTERACTIONS
// =====================

client.on('interactionCreate', async interaction => {

  if (!interaction.isChatInputCommand()) return;

  const userId = interaction.user.id;

  if (!money[userId]) {
    money[userId] = 0;
  }

  if (!inventory[userId]) {
    inventory[userId] = [];
  }

  // =====================
  // PING
  // =====================

  if (interaction.commandName === 'ping') {

    return interaction.reply('🏓 pong');
  }

  // =====================
  // BALANCE
  // =====================

  if (interaction.commandName === 'balance') {

    return interaction.reply(
      `💰 Tu as ${money[userId]} crédits`
    );
  }

  // =====================
  // DAILY
  // =====================

  if (interaction.commandName === 'daily') {

    const gain = 500;

    money[userId] += gain;

    return interaction.reply(
      `💰 Tu as reçu ${gain} crédits`
    );
  }

  // =====================
  // WORK
  // =====================

  if (interaction.commandName === 'work') {

    const gain = Math.floor(Math.random() * 500) + 100;

    money[userId] += gain;

    return interaction.reply(
      `⚒️ Tu as gagné ${gain} crédits`
    );
  }

  // =====================
  // PAY
  // =====================

  if (interaction.commandName === 'pay') {

    const membre = interaction.options.getUser('membre');
    const montant = interaction.options.getInteger('montant');

    if (money[userId] < montant) {
      return interaction.reply("❌ Pas assez d'argent");
    }

    if (!money[membre.id]) {
      money[membre.id] = 0;
    }

    money[userId] -= montant;
    money[membre.id] += montant;

    return interaction.reply(
      `✅ ${montant} crédits envoyés à ${membre}`
    );
  }

  // =====================
  // SHOP
  // =====================

  if (interaction.commandName === 'shop') {

    const items = Object.keys(shop);

    if (items.length === 0) {
      return interaction.reply("🛒 Boutique vide");
    }

    let texte = "🛒 Boutique Empire\n\n";

    items.forEach(item => {
      texte += `⚔️ ${item} → ${shop[item]} crédits\n`;
    });

    return interaction.reply(texte);
  }

  // =====================
  // BUY
  // =====================

  if (interaction.commandName === 'buy') {

    const objet = interaction.options.getString('objet');

    if (!shop[objet]) {
      return interaction.reply("❌ Objet introuvable");
    }

    const prix = shop[objet];

    if (money[userId] < prix) {
      return interaction.reply("❌ Pas assez d'argent");
    }

    money[userId] -= prix;

    inventory[userId].push(objet);

    return interaction.reply(
      `✅ Tu as acheté ${objet}`
    );
  }

  // =====================
  // INVENTORY
  // =====================

  if (interaction.commandName === 'inventory') {

    if (inventory[userId].length === 0) {
      return interaction.reply("🎒 Inventaire vide");
    }

    return interaction.reply(
      `🎒 Inventaire :\n${inventory[userId].join('\n')}`
    );
  }

  // =====================
  // ADD SHOP
  // =====================

  if (interaction.commandName === 'addshop') {

    const nom = interaction.options.getString('nom');
    const prix = interaction.options.getInteger('prix');

    shop[nom] = prix;

    return interaction.reply(
      `✅ ${nom} ajouté pour ${prix} crédits`
    );
  }

  // =====================
  // REMOVE SHOP
  // =====================

  if (interaction.commandName === 'removeshop') {

    const nom = interaction.options.getString('nom');

    delete shop[nom];

    return interaction.reply(
      `❌ ${nom} supprimé`
    );
  }

  // =====================
  // ADD MONEY
  // =====================

  if (interaction.commandName === 'addmoney') {

    const membre = interaction.options.getUser('membre');
    const montant = interaction.options.getInteger('montant');

    if (!money[membre.id]) {
      money[membre.id] = 0;
    }

    money[membre.id] += montant;

    return interaction.reply(
      `✅ ${montant} crédits ajoutés à ${membre}`
    );
  }

  // =====================
  // REMOVE MONEY
  // =====================

  if (interaction.commandName === 'removemoney') {

    const membre = interaction.options.getUser('membre');
    const montant = interaction.options.getInteger('montant');

    if (!money[membre.id]) {
      money[membre.id] = 0;
    }

    money[membre.id] -= montant;

    if (money[membre.id] < 0) {
      money[membre.id] = 0;
    }

    return interaction.reply(
      `❌ ${montant} crédits retirés à ${membre}`
    );
  }
});

// =====================
// ARGENT PAR MESSAGE
// =====================

client.on('messageCreate', message => {

  if (message.author.bot) return;

  const userId = message.author.id;

  if (!money[userId]) {
    money[userId] = 0;
  }

  const gain = Math.floor(Math.random() * 10) + 1;

  money[userId] += gain;
});

// =====================
// LOGIN
// =====================

client.login(process.env.TOKEN);     
