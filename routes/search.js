const express = require('express')
let router = express.Router()

router.get('/', (req, res) => {
    const cfg = req.app.get('config')
    const esclient = req.app.get('esclient')

    esclient.search({
        index: cfg.es_index,
        q: 'title:'+req.query.q
    }, (err, r, resp) => {
        res.render("search", {query: req.query.q, hits: r.hits.hits})
    })


})

module.exports = router
