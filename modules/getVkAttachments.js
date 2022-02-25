const downloadAttachments = require('../modules/downloadAttachments')
const Fs = require('fs')

module.exports = async function (_this, update) {
    const zipFile = await downloadAttachments(_this, update)
    if(zipFile === undefined) {
        _this.sendMessage('сообщение не содержит вложений', { peer_id: update.chat_id})
        return
    }
    _this.sendMessage('ща', { peer_id: update.chat_id})
    const uploadedFile = await _this.uploadFile({ peer_id: update.chat_id}, zipFile)
    Fs.rmSync(zipFile)
    const savedDocument = await _this.saveDocument(uploadedFile)
    _this.sendMessage('не забудь удалить единичку в конце имени архива, пупсик', { peer_id: update.chat_id}, savedDocument.doc)
}