// Join server
var express = require('express')
var app = express()
var port = process.env.PORT || 1337
//Join DateBase
var MongoClient = require('mongodb').MongoClient
var ObjectId = require('mongodb').ObjectID
var url = 'mongodb://127.0.0.1:27017' // локальная ДБ
//var url = 'mongodb://admin:q2w3e4r5@ds261136.mlab.com:61136/heroku_695mr875' // внешняя ДБ


// запрос на регистрацию пользователя в базу монгоДБ с проверкой на совпадение по логину
app.get('/auth', (req, res) => {
    var login = req.query.login
    var pwd = req.query.password
    
    MongoClient.connect(url, (err, db) => {
            if (err) throw err;
            var dbo = db.db("heroku_695mr875")
            dbo.collection('ID card').findOne({login: req.query.login}, ((err, check) => {
                if (err) throw err;
                if (!check) {
                    var obj = {
                    type: 'ID card',
                    login: login,
                    password: pwd
                    }
                    dbo.collection('ID card').insertOne(obj, (err, result) => {
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
//проверка логина
app.get('/login', (req, res) => {
    var login = req.query.login
    var pwd = req.query.password

    MongoClient.connect(url, (err, db) => {
        if (err) throw err;
        var dbo = db.db('heroku_695mr875')
        dbo.collection('ID card').findOne({login: req.query.login, password: req.query.password}, (err, check) => {
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
//изменение пароля
app.get('/change_pwd', (req, res) => {
    var login = req.query.login
    var pwd = req.query.password
    var new_pwd = req.query.new_password

    MongoClient.connect(url, (err, db) => {
        if (err) throw err;
        var dbo = db.db('heroku_695mr875')
        dbo.collection('ID card').updateOne({login: req.query.login, password: req.query.password}, {$set: {password: req.query.new_password}}, (err, result) => {
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

//send message
app.get('/send_msg', (req, res) => {
    var fromLog = req.query.from
    var toLog = req.query.to
    var msg = req.query.message
    
    MongoClient.connect(url, (err, db) => {
        if (err) throw err;
        var dbo = db.db('heroku_695mr875')
        //чекаем наличие пользователя №1 и его пароль (по факту залогинен ли он)
        dbo.collection('ID card').findOne({login: req.query.from, password: req.query.password}, (err, check) => {
            if (err) throw err;
            if (check) {
                // если да чекаем существует ли пользователь №2
                dbo.collection('ID card').findOne({login: req.query.to}, (err, check) => {
                    if (err) throw err;
                    if (check) {
                        var obj = {
                            type: 'Message',
                            from: fromLog,
                            to: toLog,
                            msg: msg
                            }
                            //или похоже нельзя тут вывести в отдельную коллекцию, но мб можно подключить новуб ДБ с сообщениями
                            //тут можно вывести отдельную коллекцию для сообщений, пока что я просто добавил в объекты "type:" для логинов/паролей и для сообщений
                            dbo.collection('message').insertOne(obj, (err, result) => {
                                if (err) throw err; 
                                if (result) {
                                console.log(fromLog + ' has sended message to: ' + toLog)
                                res.json({type: 'Message send'})
                                } else {
                                    res.json({type: 'server_err'})
                                }
                            })
                    } else {
                        console.log(toLog + ' not found, try another user.')
                        res.json({type: 'err. Try another user.'})
                    }
                })
            } else {
                console.log(fromLog + ' are not login | ' + fromLog + ' not found')
                res.json({type: "err. You're not login"})
            }
        })
    })
})
// выводим все сообщения пользователю
app.get('/all_msg', (req, res) => {

    var login = req.query.login
   

    MongoClient.connect(url, (err, db) => {
        if (err) throw err;
        var dbo = db.db('heroku_695mr875')
        dbo.collection('ID card').findOne({login: req.query.login, password: req.query.password}, (err, check) => {
            if (err) throw err;
            if (check) {
                console.log(login + " has be accessed")
                dbo.collection('message').find({to: req.query.login}, {projection:{_id: 0, type: 0}}).toArray((err, result) => {
                    if (err) throw err;
                    if (result) {
                        res.json(result)
                        console.log('User ' + login + ' request their message\n', result)
                    } else {
                        console.log('ERROR')
                        res.json({type: 'err'})
                    }
                })   
            } else {
                console.log(login + ' not found, try another user.')
                res.json({type: 'err. Try another user.'})
            }
        })
    })
})
// выводим переписку с конкретным пользователем 
app.get('/get_msg', (req, res) => {
    var youLogin = req.query.login
    var youFriend = req.query.friend
    var tmpLogin = [];
    var tmpFriend = [];

    MongoClient.connect(url, (err, db) => {
        if (err) throw err;
        var dbo = db.db('heroku_695mr875')
        dbo.collection('ID card').findOne({login: req.query.login, password: req.query.password}, (err, check) => {
        if (err) throw err;
        if (check) {
            dbo.collection('message').find({from: req.query.login, to: req.query.friend} , {projection:{_id: 0, type: 0}}).toArray((err, result) => {
                if (err) throw err;
                if (result.length != 0) {
                    if (result) {
                        tmpLogin.push(result)
                        console.log('first array\n', result)
                        dbo.collection('message').find({from: req.query.friend, to: req.query.login} , {projection:{_id: 0, type: 0}}).toArray((err, result) => {
                            if (err) throw err;
                            if (result.length != 0) {
                                if (result) {
                                    tmpFriend.push(result)
                                    console.log('Second array\n', result)
                                    var output = tmpLogin.concat(tmpFriend)
                                    res.json(output)
                                    console.log('Summary array\n', output)
                                } else {
                                    console.log('ERROR')
                                    res.json({type: 'err'})
                                }
                            } else {
                                res.json({type: 'no result'})
                                console.log('User ' + youLogin + ' has no message with ' + youFriend)
                            }
                        })
                    } else {
                        console.log('ERROR')
                        res.json({type: 'err'})
                    }
                } else {
                    res.json({type: 'no result'})
                    console.log('User ' + youLogin + ' has no message with ' + youFriend)
                }
            })
        } else {
            console.log(youLogin + ' not found, try another user.')
            res.json({type: 'err. Try another user.'})
        }
        })
    })
})


// UP our server
app.listen(port, () => {
    var dt = new Date();
    console.log("Server 'Test auth with MongoDB' listening on port: " + dt)
    
})
