const fs = require('fs')
const path = require('path')
const express = require('express')
const helmet = require('helmet')

let app = express()

function readRoutes(app, dir, prefix) {

  let files = fs.readdirSync(dir)

  files.forEach((file) => {
    let fullpath

    if (file == '.' || file == '..')
      return;

    fullpath = path.join(dir, file)

    if (/\.js$/.test(file)) {

      if (file == 'index.js')
        app.use(prefix, require(fullpath))

      app.use(prefix+file.substr(0, file.length-3), require(fullpath))

    } else if (fs.statSync(fullpath).isDirectory())
      readRoutes(app, fullpath, prefix+file+'/')

  })
}


app.use(helmet())
app.use(express.static('public'))
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'pug')


app.disable('x-powered-by')
//app.disable('etag')

readRoutes(app, path.join(__dirname, 'routes'), '/')

app.use((req, res, next) => {
    res.status(404).send('Not found!!')
})

app.use((err, req, res, next) => {
    console.error(err.stack)
    res.status(500).send('Internal server error')
})


module.exports = app
