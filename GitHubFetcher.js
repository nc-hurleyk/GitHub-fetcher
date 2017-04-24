const json2csv = require('json2csv');
const fs = require('fs');
const parseLinkHeader = require('parse-link-header');
const _ = require('lodash');
const { getLinkHeader, gitHubFetch } = require('./gitHubFetch');

class GitHubFetcher {
  /*
    getComments - get all review comments in [pullNumbers] from a repo in
    in the format [repoOwner]/[repo]
    e.g.: getComments('kphurley', 'myRepo', [42, 43]) should get all review comments
    in repo kphurley/myRepo in pull requests (issues) #42 and #43.

    Return a promise for a JSON array of the comments with user, issueNumber, body and url props
  */
  getComments(repoOwner, repo, pullNumbers) {
    const numbers = (pullNumbers instanceof Array) ? pullNumbers : [pullNumbers];
    const requests = numbers.map((number) => {
      return gitHubFetch(`repos/${repoOwner}/${repo}/pulls/${number}/comments`);
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

    const doAllRequests = (pages) => {
      let requests = [];

      for (let i = 1; i <= pages; i++) {
        requests.push(
          gitHubFetch(
            `repos/${repoOwner}/${repo}/pulls?state=all&per_page=100&page=${i}`
          ).then((res) => {
            return res.filter((pr) => pr.user.login === user)
              .map((pr) => pr.number);
          })
        );
      }

      return Promise.all(requests).then((results) => {
        return _.flatten(results);
      });
    };

    return getLinkHeader(
      `repos/BLC/nextcapital-ui/pulls?state=all&per_page=100`
    ).then((linkHeader) => {
      return doAllRequests(Number(linkHeader.last.page));
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
