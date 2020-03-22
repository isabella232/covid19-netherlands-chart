/*global fetch, Headers, Request, Response, URL */
const urlList = [
  'https://www.stichting-nice.nl/covid-19/public/died-cumulative/',
  'https://www.stichting-nice.nl/covid-19/public/ic-cumulative/',
  'https://www.stichting-nice.nl/covid-19/public/intake-count/',
  'https://www.stichting-nice.nl/covid-19/public/intake-cumulative/',
  'https://www.stichting-nice.nl/covid-19/public/new-intake/',
]

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {

  const descriptions = {
    'date': 'the date',
    'diedCumulative': 'Total (cumulative) number of fatal COVID-19 admissions to ICU',
    'icCount': 'Number of different hospitals with at least one COVID-19 infection',
    'icCumulative': 'Total (cumulative) number of different hospitals with at least one COVID-19 infection',
    'intakeCount': 'Total number of COVID-19 patients present per date in the Dutch ICUs',
    'intakeCumulative': 'Total (cumulative) number of COVID-19 patients requiring ICU admission',
    'newIntake': 'Number of new ICU admissions with COVID-19 infection',
  }

  const searchParams = new URL(request.url).searchParams

  const config = {
    allowedMethods: 'GET, HEAD, OPTIONS',
    descriptions: descriptions,
    isPretty: (searchParams.has('pretty') || searchParams.has('verbose')),
    self: request.url,
    showDocs: (searchParams.has('docs') || searchParams.has('verbose')),
    whitelist: Object.keys(descriptions),
  }

  const corsHeaders = {
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': config.allowedMethods,
    'Access-Control-Allow-Origin': '*',
  }

  const fetchJson = url => fetch(new Request(url))
    .then(response => response.ok ? response.json() : {})

  const buildResponse = data => (
    new Response(data, {
      status: 200,
      headers: new Headers({
        ...corsHeaders,
        'Content-Type': 'application/json',
        'X-Clacks-Overhead': 'GNU Terry Pratchett',
      })
    }))

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
              config.whitelist.includes(key) &&
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

  const formatData = data => {
    const response = {
      meta: {
        message: 'ok',
        status: 200,
      },
      links: {
        'self': config.self,
      },
      data: data,
      docs: 'To see documentation, call ?docs=true'
    }

    if (config.isPretty === false) {
      response.meta.format = 'For white-spaced JSON, call ?pretty=true'
    }

    if (config.showDocs) {
      response.docs = {
        code_source: 'https://github.com/potherca-blog/covid19-netherlands-chart/NICE/',
        data_source: 'https://www.stichting-nice.nl/covid-19-op-de-ic.jsp',
        keys: config.descriptions,
      }
    }

    return response
  }

  const stringifyData = data => JSON.stringify(data, null, config.isPretty ? 2 : 0)

  if (event.request.method === 'OPTIONS') {
    return Response(null, { headers: new Headers({ 'Allow': config.allowedMethods, }) })
  } else if (event.request.method == 'HEAD') {
    return new Response(null, { headers: new Headers(corsHeaders), })
  } else {
    return Promise.all(urlList.map(fetchJson))
      .then(combineData)
      .then(formatData)
      .then(stringifyData)
      .then(buildResponse)
  }
}
