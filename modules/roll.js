
module.exports = async (_this, update, matches) => {
    let members = await _this.getConversationMembers(update.chat_id)
    const currentBot = await _this.getProfileInfo()
    members = members.filter(user => user.id !== currentBot.id)

    const {first_name, last_name} = members[Math.floor(Math.random() * members.length)]
    _this.sendMessage(`${first_name} ${last_name}${matches[1]}`, { peer_id: update.chat_id})
}