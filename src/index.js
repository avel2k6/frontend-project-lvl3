import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import $ from 'jquery';
import isURL from 'validator/lib/isURL';
import StateMachine from 'javascript-state-machine';
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


const rssForm = new StateMachine({
  init: 'default',
  transitions: [
    { name: 'validate', from: ['invalid', 'valid', 'default'], to: 'valid' },
    { name: 'invalidate', from: ['invalid', 'valid', 'default'], to: 'invalid' },
    { name: 'send', from: 'valid', to: 'default' },
  ],
  methods: {
    onBeforeTransition() {
      appState.formInput = $('#rss-input').val().trim();
    },
    onTransition({ to }) {
      appState.formState = to;
    },
    onSend() {
      appState.feeds.push(appState.formInput);
      const url = appState.formInput;
      feed.getFeedData(url)
        .then((data) => {
          const parsedData = feed.parseFeedData(data);
          if (parsedData.isRss) {
            appState.feedsData.push(parsedData);
            feed.setAutoUpdater(appState, url);
            return;
          }
          appState.errors.push(`${url} не похоже на RSS-фид`);
        })
        .catch((err) => {
          appState.errors.push(`Не удалось получить фид ${url} после нескольких попыток <br>${err}`);
        });

      appState.formState = 'init';
      appState.formInput = '';
    },
  },
});

const listenForm = () => {
  const body = $('body');
  body.on(
    'input',
    '#rss-input',
    (e) => {
      const input = $(e.target).val().trim();
      if (isURL(input) && !appState.feeds.includes(input)) {
        rssForm.validate();
      } else {
        rssForm.invalidate();
      }
    },
  );

  body.on(
    'click',
    '#rss-submit',
    () => {
      if (rssForm.can('send')) {
        rssForm.send();
      }
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
