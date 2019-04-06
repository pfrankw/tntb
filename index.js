const YAML = require('yaml')
const fs = require('fs')
const path = require('path')
const elasticsearch = require('elasticsearch')


function loadPlugins(app, config, dir) {

    let files = fs.readdirSync(dir)

    files.forEach((file) => {

        let fullpath
        let mod

        if (file[0] == '.')
            return;

        fullpath = path.join(dir, file)
        require(fullpath)({app: app, config: config})

    })
}

console.log("Starting, NODE_ENV =", process.env.NODE_ENV)

let app = require('./app.js')
let config

console.log("Reading the config")
try {
    config = YAML.parse(fs.readFileSync('./config.yml').toString())
} catch (e) {
    console.error(e)
    process.exit(-1)
}


console.log("Loading plugins")
loadPlugins(app, config, path.join(__dirname, 'plugins'))

const esclient = elasticsearch.Client({
    hosts: [
        config.es
    ]
})

app.set('config', config)
app.set('esclient', esclient)

app.listen(config.port, () => {
    console.log("Listening on "+config.port)
})
