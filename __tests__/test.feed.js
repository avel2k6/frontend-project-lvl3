import { getFeedData, getFeedDiff } from '../src/feed';

const oldFeed = {
  items: [
    {
      itemLink: 'link1',
    },
    {
      itemLink: 'link2',
    },
    {
      itemLink: 'link3',
    },
  ],
};

const newFeed = {
  items: [
    {
      itemLink: 'link2',
    },
    {
      itemLink: 'link3',
    },
    {
      itemLink: 'link4',
    },
    {
      itemLink: 'link5',
    },
  ],
};

const expectedDiff = [
  {
    itemLink: 'link4',
  },
  {
    itemLink: 'link5',
  },
];

test('Check feeds difference', (done) => {
  expect(getFeedDiff(oldFeed, newFeed)).toMatchObject(expectedDiff);
  done();
});

test('Get feed data', (done) => {
  getFeedData('https://dtf.ru/rss/all')
    .then(() => {
      done();
    })
    .catch((err) => {
      expect(err).toBe(null);
      done();
    });
});
