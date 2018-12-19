const express = require('express');
const fetch = require('node-fetch');
const querystring = require('querystring');
const bodyParser = require('body-parser');

let app = express();
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.get('/return', (req, res) => {
  res.sendFile(__dirname + '/return.html');
});

app.post('/api/createIssue', (req, res) => {
  // get user access code, browser url, error message and stacktrace from API req
  const userCode = req.body.code;
  const original_url = req.body.original_url;
  const message = req.body.message;
  const error = req.body.error;
  // client id and client secret key are for my app that the user gave permissions to on github
  const client_id = 'acffd5452e72d99e751f';
  const client_secret = '4a5d7a2295d09ddee950598938c20fd921b16afa';
  // post to github to get an authorization token to work on behalf of the user
  fetch(`https://github.com/login/oauth/access_token?client_id=${client_id}&client_secret=${client_secret}&code=${userCode}`,
        {
          method: 'POST',
          headers: {
            "Accept": "application/json",
          },
        })
        .then((response) => {
          return response.json();
        })
        // when I get the access token back, make another post request to the github api to create the issue
        .then((json) => {
          const {access_token} = json;
          // body contains info about the error - issue title is the error message, issue body is the stacktrace and browser url
          // can also add labels, projects, assign dev to issue etc.
          fetch('https://api.github.com/repos/wildlingjill/github-api-test/issues',
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${access_token}`,
                'Content-type': 'application/json',
              },
              body: JSON.stringify({
                title: `${message}`,
                body: `URL: ${original_url}, stacktrace: ${error}`,
                labels: ["test"],
              }),
            })
            .then((response) => {
              return response.json();
            })
            // when github api responds with obj containing info about the new issue, send back to front-end
            .then((result) => res.json(result));
        });
});

app.listen(8000);
