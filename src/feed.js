import axios from 'axios';

export const getFeedData = (url, callback, attempt = 0) => {
  // https://corsproxy.github.io/ не работает.
  // cors-anywhere.herokuapp.com требует кастомные заголовки, чтобы отсечь левые запросы
  axios({
    method: 'get',
    url: `https://cors-anywhere.herokuapp.com/${url}`,
    headers: { 'X-Requested-With': 'XMLHttpRequest' },
  })
    .then((response) => {
      const { data } = response;
      callback(null, { data, url });
    })
    .catch((error) => {
      if (attempt < 2) {
        callback('Не удалось получить фид, пробую еще раз...');
        setTimeout(
          () => { getFeedData(url, callback, attempt + 1); },
          3000,
        );
      } else {
        callback(`Не удалось получть фид по адресу ${url}, я сдаюсь<br> ${error}`);
      }
    });
};

export const parseFeedData = (dataFromFeed) => {
  const { data, url } = dataFromFeed;

  const parser = new DOMParser();
  const dom = parser.parseFromString(data, 'application/xml');

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

export const updateFeedData = (state, feedUrl, callback) => {
  const currentState = state; // Перепиать в коллбек
  const currentData = state.feedsData.find(({ url }) => url === feedUrl);
  const index = state.feedsData.findIndex(({ url }) => url === feedUrl);
  getFeedData(
    currentData.url,
    (err, data) => {
      if (err) {
        callback(err);
        return;
      }
      const newData = parseFeedData(data);
      const newItems = getFeedDiff(currentData, newData);
      if (newItems.length > 0) {
        console.log(newItems);
        const oldItems = state.feedsData[index].items;
        currentState.feedsData[index].items = [...oldItems, ...newItems];
      }
      callback(null, data);
    },
  );
};

// export const updateFeedData2 = (currentData, index, state, callback) => {
//   getFeedData(
//     currentData.url,
//     (err, data) => {
//       if (err) {
//         callback(err);
//         return;
//       }
//       const newData = parseFeedData(data);
//       const newItems = getFeedDiff(currentData, newData);
//       if (newItems.length > 0) {
//         console.log(newItems);
//         const oldItems = state.feedsData[index].items;
//         state.feedsData[index].items = [...oldItems, ...newItems];
//       }
//       callback(null,data);
//     },
//   );
// };
