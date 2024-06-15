const axios = require('axios')
const Fs = require('fs')
let FormData = require('form-data')

class Bot {

    constructor(token=process.env.TOKEN, admins=process.env.ADMINS, api_v=process.env.API_V) {
        this.token = token
        this.api_v = api_v
        this.longPollServer = null
        this.longPollData = null
        this.handleTimeOut = 50
        this.commands = []
        this.admins = JSON.parse(admins)
        this.muted = []

        this.systemHelpers = {
            syncTimeout: ms => new Promise(resolve => setTimeout(resolve, ms)),
            randomInt: (min, max) => {
                min = Math.ceil(min)
                max = Math.floor(max)
                return Math.floor(Math.random() * (max - min)) + min
            },
            handleLongPollUpdate: (command, element, trigger) => {

                const dialogOptions = {
                    is_pm: element[5] === ' ... ',
                }
                if(!dialogOptions.is_pm) { dialogOptions.dialog_name = element[5] }

                command.callback(
                    this,
                    {
                        event_type: element[0],
                        message_id: element[1],
                        flag: element[2],
                        chat_id: element[3],
                        timestamp: element[4],
                        ...dialogOptions,
                        message: element[6]
                    },
                    trigger
                )
            }
        }
        this.syncTimeout = ms => new Promise(resolve => setTimeout(resolve, ms))
        this.randomInt = function (min, max) {
            min = Math.ceil(min)
            max = Math.floor(max)
            return Math.floor(Math.random() * (max - min)) + min
        }

    }

    async getLongPollServer () {
        const lpServer = await axios.get("https://api.vk.com/method/messages.getLongPollServer", {
            params: {
                access_token: this.token,
                v: this.api_v
            }
        })
        return lpServer.data.response
    }

    async polling () {
        if (this.longPollServer === null || this.longPollData?.failed) {
            this.longPollServer = await this.getLongPollServer()
        }

        let { server, key, ts } = await this.longPollServer
        const { data: lpData } = await axios.get(`https://${server}`, {
            params: {
                act: 'a_check',
                key,
                ts,
                wait: 25,
                mode: 32,
                lp_version: 3
            }
        })

        this.longPollData = lpData
        if (this.longPollData.failed) {
            this.longPollServer = await this.longPollServer
        }
        this.longPollServer.ts = this.longPollData.ts

        if (this.longPollData.updates instanceof Array) {
            for (const element of this.longPollData.updates) {
                if (element[0] === 4) { // handle only messages
                    let command = this.commands.find( command => command.trigger === element[6])
                    if (command) {
                        this.systemHelpers.handleLongPollUpdate(command, element, command.trigger)
                    }
                    else {
                        let regexCommand = this.commands.find(command => command.trigger instanceof RegExp && element[6].match(command.trigger))
                        if (regexCommand) {
                            let found = element[6].match(regexCommand.trigger)
                            if (found) {
                                this.systemHelpers.handleLongPollUpdate(regexCommand, element, found)
                            }
                        }
                    }

                    this.muted = this.muted.filter(user => user.unMuteTimestamp > Math.floor(Date.now() / 1000))
                    let message = await this.getMessageInfo(element[1])

                    if (this.muted.some(u => u.vk_id === message.items[0].from_id)) {
                        this.deleteMessage(message)
                    }
                }
            }
        }

        await this.syncTimeout(this.handleTimeOut)
        await this.polling()
    }

    sendMessage (message, chat_id, attachment=null) {
        let params = {
            random_id: this.randomInt(100000, 99999999),
            access_token: this.token,
            v: this.api_v,
            ...chat_id,
            message
        }
        if(attachment !== null) { params.attachment = `doc${attachment.owner_id}_${attachment.id}` }
        return axios.get('https://api.vk.com/method/messages.send', { params })
    }

    async deleteMessage(message) {
        let params = {
            access_token: this.token,
            v: this.api_v,
            message_ids: message.items[0].id,
            delete_for_all: 1,
            peer_id: message.items[0].peer_id
        }

        return axios.get('https://api.vk.com/method/messages.delete', { params })
    }

    async getConversationMembers(peer_id, excludeCurrentBot = true) {
        const { data } = await axios.get('https://api.vk.com/method/messages.getConversationMembers', {
            params: {
                access_token: this.token,
                peer_id,
                v: this.api_v
            }
        })

        if (!excludeCurrentBot) {
            return data.response.profiles
        }

        const currentBot = await this.getProfileInfo()
        return data.response.profiles.filter(user => user.id !== currentBot.id)
    }

    async getMessageInfo(id) {
        let messageInfo = await axios.get('https://api.vk.com/method/messages.getById', {
            params: {
                message_ids: id,
                preview_length: 0,
                extended: true,
                fields: '',
                access_token: this.token,
                v: this.api_v
            }
        })
        return messageInfo.data.response
    }

    async getMessageAttachment(id) {
        const attachments = await this.getMessageInfo(id)
        return attachments.items[0].attachments
    }

    async getMessagesUploadServer(chat_id) {
        let response = await axios.get('https://api.vk.com/method/docs.getMessagesUploadServer', {
            params: {
                ...chat_id,
                access_token: this.token,
                v: this.api_v
            }
        })
        return response.data.response.upload_url
    }

    async uploadFile(chat_id, filepath) {

        const server = await this.getMessagesUploadServer(chat_id)
        const form = new FormData()
        form.append('file', Fs.createReadStream(filepath))
        const response = await axios.post(server, form, {
            headers: { ...form.getHeaders() },
            maxBodyLength: Infinity,
            maxContentLength: Infinity
        })

        return response.data
    }

    async saveDocument({file}) {
        let response = await axios.get('https://api.vk.com/method/docs.save', {
            params: {
                file,
                access_token: this.token,
                v: this.api_v
            }
        })

        return response.data.response
    }

    async getProfileInfo() {
        let { data } = await axios.get('https://api.vk.com/method/account.getProfileInfo', {
            params: {
                access_token: this.token,
                v: this.api_v
            }
        })
        return data.response
    }

    on(trigger, callback) {
        this.commands.push({ trigger, callback})
    }

    mute(userData) {
        if (this.muted.some(u => u.vk_id === userData.vk_id)) {
            return;
        }

        this.muted.push({
            vk_id: userData.vk_id,
            unMuteTimestamp: Math.floor(Date.now() / 1000) + (userData.term * 60)
        })
    }

}

module.exports = Bot
