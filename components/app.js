const { spawn } = require('child_process')
const Path = require('path')
const fs = require('fs')
const WS = require('ws')
require('dotenv').config()

class App {
  constructor(path, args, keepUp, name, logPath, dir, env) {
    this.path = path
    this.args = args
    this.dir = dir || '/'
    this.env = env || {}
    this.env.PATH = process.env.PATH
    this.keepUp = keepUp || false
    this.name = name || Path.basename(this.path)
    this.logPath = logPath || this.getDefaultLogPath()
    this.status = 'created'
    this.stopped = false
    this.meta = {}
    this.listeners = []
    this.tries = 0
  }

  start(fromUser = false) {
    if (this.status == 'running')
      return
    if(fromUser) {
      this.tries = 0
    }
    this.process = spawn(this.path, this.args, {
      cwd: this.dir,
      env: this.env
    })
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
      if (this.keepUp && !this.stopped && (this.tries < process.env.MAX_TRIES)) {
        this.tries++;
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
    console.log("Client Handeled")
    return this.listeners.push(client)
  }

  getDefaultLogPath() {
    return Path.resolve(__dirname, '../logs', this.name + '.log')
  }

  static fromObject(object) {
    return new App(object.path, object.args, object.keepUp, object.name, object.logPath, object.dir, object.env)
  }

  toObject() {
    return {
      path: this.path,
      args: this.args,
      keepUp: this.keepUp,
      name: this.name,
      logPath: this.logPath,
      dir: this.dir,
      env: this.env
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