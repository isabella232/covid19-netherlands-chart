/*global fetch, Chart */
const baseUrl = 'https://covid-19.potherca.workers.dev'

const fetchJson = path => fetch(`${baseUrl}/${path}`).then(response => response.ok ? response.json() : {})

const combineData = data => {
  const combined = []
  const ordered = [];

  data.forEach(collection => {
    if ('data' in collection) {
      collection = collection.data
    }

    collection.forEach((items) => {
      if ('date' in items) {
        const date = items.date

        if (date in combined === false) {
          combined[date] = {}
        }

        Object.entries(items).map(([key, value]) => {
          if (combined[date][key] === undefined || combined[date][key] === 0) {
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

const createChart = data => {
  const context = document.getElementById('covid19-chart').getContext('2d')

  new Chart(context, {
    type: 'line',
    data: {
      labels: data.map(values => new Date(values.date).toLocaleString('default', { month: 'long', day: 'numeric' })),
      datasets: [
        { label: 'Confirmed Cases', data: data.map(values => values['cases-total']), backgroundColor: 'rgba(98%, 88%, 12%, 0.2)' },
        { label: 'Hospitalized Patients', data: data.map(values => values['hospitalised-total']), backgroundColor: 'rgba(100%, 77%, 31%, 0.4)' },
        { label: 'IC Patients', data: data.map(values => values.intakeCumulative), backgroundColor: 'rgba(100%, 60%, 16%, 0.6)' },
        { label: 'Fatalities', data: data.map(values => values['deceased-total']), backgroundColor: 'rgba(85%, 37%, 5%, 0.8)' },
        { label: 'IC Fatalities', data: data.map(values => values.diedCumulative), backgroundColor: 'rgb(60%, 20%, 2%, 1)' },
        { label: 'Hospital Personnel', data: data.map(values => values['personell-total']) },
      ],
    }
  })

  return data
}

Promise.all([
    'https://covid-19.potherca.workers.dev/RIVM',
    'https://covid-19.potherca.workers.dev/NICE',
  ].map(fetchJson))
  .then(combineData)
  .then(createChart)
  .catch(error => {
    alert(`Sorry, something seems to have gone wrong!\n\n${error}`)
    console.log(error)
  })
