const request = require('request-promise-native')
const Agent = require('socks5-http-client/lib/Agent')
const cheerio = require('cheerio')
const randomstring = require('randomstring')


async function getPage(n) {
  let options = {
    uri: 'http://tntvillage.scambioetico.org/src/releaselist.php',
    method: 'POST',
    form: {
      cat: 0,
      page: n,
      srcrel: ''
    },
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
    },
    agentClass: Agent,
    agentOptions: {
      socksHost: 'localhost', // Defaults to 'localhost'.
      socksPort: 9050, // Defaults to 1080.
      socksUsername: randomstring.generate(),
      socksPassword: randomstring.generate()
    },
    transform: (body) => {
      return cheerio.load(body)
    }
  }

  let $ = await request(options)
  console.log($('td'))
}

async function entry(obj) {
  await getPage(1)
}

module.exports = entry
