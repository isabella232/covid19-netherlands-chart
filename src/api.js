/*global fetch, Error, Request, Headers, Response, URL */

/*/ src/NICE.js /*/
const nicePromise = (config) => {
  const urlList = [
    /*/ @TODO: Add new non-date related URL/Data:
      https://www.stichting-nice.nl/covid-19/public/age-distribution/
      https://www.stichting-nice.nl/covid-19/public/age-distribution-died/
    /*/
    'died-and-survivors-cumulative',
    'ic-cumulative',
    'intake-count',
    'intake-cumulative',
    'new-intake',
  ]

  const indexes = {
    'died-and-survivors-cumulative': ['diedCumulative', 'survivors-cumulative']
  }

  const descriptions = {
    'date': 'the date',
    'diedCumulative': 'Total (cumulative) number of fatal COVID-19 admissions to ICU',
    'icCount': 'Number of different hospitals with at least one COVID-19 infection',
    'icCumulative': 'Total (cumulative) number of different hospitals with at least one COVID-19 infection',
    'intakeCount': 'Total number of COVID-19 patients present per date in the Dutch ICUs',
    'intakeCumulative': 'Total (cumulative) number of COVID-19 patients requiring ICU admission',
    'newIntake': 'Number of new ICU admissions with COVID-19 infection',
    'survivors-cumulative': 'Total (cumulative) number of COVID-19 cases released from ICU',
  }

  const whitelist = Object.keys(descriptions)

  const combineData = fetchedData => {
    const combined = []
    const data = []
    const errors = []

    fetchedData.forEach(collection => {
      collection.data.forEach((items, index) => {
        if ('errors' in items) {
          errors.push(items.errors)
        } else if ('date' in items) {
          // Format before 2020-03-30
          const date = items.date

          if (date in combined === false) {
            combined[date] = {}
          }

          Object.entries(items).map(([key, value]) => {
            if (
              whitelist.includes(key) &&
              (
                combined[date][key] === undefined ||
                combined[date][key] === 0
              )
            ) {
              combined[date][key] = value
            }
          })
        } else if (indexes[collection.url]) {
          // Format after 2020-03-30
          const key = indexes[collection.url][index]

          Object.entries(items).map(([_, value]) => {
            if (value.date in combined === false) {
              combined[value.date] = {}
            }

            combined[value.date]['date'] = value.date
            combined[value.date][key] = value.value
          })
        } else {
          // Unknow format! o_O ?
          errors.push(`Unknow/Unsupported format for URL '${collection.url}'`)
        }
      })
    })

    Object.keys(combined).sort().forEach((key) => {
      data.push(combined[key])
    });

    return { data, errors }
  }

  const fetchJson = url => fetch(new Request(
      // 'https://cors-anywhere.herokuapp.com/' +
      'https://www.stichting-nice.nl/covid-19/public/' + url
    ))
    .then(response => response.ok ? response.json() : [{
      errors: `Could not fetch '${response.url}': ${response.statusText} (${response.status})`,
    }]).then(data => ({ data, url }))

  const docs = {
    code_source: 'https://github.com/potherca-blog/covid19-netherlands-chart/NICE/',
    data_source: 'https://www.stichting-nice.nl/covid-19-op-de-ic.jsp',
    keys: descriptions,
  }

  return Promise.all(urlList.map(fetchJson))
    .then(combineData)
    .then(({ data, errors }) => ({ data, docs, errors, status: errors.length === 0 ? 200 : 500 }))
    .catch(error => ({ errors: [error.toString()], status: 500 }))
}

/*/ src/RIVM.js /*/
const rivmPromise = (config) => {
  // const url = 'https://cors-anywhere.herokuapp.com/https://www.rivm.nl/nieuws/actuele-informatie-over-coronavirus'
  const url = 'https://www.rivm.nl/nieuws/actuele-informatie-over-coronavirus'

  // @TODO: Data before 2020-03-01 is reliably and should be hard-coded data

  const regexList = {
    'cases-count': {
      'bodyRegex': new RegExp(
        '(?<cases>' +
        // Format before 25-03-2020
        '([0-9]+ (((nieuwe )?mensen positief getest)|(nieuwe patiënten bij het RIVM gemeld)))' +
        // Format after 25-03-2020
        '|((?<=totaal aantal (?:gemelde |positief |geteste )+patiënten: [0-9.]+ )\\\(\\\+[0-9.]+\\\))' +
        ')', 'g'
      ),
      'titleRegex': /(?<cases>([0-9]+|[A-Z]?[a-z]+) nieuwe patiënten)/g,
    },
    'cases-total': {
      'bodyRegex': new RegExp(
        '(?<cases>totaal (?:aantal )?' +
        '(?:positie(?:f|ve) |geteste |testen |gemelde )+' +
        '(?:mensen|patiënten|in Nederland)?' +
        '(?: op|:) [0-9.]+)',
        'g'
      ),
      'titleRegex': new RegExp(
        '(?<cases>(' +
        '(totaal [0-9]+ positieve testen)' +
        '|(totaal [0-9]+ positief geteste patiënten)' +
        '|(totaal [0-9]+ positief geteste personen)' +
        '))',
        'g'
      ),
    },
    'deceased-count': {
      'bodyRegex': new RegExp(
        '(?<cases>' +
        '((?<=totaal aantal gemelde overleden patiënten: [0-9.]+ )\\\(\\\+[0-9.]+\\\))' +
        ')', 'g'
      ),
      'titleRegex': /(?<cases>([0-9]+|[A-Z]?[a-z]+) patiënt(?:en)? overleden)/g,
    },
    'deceased-total': {
      'bodyRegex': new RegExp('(?<cases>' +
        // Format before 25-03-2020
        '((waarvan|in totaal|totaal zijn (?:er )?nu|is er een) ([0-9]+|vijfde) ' +
        '(mensen|patiënt(?:en)?|persoon|personen) (gemeld als )?' +
        '(is |zijn )?(met het coronavirus |gestorven ?|overleden ?|aan de ziekte ))' +
        // Format after 25-03-2020
        '|(totaal aantal gemelde overleden patiënten: [0-9.]+)' +
        ')', 'g'),
      'titleRegex': null,
    },
    'hospitalised-count': {
      'bodyRegex': new RegExp('(?<cases>' +
        // Format before 25-03-2020
        '(Van de nieuwe pati(e|ë)nten zijn (vier|twee|[0-9]+) (personen|mensen)( in het ziekenhuis| opgenomen)+)' +
        // Format after 25-03-2020
        '|((?<=totaal aantal gemelde patiënten opgenomen \\\(geweest\\\) in het ziekenhuis: [0-9.]+ )\\\(\\\+[0-9.]+\\\))' +
        ')',
        'g'
      ),
      'titleRegex': '',
    },
    'hospitalised-total': {
      'bodyRegex': new RegExp(
        '(?<cases>' +
        // Format before 25-03-2020
        '([0-9]+ (patiënten|mensen) (die in het ziekenhuis )?opgenomen)' +
        // Format after 25-03-2020
        '|(totaal aantal gemelde patiënten opgenomen \\\(geweest\\\) in het ziekenhuis: [0-9.]+)' +
        ')',
        'g'
      ),
      'titleRegex': '',
    },
    'personell-total': {
      'bodyRegex': new RegExp('(?<cases>' +
        '([0-9]+ van de gemelde patiënten werken in de zorg.)' +
        '|(Van de bevestigde personen werken er [0-9]+ in de zorg)' +
        '|([0-9]+ mensen die in de zorg werken)' +
        ')',
        'g'
      ),
      'titleRegex': '',
    },
  }

  const htmlRegex = /<p>.*?(?<date>[0-9]{1,2}-[0-9]{1,2}-2020).*?<\/p>(?<body>(?:.|\n)+?)<hr \/>/g;

  const extractNumber = (match, key) => {
    const convertNumericToNumber = total => (total.toLowerCase()
      .replace('twee', '2')
      .replace('tweede', '2')
      .replace('drie', '3')
      .replace('vier', '4')
      .replace('vijfde', '5')
      .replace('zes', '6')
      .replace('acht', '8')
      .replace('vijftien', '15'))

    const extractMatch = (regexList, match, key) => {
      let localMatch

      if (!localMatch && regexList[key].titleRegex) {
        localMatch = match.groups.title.match(regexList[key].titleRegex)
      }

      if (!localMatch && regexList[key].bodyRegex) {
        localMatch = match.groups.body.match(regexList[key].bodyRegex)
      }

      return localMatch || []
    }

    const extractNumberFromMatch = match => {
      let total = null

      if (match[0]) {
        total = convertNumericToNumber(match[0]).match(/[0-9.]+/gi)

        if (total[0]) {
          total = parseInt(total[0].replace('.', ''), 10)
        }
      }

      return total
    }

    match.data[key] = extractNumberFromMatch(extractMatch(regexList, match, key))

    return match
  }

  // Strip HTML tags and collapse multi-line into single line
  const convertToText = matches => matches.map(match => {
    for (let [key, value] of Object.entries(match.groups)) {
      match.groups[key] = value.replace(/<\/?[^>]+>/g, '').replace(/(\s)+/g, ' ').trim()
    }

    return match
  })

  const extractDate = matches => matches.map(match => {
    const [day, month, year] = match.groups.date.split('-')

    match.data.date = `${year}-$ {month}-${day.padStart(2, '0')}`

    return match
  })

  const grabHtmlData = text => Promise.resolve(text)
    .then(text => text.matchAll(htmlRegex))
    .then(matches => [...matches].map(match => match.groups))
    .then(matches => {
      return matches.map(match => ({
        ...match,
        title: match.body.match(/<h2>(?<title>.+)<\/h2>/)[1] || null
      }))
    })

  const extractNumbers = matches => Promise.resolve(matches)
    // @TODO: Te reduce iterations, combine all  steps into ONE function
    .then(matches => matches.map(match => extractNumber(match, 'cases-total')))
    .then(matches => matches.map(match => extractNumber(match, 'cases-count')))
    .then(matches => matches.map(match => extractNumber(match, 'deceased-count')))
    .then(matches => matches.map(match => extractNumber(match, 'deceased-total')))
    .then(matches => matches.map(match => extractNumber(match, 'hospitalised-count')))
    .then(matches => matches.map(match => extractNumber(match, 'hospitalised-total')))
    .then(matches => matches.map(match => extractNumber(match, 'personell-total')))

  const docs = {
    code_source: 'https://github.com/potherca-blog/covid19-netherlands-chart/RIVM/',
    data_source: 'https://www.rivm.nl/nieuws/actuele-informatie-over-coronavirus',
    keys: {
      'cases-count': 'Number of new COVID-19 cases per date',
      'cases-total': 'Total (cumulative) number of COVID-19 cases',
      'date': 'the date',
      'deceased-count': 'Number of fatal COVID-19 cases per date',
      'deceased-total': 'Total (cumulative) number of fatal COVID-19 cases',
      'hospitalised-count': 'Number of COVID-19 cases admitted to hospital per date',
      'hospitalised-total': 'Total (cumulative) number of COVID-19 cases admitted to hospital',
      'personell-total': 'Total (cumulative) number of COVID-19 cases amongst hospital personell',
    },
  }

  return fetch(new Request(url)).then(response => response.text())
    .then(grabHtmlData)
    .then(matches => matches.map(match => ({
      data: {},
      groups: match
    })))
    .then(convertToText)
    .then(extractDate)
    .then(extractNumbers)
    // Remove all fully empty objects. `slice(1)` removes always present "date"
    .then(matches => matches.filter(match => Object.values(match.data).slice(1).reduce((a, b) => a + b, 0) !== 0))
    // Only return "data", for Regex debugging "groups" should also be returned
    .then(matches => matches.map(match => match.data))
    // Final Response
    .then(matches => ({ data: matches, docs: docs, status: 200 }))
    .catch(error => ({ error: [error], status: 500 }))
}

/*/ src/router.js /*/
const router = [{
    callback: nicePromise,
    route: 'NICE',
  },
  {
    callback: rivmPromise,
    route: 'RIVM',
  }
]

/*/ src/api-bootstrap.js /*/
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

    if (typeof response.errors !== 'undefined' && response.errors.length === 0) {
      delete response.errors
    }

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
