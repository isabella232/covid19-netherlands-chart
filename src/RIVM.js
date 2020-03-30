/*global fetch, Error, Request */

const rivmPromise = (config) => {
  const url = 'https://cors-anywhere.herokuapp.com/https://www.rivm.nl/nieuws/actuele-informatie-over-coronavirus'
  // const url = 'https://www.rivm.nl/nieuws/actuele-informatie-over-coronavirus'

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

  const htmlRegex = new RegExp(
    '<p>.*?(?<date>[0-9]{1,2}-[0-9]{1,2}-2020).*?<\/p>' +
    '(.*|\\\n)+?' +
    '<h2>(?<title>.+)<\/h2>' +
    '(?<body>(?:.|\\\n)+?)<hr \/>',
    'g'
  );

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

    match.data.date = `${year}-${month}-${day}`

    return match
  })

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

  return fetch(new Request(url))
    .then(response => response.text())
    // Grab all HTML data
    .then(text => text.matchAll(htmlRegex))
    // Grab only the matches
    .then(matches => [...matches].map(match => ({
      data: {},
      groups: match.groups
    })))
    .then(convertToText)
    .then(extractDate)
    // @TODO: Te reduce iterations, combine all  steps into ONE function
    // .then(extractNumbers)
    .then(matches => matches.map(match => extractNumber(match, 'cases-total')))
    .then(matches => matches.map(match => extractNumber(match, 'cases-count')))
    .then(matches => matches.map(match => extractNumber(match, 'deceased-count')))
    .then(matches => matches.map(match => extractNumber(match, 'deceased-total')))
    .then(matches => matches.map(match => extractNumber(match, 'hospitalised-count')))
    .then(matches => matches.map(match => extractNumber(match, 'hospitalised-total')))
    .then(matches => matches.map(match => extractNumber(match, 'personell-total')))
    // Remove all fully empty objects. `slice(1)` removes always present "date"
    .then(matches => matches.filter(match => Object.values(match.data).slice(1).reduce((a, b) => a + b, 0) !== 0))
    // Only return "data", for Regex debugging "groups" should also be returned
    .then(matches => matches.map(match => match.data))
    // Final Response
    .then(matches => ({ data: matches, docs: docs, status: 200 }))
    .catch(error => ({ error: [error], status: 500 }))
}

router = typeof(router) == 'undefined' ? [] : router;

router.push({
  // description: '',
  // name: '',
  callback: rivmPromise,
  route: 'RIVM',
})
