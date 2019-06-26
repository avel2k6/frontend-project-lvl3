import { getFeedData } from '../src/feed';

test('Get feed', (done) => {
  getFeedData(
    'https://dtf.ru/rss/all',
    (err) => {
      expect(err).toBe(null);
      done();
    },
  );
});

test('Wrong feed', (done) => {
  getFeedData(
    'https://bad1bad.ru/rss/all',
    (err) => {
      const isError = (err !== null);
      expect(isError).toBe(true);
      done();
    },
  );
});
