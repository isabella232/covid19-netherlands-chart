/*global Headers, Response, URL */

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const searchParams = new URL(request.url).searchParams

  const config = {
    allowedMethods: 'GET, HEAD, OPTIONS',
    isPretty: (searchParams.has('pretty') || searchParams.has('verbose')),
    self: request.url,
    showDocs: (searchParams.has('docs') || searchParams.has('verbose')),
  }

  const corsHeaders = {
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': config.allowedMethods,
    'Access-Control-Allow-Origin': '*',
  }

  const buildResponse = data => (
    new Response(data, {
      status: 200,
      headers: new Headers({
        ...corsHeaders,
        'Content-Type': 'application/json',
        'X-Clacks-Overhead': 'GNU Terry Pratchett',
      })
    }))

  const stringifyData = data => JSON.stringify(data, null, config.isPretty ? 2 : 0)

  const formatData = data => {
    const response = {
      meta: {
        message: 'ok',
        status: 200,
      },
      data: data
    }

    if (config.isPretty === false) {
      response.meta.format = 'For white-spaced JSON, call ?pretty=true'
    }

    if (config.links) {
      response.links = config.links
    } else {
      response.links = { 'self': config.self }
    }

    if (config.docs) {
      if (config.showDocs) {
        response.docs = config.docs
      } else {
        response.docs = 'To see documentation, call ?docs=true'
      }
    }

    return response
  }

  if (request.method === 'OPTIONS') {
    return Response(null, { headers: new Headers({ 'Allow': config.allowedMethods, }) })
  } else if (request.method == 'HEAD') {
    return new Response(null, { headers: new Headers(corsHeaders), })
  } else {
    return main(config)
      .then(formatData)
      .then(stringifyData)
      .then(buildResponse)
  }
}
