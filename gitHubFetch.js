const fetch = require('node-fetch');
const env = require('./env.js');
const _ = require('lodash');
const parseLinkHeader = require('parse-link-header');

const baseUrl = `https://api.github.com/`;
const tokenString = env.GITHUB_AUTH_TOKEN;

const headers = {
  Authorization: `token ${tokenString}`
}

// Wrap fetch with GitHub specifics
const gitHubFetch = (endpoint, options = {}) => {
  const url = `${baseUrl}${endpoint}`;
  return fetch(url, _.merge(options, { headers })).then((res) => {
    return res.json();
  });
};

//This helper is for when we expect results to be paginated and need the link header
const getLinkHeader = (endpoint, options = {}) => {
  const url = `${baseUrl}${endpoint}`;
  return fetch(url, _.merge(options, { headers })).then((res) => {
    return parseLinkHeader(res.headers._headers.link[0]);
  });
};

module.exports = {
  getLinkHeader,
  gitHubFetch
};
