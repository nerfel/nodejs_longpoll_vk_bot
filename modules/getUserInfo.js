const findConversationMembersByString = require('../helpers/findConversationMemberByString')

module.exports = async (_this, update, matches) => {
    let members = await _this.getConversationMembers(update.chat_id, true)
    let result = await findConversationMembersByString(members, matches[1])
    if (!result.success) {
        _this.sendMessage(result.message, { peer_id: update.chat_id})
        return
    }

    return result.user
}