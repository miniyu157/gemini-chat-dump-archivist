// ==UserScript==
// @name         Gemini Chat Dump Archivist
// @name:zh-CN   Gemini 聊天记录导出助手 (Chat Dump)
// @namespace    https://github.com/miniyu157/gemini-chat-dump-archivist
// @version      2026.3.14
// @description  Export Gemini chat history to JSON with accurate Markdown preservation.
// @description:zh-CN 将 Gemini 聊天记录导出为 JSON，并精准保留 Markdown 格式。
// @author       Yumeka
// @license      MIT
// @match        https://gemini.google.com/*
// @icon         https://www.gstatic.com/images/branding/product/1x/gemini_48dp.png
// @require      https://unpkg.com/turndown/lib/turndown.browser.umd.js
// @grant        GM_addStyle
// @run-at       document-end
// ==/UserScript==

(() => {
  'use strict';

  const CONFIG = {
    repoUrl: 'https://github.com/miniyu157/gemini-chat-dump-archivist',
    licenseUrl: 'https://github.com/miniyu157/gemini-chat-dump-archivist/blob/main/LICENSE',
    turndownIgnores: ['button', '.code-block-decoration', 'model-thoughts', 'freemium-rag-disclaimer']
  };

  const td = new TurndownService({ codeBlockStyle: 'fenced', headingStyle: 'atx' });
  td.remove(CONFIG.turndownIgnores);

  const extractData = () => {
    const data = [];
    document.querySelectorAll('.conversation-container').forEach(node => {
      const user = node.querySelector('user-query .query-text');
      const model = node.querySelector('model-response message-content .markdown');
      if (user) data.push({ role: 'user', content: user.innerText.trim() });
      if (model) data.push({ role: 'model', content: td.turndown(model).trim() });
    });
    return JSON.stringify(data, null, 2);
  };

  const ACTIONS = {
    downloadJson: () => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([extractData()], { type: 'application/json' }));
      a.download = `Gemini_Export_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
    },
    scrollToAbsoluteTop: async () => {
      let lastId = null;
      while (true) {
        const firstMsg = document.querySelector('.conversation-container');
        if (!firstMsg || firstMsg.id === lastId) break;
        lastId = firstMsg.id;
        firstMsg.scrollIntoView({ block: 'start' });
        await new Promise(r => setTimeout(r, 1200));
      }
    },
    openRepo: () => window.open(CONFIG.repoUrl, '_blank'),
    openLicense: () => window.open(CONFIG.licenseUrl, '_blank')
  };

  const MENU_OPTIONS = [
    { label: 'Dump JSON', action: ACTIONS.downloadJson },
    { label: 'Go Top', action: ACTIONS.scrollToAbsoluteTop },
    { label: 'View on GitHub', action: ACTIONS.openRepo },
    { label: 'License', action: ACTIONS.openLicense }
  ];

  const UI = {
    menu: null,
    init() {
      const style = document.createElement('style');
      style.textContent = `
                [data-test-id="conversation-title"] { cursor: pointer; transition: opacity 0.2s; }
                [data-test-id="conversation-title"]:hover { opacity: 0.7; }
                .gemini-pro-menu {
                    position: absolute; display: none; flex-direction: column; z-index: 9999;
                    background: var(--mdc-theme-surface, #fff); color: var(--mdc-theme-on-surface, #1f1f1f);
                    border: 1px solid var(--mdc-theme-surface-variant, #e0e0e0);
                    border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    padding: 6px 0; min-width: 160px; margin: 0; list-style: none; font-size: 14px;
                }
                .gemini-pro-menu li { padding: 10px 16px; cursor: pointer; transition: background 0.15s; }
                .gemini-pro-menu li:hover { background: var(--mdc-theme-surface-variant, #f0f0f0); }
                @media (prefers-color-scheme: dark) {
                    .gemini-pro-menu { background: #1e1e1e; border-color: #333; color: #e3e3e3; }
                    .gemini-pro-menu li:hover { background: #2c2c2c; }
                }
            `;
      document.head.appendChild(style);

      this.menu = document.createElement('menu');
      this.menu.className = 'gemini-pro-menu';
      MENU_OPTIONS.forEach(({ label, action }) => {
        const li = document.createElement('li');
        li.innerText = label;
        li.onclick = (e) => {
          e.stopPropagation();
          this.hide();
          action();
        };
        this.menu.appendChild(li);
      });
      document.body.appendChild(this.menu);
      document.addEventListener('click', () => this.hide());
    },
    show(target) {
      const rect = target.getBoundingClientRect();
      this.menu.style.display = 'flex';
      this.menu.style.top = `${rect.bottom + window.scrollY + 8}px`;
      this.menu.style.left = `${rect.left + window.scrollX}px`;
    },
    hide() {
      if (this.menu) this.menu.style.display = 'none';
    }
  };

  UI.init();
  document.addEventListener('click', (e) => {
    const titleBtn = e.target.closest('[data-test-id="conversation-title"]');
    if (titleBtn) {
      e.preventDefault();
      e.stopPropagation();
      UI.show(titleBtn);
    }
  }, true);
})();
