const Fetcher = require('./GitHubFetcher');

const fetcher = new Fetcher();

fetcher.getPullRequestIdsByUser(
  'nc-hurleyk', 'BLC', 'nextcapital-ui'
).then((ids) => {
  fetcher.getComments('BLC', 'nextcapital-ui', ids)
  .then((comments) => {
    fetcher.writeCSV(comments, 'hurleyk_comments.csv');
  });
});
