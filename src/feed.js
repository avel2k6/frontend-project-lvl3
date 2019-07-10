import axios from 'axios';
import { retry } from '@lifeomic/attempt'; // https://github.com/lifeomic/attempt

export const getFeedData = (url) => {
  const axiosOptions = {
    method: 'get',
    url: `https://cors-anywhere.herokuapp.com/${url}`,
    headers: { 'X-Requested-With': 'XMLHttpRequest' },
  };

  const retryOptions = {
    delay: 300,
    maxAttempts: 3,
    initialDelay: 0,
    minDelay: 0,
    maxDelay: 0,
    factor: 0,
    timeout: 0,
    jitter: false,
    handleError: null,
    handleTimeout: null,
    beforeAttempt: null,
    calculateDelay: null,
  };

  return retry(() => axios(axiosOptions), retryOptions);
};

export const parseFeedData = (dataFromFeed) => {
  const parser = new DOMParser();
  const dom = parser.parseFromString(dataFromFeed, 'application/xml');
  const rssTag = dom.querySelector('rss');
  if (!rssTag) { return { isRss: false }; }

  const title = dom.querySelector('channel > title');
  const link = dom.querySelector('channel > link');
  const description = dom.querySelector('channel > description');
  const feddItems = dom.querySelectorAll('item');
  const items = [...feddItems].map(
    (item) => {
      const itemTitle = item.querySelector('title');
      const itemLink = item.querySelector('link');
      const itemDescription = item.querySelector('description');
      return {
        itemTitle: itemTitle.textContent,
        itemDescription: itemDescription.textContent,
        itemLink: itemLink.textContent,
      };
    },
  );
  return {
    title: title.textContent,
    description: description.textContent,
    source: link.textContent,
    items,
    isRss: true,
  };
};

export const getFeedDiff = (oldFeed, newFeed) => {
  const { items: oldItems } = oldFeed;
  const { items: newItems } = newFeed;
  return newItems.reduce(
    (acc, newItem) => (oldItems
      .find(({ itemLink }) => itemLink === newItem.itemLink)
      ? [...acc]
      : [...acc, newItem]),
    [],
  );
};

export const setAutoUpdater = (curretState, feedTargetUrl) => {
  const dataTimeOut = 5000;
  // const errorTimeOut = 30000;
  const updater = (state, feedUrl) => {
    getFeedData(feedUrl)
      .then((newData) => {
        const newParsedData = parseFeedData(newData.data);
        const currentState = state;
        const currentData = state.feedsData.find(({ url }) => url === feedUrl);
        const index = state.feedsData.findIndex(({ url }) => url === feedUrl);
        const newItems = getFeedDiff(currentData, newParsedData);
        if (newItems.length > 0) {
          const oldItems = state.feedsData[index].items;
          currentState.feedsData[index].items = [...oldItems, ...newItems];
        }
      })
      .finally(() => {
        setTimeout(() => { updater(state, feedUrl); }, dataTimeOut);
      });
  };
  setTimeout(() => { updater(curretState, feedTargetUrl); }, dataTimeOut);
};
