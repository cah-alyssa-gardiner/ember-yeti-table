import AddonDocsRouter, { docsRoute } from 'ember-cli-addon-docs/router';
import config from './config/environment';

const Router = AddonDocsRouter.extend({
  location: config.locationType,
  rootURL: config.rootURL
});

Router.map(function() {
  docsRoute(this, function() {
    this.route('quickstart');
    this.route('why-yeti-table');
    this.route('general');
    this.route('sorting');
    this.route('filtering');
    this.route('pagination');
    this.route('async');
    this.route('legacy-usage');

    this.route('api', function() { // autogenerated API homepage (required)
      this.route('item', { path: '/*path' }); // autogenerated API subpages (required)
    });
  });

  this.route('not-found', { path: '/*path' });
});

export default Router;
