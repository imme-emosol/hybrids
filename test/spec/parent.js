import { test } from '../helpers';
import define from '../../src/define';
import parent from '../../src/parent';

describe('parent:', () => {
  const parentHybrids = {
    customProperty: 'value',
  };

  define('test-parent-parent', parentHybrids);

  define('test-parent-child', {
    parent: parent(parentHybrids),
    computed: {
      get: host => `${host.parent.customProperty} other value`,
    },
  });

  define('test-parent-child-fn', {
    parent: parent(hybrids => hybrids === parentHybrids),
  });

  const directParentTree = test(`
    <test-parent-parent>
      <test-parent-child></test-parent-child>
      <test-parent-child></test-parent-child>
    </test-parent-parent>
  `);

  const indirectParentTree = test(`
    <test-parent-parent>
      <div>
        <test-parent-child></test-parent-child>
      </div>
    </test-parent-parent>
  `);

  const shadowParentTree = test('<test-parent-parent></test-parent-parent>');
  const noParentTree = test('<test-parent-child></test-parent-child>');

  const fnParentTree = test(`
    <test-parent-parent>
      <test-parent-child-fn></test-parent-child-fn>
    </test-parent-parent>
  `);

  it('connects with direct parent element', () => directParentTree((el) => {
    const child = el.children[0];
    expect(child.parent).toBe(el);
  }));

  it('disconnects from parent element', done => directParentTree((el) => {
    const child = el.children[0];
    expect(child.parent).toBe(el);

    const fragment = document.createDocumentFragment();
    fragment.appendChild(child);

    return Promise.resolve().then(() => {
      expect(child.parent).toBe(null);
      done();
    });
  }));

  it('connects to indirect parent element', () => indirectParentTree((el) => {
    const child = el.children[0].children[0];
    expect(child.parent).toBe(el);
  }));

  it('connects to out of the shadow parent element', () => shadowParentTree((el) => {
    const shadowRoot = el.attachShadow({ mode: 'open' });
    const child = document.createElement('test-parent-child');
    const wrapper = document.createElement('div');
    wrapper.appendChild(child);

    shadowRoot.appendChild(wrapper);
    expect(child.parent).toBe(el);
  }));

  it('connects to parent by a function argument', () => fnParentTree((el) => {
    const child = el.children[0];
    expect(child.parent).toBe(el);
  }));

  it('returns null for no parent', () => noParentTree((el) => {
    expect(el.parent).toBe(null);
  }));

  it('updates child computed property', done => directParentTree((el) => {
    Promise.resolve().then(() => {
      const spy = jasmine.createSpy('event callback');
      const child = el.children[0];

      expect(el.customProperty).toBe('value');
      expect(child.computed).toBe('value other value');

      child.addEventListener('@invalidate', spy);

      el.customProperty = 'new value';

      Promise.resolve().then(() => {
        Promise.resolve().then(() => {
          expect(spy).toHaveBeenCalledTimes(1);
          expect(child.computed).toBe('new value other value');

          done();
        });
      });
    });
  }));
});
