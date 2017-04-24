const json2csv = require('json2csv');
const fs = require('fs');
const fetch = require('node-fetch');
const parseLinkHeader = require('parse-link-header');
const _ = require('lodash');

class GitHubFetcher {
  constructor() {
    this.baseUrl = `https://api.github.com/`;
    this.token = process.env.GITHUB_AUTH_TOKEN;
  }

  /*
    getComments - get all review comments in [pullNumbers] from a repo in
    in the format [user]/[repo]
    e.g.: getComments('kphurley', 'myRepo', [42, 43]) should get all review comments
    in repo kphurley/myRepo in pull requests (issues) #42 and #43.

    return a promise for a JSON array of the comments with user, issueNumber, body and url props
  */
  getComments(repoOwner, repo, pullNumbers) {
    const numbers = (pullNumbers instanceof Array) ? pullNumbers : [pullNumbers];
    const tokenString = `token ${this.token}`;
    const requests = numbers.map((number) => {
      return fetch(`https://api.github.com/repos/${repoOwner}/${repo}/pulls/${number}/comments`, {
        headers: {
          Authorization: tokenString
        }
      }).then((res) => {
        return res.json();
      });
    });

    return Promise.all(requests)
    .then((results) => {
      let aggregatedResult = [];
      results.forEach((res) => {
        aggregatedResult = aggregatedResult.concat(
          res.map((comment) => {
            return {
              user: comment.user.login,
              body: comment.body,
              url: comment.html_url
            };
          })
        );
      });
      return aggregatedResult;
    })
    .catch((err) => console.error(`Sorry, ${err} happened.`));

  }

  /*
    getPullRequestIdsByUser - Returns a promise for all of the issue numbers that
    are pull requests for [user] in [repo]
  */
  getPullRequestIdsByUser(user, repoOwner, repo) {
    const tokenString = `token ${this.token}`;
    let linkHeader;

    const doAllRequests = () => {
      let requests = [];
      let data = [];
      let requestURL;
      const pages = Number(linkHeader.last.page);
      for (let i = 1; i <= pages; i++) {
        requestURL =
          `https://api.github.com/repos/${repoOwner}/${repo}/pulls?state=all&per_page=100&page=${i}`;
        requests.push(
          fetch(requestURL, { headers: { Authorization: tokenString }}).then((res) => {
            return res.json();
          }).then((res) => {
            return res.filter(
              (pr) => pr.user.login === user
            ).map((pr) => pr.number);
          })
        );
      }

      return Promise.all(requests).then((results) => {
        return _.flatten(results);
      });
    }

    return fetch(`https://api.github.com/repos/BLC/nextcapital-ui/pulls?state=all&per_page=100`, {
      headers: {
        Authorization: tokenString
      }
    }).then((res) => {
      linkHeader = parseLinkHeader(res.headers._headers.link[0]);
      return doAllRequests();
    }).catch((err) => {
      console.log(`${err} happened`);
    });
  }

  /*
    writeCSV - take a formatted comment object from getComments, [data] and write it to a
    CSV file indicated by [filePath].
  */
  writeCSV(data, filePath) {
    const fields = ['user', 'body', 'url'];
    const csv = json2csv({ data, fields });

    fs.writeFile(filePath, csv, function(err) {
      if (err) { throw err; };
      console.log('CSV saved to ', filePath);
    });
  }
}

module.exports = GitHubFetcher;
