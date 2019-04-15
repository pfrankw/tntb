const elasticsearch = require('elasticsearch')
const cheerio = require('cheerio')
const torRequest = require('./common/tor_request')
const modlog = require('./common/modlog')
const asleep = require('./common/asleep')


const mylog = modlog.getLog('check_tntvillage')
const myerror = modlog.getError('check_tntvillage')

function pad(num, size) {
    var s = "000000000" + num;
    return s.substr(s.length-size);
}

function buildSEArray(prefix, start, end) {

    let ret = []

    if (!start)
        return [];

    if (!end)
        return [prefix+pad(start, 2)];

    for (let i=start; i <= end; i++) {
        ret.push(prefix+pad(i, 2))
    }

    return ret;
}

function addSE(body) {

    let seasons = null
    let season = /s([0-9]{2})-?([0-9]{2})?/i.exec(body.title)
    if (season)
        seasons = buildSEArray('s', parseInt(season[1]), season[2] ? parseInt(season[2]) : null)

    // episode extraction
    let episodes = null
    let episode = /e([0-9]{2})-?([0-9]{2})?/i.exec(body.title)
    if (episode)
        episodes = buildSEArray('e', parseInt(episode[1]), episode[2] ? parseInt(episode[2]) : null)

    if (seasons)
        body.seasons = seasons

    if (episodes)
        body.episodes = episodes

    return body
}

function getTds($, tr) {
  try {
    return {
      torrent: $(tr).find('td').eq(0),
      magnet: $(tr).find('td').eq(1),
      cat: $(tr).find('td').eq(2),
      title: $(tr).find('td').eq(6)
    }
  } catch (e) {
    return null
  }
}

function parsePage(source) {

    let $ = cheerio.load(source);

    let tr_list = $('tr');
    let ret = [];

    $(tr_list).each(function(i, tr) {

        let tds = getTds($, tr)
        if (!tds)
          return

        let tlink = tds.torrent.find('a').attr('href');
        let mlink = tds.magnet.find('a').attr('href');
        let cat = 0;
        let title = tds.title.text();
        let link = tds.title.find('a').attr('href')
        let ih

        if (!mlink)
            return;

        try {
          ih = mlink.match(/btih\:([0-9A-Z]*)/)[1]
        } catch (e) {
          console.error("Can't find ih!")
          return
        }

        try {
          cat = parseInt(tds.cat.find('a').attr('href').match(/cat\=([0-9]+)/)[1])
        } catch (e) {}

        title = title.replace(/\u00a0/, " ")

        let body = {info_hash: ih, title: title, cat: cat, link: link, tlink: tlink, mlink: mlink}

        body = addSE(body)

        ret.push(body)

    })

    return ret
}

async function getPage(n) {

  return torRequest(
    'http://tntvillage.scambioetico.org/src/releaselist.php',
    { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' },
    {
      cat: 0,
      page: n,
      srcrel: ''
    }
  )
}

async function updateDB(es, es_index, parsed) {

  const client = elasticsearch.Client({
      hosts: [
          es
      ]
  })

  for (p in parsed) {

    let doc = parsed[p]
    let r

    try {
      r = await client.exists({
        id: doc.info_hash,
        index: es_index,
        type: '_doc'
      })
    } catch (e) {
      return false
    }

    // If this record already exists we can tell
    if (r)
      return false

    doc.source = 'tntvillage'
    try {
      await client.index({
        index: es_index,
        type: '_doc',
        id: doc.info_hash,
        body: doc
      })
    } catch (e) {
      return false
    }


  }

  return true
}

async function updateTNT(es, index) {

  let i = 1

  mylog('Checking for new entries')

  while (1) {

    mylog('Page', i)

    let r = await getPage(i)

    if (!r) {
      myerror('Can\'t fetch page', i)
      return
    }

    let p = parsePage(r)

    if (!p || !p.length) {
      myerror('Can\'t parse page', i)
      return
    }

    r = await updateDB(es, index, p)

    if (!r) {
      mylog('Page', i, 'was last page')
      break
    }

    i++
  }

}


async function entry(obj) {

  let intv = obj.config.update_tnt_interval
  while (intv) {
    await updateTNT(obj.config.es, obj.config.es_index)
    await asleep(intv*60*1000)
  }

}

module.exports = entry
