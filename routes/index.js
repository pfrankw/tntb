const express = require('express')
let router = express.Router()

router.get('/', (req, res) => {
    res.render("index", {title: "Welcome"})
})

module.exports = router
