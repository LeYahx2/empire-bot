    // =========================
    // DONNER RANKS
    // =========================

    for (const rank of rankRoles) {

      if (level[userId] >= rank.level) {

        const role =
          message.guild.roles.cache.get(
            rank.roleId
          );

        if (
          role &&
          !message.member.roles.cache.has(role.id)
        ) {

          await message.member.roles.add(role);

          message.channel.send(
            `🏆 ${message.author} obtient le rank ${rank.name}`
          );
        }
      }
    }
