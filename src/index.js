import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import isURL from 'validator/lib/isURL';
import watcher from './watcher';
import * as feed from './feed';

const appState = {
  formState: 'init',
  formInput: '',
  errors: [],
  feeds: [],
  feedsData: [],
};

const formStates = new Map([
  [
    'init', () => {},
  ],
  [
    'valid', () => {
      appState.feeds.push(appState.formInput);
      feed.getFeedData(
        appState.formInput,
        (err, data) => {
          if (err) {
            appState.errors.push(err);
            return;
          }
          const parsedData = feed.parseFeedData(data);
          if (parsedData) {
            appState.feedsData.push(parsedData);
            return;
          }
          appState.errors.push(`${appState.formInput} не похоже на RSS-фид`);
        },
      );
      appState.formState = 'init';
      appState.formInput = '';
    },
  ],
  [
    'invalid', () => {
      appState.errors.push(`Непривильный или уже добавленный URL : "${appState.formInput}"`);
    },
  ],
]);


const listenForm = () => {
  const rssFormInput = document.body.querySelector('#rss-input');
  rssFormInput.addEventListener(
    'input',
    (e) => {
      const input = e.target.value.trim();
      if (isURL(input) && !appState.feeds.includes(input)) {
        appState.formState = 'valid';
      } else {
        appState.formState = 'invalid';
      }
      appState.formInput = input;
    },
  );

  const rssFormSubmit = document.body.querySelector('#rss-submit');
  rssFormSubmit.addEventListener(
    'click',
    (e) => {
      const formExec = formStates.get(appState.formState);
      formExec();
      e.preventDefault();
    },
  );
};

listenForm();
watcher(appState);
