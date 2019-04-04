const elasticsearch = require('elasticsearch')
const fs = require('fs')

let ihs = []

function bulkUpdate(client, index) {

    let my_ihs = ihs.splice(0, 1000)
    let bulkup = []

    my_ihs.forEach((ih) => {
        bulkup.push({ update: { _index: index, _type: 'default', _id: ih } })
        bulkup.push({ doc: {tfile: true} })
    })

    client.bulk({ body: bulkup }, (err, res, resp) => {

        if (err) {
            console.error(err)
            process.exit(-1)
        }

        if (ihs.length)
            bulkUpdate(client, index)
        else
            console.log("[check_tdir]: Ended updating")
    })

    //console.log(my_ihs)
}

function entry(obj) {

    let tdir = obj.config.tdir
    let es_host = obj.config.es
    let files = fs.readdirSync(tdir)
    let index = obj.config.es_index

    if (!obj.config.check_tdir)
        return

    const client = elasticsearch.Client({
        hosts: [
            es_host
        ]
    })

    files.forEach((file) => {
        let m = file.match(/([A-Z0-9]+)\./)

        if (!m || !m[1])
            return;

        ihs.push(m[1])
    })

    console.log("[check_tdir]: Updating", ihs.length, "documents")

    bulkUpdate(client, index)

}


module.exports = entry
