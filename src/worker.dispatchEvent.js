/*global dispatchEvent, Event, Request, URL */

const handleError = e => {
  const errorElement = document.querySelector('[data-js="errors"]')
  errorElement.innerHTML += e
  errorElement.style.display = 'initial'

  console.error(e)
}

window.addEventListener('DOMContentLoaded', () => {
  // DOM fully loaded and parsed
  document.body.innerHTML += `
<h2>Response</h2>

<div data-js="errors" style="display:none; color:red; border:1px solid;padding: 1em;"></div>

<h3>Headers</h3>

<pre data-js="response-headers"></pre>

<h3>Body</h3>

<pre data-js="response-body"></pre>
`

  document.body.appendChild(document.createElement('script')).src = './../src/NICE.js'
  document.body.appendChild(document.createElement('script')).src = './../src/RIVM.js'
  document.body.appendChild(document.createElement('script')).src = './../src/api-bootstrap.js'
})

window.addEventListener('load', () => {
  // Page is fully loaded including all stylesheets and images
  const event = new Event('fetch', {})

  event.request = new Request(document.location)

  event.response = null

  event.respondWith = input => event.response = input

  try {
    dispatchEvent(event)
  } catch (e) {
    handleError(e)
  }

  event.response
    .then(e => {
      e.json().then(data => {

        const searchParams = new URL(document.location).searchParams

        let indent = 0
        if (searchParams.has('pretty') || searchParams.has('verbose')) {
          indent = 2
        }

        document.querySelector('[data-js="response-headers"]').innerHTML +=
          `Status: <span style="background:${e.status < 500 ? 'green' :'red'};color:white;">${e.status}</span> (${e.statusText})\n` +
          JSON.stringify(Object.fromEntries(e.headers.entries()), null, 2)

        document.querySelector('[data-js="response-body"]').innerHTML += JSON.stringify(data, null, indent)
      })
    }).catch(handleError)
})
