const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const handlerSource = fs.readFileSync(path.join(root, 'event-handlers.js'), 'utf8');

test('all served pages use external scripts and declared event functions', () => {
  const context = { document: { querySelectorAll: () => [] } };
  const handlers = vm.runInNewContext(handlerSource + '\nshopHandlers', context);
  for (const file of fs.readdirSync(root).filter(name => name.endsWith('.html'))) {
    const html = fs.readFileSync(path.join(root, file), 'utf8');
    assert.doesNotMatch(html, /\son\w+\s*=/i, file);
    assert.doesNotMatch(html, /(?:href|src)\s*=\s*["']javascript:/i, file);
    for (const script of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
      const src = /\bsrc="([^"]+)"/.exec(script[1])?.[1];
      assert.ok(src, file);
      assert.equal(script[2].trim(), '', file);
      new vm.Script(fs.readFileSync(path.join(root, src), 'utf8'), { filename: src });
    }
    for (const action of html.matchAll(/data-on\w+="([^"]+)"/g)) {
      assert.equal(typeof handlers[action[1]], 'function', file);
    }
    assert.match(html, /<script src="event-handlers.js" defer><\/script>/, file);
  }
  const nginx = fs.readFileSync(path.join(root, 'deploy/nginx.conf'), 'utf8');
  assert.match(nginx, /script-src 'self';/);
});

test('external handlers preserve this binding, arguments, compound calls and cancelled submit', () => {
  const calls = [];
  const elements = new Map();
  for (const action of ['selectColor', 'samsungPopup', 'changeSecondQuantity', 'blockSubmit']) {
    elements.set(action, { getAttribute: () => action });
  }
  const context = {
    document: { querySelectorAll: selector => selector === '[data-onclick]' ? [...elements.values()] : [] },
    toggleButton: value => calls.push(value),
    showContent: value => calls.push(value),
    openPopup: () => calls.push('popup'),
    basket: { changePNum: value => calls.push(value) },
  };
  vm.runInNewContext(handlerSource, context);
  elements.get('selectColor').onclick({});
  elements.get('samsungPopup').onclick({});
  elements.get('changeSecondQuantity').onclick({});
  assert.deepEqual(calls, [elements.get('selectColor'), 'samsung', 'popup', 2]);
  assert.equal(elements.get('blockSubmit').onclick({}), false);
});
