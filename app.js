const express = require('express')
const fileUpload = require('express-fileupload')
const Datastore = require('nedb')
const UIDGenerator = require('uid-generator')
const uniqueSlug = require('unique-slug')

const allowedFileTypes = new Map([['image/png', '.png'], ['application/pdf', '.pdf'], ['image/bmp', '.bmp'], ['image/jpeg', '.jpg']])

//setup database
const database = new Datastore("data.db")
database.loadDatabase()
database.ensureIndex({ fieldName: 'id', unique: true })

//init UID stuff
const uidgen = new UIDGenerator(64, UIDGenerator.BASE58)

//Inserts data with an unique Identifier in the database
function insertData(data, callback) {
    data.id = uidgen.generateSync()
    database.insert(data, (err, doc) => {
        if (err) {
            if (errorType == 'uniqueViolated')
                return insertData(data, callback)
            else
                return callback(err, doc)
        }
        return callback(err, doc)
    })
}

//setup server
const app = express()
app.use(express.static('public'))
app.use("/getFile", express.static("userfiles"))
app.use(fileUpload())
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.listen(3000)

//read form information
app.post('/readForm', (request, response) => {
    if (!request.body.id)
        return response.status(400).send("Invalid request.")

    database.findOne({ id: request.body.id }, (err, data) => {
        if (err)
            return response.status(400).send("Id doesn't exist.")

        delete data._id //internal id should not be exposed
        return response.json(data)
    })
})

//submit File
app.post('/submitFile', (request, response) => {
    if (!request.files || Object.keys(request.files).length === 0)
        return response.status(400).send('No files were uploaded.')

    const f = request.files.file
    const filetype = f.mimetype

    if (allowedFileTypes.has(filetype)) {
        const filename = uniqueSlug() + allowedFileTypes.get(filetype)

        f.mv('userfiles/' + filename)
        return response.json({ fileID: filename, type: filetype })
    } else
        return response.status(400).send('Illegal file type.')
})

//stores the form in the database
app.post('/submitForm', (request, response) => {
    if (!request.is('json'))
        return response.status(400).send("json expected.")

    insertData(request.body, (err, data) => {
        if (err)
            return response.status(500).send("Unable to store data.")
        return response.json({ id: data.id })
    })
})