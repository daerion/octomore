'use strict'

import getDebugger from 'debug'

import { noTransform } from './transformer'
import createPseudoCache from './cache/pseudo'

const debug = getDebugger('octomore:document')

export default function defineDocument ({ retriever, uriTemplate, getUri, transformer = noTransform, rawCache = createPseudoCache(), transformedCache = createPseudoCache(), friendlyName = 'Document' }) {
  if (typeof retriever !== 'function') {
    throw new Error('A retriever function must be provided when defining a document.')
  }

  if (typeof getUri !== 'function' && typeof uriTemplate !== 'string') {
    throw new Error('You must provide either an "uriTemplate" string or a "getUri" function when creating a new document.')
  }

  const getFullUri = getUri || ((id) => uriTemplate.replace(/\{id\}/i, id))
  const isInCache = async (uri, cache) => await cache.exists(uri) && !(await cache.isOutdated(uri))

  let getTransformedData = async (id, options) => {
    const debugDoc = (msg, ...params) => debug(`[%s %s] ${msg}`, friendlyName, id, ...params)
    const uri = await getFullUri(id, options)
    const cachedTransformedData = await isInCache(uri, transformedCache)

    if (cachedTransformedData) {
      debug('Returning cached transformed data for uri %s.', uri)

      return await transformedCache.retrieve(uri)
    }

    const cachedRawData = await isInCache(uri, rawCache)

    debugDoc('Retrieving raw data from %s, full uri is %s', cachedRawData ? 'cache' : 'source', uri)

    const raw = cachedRawData ? await rawCache.retrieve(uri) : await retriever(uri, options)

    debugDoc('Raw data retrieved - applying transformation')

    if (!cachedRawData) {
      await rawCache.store(uri, raw)
    }

    const transformed = await transformer(raw)

    debugDoc('Transformation applied')

    await transformedCache.store(uri, transformed)

    return transformed
  }

  getTransformedData.retriever = retriever
  getTransformedData.cache = { raw: rawCache, transformed: transformedCache }

  return getTransformedData
}
