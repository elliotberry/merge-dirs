
import mergedirs from '../index.js'
import fs from 'fs'

/* globals describe, it */
describe('merge dirs', function () {
  it('should merge 2 folders', function (done) {
    fs.mkdirSync(__dirname + '/c')
    mergedirs(__dirname + '/a', __dirname + '/c')
    mergedirs(__dirname + '/b', __dirname + '/c')
		//
    fs.existsSync(__dirname + '/c/hello.txt').should.equal(true)
    fs.existsSync(__dirname + '/c/world.txt').should.equal(true)
    done()
  })
})
