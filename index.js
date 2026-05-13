const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  Events
} = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// ======================
// CONFIG
// ======================

const CLIENT_ID = '1500891961320542338';
const GUILD_ID = '1465673686043328526';

// ======================
// DATA
// ======================

const money = {};
const shop = {};
const inventories = {};
const roleShop = {};

// ======================
// COMMANDES
// ======================

const commands = [

  new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Ping'),

  new SlashCommandBuilder()
    .setName('balance')
    .setDescription('Voir son argent'),

  new SlashCommandBuilder()
    .setName('shop')
    .setDescription('Voir la boutique'),

  new SlashCommandBuilder()
    .setName('inventory')
    .setDescription('Voir son inventaire'),

  new SlashCommandBuilder()
    .setName('buy')
    .setDescription('Acheter un objet')
    .addStringOption(option =>
      option.setName('objet')
        .setDescription('Objet')
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('buyrole')
    .setDescription('Acheter un rôle')
    .addRoleOption(option =>
      option.setName('role')
        .setDescription('Rôle')
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName('panel')
    .setDescription('Panel admin')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)

].map(command => command.toJSON());

// ======================
// REST
// ======================

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

// ======================
// READY
// ======================

client.once('ready', async () => {

  console.log('👑 Empire Bot connecté');

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

    console.log('✅ Commandes synchronisées');

  } catch (error) {
    console.error(error);
  }
});

// ======================
// MESSAGE MONEY
// ======================

client.on('messageCreate', message => {

  if (message.author.bot) return;

  const userId = message.author.id;

  if (!money[userId]) {
    money[userId] = 0;
  }

  money[userId] += Math.floor(Math.random() * 10) + 1;
});

// ======================
// INTERACTIONS
// ======================

client.on(Events.InteractionCreate, async interaction => {

  // ======================
  // COMMANDES
  // ======================

  if (interaction.isChatInputCommand()) {

    const userId = interaction.user.id;

    if (!money[userId]) {
      money[userId] = 0;
    }

    if (!inventories[userId]) {
      inventories[userId] = [];
    }

    // PING
    if (interaction.commandName === 'ping') {

      return interaction.reply('🏓 Pong');
    }

    // BALANCE
    if (interaction.commandName === 'balance') {

      return interaction.reply(
        `💰 Tu as ${money[userId]} crédits`
      );
    }

    // SHOP
    if (interaction.commandName === 'shop') {

      let texte = '🛒 Boutique Empire\n\n';

      // OBJETS
      for (const item in shop) {
        texte += `⚔️ ${item} → ${shop[item]} crédits\n`;
      }

      // RÔLES
      for (const roleId in roleShop) {

        const role = interaction.guild.roles.cache.get(roleId);

        if (role) {
          texte += `👑 ${role.name} → ${roleShop[roleId]} crédits\n`;
        }
      }

      if (
        Object.keys(shop).length === 0 &&
        Object.keys(roleShop).length === 0
      ) {
        texte += '❌ Boutique vide';
      }

      return interaction.reply(texte);
    }

    // BUY
    if (interaction.commandName === 'buy') {

      const objet = interaction.options.getString('objet');

      if (!shop[objet]) {
        return interaction.reply('❌ Objet introuvable');
      }

      const prix = shop[objet];

      if (money[userId] < prix) {
        return interaction.reply("❌ Pas assez d'argent");
      }

      money[userId] -= prix;

      inventories[userId].push(objet);

      return interaction.reply(
        `✅ Tu as acheté ${objet}`
      );
    }

    // INVENTORY
    if (interaction.commandName === 'inventory') {

      if (inventories[userId].length === 0) {
        return interaction.reply('🎒 Inventaire vide');
      }

      return interaction.reply(
        `🎒 Inventaire :\n${inventories[userId].join('\n')}`
      );
    }

    // BUY ROLE
    if (interaction.commandName === 'buyrole') {

      const role = interaction.options.getRole('role');

      if (!roleShop[role.id]) {
        return interaction.reply('❌ Ce rôle n’est pas dans la boutique');
      }

      const prix = roleShop[role.id];

      if (money[userId] < prix) {
        return interaction.reply("❌ Pas assez d'argent");
      }

      money[userId] -= prix;

      const member = interaction.member;

      await member.roles.add(role);

      return interaction.reply(
        `👑 Tu as acheté le rôle ${role.name}`
      );
    }

    // PANEL
    if (interaction.commandName === 'panel') {

      const embed = new EmbedBuilder()
        .setTitle('👑 Panel Empire')
        .setDescription('Gestion économie & boutique');

      const row = new ActionRowBuilder()
        .addComponents(

          new ButtonBuilder()
            .setCustomId('addmoney')
            .setLabel('💰 Ajouter argent')
            .setStyle(ButtonStyle.Success),

          new ButtonBuilder()
            .setCustomId('removemoney')
            .setLabel('❌ Retirer argent')
            .setStyle(ButtonStyle.Danger),

          new ButtonBuilder()
            .setCustomId('addshop')
            .setLabel('🛒 Ajouter boutique')
            .setStyle(ButtonStyle.Primary),

          new ButtonBuilder()
            .setCustomId('addrole')
            .setLabel('👑 Ajouter rôle')
            .setStyle(ButtonStyle.Secondary)
        );

      return interaction.reply({
        embeds: [embed],
        components: [row]
      });
    }
  }

  // ======================
  // BOUTONS
  // ======================

  if (interaction.isButton()) {

    // ADD MONEY
    if (interaction.customId === 'addmoney') {

      const modal = new ModalBuilder()
        .setCustomId('modal_addmoney')
        .setTitle('Ajouter argent');

      const userInput = new TextInputBuilder()
        .setCustomId('userid')
        .setLabel('ID utilisateur')
        .setStyle(TextInputStyle.Short);

      const amountInput = new TextInputBuilder()
        .setCustomId('amount')
        .setLabel('Montant')
        .setStyle(TextInputStyle.Short);

      modal.addComponents(
        new ActionRowBuilder().addComponents(userInput),
        new ActionRowBuilder().addComponents(amountInput)
      );

      return interaction.showModal(modal);
    }

    // REMOVE MONEY
    if (interaction.customId === 'removemoney') {

      const modal = new ModalBuilder()
        .setCustomId('modal_removemoney')
        .setTitle('Retirer argent');

      const userInput = new TextInputBuilder()
        .setCustomId('userid')
        .setLabel('ID utilisateur')
        .setStyle(TextInputStyle.Short);

      const amountInput = new TextInputBuilder()
        .setCustomId('amount')
        .setLabel('Montant')
        .setStyle(TextInputStyle.Short);

      modal.addComponents(
        new ActionRowBuilder().addComponents(userInput),
        new ActionRowBuilder().addComponents(amountInput)
      );

      return interaction.showModal(modal);
    }

    // ADD SHOP
    if (interaction.customId === 'addshop') {

      const modal = new ModalBuilder()
        .setCustomId('modal_addshop')
        .setTitle('Ajouter boutique');

      const itemInput = new TextInputBuilder()
        .setCustomId('item')
        .setLabel('Nom objet')
        .setStyle(TextInputStyle.Short);

      const priceInput = new TextInputBuilder()
        .setCustomId('price')
        .setLabel('Prix')
        .setStyle(TextInputStyle.Short);

      modal.addComponents(
        new ActionRowBuilder().addComponents(itemInput),
        new ActionRowBuilder().addComponents(priceInput)
      );

      return interaction.showModal(modal);
    }

    // ADD ROLE
    if (interaction.customId === 'addrole') {

      const modal = new ModalBuilder()
        .setCustomId('modal_addrole')
        .setTitle('Ajouter rôle boutique');

      const roleInput = new TextInputBuilder()
        .setCustomId('roleid')
        .setLabel('ID rôle')
        .setStyle(TextInputStyle.Short);

      const priceInput = new TextInputBuilder()
        .setCustomId('price')
        .setLabel('Prix')
        .setStyle(TextInputStyle.Short);

      modal.addComponents(
        new ActionRowBuilder().addComponents(roleInput),
        new ActionRowBuilder().addComponents(priceInput)
      );

      return interaction.showModal(modal);
    }
  }

  // ======================
  // MODALS
  // ======================

  if (interaction.isModalSubmit()) {

    // ADD MONEY
    if (interaction.customId === 'modal_addmoney') {

      const userId = interaction.fields.getTextInputValue('userid');
      const amount = parseInt(
        interaction.fields.getTextInputValue('amount')
      );

      if (!money[userId]) {
        money[userId] = 0;
      }

      money[userId] += amount;

      return interaction.reply(
        `✅ ${amount} crédits ajoutés`
      );
    }

    // REMOVE MONEY
    if (interaction.customId === 'modal_removemoney') {

      const userId = interaction.fields.getTextInputValue('userid');
      const amount = parseInt(
        interaction.fields.getTextInputValue('amount')
      );

      if (!money[userId]) {
        money[userId] = 0;
      }

      money[userId] -= amount;

      if (money[userId] < 0) {
        money[userId] = 0;
      }

      return interaction.reply(
        `❌ ${amount} crédits retirés`
      );
    }

    // ADD SHOP
    if (interaction.customId === 'modal_addshop') {

      const item = interaction.fields.getTextInputValue('item');
      const price = parseInt(
        interaction.fields.getTextInputValue('price')
      );

      shop[item] = price;

      return interaction.reply(
        `🛒 ${item} ajouté pour ${price} crédits`
      );
    }

    // ADD ROLE
    if (interaction.customId === 'modal_addrole') {

      const roleId = interaction.fields.getTextInputValue('roleid');
      const price = parseInt(
        interaction.fields.getTextInputValue('price')
      );

      roleShop[roleId] = price;

      return interaction.reply(
        `👑 Rôle ajouté pour ${price} crédits`
      );
    }
  }
});

client.login(process.env.TOKEN);
