/*global router, Headers, Response, URL */

const statusCodes = {
  100: "Continue",
  101: "Switching Protocols",
  102: "Processing",

  200: "OK",
  201: "Created",
  202: "Accepted",
  203: "Non-Authoritative Information",
  204: "No Content",
  205: "Reset Content",
  206: "Partial Content",
  207: "Multi-Status",
  208: "Already Reported",
  226: "IM Used",

  300: "Multiple Choices",
  301: "Moved Permanently",
  302: "Found",
  303: "See Other",
  304: "Not Modified",
  305: "Use Proxy",
  307: "Temporary Redirect",
  308: "Permanent Redirect",

  400: "Bad Request",
  401: "Unauthorized",
  402: "Payment Required",
  403: "Forbidden",
  404: "Not Found",
  405: "Method Not Allowed",
  406: "Not Acceptable",
  407: "Proxy Authentication Required",
  408: "Request Timeout",
  409: "Conflict",
  410: "Gone",
  411: "Length Required",
  412: "Precondition Failed",
  413: "Payload Too Large",
  414: "URI Too Long",
  415: "Unsupported Media Type",
  416: "Range Not Satisfiable",
  417: "Expectation Failed",
  418: "I'm a teapot",
  421: "Misdirected Request",
  422: "Unprocessable Entity",
  423: "Locked",
  424: "Failed Dependency",
  426: "Upgrade Required",
  428: "Precondition Required",
  429: "Too Many Requests",
  431: "Request Header Fields Too Large",
  444: "Connection Closed Without Response",
  451: "Unavailable For Legal Reasons",
  499: "Client Closed Request",

  500: "Internal Server Error",
  501: "Not Implemented",
  502: "Bad Gateway",
  503: "Service Unavailable",
  504: "Gateway Time-out",
  505: "HTTP Version Not Supported",
  506: "Variant Also Negotiates",
  507: "Insufficient Storage",
  508: "Loop Detected",
  510: "Not Extended",
  511: "Network Authentication Required",
  599: "Network Connect Timeout Error",
}

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)

  const config = {
    allowedMethods: 'GET, HEAD, OPTIONS',
    isPretty: (url.searchParams.has('pretty') || url.searchParams.has('verbose')),
    showDocs: (url.searchParams.has('docs') || url.searchParams.has('verbose')),
  }

  const corsHeaders = {
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': config.allowedMethods,
    'Access-Control-Allow-Origin': '*',
  }

  const buildResponse = data =>
    new Response(JSON.stringify(data, null, config.isPretty ? 2 : 0), {
      headers: new Headers({
        ...corsHeaders,
        'Content-Type': 'application/json',
        'X-Clacks-Overhead': 'GNU Terry Pratchett',
      }),
      status: data.meta.status,
      statusText: data.meta.message,
    })

  const enhanceResponse = response => {
    response = response || {}

    /*/ Data /*/
    if (typeof response.data === 'undefined' && typeof response.errors === 'undefined') {
      response.errors = ['No data returned']
      response.status = 500
    }

    /*/ Docs /*/
    if (response.docs) {
      response.docs = config.showDocs ?
        response.docs :
        'To see documentation, call ?docs=true'
    }

    /*/ Links /*/
    if (!response.links) {
      response.links = { 'self': request.url }
    }

    /*/ Meta data /*/
    response.meta = response.meta || {}

    response.meta.status = response.status || response.meta.status || 500

    response.meta.message = statusCodes[response.meta.status || 500]

    if (config.isPretty === false) {
      response.meta.format = 'For white-spaced JSON, call ?pretty=true'
    }

    delete response.status

    return response
  }

  if (request.method === 'OPTIONS') {
    return Response(null, { headers: new Headers({ 'Allow': config.allowedMethods, }) })
  } else if (request.method == 'HEAD') {
    return new Response(null, { headers: new Headers(corsHeaders), })
  } else {
    const path = url.pathname.split('/').filter(Boolean).join('/');

    // How to trigger specific (function/route/worker)s depending on URI?
    const requestPath = `${request.method}:${path}`

    if (typeof router === 'undefined') {
      router = []
    }

    const routes = router.filter(route => new RegExp(route.route, 'g').test(requestPath))

    routes.push({
      callback: () => ({
        errors: [`No callback found for route '${url.pathname}'`],
        status: 501
      })
    })

    console.log(routes[0])

    return Promise.resolve(routes.shift().callback(config))
      .then(enhanceResponse)
      .then(buildResponse)
  }
}
