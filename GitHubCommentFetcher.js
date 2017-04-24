const GitHub = require('github-api');
const json2csv = require('json2csv');
const fs = require('fs');
const fetch = require('node-fetch');

class GitHubCommentFetcher {
  constructor() {
    // this.gh = new GitHub({
    //   token: process.env.GITHUB_AUTH_TOKEN
    // });
    this.baseUrl = `https://api.github.com/`;
  }

  /*
    getComments - get all review comments in [pullNumbers] from a repo in
    in the format [user]/[repo]
    e.g.: getComments('kphurley', 'myRepo', [42, 43]) should get all review comments
    in repo kphurley/myRepo in pull requests (issues) #42 and #43.

    return an JSON array of the comments with user, issueNumber, body and url props
  */
  getComments(user, repo, pullNumbers) {
    const numbers = (pullNumbers instanceof Array) ? pullNumbers : [pullNumbers];
    const repository = this.gh.getRepo(user, repo);
    const requests = numbers.map((number) => {
      //return repository._request('GET', `/repos/${user}/${repo}/pulls/${number}/comments`);
      return fetch(`${this.baseUrl}/repos/${user}/${repo}/pulls/${number}/comments`, {
        headers: {
          Authorization: `token ${process.env.GITHUB_AUTH_TOKEN}`
        }
      }).then((res) => res.json());
    });

    return Promise.all(requests)
    .then((results) => {
      let aggregatedResult = [];
      results.forEach((res) => {
        aggregatedResult = aggregatedResult.concat(
          res.data.map((comment) => {
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
    getPullRequestIdsByUser - Find all of the issue numbers that are pull requests
    for [user] in [repo]

    return an array of the matching issueNumbers
  */
  getPullRequestIdsByUser(user, repoOwner, repo) {
    // const repository = this.gh.getRepo(repoOwner, repo);
    // repository.listPullRequests({}).then((issues) => {
    //   console.log(issues);
    // }).catch((error) => {
    //   console.log('ERROR ', error);
    // });
    fetch(`https://api.github.com/repos/BLC/nextcapital-design-objects/issues?state=all`, {
      headers: {
        Authorization: `token ${process.env.GITHUB_AUTH_TOKEN}`
      }
    }).then((res) => {
      //the response is paginated - we need to get the number of pages and
      //make seperate requests
      console.log(res);
      return res.json();
    }).then((pulls) => {
      console.log('it worked');
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

module.exports = GitHubCommentFetcher;
