// Join server
var express = require('express')
var app = express()

//Join DateBase
var MongoClient = require('mongodb').MongoClient
var ObjectId = require('mongodb').ObjectID
var url = 'mongodb://127.0.0.1:27017'


// запрос на регистрацию пользователя в базу монгоДБ с проверкой на совпадение по логину
app.get('/auth', (req, res) => {
    var login = req.query.login
    var pwd = req.query.password
    
    MongoClient.connect(url, (err, db) => {
            if (err) throw err;
            var dbo = db.db("lesson")
            dbo.collection('users').findOne({login: req.query.login}, ((err, check) => {
                if (err) throw err;
                if (!check) {
                    var obj = {
                    login: login,
                    password: pwd
                    }
                    dbo.collection('users').insertOne(obj, (err, result) => {
                        if (err) throw err; 
                        if (result) {
                        console.log(login + ' has added to DateBase')
                        res.json({type: 'ok'})
                        } else {
                            res.json({type: 'server_err'})
                        }
                    }) 
                } else {
                    console.log(login + ' was added to DateBase earlier')
                    res.json({type: 'err'})
                }
                db.close()
            }))               
    })
})

app.get('/login', (req, res) => {
    var login = req.query.login
    var pwd = req.query.password

    MongoClient.connect(url, (err, db) => {
        if (err) throw err;
        var dbo = db.db('lesson')
        dbo.collection('users').findOne({login: req.query.login, password: req.query.password}, (err, check) => {
            if (check) {
                res.json({type: 'You are login!', user: check})
                console.log(login + ' has login.')
              } else {
                res.json({type: 'Wrong password'})
                console.log(login + ' try login, password wrong.')
              }
        })
    })
})

app.get('/change_pwd', (req, res) => {
    var login = req.query.login
    var pwd = req.query.password
    var new_pwd = req.query.new_password

    MongoClient.connect(url, (err, db) => {
        if (err) throw err;
        var dbo = db.db('lesson')
        dbo.collection('users').updateOne({login: req.query.login, password: req.query.password}, {$set: {password: req.query.new_password}}, (err, result) => {
            if (err) throw err;
            if (result) {
                res.json({type: 'ok'})
                console.log(login + ' has change password: ' + new_pwd)
              } else {
                res.json({type: 'err'})
              }
        })
    })
})


// UP our server
app.listen(1337, () => {
    var dt = new Date();
    console.log("Server 'Test auth with MongoDB' listening on port 1337 on: " + dt)
    
})