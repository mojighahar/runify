const WS = require('ws')

class SocketHandler {
  constructor(port, apps) {
    this.server = new WS.Server({ port: port })
    this.clients = []
    this.apps = apps
    this.applyServerEvents()
  }

  applyServerEvents() {
    this.server.on('connection', client => this.accept(client))
  }

  accept(client) {
    var index = this.clients.push(client) - 1
    this.clients[index].index = index
    this.applyClientEvents(client)
  }

  applyClientEvents(client) {
    client.on('message', (message) => {
      var request = JSON.parse(message)
      switch (request.action) {
        case 'attach':
          this.apps[request.index].addListener(client)
          break
        case 'deattach':
        this.apps[request.index].removeListener(client)
          break
      }
    })

    client.on('close', () => {
      this.destroy(client)
    })
  }

  destroy(client) {
    this.clients.splice(client.index, 1)
    this.apps.forEach(app => {
      app.removeListener(client)
    })
  }
}

module.exports = SocketHandler