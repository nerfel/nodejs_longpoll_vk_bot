const axios = require('axios')
const Fs = require('fs')
const Path = require('path')

module.exports = async function(url, filename) {
    const path = Path.resolve(__dirname, filename)
    const response = await axios.get(url, { responseType: "stream" })

    response.data.pipe(Fs.createWriteStream(path))
    return new Promise((resolve, reject) => {
        response.data.on('end', () => {
            resolve()
        })

        response.data.on('error', err => {
            reject(err)
        })
    })
}