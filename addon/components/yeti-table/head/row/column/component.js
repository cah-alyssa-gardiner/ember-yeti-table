import Component from '@ember/component';
import { assert } from '@ember/debug';
import { isArray } from '@ember/array';
import { htmlSafe } from '@ember/template';
import DidChangeAttrsComponent from 'ember-yeti-table/-private/utils/did-change-attrs-component';

import { computed, action } from '@ember-decorators/object';
import { equal, or } from '@ember-decorators/object/computed';
import { tagName } from '@ember-decorators/component';
import { argument } from '@ember-decorators/argument';
import { optional, unionOf, arrayOf } from '@ember-decorators/argument/types';
import { Action } from '@ember-decorators/argument/types';

import Hammer from 'hammerjs';

import layout from './template';

/**
  An important component yielded from the header or head.row component that is used to define
  a column of the table.

  ```hbs
  <table.header as |header|>
    <header.column @prop="firstName" as |column|>
      First name
      {{if column.isAscSorted "(sorted asc)"}}
      {{if column.isDescSorted "(sorted desc)"}}
    </header.column>
  </table.header>
  ```

  ```hbs
  <table.head as |head|>
    <head.row as |row|>
      <row.column @prop="firstName" as |column|>
        First name
        {{if column.isAscSorted "(sorted asc)"}}
        {{if column.isDescSorted "(sorted desc)"}}
      </row.column>
    </head.row>
  </table.head>
  ```

  @yield {object} column
  @yield {boolean} column.isSorted - `true` if column is sorted ascending or descending
  @yield {boolean} column.isAscSorted - `true` if column is sorted ascending
  @yield {boolean} column.isDescSorted - `true` if column is sorted descending
*/
@tagName('')
class Column extends DidChangeAttrsComponent {
  layout = layout;

  @argument(optional('object'))
  theme;

  @argument(Component)
  parent;

  /**
   * An important argument that Yeti Table uses to tiw this column to a certain property on
   * each row object of the original `@data` (or `@loadFunction`) that was passed in.
   *
   * This is the argument that allows Yeti Table to keep itself up to date when the original
   * data changes.
   *
   * If you don't need sorting, filtering or automatic table unrolling (using the blockless
   * body component), then this property is optional.
   */
  @argument(optional('string'))
  prop;

  /**
   * Set to `false` to hide the entire column across all rows. Keep in mind that this property
   * won't just hide the column using css. The DOM for the column will be removed. Defaults to `true`.
   */
  @argument('boolean')
  visible = true;

  /**
   * Used to turn off sorting clicking on this column (clicks won't toggle sorting anymore).
   * Useful on avatar columns, for example, where a sorting order doesn't really make sense.
   * Defaults to the `<YetiTable>` `@sortable` argument (which in turn defaults to `true`).
   */
  @argument('boolean')
  sortable = true;

  /**
   * Optionally use an `asc` or `desc` string on this argument to turn on ascending or descending sorting
   * on this column. Useful to turn on default sortings on the table.
   */
  @argument(optional('string'))
  sort = null;

  /**
   * Use `@sortSequence` to customize the sequence in which the sorting order will cycle when
   * clicking on this column header. You can either pass in a comma-separated string or an array
   * of strings. Accepted values are `'asc'`, `'desc'` and `'unsorted'`. The default value is `['asc', 'desc']`
   * or whatever the global table sortSequence value is.
   */
  @argument(unionOf('string', arrayOf('string')))
  sortSequence;

  /**
   * Used to turn on resizing on this column.
   * Defaults to the `<YetiTable>` `@resizable` argument (which in turn defaults to `false`).
   */
  @argument('boolean')
  resizable = true;

  /**
   * Used to turn off filtering for this column. When `false`, Yeti Table won't look for
   * values on this column. Defaults to `true`.
   */
  @argument('boolean')
  filterable = true;

  /**
   * The column filter. If passed in, Yeti Table will search this column for rows that contain this
   * string and show those rows.
   *
   * The column definitions `@filter` argument is subtractive, meaning that it will filter out rows
   * from the subset that passes the general `@filter`.
   */
  @argument(optional('string'))
  filter;

  /**
   * An optional function to customize the filtering logic *on this column*. This function should return true
   * or false to either include or exclude the row on the resulting set. If this function depends
   * on a value, pass that value as the `@filterUsing` argument.
   *
   * This function will be called with two arguments:
   * - `value` - the current data cell to use for filtering
   * - `filterUsing` - the value you passed in as `@filterUsing`
   */
  @argument(optional(Function))
  filterFunction;

  /**
   * If you `@filterFunction` function depends on a different value (other that `@filter`)
   * to show, pass it in this argument. Yeti Table uses this argument to know when to recalculate
   * the fitlered rows.
   */
  @argument(optional('any'))
  filterUsing;

  /**
   * Used to add a class to all the cells in this column.
   */
  @argument(optional('string'))
  columnClass;

  @argument(Action)
  onClick;

  @equal('sort', 'asc') isAscSorted;

  @equal('sort', 'desc') isDescSorted;

  @or('isAscSorted', 'isDescSorted') isSorted;

  @computed('sortSequence')
  get normalizedSortSequence() {
    let sortSequence = this.get('sortSequence');
    assert('@sortSequence must be either a comma-separated string or an array. Got `${sortSequence}.`', isArray(sortSequence) || typeof sortSequence === 'string');

    if (isArray(sortSequence)) {
      return sortSequence;
    } else if (typeof sortSequence === 'string') {
      return sortSequence.split(',').map((s) => s.trim());
    } else {
      return [];
    }
  }

  @computed('width')
  get columnStyle() {
    let styles = ['position: relative;'];
    let width = this.get('width');
    if (width) {
      styles.push(`width: ${width}px;`);
    }
    return htmlSafe(styles.join(''));
  }

  init() {
    super.init(...arguments);

    this.didChangeAttrsConfig = {
      attrs: ['filter', 'filterUsing', 'sort']
    };

    if (this.get('parent')) {
      this.get('parent').registerColumn(this);
    }
  }

  didChangeAttrs() {
    this.get('parent').runLoadData();
  }

  willDestroyElement() {
    super.willDestroyElement(...arguments);
    if (this.get('parent')) {
      this.get('parent').unregisterColumn(this);
    }
  }

  @action
  registerTh(element) {
    this._thElement = element;
  }

  @action
  unregisterTh() {
    this._thElement = null;
  }

  @action
  initHammer(element) {
    let hammer = new Hammer(element);

    hammer.add(new Hammer.Press({ time: 0 }));

    hammer.on('press', this.pressHandler);
    hammer.on('panstart', this.panStartHandler);
    hammer.on('panmove', this.panMoveHandler);
    hammer.on('panend', this.panEndHandler);

    this._hammer = hammer;
  }

  @action
  teardownHammer() {
    let hammer = this._hammer;

    hammer.off('press');
    hammer.off('panstart');
    hammer.off('panmove');
    hammer.off('panend');

    hammer.destroy();
  }

  pressHandler = event => {
    let [{ clientX }] = event.pointers;
    this._originalClientX = clientX;
    this._originalWidth = this._thElement.offsetWidth;
  };

  panStartHandler = () => {
    this.set('isResizing', true);
  };

  panMoveHandler = event => {
    let [{ clientX }] = event.pointers;

    let delta = clientX - this._originalClientX;
    console.log(delta, this._originalWidth + delta);
    this.set('width', this._originalWidth + delta)
  };

  panEndHandler = () => {
    this.set('isResizing', false);
  };
}

export default Column;
