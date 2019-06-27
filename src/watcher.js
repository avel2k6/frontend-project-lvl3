import { watch } from 'melanke-watchjs';
import $ from 'jquery';

const generateId = () => `f${(+new Date()).toString(16)}`;

const prettyHTML = (string) => {
  const parser = new DOMParser();
  const dom = parser.parseFromString(string, 'text/html');
  $(dom).find('img').removeAttr('height').removeAttr('width')
    .addClass('img-fluid');
  console.log(dom);
  return dom.body.innerHTML;
};

export default (state) => {
  const formInput = document.body.querySelector('#rss-input');
  const formSubmit = document.body.querySelector('#rss-submit');
  const formFeedsList = $('#feeds-list > ul');
  const formFeedsContent = $('#feeds-content');
  const infoBlock = document.body.querySelector('info');

  watch(
    state,
    'formState',
    () => {
      switch (state.formState) {
        case 'valid':
          console.log('valid');
          $(formInput).addClass('is-valid').removeClass('is-invalid');
          $(formSubmit).prop('disabled', false);
          break;
        case 'invalid':
          $(formInput).addClass('is-invalid').removeClass('is-valid');
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
    (prop, action, newFeed) => {
      $('#search-spinner').remove();
      const {
        title, description, items, source,
      } = newFeed;
      $('<li>', { html: `<b>${title}</b><br>${description}` }).appendTo(formFeedsList);

      const contentDiv = document.createElement('div');
      contentDiv.classList.add('row');
      const headerDiv = document.createElement('div');
      headerDiv.classList.add('col-sm-12');
      headerDiv.innerHTML = `<h2>${title}</h2>`;
      contentDiv.append(headerDiv);
      items.forEach(
        (item, index) => {
          const { itemTitle, itemLink } = item;
          const itemDiv = document.createElement('div');
          itemDiv.classList.add('col-sm-4', 'p-2');

          const innerDiv = document.createElement('div');
          innerDiv.classList.add('bg-white', 'col-sm', 'rounded', 'h-100', 'p-2', 'row');
          innerDiv.innerHTML += `<div class="col-12 align-self-start"'><a target='_blank' class='text-dark' href='${itemLink}'>${itemTitle.trim()}</a></div>`;
          innerDiv.innerHTML += `<div class="col-12 align-self-end"><hr class="my-2"><button data-index="${index}" data-source="${source}" data-toggle="modal" data-target="#rssModal" type="button" class="btn btn-secondary btn-details">Подробней</button><div>`;

          itemDiv.append(innerDiv);

          contentDiv.append(itemDiv);
        },
      );
      $(contentDiv).appendTo(formFeedsContent);
    },
  );

  watch(
    state,
    'errors',
    (prop, action, newError) => {
      // const div = document.createElement('div');
      // div.classList.add('alert', 'alert-danger');
      // div.innerHTML = newError;
      // infoBlock.append(div);
      const id = generateId();
      $(`<div id ='${id}' class='alert alert-danger'>${newError}</div>`).appendTo(infoBlock);
      setTimeout(() => $(`#${id}`).fadeOut(), 7000);
      setTimeout(() => $(`#${id}`).remove(), 8000);
    },
  );

  watch(
    state,
    'previewData',
    (prop, action, newData) => {
      const { index: detailsIndex, source: detailsSource } = newData;
      const { feedsData } = state;
      const { itemTitle, itemDescription } = feedsData
        .find(({ source }) => source === detailsSource)
        .items[detailsIndex];
      // console.dir(itemTitle, itemDescription);
      const prettyDescription = prettyHTML(itemDescription);
      $('.modal-title').text(itemTitle);
      $('.modal-body').html(prettyDescription);
    },
  );
};
