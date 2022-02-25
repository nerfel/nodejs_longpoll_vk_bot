require('dotenv').config()
const Bot = require('./core/index')
const modules = require('./modules')

const bot = new Bot(process.env.TOKEN);

bot.on(/^\/roll*(.*)$/s, function(_this, update, matches) {
    modules.roll(_this, update, matches)
})

bot.on('/download', function(_this, update) {
    modules.getVkAttachments(_this, update)
})


bot.polling()