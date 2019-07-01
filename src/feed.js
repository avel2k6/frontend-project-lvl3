import axios from 'axios';

export const getFeedData = url => new Promise((feedResolve, feedReject) => {
  const timeOutTime = 3000;
  const maximumAttempts = 3;
  const tryToGetData = (resolve, reject, attempt = 0) => {
    // https://corsproxy.github.io/ не работает.
    // cors-anywhere.herokuapp.com требует кастомные заголовки, чтобы отсечь левые запросы
    axios({
      method: 'get',
      url: `https://cors-anywhere.herokuapp.com/${url}`,
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
    })
      .then((response) => {
        const { data } = response;
        resolve({ data, url });
      })
      .catch((error) => {
        if (attempt < maximumAttempts) {
          setTimeout(
            () => { tryToGetData(resolve, reject, attempt + 1); },
            timeOutTime,
          );
        } else {
          reject(error);
        }
      });
  };
  tryToGetData(feedResolve, feedReject);
});

export const parseFeedData = (dataFromFeed) => {
  const { data, url } = dataFromFeed;
  const parser = new DOMParser();
  const dom = parser.parseFromString(data, 'application/xml');
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
    url,
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
  const errorTimeOut = 30000;
  const updater = (state, feedUrl) => {
    getFeedData(feedUrl)
      .then((newData) => {
        const newParsedData = parseFeedData(newData);
        const currentState = state;
        const currentData = state.feedsData.find(({ url }) => url === feedUrl);
        const index = state.feedsData.findIndex(({ url }) => url === feedUrl);
        const newItems = getFeedDiff(currentData, newParsedData);
        if (newItems.length > 0) {
          const oldItems = state.feedsData[index].items;
          currentState.feedsData[index].items = [...oldItems, ...newItems];
        }
        setTimeout(() => { updater(state, feedUrl); }, dataTimeOut);
      })
      .catch(() => {
        setTimeout(() => { updater(state, feedUrl); }, errorTimeOut);
      });
  };
  setTimeout(() => { updater(curretState, feedTargetUrl); }, dataTimeOut);
};
