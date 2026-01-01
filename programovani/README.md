# HTML Studio v2.0 🚀

Moderní mobilní HTML editor s AI asistencí, live preview a GitHub integrací - **refaktorováno s modulární architekturou**.

## ✨ Co je nového v 2.0

- 🏗️ **Modulární architektura** - Čistě oddělené moduly namísto monolitického souboru
- ⚡ **Vite build systém** - Rychlý development, optimalizovaný production build
- 🎯 **State management** - Centrální správa stavu aplikace
- 🔄 **Event-driven** - Loose coupling mezi moduly přes event bus
- 🧪 **Testovatelné** - Jednotlivé moduly lze snadno testovat
- 📦 **Tree-shaking** - Menší bundle size díky odstranění nepoužitého kódu
- 🔥 **Hot Module Replacement** - Instant aktualizace během vývoje

## 📁 Struktura projektu

```
html-studio/
├── src/
│   ├── core/              # Jádro aplikace
│   │   ├── app.js         # Hlavní aplikace
│   │   ├── state.js       # State management
│   │   ├── events.js      # Event bus
│   │   └── config.js      # Konfigurace
│   │
│   ├── modules/           # Funkční moduly
│   │   ├── editor/        # Editor modul
│   │   └── preview/       # Preview modul
│   │
│   ├── ui/                # UI komponenty
│   │   └── components/    # Modal, Toast, atd.
│   │
│   ├── utils/             # Utility funkce
│   │   ├── dom.js
│   │   ├── string.js
│   │   ├── async.js
│   │   └── shortcuts.js
│   │
│   └── styles/            # Styly
│       ├── main.css
│       ├── base/
│       └── components/
│
├── index.html             # Entry point
├── package.json
├── vite.config.js
└── README.md
```

## 🚀 Rychlý start

### 1. Instalace závislostí

```bash
npm install
```

### 2. Development server

```bash
npm run dev
```

Otevře se na `http://localhost:3000`

### 3. Production build

```bash
npm run build
```

Build se vytvoří v `dist/` složce.

### 4. Preview production buildu

```bash
npm run preview
```

## 📦 Dostupné příkazy

```bash
npm run dev      # Spustí dev server s HMR
npm run build    # Production build
npm run preview  # Preview production buildu
npm run lint     # ESLint kontrola
npm run format   # Prettier formátování
```

## 🎯 Hlavní features

### ✅ Implementováno v 2.0

- [x] Modulární architektura
- [x] State management systém
- [x] Event-driven komunikace
- [x] Editor s line numbers
- [x] Live preview v iframe
- [x] Console capture z preview
- [x] Keyboard shortcuts
- [x] Toast notifikace
- [x] Modal dialogy
- [x] Theme switching (dark/light)
- [x] View modes (split/editor/preview)

### 🚧 Připraveno k migraci

- [ ] AI modul (Gemini, Groq, OpenRouter, atd.)
- [ ] File Manager (tabs, tree view)
- [ ] Code tools (format, minify, validate)
- [ ] GitHub integrace
- [ ] Snippets a templates
- [ ] Auto-complete

## 🏗️ Architektura

### State Management

Centrální state systém s observer patternem:

```javascript
import { state } from '@core/state.js';

// Čtení
const code = state.get('editor.code');

// Zápis
state.set('editor.code', newCode);

// Subscribe na změny
const unsubscribe = state.subscribe('editor.code', code => {
  console.log('Code changed:', code);
});
```

### Event Bus

Loose coupling mezi moduly:

```javascript
import { eventBus } from '@core/events.js';

// Poslat event
eventBus.emit('editor:change', { code });

// Poslouchat event
eventBus.on('editor:change', ({ code }) => {
  preview.update(code);
});
```

### Moduly

Každý modul je samostatná třída s jasnou odpovědností:

```javascript
import Editor from '@modules/editor/Editor.js';

const editor = new Editor(container);
editor.setCode('<h1>Hello</h1>');
```

## 🔧 Konfigurace

Konfigurace v `src/core/config.js`:

```javascript
export const config = {
  app: {
    name: 'HTML Studio',
    version: '2.0.0',
  },
  editor: {
    defaultLanguage: 'html',
    fontSize: 14,
    tabSize: 2,
  },
  // ...
};
```

## 🎨 Styling

CSS je rozdělený do modulárních souborů:

- `base/` - Reset, variables, typography
- `components/` - Komponenty (editor, modal, toast, atd.)
- `main.css` - Import všeho

## 🧪 Testing (plánováno)

```bash
npm run test        # Unit testy
npm run test:watch  # Watch mode
npm run test:coverage  # Coverage report
```

## 📚 Migrace ze staré verze

Stará monolitická verze (`html_studio.html`) je stále funkční a dostupná jako fallback.

Nová verze (`index.html` + `src/`) používá moderní ES modules a Vite bundler.

### Hlavní rozdíly:

| Stará verze           | Nová verze          |
| --------------------- | ------------------- |
| 1 soubor (~17k řádků) | Modulární struktura |
| Inline CSS + JS       | Oddělené soubory    |
| Global scope          | ES Modules          |
| Manuální reload       | HMR                 |
| Těžko testovatelné    | Unit testy          |

## 🤝 Přispívání

1. Fork repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📝 Coding Style

- ESLint + Prettier pro code formatting
- ES6+ syntax (modules, arrow functions, async/await)
- JSDoc komentáře pro důležité funkce
- Názvy v camelCase (proměnné, funkce) a PascalCase (třídy)

## 🐛 Známé problémy

- AI modul zatím není migrován (plánováno)
- File Manager zatím není implementován
- GitHub integrace není portována

## 📄 License

MIT

## 👨‍💻 Autor

GitHub Copilot + Váš tým

---

**Note:** Toto je verze 2.0 s kompletně přepracovanou architekturou. Pro produkční použití doporučujeme dokončit migraci všech modulů.

## 🚀 Další kroky

1. ✅ ~~Setup projektu~~
2. ✅ ~~Core moduly~~
3. ✅ ~~Editor a Preview~~
4. 🔄 **Spustit dev server a otestovat**
5. ⏭️ Portovat AI modul
6. ⏭️ Portovat File Manager
7. ⏭️ Přidat testy
8. ⏭️ Optimalizace a deployment
