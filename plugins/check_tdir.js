const elasticsearch = require('elasticsearch')
const parseTorrent = require('parse-torrent')
const fs = require('fs')
const path = require('path')

let ihs = []

async function updateBulk(client, index, ihs)
{
    let my_ihs = ihs
    let bulkup = []

    await my_ihs.forEach(async (ih) => {
        bulkup.push({ update: { _index: index, _type: '_doc', _id: ih.infoHash } })
        delete ih.infoHash
        bulkup.push({ doc: { parsed: ih } })
    })

    try {
      let x = await client.bulk({body: bulkup})
      return x
    } catch (e) {
      console.error(e)
    }

    return null
}

async function entry(obj) {

    let tdir = obj.config.tdir
    let es_host = obj.config.es
    let files = fs.readdirSync(tdir)
    let index = obj.config.es_index

    if (!obj.config.check_tdir)
        return

    const client = elasticsearch.Client({
        hosts: [
            es_host
        ]
    })

    //await files.forEach(async (file, i) => {
    for (i in files) {

        let file = files[i]

        if (file[0] == '.')
            continue;


        let m = file.match(/([A-Z0-9]+)\./)
        let ih = {}
        let fullpath = path.join(tdir, file)
        let torrent

        if (!m || !m[1])
            continue;

        torrent = parseTorrent(fs.readFileSync(fullpath))

        ih = {
          infoHash: m[1],
          name: torrent.name,
          trackers: torrent.announce,
          comment: torrent.comment,
          created: torrent.created,
          private: torrent.private,
          length: torrent.length,
          pieceLength: torrent.pieceLength,
          lastPieceLength: torrent.lastPieceLength,
          files: torrent.files,
        }

        ihs.push(ih)
        if (ihs.length >= 1000) {
          console.log("Updating..", i)
          await updateBulk(client, index, ihs.splice(0, 1000))
          console.log("Updated")
        }

    }

    console.log("Last update", ihs.length)
    await updateBulk(client, index, ihs.splice(0, 1000))
    console.log("Updated")

}


module.exports = entry
