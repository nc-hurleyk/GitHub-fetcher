const Fetcher = require('./GitHubCommentFetcher');

const fetcher = new Fetcher();

//const pullRequests = [array of PR numbers];

// fetcher.getComments('BLC', 'nextcapital-design-objects', [584, 594, 603, 618, 630, 664])
// .then((comments) => {
//   fetcher.writeCSV(comments, 'hurleyk_comments.csv');
// });

fetcher.getPullRequestIdsByUser('hurleyk', 'BLC', 'nextcapital-design-objects');
