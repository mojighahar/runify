const { spawn } = require('child_process')
const Path = require('path')
const fs = require('fs')
const WS = require('ws')

class App {
  constructor(path, args, keepUp, name, logPath) {
    this.path = path
    this.args = args
    this.keepUp = keepUp || false
    this.name = name || Path.basename(this.path)
    this.logPath = logPath || this.getDefaultLogPath()
    this.status = 'created'
    this.stopped = false
    this.meta = {}
    this.listeners = []
  }

  start() {
    if (this.status == 'running')
      return
    this.process = spawn(this.path, this.args)
    this.attachEvents()
    this.status = 'running'
    this.stopped = false
  }

  attachEvents() {
    this.process.stderr.on('data', (data) => {
      this.log(data)
    })
    this.process.stdout.on('data', (data) => {
      this.log(data)
    })
    this.process.on('error', (error) => {
      this.log(error)
      this.status = 'errored'
    })
    this.process.on('exit', (code, signal) => {
      this.status = 'exited'
      this.meta.exitCode = code
      this.meta.signal = signal
      if (this.keepUp && !this.stopped) {
        this.start();
      }
    })
  }

  stop() {
    if (this.status != 'running')
      return
    this.process.kill()
    this.status = 'killed'
    this.stopped = true
  }

  log(data) {
    this.sendToListeners(data.toString())
    fs.appendFile(this.logPath, data.toString() + '\n', (error) => {
      if (error) {
        this.meta.logError = error
        this.meta.logWriting = 'Error'
      } else {
        this.meta.logWriting = 'OK'
      }
    })
  }

  addListener(client) {
    var last = ''
    if (fs.existsSync(this.logPath))
      last = fs.readFileSync(this.logPath, { encoding: 'UTF-8' })
    client.send(JSON.stringify({
      type: 'attach',
      success: true,
      last: last
    }))
    return this.listeners.push(client)
  }

  getDefaultLogPath() {
    return Path.resolve(__dirname, '../logs', this.name + '.log')
  }

  static fromObject(object) {
    return new App(object.path, object.args, object.keepUp, object.name, object.logPath)
  }

  toObject() {
    return {
      path: this.path,
      args: this.args,
      keepUp: this.keepUp,
      name: this.name,
      logPath: this.logPath
    }
  }

  sendToListeners(data) {
    this.listeners.forEach(listener => {
      if (listener.readyState == WS.OPEN) {
        listener.send(JSON.stringify({
          type: 'update',
          update: data
        }))
      } else {
        this.removeListener(listener)
      }
    })
  }

  removeListener(client) {
    for (var i = 0, listener; listener = this.listeners[i]; i++) {
      if (client.index == listener.index) {
        this.listeners.splice(i, 1)
      }
    }
  }
}

module.exports = App