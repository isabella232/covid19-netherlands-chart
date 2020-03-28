/*global fetch, Request*/
const nicePromise = (config) => {
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

  const docs = {
    code_source: 'https://github.com/potherca-blog/covid19-netherlands-chart/NICE/',
    data_source: 'https://www.stichting-nice.nl/covid-19-op-de-ic.jsp',
    keys: descriptions,
  }

  return Promise.all(urlList.map(fetchJson))
    .then(combineData)
    .then(data => ({ data, docs, status: 200 }))
    .catch(error => ({ error: [error], status: 500 }))
}

router = typeof(router) == 'undefined' ? [] : router;

router.push({
  // description: '',
  // name: '',
  callback: nicePromise,
  route: 'NICE',
})
