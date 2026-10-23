/**
 * KeyShield – Global / Script-tag build
 * Exposes window.KeyShield and window.Keyboard
 */
(function (global) {
  'use strict';
/**
 * KeyShield – Custom Virtual Keyboard Module
 * Pure ES Module for enhanced security (anti-keylogging) in fintech / sensitive inputs.
 * Replaces the native OS keyboard with a controlled on-screen keyboard.
 */

const LAYOUTS = {
  "en-us": {
    name: "English (US)",
    alpha: [
      ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
      ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
      ["⇧", "z", "x", "c", "v", "b", "n", "m", "⌫"],
      ["123", "🌐", " ", ".", "↵"]
    ],
    number: [
      ["1", "2", "3", "+"],
      ["4", "5", "6", "-"],
      ["7", "8", "9", "."],
      ["ABC", "0", "⌫", "↵"]
    ],
    symbols: [
      ["!", "@", "#", "$", "%", "^", "&", "*", "(", ")"],
      ["-", "_", "=", "+", "[", "]", "{", "}", "\\", "|"],
      [";", ":", "'", '"', ",", ".", "<", ">", "/", "?"],
      ["ABC", " ", "⌫", "↵"]
    ]
  },
  "en-uk": {
    name: "English (UK)",
    alpha: [
      ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
      ["a", "s", "d", "f", "g", "h", "j", "k", "l"],
      ["⇧", "z", "x", "c", "v", "b", "n", "m", "⌫"],
      ["123", "🌐", " ", ".", "↵"]
    ],
    number: [
      ["1", "2", "3", "+"],
      ["4", "5", "6", "-"],
      ["7", "8", "9", "."],
      ["ABC", "0", "⌫", "↵"]
    ],
    symbols: [
      ["!", "@", "£", "$", "%", "^", "&", "*", "(", ")"],
      ["-", "_", "=", "+", "[", "]", "{", "}", "\\", "|"],
      [";", ":", "'", '"', ",", ".", "<", ">", "/", "?"],
      ["ABC", " ", "⌫", "↵"]
    ]
  },
  ar: {
    name: "العربية",
    rtl: true,
    alpha: [
      ["ض", "ص", "ث", "ق", "ف", "غ", "ع", "ه", "خ", "ح", "ج", "د"],
      ["ش", "س", "ي", "ب", "ل", "ا", "ت", "ن", "م", "ك", "ط"],
      ["⇧", "ئ", "ء", "ؤ", "ر", "لا", "ى", "ة", "و", "ز", "ظ", "⌫"],
      ["123", "🌐", " ", ".", "↵"]
    ],
    number: [
      ["١", "٢", "٣", "+"],
      ["٤", "٥", "٦", "-"],
      ["٧", "٨", "٩", "."],
      ["ABC", "٠", "⌫", "↵"]
    ],
    symbols: [
      ["!", "@", "#", "$", "%", "^", "&", "*", "(", ")"],
      ["-", "_", "=", "+", "[", "]", "{", "}", "\\", "|"],
      [";", ":", "'", '"', ",", ".", "<", ">", "/", "?"],
      ["ABC", " ", "⌫", "↵"]
    ]
  }
};

const DEFAULT_TYPES = ["text", "number", "url", "email", "password", "tel", "search"];

const THEMES = {
  dark: {
    bg: "#1a1a1a",
    keyBg: "#2d2d2d",
    keyBgActive: "#3d3d3d",
    keyText: "#ffffff",
    keyBorder: "#404040",
    specialBg: "#3a3a3a",
    accent: "#0a84ff",
    shadow: "0 -4px 20px rgba(0,0,0,0.4)"
  },
  light: {
    bg: "#f0f0f0",
    keyBg: "#ffffff",
    keyBgActive: "#e0e0e0",
    keyText: "#1a1a1a",
    keyBorder: "#d0d0d0",
    specialBg: "#e8e8e8",
    accent: "#007aff",
    shadow: "0 -4px 20px rgba(0,0,0,0.12)"
  },
  fintech: {
    bg: "#0d1117",
    keyBg: "#161b22",
    keyBgActive: "#21262d",
    keyText: "#e6edf3",
    keyBorder: "#30363d",
    specialBg: "#1c2128",
    accent: "#238636",
    shadow: "0 -4px 24px rgba(0,0,0,0.5)"
  }
};

const SIZE_BREAKPOINTS = {
  xs: 480,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  all: Infinity
};

class Keyboard {
  #config = {
    class: null,
    types: [...DEFAULT_TYPES],
    theme: "dark",
    size: "all",
    animation: false,
    lang: ["en-us"],
    preventNative: true,
    vibrate: true,
    sound: false,
    maxLengthRespect: true
  };

  #active = false;
  #initialized = false;
  #currentInput = null;
  #keyboardEl = null;
  #styleEl = null;
  #shift = false;
  #caps = false;
  #mode = "alpha";
  #currentLang = "en-us";
  #langIndex = 0;
  #boundHandlers = {};
  #observer = null;
  #spacer = null;

  // History / back-button
  #historyPushed = false;
  #ignoreNextPopstate = false;

  // Per-input original attributes (keyed by element to support fast switching)
  #lockedInputs = new WeakMap();

  constructor(config = {}) {
    if (Keyboard.#instance) {
      console.warn("[KeyShield] Only one instance allowed. Returning existing instance.");
      return Keyboard.#instance;
    }
    Keyboard.#instance = this;
    if (Object.keys(config).length) {
      this.config(config);
    }
  }

  static #instance = null;

  config(options = {}) {
    this.#mergeConfig(options);
    return this;
  }

  update(options = {}) {
    this.#mergeConfig(options);
    if (this.#initialized) {
      this.stop();
      this.init();
    }
    return this;
  }

  init() {
    if (this.#initialized) {
      this.stop();
    }
    this.#injectStyles();
    this.#createKeyboardDOM();
    this.#attachGlobalListeners();
    this.#observeDynamicInputs();
    this.#initialized = true;
    this.#active = true;
    return this;
  }

  stop() {
    this.#hideKeyboard(true);
    this.#detachGlobalListeners();
    this.#removeKeyboardDOM();
    this.#removeStyles();
    this.#disconnectObserver();
    this.#initialized = false;
    this.#active = false;
    this.#currentInput = null;
    return this;
  }

  clear() {
    this.stop();
    this.#config = {
      class: null,
      types: [...DEFAULT_TYPES],
      theme: "dark",
      size: "all",
      animation: false,
      lang: ["en-us"],
      preventNative: true,
      vibrate: true,
      sound: false,
      maxLengthRespect: true
    };
    this.#currentLang = "en-us";
    this.#langIndex = 0;
    this.#shift = false;
    this.#caps = false;
    this.#mode = "alpha";
    return this;
  }

  // ─── Private ───────────────────────────────────────────────────────

  #mergeConfig(options) {
    if (options.class !== undefined) this.#config.class = options.class;
    if (options.types !== undefined) {
      this.#config.types = Array.isArray(options.types) && options.types.length
        ? options.types.map(t => t.toLowerCase())
        : [...DEFAULT_TYPES];
    }
    if (options.theme !== undefined) {
      this.#config.theme = THEMES[options.theme] ? options.theme : "dark";
    }
    if (options.size !== undefined) {
      this.#config.size = SIZE_BREAKPOINTS[options.size] !== undefined
        ? options.size
        : "all";
    }
    if (options.animation !== undefined) this.#config.animation = !!options.animation;
    if (options.lang !== undefined) {
      const valid = (Array.isArray(options.lang) ? options.lang : [options.lang])
        .filter(l => LAYOUTS[l]);
      this.#config.lang = valid.length ? valid : ["en-us"];
      this.#currentLang = this.#config.lang[0];
      this.#langIndex = 0;
    }
    if (options.preventNative !== undefined) this.#config.preventNative = !!options.preventNative;
    if (options.vibrate !== undefined) this.#config.vibrate = !!options.vibrate;
    if (options.sound !== undefined) this.#config.sound = !!options.sound;
    if (options.maxLengthRespect !== undefined) this.#config.maxLengthRespect = !!options.maxLengthRespect;
  }

  #shouldApplyTo(el) {
    if (!el || (el.tagName !== "INPUT" && el.tagName !== "TEXTAREA")) return false;
    if (el.disabled) return false;

    const maxW = SIZE_BREAKPOINTS[this.#config.size];
    if (window.innerWidth > maxW) return false;

    // Prefer the *original* type we stored (in case we temporarily changed type=number → text)
    const stored = this.#lockedInputs.get(el);
    const type = (stored?.originalType || el.type || "text").toLowerCase();
    const hasClass = this.#config.class
      ? el.classList.contains(this.#config.class)
      : false;
    const matchesType = this.#config.types.includes(type);

    if (this.#config.class) {
      return hasClass && (this.#config.types.length === 0 || matchesType || el.tagName === "TEXTAREA");
    }
    return matchesType || (el.tagName === "TEXTAREA" && this.#config.types.includes("text"));
  }

  #injectStyles() {
    if (this.#styleEl) return;
    const theme = THEMES[this.#config.theme] || THEMES.dark;
    const anim = this.#config.animation;

    this.#styleEl = document.createElement("style");
    this.#styleEl.id = "cvk-styles";
    this.#styleEl.textContent = `
      #cvk-keyboard {
        position: fixed;
        left: 0; right: 0; bottom: 0;
        z-index: 2147483646;
        background: ${theme.bg};
        box-shadow: ${theme.shadow};
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        user-select: none;
        -webkit-user-select: none;
        touch-action: manipulation;
        padding: 6px 4px calc(6px + env(safe-area-inset-bottom, 0px));
        transform: translateY(100%);
        transition: ${anim ? "transform 0.28s cubic-bezier(0.32, 0.72, 0, 1)" : "none"};
        will-change: transform;
      }
      #cvk-keyboard.cvk-visible { transform: translateY(0); }
      #cvk-keyboard .cvk-row {
        display: flex;
        justify-content: center;
        gap: 5px;
        margin-bottom: 6px;
      }
      #cvk-keyboard .cvk-row:last-child { margin-bottom: 2px; }
      #cvk-keyboard .cvk-key {
        flex: 1 1 0;
        min-width: 0;
        height: 46px;
        max-width: 64px;
        background: ${theme.keyBg};
        color: ${theme.keyText};
        border: 1px solid ${theme.keyBorder};
        border-radius: 8px;
        font-size: 17px;
        font-weight: 400;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: ${anim ? "background 0.1s, transform 0.08s" : "none"};
        -webkit-tap-highlight-color: transparent;
      }
      #cvk-keyboard .cvk-key:active,
      #cvk-keyboard .cvk-key.cvk-pressed {
        background: ${theme.keyBgActive};
        transform: ${anim ? "scale(0.94)" : "none"};
      }
      #cvk-keyboard .cvk-key.cvk-special {
        background: ${theme.specialBg};
        font-size: 14px;
        font-weight: 500;
        max-width: 72px;
        flex: 1.3 1 0;
      }
      #cvk-keyboard .cvk-key.cvk-space {
        flex: 4 1 0;
        max-width: none;
      }
      #cvk-keyboard .cvk-key.cvk-enter {
        background: ${theme.accent};
        color: #fff;
        max-width: 80px;
        flex: 1.5 1 0;
      }
      #cvk-keyboard .cvk-key.cvk-shift-active {
        background: ${theme.accent};
        color: #fff;
      }
      #cvk-keyboard .cvk-key.cvk-wide {
        max-width: 90px;
        flex: 1.6 1 0;
      }
      #cvk-spacer {
        height: 0;
        transition: ${anim ? "height 0.28s cubic-bezier(0.32, 0.72, 0, 1)" : "none"};
        pointer-events: none;
      }
      body.cvk-open { overflow: hidden; }
      /* Keep caret visible */
      input.cvk-target, textarea.cvk-target {
        caret-color: ${theme.accent};
      }
    `;
    document.head.appendChild(this.#styleEl);
  }

  #removeStyles() {
    if (this.#styleEl) {
      this.#styleEl.remove();
      this.#styleEl = null;
    }
  }

  #createKeyboardDOM() {
    if (this.#keyboardEl) return;
    this.#keyboardEl = document.createElement("div");
    this.#keyboardEl.id = "cvk-keyboard";
    this.#keyboardEl.setAttribute("role", "keyboard");
    this.#keyboardEl.setAttribute("aria-label", "Virtual keyboard");
    document.body.appendChild(this.#keyboardEl);

    this.#spacer = document.createElement("div");
    this.#spacer.id = "cvk-spacer";
    document.body.appendChild(this.#spacer);

    this.#renderKeys();
  }

  #removeKeyboardDOM() {
    if (this.#keyboardEl) {
      this.#keyboardEl.remove();
      this.#keyboardEl = null;
    }
    if (this.#spacer) {
      this.#spacer.remove();
      this.#spacer = null;
    }
    document.body.classList.remove("cvk-open");
  }

  #renderKeys() {
    if (!this.#keyboardEl) return;
    const layout = LAYOUTS[this.#currentLang] || LAYOUTS["en-us"];
    const rows = layout[this.#mode] || layout.alpha;
    const isRtl = !!layout.rtl;

    this.#keyboardEl.dir = isRtl ? "rtl" : "ltr";
    this.#keyboardEl.innerHTML = "";

    rows.forEach(row => {
      const rowEl = document.createElement("div");
      rowEl.className = "cvk-row";

      row.forEach(key => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "cvk-key";
        btn.dataset.key = key;

        if (["⇧", "⌫", "123", "ABC", "🌐", "↵"].includes(key)) {
          btn.classList.add("cvk-special");
        }
        if (key === " ") {
          btn.classList.add("cvk-space");
          btn.setAttribute("aria-label", "Space");
        }
        if (key === "↵") {
          btn.classList.add("cvk-enter");
          btn.setAttribute("aria-label", "Enter");
        }
        if (key === "⇧" && (this.#shift || this.#caps)) {
          btn.classList.add("cvk-shift-active");
        }
        if (["123", "ABC", "🌐"].includes(key)) {
          btn.classList.add("cvk-wide");
        }

        let display = key;
        if (key === " ") display = "";
        else if (this.#mode === "alpha" && key.length === 1 && /[a-zA-Zا-ي]/.test(key)) {
          display = (this.#shift || this.#caps) ? key.toUpperCase() : key.toLowerCase();
        }
        btn.textContent = display;

        // Prevent the button from taking focus (keeps caret in the input)
        btn.addEventListener("mousedown", e => e.preventDefault());
        btn.addEventListener("touchstart", e => {
          e.preventDefault();
          e.stopPropagation();
          this.#onKeyPress(key, btn);
        }, { passive: false });

        btn.addEventListener("click", e => {
          e.preventDefault();
          e.stopPropagation();
          if (!("ontouchstart" in window)) {
            this.#onKeyPress(key, btn);
          }
        });

        rowEl.appendChild(btn);
      });

      this.#keyboardEl.appendChild(rowEl);
    });
  }

  #onKeyPress(key, btn) {
    if (!this.#currentInput) return;

    // Keep focus & selection on the input
    this.#currentInput.focus({ preventScroll: true });

    if (this.#config.animation && btn) {
      btn.classList.add("cvk-pressed");
      setTimeout(() => btn.classList.remove("cvk-pressed"), 120);
    }

    if (this.#config.vibrate && navigator.vibrate) {
      navigator.vibrate(12);
    }

    const input = this.#currentInput;
    let start = input.selectionStart;
    let end = input.selectionEnd;

    // Fallback if selection is null (rare)
    if (start == null || end == null) {
      start = end = input.value.length;
    }

    const value = input.value;

    const insert = (char) => {
      if (this.#config.maxLengthRespect && input.maxLength > 0) {
        if (value.length - (end - start) + char.length > input.maxLength) return;
      }
      const newVal = value.slice(0, start) + char + value.slice(end);
      input.value = newVal;
      const pos = start + char.length;
      try {
        input.setSelectionRange(pos, pos);
      } catch (_) {}
      this.#dispatchInputEvents(input);
    };

    const del = () => {
      if (start !== end) {
        const newVal = value.slice(0, start) + value.slice(end);
        input.value = newVal;
        try { input.setSelectionRange(start, start); } catch (_) {}
      } else if (start > 0) {
        const newVal = value.slice(0, start - 1) + value.slice(start);
        input.value = newVal;
        try { input.setSelectionRange(start - 1, start - 1); } catch (_) {}
      }
      this.#dispatchInputEvents(input);
    };

    switch (key) {
      case "⌫":
        del();
        break;
      case "↵":
        this.#handleEnter(input);
        break;
      case "⇧":
        if (this.#caps) {
          this.#caps = false;
          this.#shift = false;
        } else if (this.#shift) {
          this.#caps = true;
          this.#shift = true;
        } else {
          this.#shift = true;
        }
        this.#renderKeys();
        break;
      case "123":
        this.#mode = "number";
        this.#shift = false;
        this.#renderKeys();
        break;
      case "ABC":
        this.#mode = "alpha";
        this.#renderKeys();
        break;
      case "🌐":
        this.#cycleLanguage();
        break;
      case " ":
        insert(" ");
        if (this.#shift && !this.#caps) {
          this.#shift = false;
          this.#renderKeys();
        }
        break;
      default:
        if (this.#mode === "alpha" && key.length === 1) {
          const char = (this.#shift || this.#caps) ? key.toUpperCase() : key.toLowerCase();
          insert(char);
          if (this.#shift && !this.#caps) {
            this.#shift = false;
            this.#renderKeys();
          }
        } else {
          insert(key);
        }
        break;
    }
  }

  #handleEnter(input) {
    if (input.tagName === "INPUT") {
      const form = input.form;
      if (form) {
        if (typeof form.requestSubmit === "function") {
          form.requestSubmit();
        } else {
          form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
        }
      } else {
        input.blur();
        this.#hideKeyboard();
      }
    } else {
      const start = input.selectionStart ?? input.value.length;
      const end = input.selectionEnd ?? input.value.length;
      const value = input.value;
      input.value = value.slice(0, start) + "\n" + value.slice(end);
      try { input.setSelectionRange(start + 1, start + 1); } catch (_) {}
      this.#dispatchInputEvents(input);
    }
  }

  #cycleLanguage() {
    if (this.#config.lang.length < 2) return;
    this.#langIndex = (this.#langIndex + 1) % this.#config.lang.length;
    this.#currentLang = this.#config.lang[this.#langIndex];
    this.#mode = "alpha";
    this.#shift = false;
    this.#caps = false;
    this.#renderKeys();
  }

  #dispatchInputEvents(input) {
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }

  /**
   * Lock native keyboard WITHOUT using readonly (so caret stays visible
   * and the user can tap to reposition the cursor).
   */
  #lockNativeKeyboard(input) {
    if (!this.#config.preventNative) return;
    if (this.#lockedInputs.has(input)) return; // already locked

    const originalType = input.getAttribute("type");
    const originalInputMode = input.getAttribute("inputmode");

    this.#lockedInputs.set(input, { originalType, originalInputMode });

    input.setAttribute("inputmode", "none");
    input.classList.add("cvk-target");

    // number / tel force a numeric OS keyboard on many mobile browsers.
    // Temporarily switch to text so the OS has no reason to show it.
    const type = (input.type || "").toLowerCase();
    if (type === "number" || type === "tel") {
      input.setAttribute("type", "text");
    }
  }

  #unlockNativeKeyboard(input) {
    if (!input) return;
    const stored = this.#lockedInputs.get(input);
    if (!stored) return;

    if (stored.originalType) {
      input.setAttribute("type", stored.originalType);
    } else {
      input.removeAttribute("type");
    }
    if (stored.originalInputMode) {
      input.setAttribute("inputmode", stored.originalInputMode);
    } else {
      input.removeAttribute("inputmode");
    }

    input.classList.remove("cvk-target");
    this.#lockedInputs.delete(input);
  }

  /**
   * Resolve the layout mode for a given input from its *original* type.
   */
  #resolveModeFor(input) {
    const stored = this.#lockedInputs.get(input);
    const type = (stored?.originalType || input.getAttribute("type") || input.type || "text").toLowerCase();
    if (type === "number" || type === "tel") return "number";
    return "alpha";
  }

  #showKeyboard(input) {
    if (!this.#keyboardEl || !this.#active) return;

    // Switching from another field: unlock the previous one first
    if (this.#currentInput && this.#currentInput !== input) {
      this.#unlockNativeKeyboard(this.#currentInput);
      this.#currentInput.classList.remove("cvk-target");
    }

    this.#currentInput = input;
    this.#lockNativeKeyboard(input);

    // Always re-evaluate mode from the new field's original type
    this.#mode = this.#resolveModeFor(input);
    this.#shift = false;
    this.#caps = false;
    this.#renderKeys();

    // History entry for Back button (only once while keyboard is open)
    if (!this.#historyPushed) {
      try {
        history.pushState({ keyshield: true }, "");
        this.#historyPushed = true;
      } catch (_) {}
    }

    requestAnimationFrame(() => {
      this.#keyboardEl.classList.add("cvk-visible");
      document.body.classList.add("cvk-open");

      const kbHeight = this.#keyboardEl.offsetHeight;
      if (this.#spacer) {
        this.#spacer.style.height = kbHeight + "px";
      }

      // Ensure caret is visible and focus is correct
      try {
        input.focus({ preventScroll: true });
      } catch (_) {
        input.focus();
      }

      setTimeout(() => {
        input.scrollIntoView({
          behavior: this.#config.animation ? "smooth" : "auto",
          block: "center"
        });
      }, 40);
    });
  }

  /**
   * @param {boolean} [fromStop=false]
   * @param {boolean} [fromPopstate=false]
   */
  #hideKeyboard(fromStop = false, fromPopstate = false) {
    if (!this.#keyboardEl) return;

    this.#keyboardEl.classList.remove("cvk-visible");
    document.body.classList.remove("cvk-open");
    if (this.#spacer) this.#spacer.style.height = "0";

    if (this.#currentInput) {
      this.#unlockNativeKeyboard(this.#currentInput);
      this.#currentInput = null;
    }

    this.#mode = "alpha";
    this.#shift = false;
    this.#caps = false;

    // History cleanup
    if (this.#historyPushed) {
      this.#historyPushed = false;
      if (!fromPopstate && !fromStop) {
        // User dismissed by tapping elsewhere – consume the history entry
        // without navigating away from the page
        this.#ignoreNextPopstate = true;
        try {
          history.back();
        } catch (_) {
          this.#ignoreNextPopstate = false;
        }
      }
      // if fromPopstate, the browser already consumed the entry
    }
  }

  #onFocusIn = (e) => {
    const el = e.target;
    if (!this.#shouldApplyTo(el)) return;
    this.#showKeyboard(el);
  };

  #onFocusOut = (e) => {
    // Small delay so tapping a key (which can briefly blur) still works
    setTimeout(() => {
      if (!this.#currentInput) return;
      const active = document.activeElement;
      // Stay open if focus is still on the current input or inside the keyboard
      if (active === this.#currentInput) return;
      if (this.#keyboardEl && this.#keyboardEl.contains(active)) return;
      this.#hideKeyboard();
    }, 100);
  };

  #onResize = () => {
    if (this.#currentInput && !this.#shouldApplyTo(this.#currentInput)) {
      this.#hideKeyboard();
    }
  };

  /**
   * Hardware / software Back button.
   * Closes the keyboard first (like the native keyboard).
   */
  #onPopState = () => {
    if (this.#ignoreNextPopstate) {
      this.#ignoreNextPopstate = false;
      return;
    }
    if (this.#currentInput) {
      this.#hideKeyboard(false, true);
    }
  };

  /**
   * Block native key input while our keyboard is active on the field,
   * and allow Escape to dismiss.
   */
  #onKeyDown = (e) => {
    if (!this.#currentInput) return;

    if (e.key === "Escape") {
      e.preventDefault();
      this.#hideKeyboard();
      this.#currentInput?.blur();
      return;
    }

    // Allow navigation / selection keys so user can move the caret
    const allowed = [
      "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown",
      "Home", "End", "Tab",
      "Shift", "Control", "Alt", "Meta",
      "Backspace", "Delete" // we also handle these via our keys, but native is fine
    ];
    if (allowed.includes(e.key) || e.ctrlKey || e.metaKey) {
      return; // let the browser move the caret / select
    }

    // Block everything else (letters, numbers, etc.) so only our keyboard types
    if (this.#config.preventNative && e.target === this.#currentInput) {
      e.preventDefault();
    }
  };

  #attachGlobalListeners() {
    this.#boundHandlers.focusin = this.#onFocusIn;
    this.#boundHandlers.focusout = this.#onFocusOut;
    this.#boundHandlers.resize = this.#onResize;
    this.#boundHandlers.popstate = this.#onPopState;
    this.#boundHandlers.keydown = this.#onKeyDown;

    document.addEventListener("focusin", this.#boundHandlers.focusin, true);
    document.addEventListener("focusout", this.#boundHandlers.focusout, true);
    window.addEventListener("resize", this.#boundHandlers.resize);
    window.addEventListener("popstate", this.#boundHandlers.popstate);
    document.addEventListener("keydown", this.#boundHandlers.keydown, true);
  }

  #detachGlobalListeners() {
    if (this.#boundHandlers.focusin) {
      document.removeEventListener("focusin", this.#boundHandlers.focusin, true);
      document.removeEventListener("focusout", this.#boundHandlers.focusout, true);
      window.removeEventListener("resize", this.#boundHandlers.resize);
      window.removeEventListener("popstate", this.#boundHandlers.popstate);
      document.removeEventListener("keydown", this.#boundHandlers.keydown, true);
      this.#boundHandlers = {};
    }
  }

  #observeDynamicInputs() {
    this.#observer = new MutationObserver(() => {});
    this.#observer.observe(document.body, { childList: true, subtree: true });
  }

  #disconnectObserver() {
    if (this.#observer) {
      this.#observer.disconnect();
      this.#observer = null;
    }
  }
}



  global.KeyShield = Keyboard;
  global.Keyboard = Keyboard;
})(typeof window !== "undefined" ? window : this);
