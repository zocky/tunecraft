const express = require('express')
const path = require('path')
module.exports = function (app) {
  express.static.mime.types['wasm'] = 'application/wasm';
  app.use('/assets', express.static(path.join(__dirname, 'assets')))
  app.use('/', express.static(path.join(__dirname, 'dist')))
}
