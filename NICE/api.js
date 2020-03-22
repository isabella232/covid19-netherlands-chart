/*global fetch, Headers, Request, Response, URL */

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

const fetchJson = (url, config = {}) => fetch(new Request(url, config))
  .then(response => response.ok ?
    response.json() : {} // new Error('Could not retrieve API response, status = ' + response.status)
  )

const fetchAll = (urlList, config) =>
  Promise.all(urlList.map(url => fetchJson(url, config)))

const combineData = ({ data, whitelist }) => {
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

const handleRequest = async(request, config) => fetchAll(urlList, config)
  .then(data => { return { data, whitelist } })
  .then(combineData)
  .then(data => ({
    status: 200,
    message: 'ok',
    docs: {
      code_source: 'https://github.com/potherca-blog/covid19-netherlands-chart/NICE/',
      data_source: 'https://www.stichting-nice.nl/covid-19-op-de-ic.jsp',
      keys: descriptions,
      url: request.url,
    },
    data: data,
  }))
  .then(data => {
    let indent = 0

    if (new URL(request.url).searchParams.has('pretty')) {
      indent = 2
    }

    return JSON.stringify(data, null, indent)
  })
  .then(data => new Response(data, {
    status: 200,
    headers: new Headers({
      'Content-Type': 'application/json',
      'X-Clacks-Overhead': 'GNU Terry Pratchett',
    })
  }))
