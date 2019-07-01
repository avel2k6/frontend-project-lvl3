import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import $ from 'jquery';
import isURL from 'validator/lib/isURL';
import StateMachine from 'javascript-state-machine';
import modifyForm from './watcher';
import * as feed from './feed';

const appState = {
  formState: 'init',
  formInput: '',
  errors: [],
  feeds: [],
  feedsData: [],
  previewData: null,
};

const controlForm = (formCurrentState) => {
  const state = formCurrentState;
  const rssForm = new StateMachine({
    init: 'default',
    transitions: [
      { name: 'validate', from: ['invalid', 'valid', 'default'], to: 'valid' },
      { name: 'invalidate', from: ['invalid', 'valid', 'default'], to: 'invalid' },
      { name: 'send', from: 'valid', to: 'default' },
    ],
    methods: {
      onBeforeTransition() {
        state.formInput = $('#rss-input').val().trim();
      },
      onTransition({ to }) {
        state.formState = to;
      },
      onSend() {
        state.feeds.push(appState.formInput);
        const url = state.formInput;
        feed.getFeedData(url)
          .then((data) => {
            const parsedData = feed.parseFeedData(data);
            if (parsedData.isRss) {
              state.feedsData.push(parsedData);
              feed.setAutoUpdater(state, url);
              return;
            }
            state.errors.push(`${url} не похоже на RSS-фид`);
          })
          .catch((err) => {
            state.errors.push(`Не удалось получить фид ${url} после нескольких попыток <br>${err}`);
          });

        state.formState = 'init';
        state.formInput = '';
      },
    },
  });

  const body = $('body');
  body.on(
    'input',
    '#rss-input',
    (e) => {
      const input = $(e.target).val().trim();
      if (isURL(input) && !state.feeds.includes(input)) {
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
      state.previewData = button.data();
    },
  );
};

controlForm(appState);
modifyForm(appState);
