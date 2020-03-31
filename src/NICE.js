/*global fetch, Request*/
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
      'https://cors-anywhere.herokuapp.com/' +
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

router = typeof(router) == 'undefined' ? [] : router;

router.push({
  // description: '',
  // name: '',
  callback: nicePromise,
  route: 'NICE',
})
