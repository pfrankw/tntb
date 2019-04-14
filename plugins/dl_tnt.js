const fs = require('fs')
const path = require('path')

const parseTorrent = require('parse-torrent')
const torRequest = require('./common/tor_request')
const modlog = require('./common/modlog')
const asleep = require('./common/asleep')

const mylog = modlog.getLog('dl_tnt')
const myerror = modlog.getError('dl_tnt')

async function getTorrent(uri) {
  try {
    let r = await torRequest(
      uri,
      { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' },
      null,
      {encoding: null}
    )

    return r

  } catch (e) {
    return null
  }
}

async function dlTNT(esclient, config) {

  let r
  let count
  let from

  try {
    count = await esclient.count({
      index: config.es_index,
      type: '_doc',
      body: {
        query: {
          bool: {
            must_not: {
              exists: {
                field: 'parsed'
              }
            }
          }
        }
      }
    })
  } catch (e) {
    myerror(e)
    return
  }

  mylog("not parsed count", count.count)
  from=0
  while (from<count.count) {

    try {
      r = await esclient.search({
        index: config.es_index,
        type: '_doc',
        body: {
          from: from,
          size: 10,
          query: {
            bool: {
              must_not: {
                exists: {
                  field: 'parsed'
                }
              }
            }
          }
        }
      })
    } catch (e) {
      myerror(e)
      return
    }

    if (!r || !r.hits || !r.hits.total) {
      myerror("Can't obtain not parsed list")
      return
    }

    for (i in r.hits.hits) {

      let doc = r.hits.hits[i]

      mylog('Trying to fetch', doc._id, doc._source.tlink)

      let tbuf = await getTorrent(doc._source.tlink)

      if (!tbuf) {
        myerror('Cant fetch it')
        continue
      }

      let pt = parseTorrent(tbuf)
      if (!pt) {
        myerror('Cant parse torrent', doc._id, doc._source.tlink)
        continue
      }

      if (pt.infoHash.toUpperCase() != doc._id) {
        myerror('WTF downloaded torrent and tlink does not match', doc._id, pt.infoHash)
        continue
      }

      let fulltpath = path.join(config.tdir, doc._id+'.torrent')

      fs.writeFileSync(fulltpath, tbuf)

      try {
        await esclient.update({
          index: config.es_index,
          type: '_doc',
          id: doc._id,
          body: {
            doc: {
              parsed: {
                name: pt.name,
                announce: pt.announce,
                comment: pt.comment,
                created: pt.created,
                private: pt.private,
                length: pt.length,
                pieceLength: pt.pieceLength,
                lastPieceLength: pt.lastPieceLength,
                files: pt.files,
              }
            }
          }
        })

        mylog('Successfully inserted', doc._id)
      } catch (e) {
        myerror('Error while inserting', doc._id, e)
      }

    }

    from+=r.hits.hits.length

  }

}

async function entry(obj) {

  let intv = obj.config.dl_tnt_interval

  while (intv) {
    mylog("Starting dlTNT")
    await dlTNT(obj.app.get('esclient'), obj.config)
    await asleep(intv*60*1000)
  }

}

module.exports = entry
