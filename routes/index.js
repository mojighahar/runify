var express = require('express')
var router = express.Router()
var App = require('../components/app')
var Backup = require('../components/backup')
require('dotenv').config()

var apps = Backup.load()
var SocketHandler = require('../components/socketHandler')
new SocketHandler(process.env.SOCKET_PORT || 65301, apps)

router.get('/', function(req, res, next) {
  res.render('index', { apps: apps });
})

router.post('/start', function(req, res, next) {
  apps[req.body.index].start()
  res.json({success: true })
})

router.post('/stop', function(req, res, next) {
  apps[req.body.index].stop()
  res.json({ success: true })
})

router.post('/delete', function(req, res, next) {
  apps[req.body.index].stop()
  apps.splice(req.body.index, 1)
  Backup.save(apps)
  res.json({ success: true })
})

router.post('/add-app', function(req, res, next) {
  var index = apps.push(new App(req.body.path, req.body.args, req.body.keepUp, req.body.name, null, req.body.dir, req.body.env)) - 1
  apps[index].index = index
  Backup.save(apps)
  res.json({ success: true })
})

module.exports = router;
