const randomstring = require('randomstring')
const Agent = require('socks5-http-client/lib/Agent')
const request = require('request-promise-native')

async function torRequest(uri, headers, form, opts) {

  let r

  let options = {
    uri: uri,
    method: form ? 'POST' : 'GET',
    form: form,
    headers: headers,
    agentClass: Agent,
    agentOptions: {
      socksHost: 'localhost', // Defaults to 'localhost'.
      socksPort: 9050, // Defaults to 1080.
      socksUsername: randomstring.generate(),
      socksPassword: randomstring.generate()
    }
  }

  for (k in opts) {
    options[k] = opts[k]
  }

  try {
    r = await request(options)
    return r
  } catch (e) {
    return null
  }

}

module.exports = torRequest
