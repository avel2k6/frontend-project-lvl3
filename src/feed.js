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
      callback(null, data);
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

export const parseFeedData = (data) => {
  const parser = new DOMParser();
  const dom = parser.parseFromString(data, 'application/xml');
  if (!dom.querySelector('rss')) {
    return null;
  }
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
  };
};
