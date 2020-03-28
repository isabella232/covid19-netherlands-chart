# RIVM - COVID-19 infections in the Netherlands

Netherlands National Institute for Public Health and the Environment (RIVM)
has an overview of information related to COVID-19 cases in the Netherlands:
https://www.rivm.nl/nieuws/actuele-informatie-over-coronavirus

The source of this information comes in the form of unstructured HTML.

I wanted to use this date for my COVID-19 chart but I did not want to manually
update my data every day. To solve this, I create an API that parses the page
and return JSON.

The API endpoint can be found at https://covid-19.potherca.workers.dev/RIVM/

The code used for the endpoint can be found at https://github.com/potherca-blog/covid19-netherlands-chart/blob/master/RIVM/api.js

It can be run/studies in the browser at https://blog.pother.ca/covid19-netherlands-chart/RIVM/

This documentation can be found at https://github.com/potherca-blog/covid19-netherlands-chart/tree/master/RIVM

## Available information

| Topic                 | Description                                                               |
| --------------------- | ------------------------------------------------------------------------- |
| `cases-count`         | Number of new COVID-19 cases per date                                     |
| `cases-total`         | Total (cumulative) number of COVID-19 cases                               |
| `date': `             | the date                                                                  |
| `deceased-count`      | Number of fatal COVID-19 cases per date                                   |
| `deceased-total`      | Total (cumulative) number of fatal COVID-19 cases                         |
| `hospitalised-count`  | Number of COVID-19 cases admitted to hospital per date                    |
| `hospitalised-total`  | Total (cumulative) number of COVID-19 cases admitted to hospital          |
| `personell-total`     | Total (cumulative) number of COVID-19 cases amongst hospital personell    |

[1]: https://www.rivm.nl/nieuws/actuele-informatie-over-coronavirus
