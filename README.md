# KeyShield

**Secure custom virtual keyboard for fintech and privacy-sensitive web applications.**

KeyShield replaces the native device keyboard with a controlled on-screen keyboard. It is designed to reduce exposure to keyloggers while preserving a native-like user experience (caret, selection, Back button, form submit, multi-language layouts).

Built and maintained by **[Vora-Teck](mailto:vorateck@gmail.com)**.

---

## Features

- **Anti-keylogging focus** — blocks the OS keyboard via `inputmode="none"` and targeted type handling for `number` / `tel`
- **Native-like UX** — bottom sheet, content spacer, safe-area, Back button closes keyboard first, Enter submits forms
- **Visible caret & cursor positioning** — users can tap and use arrow keys to place the insertion point
- **Multi-language** — English (US/UK) and Arabic (RTL); easy to add more layouts
- **Themes** — `dark`, `light`, `fintech` (extensible)
- **Size breakpoints** — activate only on selected viewport sizes
- **Zero dependencies** — pure ES module or global script build
- **Singleton lifecycle** — `config` / `update` / `init` / `stop` / `clear`

---

## Quick start

### ES Module

```js
import { Keyboard } from "./keyshield.js";

const keyboard = new Keyboard({
  class: "secure-input",
  types: ["text", "password", "number"],
  theme: "fintech",
  animation: true,
  lang: ["en-us", "ar"]
});

keyboard.init();
```

### Script tag (no bundler)

```html
<script src="./keyshield.global.js"></script>
<script>
  const keyboard = new KeyShield({
    class: "secure-input",
    theme: "dark",
    animation: true
  });
  keyboard.init();
</script>
```

`window.Keyboard` is also available as an alias of `window.KeyShield`.

---

## Configuration options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `class` | `string \| null` | `null` | CSS class that marks target inputs. When set, both class and type must match. |
| `types` | `string[]` | `["text","number","url","email","password","tel","search"]` | Input types the keyboard applies to. |
| `theme` | `string` | `"dark"` | `"dark"` \| `"light"` \| `"fintech"` |
| `size` | `string` | `"all"` | Max viewport: `xs` · `sm` · `md` · `lg` · `xl` · `all` |
| `animation` | `boolean` | `false` | Slide-in and key-press animations |
| `lang` | `string[]` | `["en-us"]` | Layouts to enable. Built-in: `en-us`, `en-uk`, `ar` |
| `preventNative` | `boolean` | `true` | Block the OS keyboard |
| `vibrate` | `boolean` | `true` | Haptic feedback on key press |
| `maxLengthRespect` | `boolean` | `true` | Honour `maxlength` |

---

## Methods

| Method | Description |
|--------|-------------|
| `config(options)` | Set configuration (chainable). Does not start the keyboard. |
| `update(options)` | Merge options; restarts if already initialized. |
| `init()` | Inject UI and attach listeners. |
| `stop()` | Remove UI and listeners; restore native keyboard. |
| `clear()` | `stop()` + reset config to defaults. |

Only one instance is allowed (singleton). Constructing again returns the existing instance.

---

## Behaviour notes

- Hardware / software **Back** button closes the keyboard first (history state).
- **Escape** also dismisses the keyboard.
- **Enter** on single-line inputs submits the parent form when present.
- `number` / `tel` fields open the numeric layout automatically.
- Caret stays visible; insertion happens at the current selection.

---

## Extending

### New language

Add an entry to the `LAYOUTS` object in `keyshield.js` (same row structure as `en-us`), then pass it in `lang`.

### New theme

Add an entry to the `THEMES` object with the same keys (`bg`, `keyBg`, `keyBgActive`, `keyText`, `keyBorder`, `specialBg`, `accent`, `shadow`).

### Frameworks

Create the instance once after the DOM is ready and call `init()`. Because listeners are document-level (capture), dynamically rendered inputs are supported.

```js
// React
useEffect(() => {
  const kb = new Keyboard({ class: "secure-input", theme: "fintech" });
  kb.init();
  return () => kb.stop();
}, []);
```

---

## Repository layout

```
├── index.html              # Documentation SPA (hash routes)
├── keyshield.js            # ES module (full source)
├── keyshield.min.js        # ES module (minified)
├── keyshield.global.js     # IIFE / script-tag build
├── keyshield-logo.jpg      # Brand logo
├── keyboard.js             # Alias of keyshield.js
└── README.md               # This file
```

### SPA routes

| Hash | Page |
|------|------|
| `#home` | Landing / features |
| `#live-demo` | Interactive demo |
| `#documentation` | Install, API, extend, downloads |
| `#terms-of-use` | License & disclaimer |
| `#contact` | Contact form → Gmail / mailto |

---

## Security notice

**Inspect the source before production use.** KeyShield is provided so you can review and adapt it to your threat model. Vora-Teck does not claim that any client-side keyboard fully eliminates keylogging risk; combine it with other controls (HTTPS, CSP, device integrity, server-side validation) as appropriate.

---

## License & copyright

Copyright © 2024–2026 **Vora-Teck**. All rights reserved.

You may use, modify, and integrate KeyShield into your applications. Attribution is appreciated but not required. Do not present modified versions as official Vora-Teck products without permission.

See the in-app **Terms of Use** (`#terms-of-use`) for the full disclaimer and limitation of liability.

---

## Contact

- Email: [vorateck@gmail.com](mailto:vorateck@gmail.com)
- In-app: open the SPA and go to **Contact**

---

**KeyShield** · Vora-Teck · Secure input for the modern web
