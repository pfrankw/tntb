const express = require('express')
let router = express.Router()

function formatModel(hit) {
    return hit._source
}

router.get('/:hash', async (req, res) => {
    const cfg = req.app.get('config')
    const esclient = req.app.get('esclient')

    try {
        let r = await esclient.get({id: req.params.hash, index: cfg.es_index, type: 'default'})
        console.log(r)
        res.render('torrent', {model: formatModel(r)})
    } catch (e) {
        res.send("Impossibile trovare il torrent")
    }


})


module.exports = router
