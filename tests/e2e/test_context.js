/**
 * ============================================================================
 * E2E Test Context & Headless DOM/CSS Simulation Engine
 * SlideVault Mobile & Tablet UI Testing Framework
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const vm = require('vm');

const PROJECT_ROOT = path.resolve(__dirname, '../..');

/**
 * Read file as UTF-8 string relative to project root
 */
function loadFile(relPath) {
  const fullPath = path.resolve(PROJECT_ROOT, relPath);
  return fs.readFileSync(fullPath, 'utf8');
}

/**
 * Check if file exists relative to project root
 */
function fileExists(relPath) {
  const fullPath = path.resolve(PROJECT_ROOT, relPath);
  return fs.existsSync(fullPath);
}

/**
 * Compute SHA-256 hash of a file
 */
function getFileHash(relPath) {
  const fullPath = path.resolve(PROJECT_ROOT, relPath);
  const buffer = fs.readFileSync(fullPath);
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Binary comparison between two files
 */
function compareBinary(relPathA, relPathB) {
  const bufA = fs.readFileSync(path.resolve(PROJECT_ROOT, relPathA));
  const bufB = fs.readFileSync(path.resolve(PROJECT_ROOT, relPathB));
  const equal = bufA.equals(bufB);
  let diffCount = 0;
  const minLen = Math.min(bufA.length, bufB.length);
  for (let i = 0; i < minLen; i++) {
    if (bufA[i] !== bufB[i]) diffCount++;
  }
  diffCount += Math.abs(bufA.length - bufB.length);
  return {
    equal,
    diffCount,
    lengthA: bufA.length,
    lengthB: bufB.length
  };
}

/**
 * Lightweight HTML parser extracting DOM nodes and metadata
 */
function parseHtml(htmlString) {
  const elements = [];
  const idMap = new Map();
  const classMap = new Map();

  // Strip scripts/styles for raw text inspection or keep for reference
  const tagRegex = /<([a-zA-Z0-9\-]+)([^>]*)>/g;
  let match;

  while ((match = tagRegex.exec(htmlString)) !== null) {
    const tagName = match[1].toLowerCase();
    const rawAttrs = match[2];
    if (tagName.startsWith('!')) continue; // comments, doctype

    const attrs = {};
    const attrRegex = /([a-zA-Z0-9\-_:?@]+)(?:=(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
    let attrMatch;
    while ((attrMatch = attrRegex.exec(rawAttrs)) !== null) {
      const attrName = attrMatch[1];
      const attrValue = attrMatch[2] !== undefined ? attrMatch[2] : (attrMatch[3] !== undefined ? attrMatch[3] : (attrMatch[4] !== undefined ? attrMatch[4] : ''));
      attrs[attrName] = attrValue;
    }

    const elem = {
      tagName,
      attrs,
      id: attrs['id'] || null,
      classList: (attrs['class'] || '').split(/\s+/).filter(Boolean),
      rawAttrs
    };

    elements.push(elem);

    if (elem.id) {
      idMap.set(elem.id, elem);
    }

    for (const cls of elem.classList) {
      if (!classMap.has(cls)) classMap.set(cls, []);
      classMap.get(cls).push(elem);
    }
  }

  return {
    raw: htmlString,
    elements,
    getElementById: (id) => idMap.get(id) || null,
    getElementsByClassName: (cls) => classMap.get(cls) || [],
    getElementsByTagName: (tag) => elements.filter(e => e.tagName === tag.toLowerCase()),
    hasElementWithId: (id) => idMap.has(id),
    querySelectorAll: (selector) => {
      const parts = selector.split(',').map(s => s.trim()).filter(Boolean);
      const results = [];
      const seen = new Set();

      for (const part of parts) {
        let matched = [];
        if (part.startsWith('#')) {
          const id = part.slice(1);
          const el = idMap.get(id);
          matched = el ? [el] : [];
        } else if (part.startsWith('.')) {
          const cls = part.slice(1);
          matched = classMap.get(cls) || [];
        } else if (part.startsWith('[')) {
          const attrName = part.replace(/[\[\]]/g, '').split('=')[0];
          matched = elements.filter(e => attrName in e.attrs);
        } else {
          matched = elements.filter(e => e.tagName === part.toLowerCase());
        }

        for (const m of matched) {
          if (!seen.has(m)) {
            seen.add(m);
            results.push(m);
          }
        }
      }
      return results;
    }
  };
}

/**
 * CSS parser for extracting rules, media queries, and properties
 */
function parseCss(cssString) {
  const rules = [];

  // Remove comments
  const cleanCss = cssString.replace(/\/\*[\s\S]*?\*\//g, '');

  let i = 0;
  while (i < cleanCss.length) {
    // Skip whitespace
    while (i < cleanCss.length && /\s/.test(cleanCss[i])) i++;
    if (i >= cleanCss.length) break;

    if (cleanCss.startsWith('@media', i)) {
      const mediaStart = i;
      const firstBrace = cleanCss.indexOf('{', mediaStart);
      if (firstBrace === -1) break;
      const mediaQuery = cleanCss.slice(mediaStart + 6, firstBrace).trim();
      let depth = 1;
      let j = firstBrace + 1;
      while (j < cleanCss.length && depth > 0) {
        if (cleanCss[j] === '{') depth++;
        else if (cleanCss[j] === '}') depth--;
        j++;
      }
      const mediaBody = cleanCss.slice(firstBrace + 1, j - 1);
      parseSimpleRules(mediaBody, mediaQuery, rules);
      i = j;
    } else if (cleanCss[i] === '@') {
      // Skip other at-rules like @keyframes or @import
      const firstBrace = cleanCss.indexOf('{', i);
      const firstSemi = cleanCss.indexOf(';', i);
      if (firstSemi !== -1 && (firstBrace === -1 || firstSemi < firstBrace)) {
        i = firstSemi + 1;
      } else if (firstBrace !== -1) {
        let depth = 1;
        let j = firstBrace + 1;
        while (j < cleanCss.length && depth > 0) {
          if (cleanCss[j] === '{') depth++;
          else if (cleanCss[j] === '}') depth--;
          j++;
        }
        i = j;
      } else {
        break;
      }
    } else {
      const openBrace = cleanCss.indexOf('{', i);
      if (openBrace === -1) break;
      const closeBrace = cleanCss.indexOf('}', openBrace);
      if (closeBrace === -1) break;
      const selector = cleanCss.slice(i, openBrace).trim();
      const declText = cleanCss.slice(openBrace + 1, closeBrace);
      if (selector) {
        parseSimpleRules(selector + '{' + declText + '}', null, rules);
      }
      i = closeBrace + 1;
    }
  }

  return {
    raw: cssString,
    rules,
    findRules: (selectorPart) => {
      return rules.filter(r => r.selector.includes(selectorPart));
    },
    hasRuleWithProperty: (selectorPart, propName, expectedValueRegex = null) => {
      const matched = rules.filter(r => r.selector.includes(selectorPart));
      for (const r of matched) {
        if (r.declarations[propName]) {
          if (!expectedValueRegex || expectedValueRegex.test(r.declarations[propName])) {
            return true;
          }
        }
      }
      return false;
    },
    getPropertyValue: (selectorPart, propName) => {
      const matched = rules.filter(r => r.selector.includes(selectorPart));
      for (let i = matched.length - 1; i >= 0; i--) {
        if (matched[i].declarations[propName]) {
          return matched[i].declarations[propName];
        }
      }
      return null;
    }
  };
}

function parseSimpleRules(cssText, mediaQuery, rulesList) {
  const ruleRegex = /([^{]+)\{([^}]+)\}/g;
  let match;
  while ((match = ruleRegex.exec(cssText)) !== null) {
    const selector = match[1].trim();
    const declText = match[2];
    const declarations = {};

    declText.split(';').forEach(decl => {
      const parts = decl.split(':');
      if (parts.length >= 2) {
        const prop = parts[0].trim().toLowerCase();
        const val = parts.slice(1).join(':').trim();
        declarations[prop] = val;
      }
    });

    rulesList.push({
      selector,
      declarations,
      mediaQuery
    });
  }
}

/**
 * Headless DOM / JavaScript Runtime Simulator
 * Emulates the browser runtime for `glass-theme.js`
 */
function createSimulatedBrowser(htmlContent = '', options = {}) {
  const listeners = {};
  const root = {
    style: {
      properties: {},
      setProperty: function(k, v) { this.properties[k] = v; },
      getPropertyValue: function(k) { return this.properties[k] || ''; }
    },
    classList: {
      classes: new Set(['dark']),
      add: function(c) { this.classes.add(c); },
      remove: function(c) { this.classes.delete(c); },
      contains: function(c) { return this.classes.has(c); },
      toggle: function(c) { if (this.contains(c)) this.remove(c); else this.add(c); }
    },
    getAttribute: function(a) { return this.attributes[a] || null; },
    setAttribute: function(a, v) { this.attributes[a] = v; },
    attributes: {}
  };

  const body = {
    style: { properties: {} },
    classList: {
      classes: new Set(),
      add: function(c) { this.classes.add(c); },
      remove: function(c) { this.classes.delete(c); },
      contains: function(c) { return this.classes.has(c); }
    },
    appendChild: function() {}
  };

  // Create virtual element nodes from HTML
  const parsed = parseHtml(htmlContent);
  const elements = new Map();

  for (const el of parsed.elements) {
    const classes = new Set(el.classList);
    const mockElem = {
      tagName: el.tagName.toUpperCase(),
      id: el.id,
      attributes: Object.assign({}, el.attrs),
      classList: {
        classes,
        add: function(c) { classes.add(c); },
        remove: function(c) { classes.delete(c); },
        contains: function(c) { return classes.has(c); },
        toggle: function(c) { if (this.contains(c)) this.remove(c); else this.add(c); }
      },
      style: {
        properties: {},
        setProperty: function(k, v) { this.properties[k] = v; },
        getPropertyValue: function(k) { return this.properties[k] || ''; }
      },
      getAttribute: function(a) { return this.attributes[a] || null; },
      setAttribute: function(a, v) { this.attributes[a] = v; },
      removeAttribute: function(a) { delete this.attributes[a]; },
      hasAttribute: function(a) { return a in this.attributes; },
      addEventListener: function(evt, fn) {
        if (!listeners[evt]) listeners[evt] = [];
        listeners[evt].push(fn);
      },
      dispatchEvent: function(evt) {
        if (listeners[evt.type]) {
          listeners[evt.type].forEach(fn => fn(evt));
        }
      },
      focus: function() {},
      click: function() {
        if (listeners['click']) listeners['click'].forEach(fn => fn({ type: 'click', target: mockElem }));
      }
    };
    if (el.id) elements.set(el.id, mockElem);
  }

  // Simulated browser window & document
  const windowObj = {
    scrollY: 0,
    innerWidth: options.width || 393,
    innerHeight: options.height || 852,
    document: null,
    localStorage: {
      store: {},
      getItem: function(k) { return this.store[k] || null; },
      setItem: function(k, v) { this.store[k] = String(v); },
      removeItem: function(k) { delete this.store[k]; }
    },
    BroadcastChannel: function(channelName) {
      return {
        name: channelName,
        postMessage: function() {},
        onmessage: null
      };
    },
    CustomEvent: function(type, params) {
      return { type, detail: params ? params.detail : null };
    },
    addEventListener: function(evt, fn) {
      if (!listeners[evt]) listeners[evt] = [];
      listeners[evt].push(fn);
    },
    removeEventListener: function(evt, fn) {
      if (listeners[evt]) listeners[evt] = listeners[evt].filter(f => f !== fn);
    },
    dispatchEvent: function(evt) {
      if (listeners[evt.type]) {
        listeners[evt.type].forEach(fn => fn(evt));
      }
    },
    setTimeout: setTimeout,
    clearTimeout: clearTimeout,
    requestAnimationFrame: (cb) => setTimeout(cb, 16),
    cancelAnimationFrame: (id) => clearTimeout(id),
    console: {
      log: () => {},
      warn: () => {},
      error: () => {}
    }
  };

  const documentObj = {
    documentElement: root,
    body: body,
    getElementById: (id) => elements.get(id) || null,
    querySelector: (sel) => {
      if (sel.startsWith('#')) return elements.get(sel.slice(1)) || null;
      if (sel === 'body') return body;
      if (sel === 'html') return root;
      for (const el of elements.values()) {
        if (sel.startsWith('.') && el.classList.contains(sel.slice(1))) return el;
      }
      return null;
    },
    querySelectorAll: (sel) => {
      const res = [];
      for (const el of elements.values()) {
        if (sel.startsWith('.') && el.classList.contains(sel.slice(1))) res.push(el);
      }
      return res;
    },
    addEventListener: function(evt, fn) {
      if (!listeners[evt]) listeners[evt] = [];
      listeners[evt].push(fn);
    },
    dispatchEvent: function(evt) {
      if (listeners[evt.type]) {
        listeners[evt.type].forEach(fn => fn(evt));
      }
    },
    createElement: function(tag) {
      return {
        tagName: tag.toUpperCase(),
        classList: { add: () => {}, remove: () => {} },
        style: {},
        innerHTML: '',
        appendChild: () => {}
      };
    }
  };

  windowObj.document = documentObj;

  return {
    window: windowObj,
    document: documentObj,
    elements,
    listeners,
    triggerScroll: (targetScrollY) => {
      const prevScrollY = windowObj.scrollY;
      windowObj.scrollY = targetScrollY;
      const evt = { type: 'scroll', currentScrollY: targetScrollY, prevScrollY };
      if (listeners['scroll']) {
        listeners['scroll'].forEach(fn => fn(evt));
      }
    },
    triggerTouchEnd: () => {
      const evt = { type: 'touchend' };
      if (listeners['touchend']) {
        listeners['touchend'].forEach(fn => fn(evt));
      }
    }
  };
}

module.exports = {
  PROJECT_ROOT,
  loadFile,
  fileExists,
  getFileHash,
  compareBinary,
  parseHtml,
  parseCss,
  createSimulatedBrowser
};
