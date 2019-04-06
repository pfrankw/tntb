const express = require('express')
let router = express.Router()


function formatModel(hit) {

    return {
        title: hit._source.title,
        link: hit._source.link,
        tlink: hit._source.tlink,
        mlink: hit._source.mlink,
        info_hash: hit._source.info_hash,
        length: hit._source.parsed ? hit._source.parsed.length : undefined,
        created: hit._source.parsed ? new Date(hit._source.parsed.created) : undefined,
        comment: hit._source.parsed ? hit._source.parsed.comment : undefined
    }
}


router.get('/', (req, res) => {
    const cfg = req.app.get('config')
    const esclient = req.app.get('esclient')

    esclient.search({
        index: cfg.es_index,
        q: 'title:'+req.query.q
    }, (err, r, resp) => {

        let hits = []
        let collection = []
        let nhits = 0

        if (!err && r.hits && r.hits.hits) {
          hits = r.hits.hits
          nhits = r.hits.total

          hits.forEach((hit)=>{collection.push(formatModel(hit))})
        }

        console.log(collection)
        res.render("search", {query: req.query.q, collection:collection, nhits: nhits})
    })


})

module.exports = router
