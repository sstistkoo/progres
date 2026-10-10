'use strict';
// Testovací harness pro sichty.html: spustí skutečný skript aplikace v node (modul vm)
// s atrapou DOM a localStorage. Testuje se tak opravdový kód, ne jeho kopie.
// Spouštět s TZ=Europe/Prague (nastaví se i tady, než se poprvé použije Date).

process.env.TZ = process.env.TZ || 'Europe/Prague';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const DEFAULT_HTML = path.join(__dirname, '..', 'sichty.html');

function extractScript(html) {
    const re = /<script>([\s\S]*?)<\/script>/g;
    let match;
    let last = null;
    while ((match = re.exec(html))) last = match[1];
    if (last === null) throw new Error('V HTML není žádný <script> blok');
    return last;
}

function makeElement(tag) {
    const classes = new Set();
    const el = {
        tagName: tag || 'div',
        value: '',
        checked: false,
        className: '',
        id: '',
        _html: '',
        // vymazání obsahu (innerHTML = '') zahodí i potomky, stejně jako v prohlížeči
        get innerHTML() { return el._html; },
        set innerHTML(value) {
            el._html = value;
            if (value === '') {
                el.children.length = 0;
                el.options.length = 0;
            }
        },
        textContent: '',
        open: false,
        disabled: false,
        style: {},
        dataset: {},
        children: [],
        options: [],
        classList: {
            add: (...c) => c.forEach((x) => classes.add(x)),
            remove: (...c) => c.forEach((x) => classes.delete(x)),
            toggle: (c, force) => {
                const on = force === undefined ? !classes.has(c) : !!force;
                if (on) classes.add(c); else classes.delete(c);
                return on;
            },
            contains: (c) => classes.has(c)
        },
        appendChild(child) {
            el.children.push(child);
            if (el.tagName === 'select') el.options.push(child);
            return child;
        },
        addEventListener() {},
        removeEventListener() {},
        setAttribute() {},
        getAttribute() { return null; },
        querySelector() { return null; },
        querySelectorAll() { return []; },
        closest() { return null; },
        focus() {},
        click() {},
        remove() {}
    };
    return el;
}

function makeLocalStorage(initial) {
    const map = new Map(Object.entries(initial || {}).map(([k, v]) => [k, String(v)]));
    return {
        getItem: (k) => (map.has(k) ? map.get(k) : null),
        setItem: (k, v) => { map.set(k, String(v)); },
        removeItem: (k) => { map.delete(k); },
        clear: () => map.clear(),
        key: (i) => (Array.from(map.keys())[i] ?? null),
        get length() { return map.size; },
        _keys: () => Array.from(map.keys()),
        _dump: () => Object.fromEntries(map)
    };
}

/**
 * Vytvoří čerstvou instanci aplikace.
 * options.storage - počáteční obsah localStorage (objekt klíč -> text)
 * options.htmlPath - jiný soubor než sichty.html
 * Vrací { run, json, storage, el, reboot }:
 *   run(kód)  - vyhodnotí kód v kontextu aplikace (vidí i top-level let/const)
 *   json(kód) - totéž, ale výsledek projde JSON (kvůli porovnávání mezi realmy)
 */
function createApp(options) {
    const opts = options || {};
    const htmlPath = opts.htmlPath || DEFAULT_HTML;
    const script = extractScript(fs.readFileSync(htmlPath, 'utf8'));
    const storage = makeLocalStorage(opts.storage);
    const elements = new Map();

    const document = {
        getElementById(id) {
            if (!elements.has(id)) {
                const e = makeElement('div');
                e.id = id;
                elements.set(id, e);
            }
            return elements.get(id);
        },
        createElement: (tag) => makeElement(tag),
        createTextNode: (text) => ({ textContent: text }),
        querySelectorAll: () => [],
        querySelector: () => null,
        addEventListener() {},
        body: makeElement('body')
    };

    const sandbox = {
        document,
        localStorage: storage,
        console,
        setTimeout: () => 0,
        clearTimeout() {},
        setInterval: () => 0,
        clearInterval() {},
        navigator: {},
        location: { reload() {} },
        Blob: class {},
        FileReader: class {},
        alert() {},
        fetch: async () => { throw new Error('offline'); }
    };
    sandbox.URL = { createObjectURL: () => '', revokeObjectURL() {} };
    sandbox.window = {
        addEventListener() {},
        open() {},
        print() {},
        URL: sandbox.URL
    };

    vm.createContext(sandbox);
    vm.runInContext(script, sandbox, { filename: 'sichty.html' });

    return {
        run: (code) => vm.runInContext(code, sandbox),
        json: (code) => JSON.parse(vm.runInContext(`JSON.stringify(${code})`, sandbox) ?? 'null'),
        storage,
        el: (id) => document.getElementById(id),
        reboot: (extraStorage) => createApp(Object.assign({}, opts, {
            storage: Object.assign(storage._dump(), extraStorage || {})
        }))
    };
}

module.exports = { createApp, makeLocalStorage, DEFAULT_HTML };
