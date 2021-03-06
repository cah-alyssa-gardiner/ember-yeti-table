import { tagName, layout } from '@ember-decorators/component';
import Component from '@ember/component';
import { deprecate } from '@ember/debug';

import template from './template';

/**
  Renders a `<thead>` element and yields the row component.

  ```hbs
  <table.thead as |head|>
    <head.row as |row|>
      <row.column @prop="firstName" as |column|>
        First name
        {{if column.isAscSorted "(sorted asc)"}}
        {{if column.isDescSorted "(sorted desc)"}}
      </head.column>
    </head.row>
  </table.thead>
  ```

  @yield {object} head
  @yield {Component} head.row
*/
@tagName('')
@layout(template)
class THead extends Component {
  theme;

  sortable;

  sortSequence;

  parent;

  columns;

  onColumnClick;

  /**
   * Used by the old head yield to indicate deprecation
   */
  shouldDeprecate;

  init() {
    super.init(...arguments);

    deprecate('The yielded `head` component has been deprecated. Please use `thead` instead.', !this.shouldDeprecate, {
      id: 'ember-yet-table:Head-component',
      until: '2.0.0'
    });
  }
}

export default THead;
