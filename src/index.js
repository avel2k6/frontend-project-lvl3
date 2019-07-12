import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import isURL from 'validator/lib/isURL';
import StateMachine from 'javascript-state-machine';
import modifyForm from './watcher';
import * as feed from './feed';

const app = () => {
  const appState = {
    formState: 'initial',
    formInput: '',
    errors: [],
    feeds: [],
    feedsData: [],
    previewData: null,
  };

  const controlForm = (formCurrentState) => {
    const state = formCurrentState;
    const rssForm = new StateMachine({
      init: 'initial',
      transitions: [
        { name: 'validate', from: ['invalid', 'valid', 'initial'], to: 'valid' },
        { name: 'invalidate', from: ['invalid', 'valid', 'initial'], to: 'invalid' },
        { name: 'send', from: 'valid', to: 'check' },
        { name: 'reset', from: 'check', to: 'initial' },
        { name: 'reject', from: 'check', to: 'invalid' },
      ],
      methods: {
        onBeforeTransition() {
          state.formInput = document.querySelector('#rss-input').value.trim();
        },
        onTransition({ to }) {
          state.formState = to;
        },
        onInvalidate() {
          if (state.feeds.includes(state.formInput)) {
            state.errors.push({ messageKey: 'has_already', messageData: { url: state.formInput } });
          }
        },
        onSend() {
          return (formInputData) => {
            const formData = new FormData(formInputData);
            const url = formData.get('rss-url').trim();
            state.feeds.push(url);
            feed.getFeedData(url)
              .then((data) => {
                const parsedData = feed.parseFeedData(data.data);
                if (parsedData.isRss) {
                  state.feedsData.push({ url, ...parsedData });
                  state.errors = [];
                  rssForm.reset();
                  feed.setAutoUpdater(state, url);
                  return;
                }
                state.errors.push({ messageKey: 'is_not_rss', messageData: { url } });
                rssForm.reject();
              })
              .catch((err) => {
                state.errors.push({ messageKey: 'cant_get_feed', messageData: { url, err } });
                rssForm.reject();
              });
          };
        },
      },
    });

    const formInput = document.querySelector('#rss-input');
    formInput.addEventListener(
      'input',
      (e) => {
        const input = e.target.value.trim();
        if (isURL(input) && !state.feeds.includes(input)) {
          rssForm.validate();
        } else {
          rssForm.invalidate();
        }
      },
    );

    const formSubmitButton = document.querySelector('#rss-form');
    formSubmitButton.addEventListener(
      'submit',
      (e) => {
        e.preventDefault();
        if (rssForm.can('send')) {
          rssForm.send()(e.target);
        }
      },
    );
  };

  controlForm(appState);
  modifyForm(appState);
};

app();
