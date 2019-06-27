import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import $ from 'jquery';
import isURL from 'validator/lib/isURL';
import watcher from './watcher';
import * as feed from './feed';

const appState = {
  formState: 'init',
  formInput: '',
  errors: [],
  feeds: [],
  feedsData: [],
  previewData: null,
};

const executeState = (statesCollection, executedState) => {
  const stateExec = statesCollection.get(executedState);
  stateExec();
};

const formStates = new Map([
  [
    'init', () => {},
  ],
  [
    'valid', () => {
      appState.feeds.push(appState.formInput);
      appState.formState = 'send';
      executeState(formStates, appState.formState);
    },
  ],
  [
    'invalid', () => {
      appState.errors.push(`Непривильный или уже добавленный URL : "${appState.formInput}"`);
    },
  ],
  [
    'send', () => {
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
]);


const listenForm = () => {
  const body = $('body');
  body.on(
    'input',
    '#rss-input',
    (e) => {
      const input = $(e.target).val().trim();
      if (isURL(input) && !appState.feeds.includes(input)) {
        appState.formState = 'valid';
      } else {
        appState.formState = 'invalid';
      }
      appState.formInput = input;
    },
  );

  body.on(
    'click',
    '#rss-submit',
    () => {
      executeState(formStates, appState.formState);
      // const formExec = formStates.get(appState.formState);
      // formExec();
      return false;
    },
  );

  body.on(
    'click',
    '.btn-details',
    (e) => {
      const button = $(e.target);
      appState.previewData = button.data();
    },
  );
};

listenForm();
watcher(appState);
