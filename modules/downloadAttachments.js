const downloadFile = require('../helpers/downloadFile')
const Fs = require('fs')
const Path = require('path')
const AdmZip = require('adm-zip')

module.exports = async function (_this, update) {
    const baseDir = 'vk_attachments_' + update.message_id + '_' + update.timestamp.toString()
    const publicDir = Path.resolve('./media', baseDir)
    if(!Fs.existsSync(publicDir)) { Fs.mkdirSync(publicDir) }

    const attachments = await _this.getMessageAttachment(update.message_id)
    if(attachments.length === 0) return;
    const formattedAttachments = attachments.map(item => {
        switch (item.type) {
            case 'doc':
                return { url: item.doc.url, filepath: Path.resolve(publicDir, item.doc.title) }
            case 'audio':
                return { url: item.audio.url, filepath: Path.resolve(publicDir, `${item.audio.artist} — ${item.audio.title}.mp3`) }
            case 'photo':
                let photo = item.photo.sizes.reduce((acc, curr) => acc.height > curr.height ? acc : curr)
                let foundName = photo.url.match(/\/(?!.*\/)(.*)\?/)
                let photoName = foundName !== null ? foundName[1] : 'photo.jpg'
                return { url: photo.url, filepath: Path.resolve(publicDir, photoName) }
        }
    })

    let downloadingFilesPromises = []
    formattedAttachments.forEach( (attachment) => {
        downloadingFilesPromises.push(
            downloadFile(attachment.url, attachment.filepath)
        )
    })
    await Promise.all(downloadingFilesPromises)

    const zip = new AdmZip()
    const zipFile = publicDir + '.zip'
    const fakeZipFileName = zipFile + '1'
    zip.addLocalFolder(publicDir)
    zip.writeZip(zipFile)

    Fs.renameSync(zipFile, fakeZipFileName)
    Fs.rmSync(publicDir, { recursive: true })

    return fakeZipFileName
}