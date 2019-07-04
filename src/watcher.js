import { watch } from 'melanke-watchjs';
import _ from 'lodash';
import md5 from 'md5';
import i18next from 'i18next';
import ruJson from '../assets/i18/ru.json';

const generateId = string => ((string)
  ? md5(string).substr(0, 8)
  : `f${(+new Date()).toString(16)}`);

const findFeedByData = (state, data) => state.feedsData.find(({ items }) => items[0] === data[0]);

const prettyHTML = (string) => {
  const parser = new DOMParser();
  const dom = parser.parseFromString(string, 'text/html');

  const images = dom.querySelectorAll('img');
  images.forEach((image) => {
    image.removeAttribute('height');
    image.removeAttribute('width');
    image.classList.add('img-fluid');
  });
  return dom.body.innerHTML;
};

const makeFeedItemsCollection = (items, source) => items.map(
  (item) => {
    const { itemTitle, itemLink } = item;
    const itemDiv = document.createElement('div');
    itemDiv.classList.add('d-flex', 'align-items-end', 'flex-column', 'col-sm-3', 'mb-3');
    itemDiv.innerHTML = `<div class="p-2 w-100">
          <a target='_blank' class='text-dark' href='${itemLink}'>
            ${itemTitle.trim()}
          </a>
        </div>
        <div class="mt-auto p-2 w-100">
          <hr class="my-2">
          <button data-link="${itemLink}" data-source="${source}" data-toggle="modal" data-target="#rssModal" type="button" class="btn btn-secondary btn-details">Подробней</button>
        </div>
      `;
    return itemDiv;
  },
)
  .reverse();

export default (state) => {
  i18next.init({
    lng: 'ru',
    resources: ruJson,
  });

  const formInput = document.body.querySelector('#rss-input');
  const formSubmit = document.body.querySelector('#rss-submit');
  const formFeedsList = document.body.querySelector('#feeds-list > ul');
  const infoBlock = document.body.querySelector('info');
  const spinner = document.body.querySelector('#search-spinner');

  watch(
    state,
    'formState',
    () => {
      switch (state.formState) {
        case 'valid':
          formInput.classList.add('is-valid');
          formInput.classList.remove('is-invalid');
          formSubmit.removeAttribute('disabled');
          break;
        case 'invalid':
          formInput.classList.add('is-invalid');
          formInput.classList.remove('is-valid');
          formSubmit.setAttribute('disabled', true);
          spinner.classList.add('d-none');
          break;
        case 'check':
          formInput.classList.remove('is-valid', 'is-invalid');
          formSubmit.setAttribute('disabled', true);
          spinner.classList.remove('d-none');
          break;
        default:
          formInput.value = '';
          formInput.classList.remove('is-valid', 'is-invalid');
          formSubmit.setAttribute('disabled', true);
          spinner.classList.add('d-none');
          break;
      }
    },
  );

  watch(
    state,
    'feedsData',
    (prop, action, newData, oldData) => {
      if (action === 'push') {
        const {
          title, description, items, source, url,
        } = newData;

        const newListElement = document.createElement('li');
        newListElement.innerHTML = `<b>${title}</b><br>${description}`;
        formFeedsList.append(newListElement);

        const allFeedsContent = document.body.querySelector('#feeds-content');
        const feedHeader = document.createElement('div');
        feedHeader.innerHTML = `<h2 class="w-100">${title}</h2>`;
        allFeedsContent.append(feedHeader);

        const feedContentId = generateId(url);

        const currentFeedContent = document.createElement('div');
        currentFeedContent.classList.add('row', 'bg-white');
        currentFeedContent.setAttribute('data-feed-source', feedContentId);
        allFeedsContent.append(currentFeedContent);

        const feedItemsList = makeFeedItemsCollection(items, source);
        feedItemsList.forEach(
          feedItem => currentFeedContent.prepend(feedItem),
        );
      }

      if (action === 'set') {
        const {
          source, url,
        } = findFeedByData(state, oldData);
        const items = _.difference(newData, oldData);
        const feedContentId = generateId(url);
        const feedItemsList = makeFeedItemsCollection(items, source);
        const currentFeedContent = document.body.querySelector(`[data-feed-source='${feedContentId}']`);
        feedItemsList.forEach(
          feedItem => currentFeedContent.prepend(feedItem),
        );
      }
    },
  );

  watch(
    state,
    'errors',
    (prop, action, newError) => {
      if (state.errors.length === 0) {
        return;
      }
      const { messageKey, messageData } = newError;
      const message = i18next.t(messageKey, messageData);
      const messageDiv = document.createElement('div');
      messageDiv.classList.add('shadow', 'alert', 'alert-danger', 'mt-2');
      messageDiv.innerHTML = message;
      infoBlock.append(messageDiv);
      setTimeout(
        () => infoBlock.removeChild(messageDiv),
        7000,
      );
    },
  );

  watch(
    state,
    'previewData',
    (prop, action, newData) => {
      const { link: detailsLink, source: detailsSource } = newData;
      const { feedsData } = state;
      const { itemTitle, itemDescription } = feedsData
        .find(({ source }) => source === detailsSource)
        .items
        .find(({ itemLink }) => itemLink === detailsLink);
      // console.dir(itemTitle, itemDescription);
      const prettyDescription = prettyHTML(itemDescription);
      const modalTitle = document.body.querySelector('.modal-title');
      modalTitle.innerHTML = itemTitle;
      const modalBody = document.body.querySelector('.modal-body');
      modalBody.innerHTML = prettyDescription;
    },
  );
};
