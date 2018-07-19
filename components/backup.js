const App = require('./app')
const fs = require('fs')

class Backup {
  static load() {
    if(!fs.existsSync(Backup.PATH))
      return []
    
    var backups = JSON.parse(fs.readFileSync(Backup.PATH, { encoding: 'UTF-8' }))
    var apps = []
    for(var i = 0, backup; backup = backups[i]; i++) {
      apps.push(App.fromObject(backup))
    }

    return apps
  }

  static save(apps) {    
    var backups = []
    for(var i = 0, app; app = apps[i]; i++) {
      backups.push(app.toObject())
    }
    
    fs.writeFileSync(Backup.PATH, JSON.stringify(backups), { encoding: 'UTF-8' })
  }
}

Backup.PATH = 'apps-backup.json'

module.exports = Backup