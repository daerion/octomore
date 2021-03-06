'use strict'

const propTypes = {
  getConfig: 'function',
  exists: 'function',
  isOutdated: 'function',
  store: 'function',
  retrieve: 'function',
  remove: 'function',
  getRemainingLifetime: 'function'
}

function verifyCacheProps (cache, expect) {
  const props = Object.keys(propTypes)

  expect(cache).to.be.an('object')
  expect(cache).to.have.all.keys(props)

  props.forEach((prop) => {
    expect(typeof cache[prop]).to.equal(propTypes[prop])
  })
}

module.exports = {
  propTypes,
  verifyCacheProps
}
