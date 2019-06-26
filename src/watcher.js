import { watch } from 'melanke-watchjs';
import $ from 'jquery';

export default (state) => {
  const formInput = document.body.querySelector('#rss-input');
  const formSubmit = document.body.querySelector('#rss-submit');
  const formFeedsList = document.body.querySelector('#feeds-list > ul');
  const formFeedsContent = document.body.querySelector('#feeds-content');
  const infoBlock = document.body.querySelector('info');

  watch(
    state,
    'formState',
    () => {
      const li = document.createElement('li');
      li.innerHTML = 'Ищу данные нового фида...';
      switch (state.formState) {
        case 'valid':
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
          formFeedsList.append(li);
          setTimeout(() => formFeedsList.removeChild(li), 5000);
          break;
      }
    },
  );

  watch(
    state,
    'feedsData',
    (prop, action, newFeed) => {
      const title = newFeed.querySelector('channel > title');
      const description = newFeed.querySelector('channel > description');
      const feddItems = newFeed.querySelectorAll('item');

      const li = document.createElement('li');
      li.innerHTML = `<b>${title.innerHTML}</b><br>${description.innerHTML}`;
      formFeedsList.append(li);

      const contentDiv = document.createElement('div');
      contentDiv.classList.add('row');
      feddItems.forEach((item) => {
        const itemTitle = item.querySelector('title');
        const itemLink = item.querySelector('link');
        const itemDiv = document.createElement('div');
        const innerDiv = document.createElement('div');
        itemDiv.classList.add('col-sm-4', 'p-1');
        innerDiv.classList.add('bg-white', 'col-sm', 'rounded', 'h-100');
        innerDiv.innerHTML = `<a target='_blank' href='${itemLink.textContent}'>${itemTitle.textContent.trim()}</a>`;
        itemDiv.append(innerDiv);
        contentDiv.append(itemDiv);
      });
      const headerDiv = document.createElement('div');
      headerDiv.classList.add('col-sm-4');
      headerDiv.innerHTML = `<h2>${title.innerHTML}</h2>`;
      formFeedsContent.append(headerDiv);
      formFeedsContent.append(contentDiv);
    },
  );

  watch(
    state,
    'errors',
    (prop, action, newError) => {
      const div = document.createElement('div');
      div.classList.add('alert', 'alert-danger');
      div.innerHTML = newError;
      infoBlock.append(div);
      setTimeout(() => infoBlock.removeChild(div), 8000);
    },
  );
};
