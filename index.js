require('dotenv').config()
const Bot = require('./core/index')
const modules = require('./modules')

const bot = new Bot(process.env.TOKEN);

bot.on(/^\/roll*(.*)$/s, function(_this, update, matches) {
    modules.roll(_this, update, matches)
})

bot.on(/^\/download/, function(_this, update) {
    modules.getVkAttachments(_this, update)
})

bot.on(/^\/get_user_info\s(.+)$/s,  async function (_this, update, matches) {
    let user = await modules.getUserInfo(_this, update, matches)
    if (user !== undefined) {
        _this.sendMessage({
            vk_id: user.id,
            screen_name: user.screen_name,
            first_name: user.first_name,
            last_name: user.last_name,
            is_online: user.online_info.is_online
        }, { peer_id: update.chat_id })
    }
})

bot.on(/^\/mute\s(.+)\s(\d+)$/s, function (_this, update, matches) {
    modules.mute(_this, update, matches)
})

bot.on(/^\/help/, function(_this, update) {
    let message =
        'Доступные команды: \n' +
        '/roll <фраза> - выбрать случайного участника беседы\n' +
        '/download - загрузка прикреплённых к сообщению вложений (документы/аудио/фото), в основном используется для скачивания музыки из ВК\n' +
        '/get_user_info <Имя Фамилия> - получить информацию по пользьователю\n' +
        '/mute <Имя Фамилия> <кол-во минут> - замьютить человека в беседе (функция доступна ограниченному количеству людей)';

    _this.sendMessage(message, { peer_id: update.chat_id })
})


bot.polling()