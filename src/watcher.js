import { watch } from 'melanke-watchjs';
import _ from 'lodash';
import md5 from 'md5';
import i18next from 'i18next';
import ruJson from '../assets/i18/ru.json';

const generateId = string => ((string)
  ? md5(string).substr(0, 8)
  : _.uniqueId('uniq_'));

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

const makeFeedItemsCollection = (items, itemSource, formCurrentState) => items.map(
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
          <button data-link="${itemLink}" data-source="${itemSource}" data-toggle="modal" data-target="#rssModal" type="button" class="btn btn-secondary btn-details">Подробней</button>
        </div>
      `;
    itemDiv.querySelector('[data-link]').addEventListener(
      'click',
      (e) => {
        const { target } = e;
        const { link, source } = target.dataset;
        const state = formCurrentState;
        state.previewData = { link, source };
      },
    );
    return itemDiv;
  },
)
  .reverse();

export default (state) => {
  i18next.init({
    lng: 'ru',
    resources: ruJson,
  });

  const formInput = document.querySelector('#rss-input');
  const formSubmit = document.querySelector('#rss-submit');
  const formFeedsList = document.querySelector('#feeds-list > ul');
  const infoBlock = document.querySelector('info');
  const spinner = document.querySelector('#search-spinner');

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
        case 'default':
          formInput.value = '';
          formInput.classList.remove('is-valid', 'is-invalid');
          formSubmit.setAttribute('disabled', true);
          spinner.classList.add('d-none');
          break;
        default:
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

        const allFeedsContent = document.querySelector('#feeds-content');
        const feedHeader = document.createElement('div');
        feedHeader.innerHTML = `<h2 class="w-100">${title}</h2>`;
        allFeedsContent.append(feedHeader);

        const feedContentId = generateId(url);

        const currentFeedContent = document.createElement('div');
        currentFeedContent.classList.add('row', 'bg-white');
        currentFeedContent.setAttribute('data-feed-source', feedContentId);
        allFeedsContent.append(currentFeedContent);

        const feedItemsList = makeFeedItemsCollection(items, source, state);
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
        const feedItemsList = makeFeedItemsCollection(items, source, state);
        const currentFeedContent = document.querySelector(`[data-feed-source='${feedContentId}']`);
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
      const modalTitle = document.querySelector('.modal-title');
      modalTitle.innerHTML = itemTitle;
      const modalBody = document.querySelector('.modal-body');
      modalBody.innerHTML = prettyDescription;
    },
  );
};
