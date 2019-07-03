import { watch } from 'melanke-watchjs';
import $ from 'jquery';
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
  $(dom).find('img').removeAttr('height').removeAttr('width')
    .addClass('img-fluid');
  return dom.body.innerHTML;
};

const makeFeedItemsList = (items, source) => items.map((item) => {
  const { itemTitle, itemLink } = item;
  return `
      <div class="d-flex align-items-end flex-column bd-highlight col-sm-3 mb-3" >
        <div class="p-2 w-100">
          <a target='_blank' class='text-dark' href='${itemLink}'>
            ${itemTitle.trim()}
          </a>
        </div>
        <div class="mt-auto p-2 w-100">
          <hr class="my-2">
          <button data-link="${itemLink}" data-source="${source}" data-toggle="modal" data-target="#rssModal" type="button" class="btn btn-secondary btn-details">Подробней</button>
        </div>
      </div>
      `;
})
  .join('');

export default (state) => {
  i18next.init({
    lng: 'ru',
    resources: ruJson,
  });


  const formInput = document.body.querySelector('#rss-input');
  const formSubmit = document.body.querySelector('#rss-submit');
  const formFeedsList = $('#feeds-list > ul');
  const infoBlock = document.body.querySelector('info');

  watch(
    state,
    'formState',
    () => {
      console.log(state.formState);
      switch (state.formState) {
        case 'valid':
          $(formInput).addClass('is-valid').removeClass('is-invalid');
          $(formSubmit).prop('disabled', false);
          break;
        case 'invalid':
          $(formInput).addClass('is-invalid').removeClass('is-valid');
          $(formSubmit).prop('disabled', true);
          break;
        case 'check':
          $(formInput).removeClass('is-invalid').removeClass('is-valid');
          $(formSubmit).prop('disabled', true);
          break;
        default:
          formInput.value = '';
          $(formInput).removeClass('is-invalid is-valid');
          $(formSubmit).prop('disabled', true);
          break;
      }
    },
  );
  watch(
    state,
    'feeds',
    (prop, action, newFeedUrl) => {
      if (newFeedUrl) {
        const spinner = '<li id="search-spinner"><div class="spinner-border" role="status"><span class="sr-only">Loading...</span></div></li>';
        $(spinner).appendTo(formFeedsList);
        setTimeout(() => $('#search-spinner').remove(), 5000);
      }
    },
  );

  watch(
    state,
    'feedsData',
    (prop, action, newData, oldData) => {
      $('#search-spinner').remove();

      if (action === 'push') {
        const {
          title, description, items, source, url,
        } = newData;
        $('<li>', { html: `<b>${title}</b><br>${description}` }).appendTo(formFeedsList);
        $('<div>', { html: `<h2 class="w-100">${title}</h2>` })
          .appendTo('#feeds-content');
        const feedContentId = generateId(url);
        $('<div>', { class: 'row bg-white p-1', 'data-feed-source': `${feedContentId}` })
          .appendTo('#feeds-content');
        const feedItemsList = makeFeedItemsList(items, source);
        $(feedItemsList).appendTo(`[data-feed-source='${feedContentId}']`);
      }

      if (action === 'set') {
        const {
          source, url,
        } = findFeedByData(state, oldData);
        const items = _.difference(newData, oldData);
        const feedContentId = generateId(url);
        const feedItemsList = makeFeedItemsList(items, source);
        $(feedItemsList).prependTo(`[data-feed-source='${feedContentId}']`);
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
      const id = generateId();
      const { messageKey, messageData } = newError;
      const message = i18next.t(messageKey, messageData);
      $(`<div id ='${id}' class='shadow alert alert-danger mt-2'>${message}</div>`).appendTo(infoBlock);
      setTimeout(() => $(`#${id}`).fadeOut(), 7000);
      setTimeout(() => $(`#${id}`).remove(), 8000);
    },
  );

  // console.log(i18next.t('cant_get_feed', {url: 'u2r2l', err: 'ERRRRRRR!'}));

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
      $('.modal-title').text(itemTitle);
      $('.modal-body').html(prettyDescription);
    },
  );
};
