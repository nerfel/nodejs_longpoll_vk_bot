const getUserInfo = require('./getUserInfo')
const muniteStringFormat = require('../helpers/minuteStringFormat')
module.exports = async (_this, update, matches) => {
    let message = await _this.getMessageInfo(update.message_id)
    if (!_this.admins.includes(message.items[0].from_id)) {
        _this.sendMessage('У вас нет прав для доступа к этому модулю', { peer_id: update.chat_id })
        return
    }

    let userToMute = await getUserInfo(_this, update, matches)
    if (userToMute !== undefined) {
        _this.mute({
            vk_id: userToMute.id,
            term: matches[2]
        })

        _this.sendMessage(`Пользователь ${userToMute.first_name} ${userToMute.last_name} замьючен на ${matches[2]} ${muniteStringFormat(matches[2])}`, { peer_id: update.chat_id })
    }
}