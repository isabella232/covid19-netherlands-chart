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

/*global fetch, Request*/
const main = (config) => {
  const urlList = [
    'https://www.stichting-nice.nl/covid-19/public/died-cumulative/',
    'https://www.stichting-nice.nl/covid-19/public/ic-cumulative/',
    'https://www.stichting-nice.nl/covid-19/public/intake-count/',
    'https://www.stichting-nice.nl/covid-19/public/intake-cumulative/',
    'https://www.stichting-nice.nl/covid-19/public/new-intake/',
  ]

  const descriptions = {
    'date': 'the date',
    'diedCumulative': 'Total (cumulative) number of fatal COVID-19 admissions to ICU',
    'icCount': 'Number of different hospitals with at least one COVID-19 infection',
    'icCumulative': 'Total (cumulative) number of different hospitals with at least one COVID-19 infection',
    'intakeCount': 'Total number of COVID-19 patients present per date in the Dutch ICUs',
    'intakeCumulative': 'Total (cumulative) number of COVID-19 patients requiring ICU admission',
    'newIntake': 'Number of new ICU admissions with COVID-19 infection',
  }

  const whitelist = Object.keys(descriptions)

  const combineData = data => {
    const combined = []
    const ordered = [];

    data.forEach(collection => {
      collection.forEach((items) => {
        if ('date' in items) {
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

        }
      })
    })

    Object.keys(combined).sort().forEach((key) => {
      ordered.push(combined[key])
    });

    return ordered
  }

  const fetchJson = url => fetch(new Request(url))
    .then(response => response.ok ? response.json() : {})

  config.docs = {
    code_source: 'https://github.com/potherca-blog/covid19-netherlands-chart/NICE/',
    data_source: 'https://www.stichting-nice.nl/covid-19-op-de-ic.jsp',
    keys: descriptions,
  }

  return Promise.all(urlList.map(fetchJson))
    .then(combineData)
}
