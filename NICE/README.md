# Stichting NICE - COVID-19 infection in Dutch ICU

The Dutch Foundation for National Intensive Care Evaluation ([Stichting NICE][1])
has an [overview of information][2] related to COVID-19 cases in Intensive Care
(IC).

The source of this information comes from 6 separate API endpoints.

I wanted to use this date for my COVID-19 chart but I did not feel much like
making 6 HTTP calls for each request. To solve this, I create an API that makes
the calls and combines them into one endpoint.

The API endpoint can be found at https://covid-19.potherca.workers.dev/NICE

The code used for the endpoint can be found at https://github.com/potherca-blog/covid19-netherlands-chart/blob/master/NICE/api.js

It can be run/studies in the browser at https://blog.pother.ca/covid19-netherlands-chart/NICE/

This documentation can be found at https://github.com/potherca-blog/covid19-netherlands-chart/tree/master/NICE

## Available information

| Topic              | Description                                                                                 |
| ------------------ | ------------------------------------------------------------------------------------------- |
| died-cumulative    | Totaal (cumulatief) aantal COVID-19 opnamen met fatale afloop op de IC                      |
| ic-count           | Aantal verschillende ziekenhuizen met tenminste één COVID-19 infectie                       |
| ic-cumulative      | Totaal (cumulatief) aantal verschillende ziekenhuizen met tenminste één COVID-19 infectie   |
| intake-count       | Totaal aantal aanwezige COVID-19 patiënten per datum in de Nederlandse ICs                  |
| intake-cumulative  | Totaal (cumulatief) aantal Covid-19 patiënten waarvoor IC opname nodig was                  |
| new-intake         | Aantal nieuwe IC opnamen met COVID-19 infectie                                              |

## URL endpoints

| Topic              | URL Endpoint                                                       |
| ------------------ | ------------------------------------------------------------------ |
| died-cumulative    | https://www.stichting-nice.nl/covid-19/public/died-cumulative/     |
| ic-cumulative      | https://www.stichting-nice.nl/covid-19/public/ic-cumulative/       |
| intake-count       | https://www.stichting-nice.nl/covid-19/public/intake-count/        |
| intake-cumulative  | https://www.stichting-nice.nl/covid-19/public/intake-cumulative/   |
| new-intake         | https://www.stichting-nice.nl/covid-19/public/new-intake/          |

## Information per URL endpoint

| Topic              | diedCumulative | icCount | icCumulative | intakeCount | intakeCumulative | newIntake |
| ------------------ | -------------- | ------- | ------------ | ----------- | ---------------- | --------- |
| died-cumulative    |             ✔ |         |              |             |                  |           |
| ic-cumulative      |                |         |           ✔ |             |                  |           |
| intake-count       |                |      ✔ |              |          ✔ |                  |           |
| intake-cumulative  |                |         |              |             |               ✔️ |        ✔️ |
| new-intake         |                |         |              |             |                  |        ✔️ |

---

Copyright: 1996-2020 van Stichting NICE
Source: https://www.stichting-nice.nl/covid-19-op-de-ic.jsp

[1]: https://www.stichting-nice.nl/
[2]: https://www.stichting-nice.nl/covid-19-op-de-ic.jsp
