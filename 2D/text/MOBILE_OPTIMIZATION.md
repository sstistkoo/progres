# 📱 Mobilní Optimalizace - Ověření

## ✅ Provedené Optimalizace

### 1. **Font-size na Input Prvcích**
- ✅ `aiPrompt` textarea: **font-size: 16px** (iOS keyboard fix)
- ✅ Všechny `input` prvky: **font-size: 16px**
- ✅ Keypad tlačítka: **font-size: 16px**

### 2. **Touch Target Velikosti** (Minimálně 44×44px dle iOS, 48×48px dle Android)
- ✅ Toolbar tlačítka: **min-height: 56px** (portrait), **60px** (landscape)
- ✅ Keypad tlačítka: **min-height: 44px** + **padding: 12px**
- ✅ Modal tlačítka: Dostatečné padding

### 3. **Spacing & Gap**
- ✅ Portrait toolbar: **gap: 6px** (bylo 3px) - lepší oddělení tlačítek
- ✅ Keypad grid: **gap: 8px**
- ✅ Toolbar padding: **8px 5px** (bylo 5px 3px)

### 4. **Responsive Layout**
- ✅ Viewport meta tag: `width=device-width, initial-scale=1.0, viewport-fit=cover`
- ✅ Modal max-height: **90vh** + `overflow-y: auto` (scrolling na malých displejích)
- ✅ Special breakpoint pro ultra-malé displeje: **@media (max-width: 320px)**

### 5. **Touch & Gesture Handling**
- ✅ Canvas: `touch-action: none` (prevence výchozího scroll/zoom)
- ✅ Pinch-to-zoom prevence: V init.js - zachycení multitouchových eventů
- ✅ Touch cursor: Speciální UI feedback pro touch

### 6. **Safe Area Handling** (Notches, Home Indicators)
- ✅ Body: `height: 100dvh` (dynamic viewport height)
- ✅ Toolbar padding: `env(safe-area-inset-bottom)` - respektuje Home Indicator
- ✅ Landscape mode: `right: 80px` vs Portrait: 50% centered

### 7. **CSS Media Queries**
```
- max-width: 768px (tablet/mobile)
  - orientation: portrait   → toolbar dole, vertical centered
  - orientation: landscape  → toolbar vpravo

- max-width: 360px (malé telefony)
  - modal width: 95%
  - modal padding: 15px

- max-width: 320px (ultra-malé telefony)
  - toolbar button: 16px ikona
  - keypad: menší padding
```

## 🧪 Testované Scénáře

### Na Mobilech Funguje:
- ✅ Portrait a landscape orientace - toolbar se automaticky přepíná
- ✅ Canvas drawing - touch eventy bez defaultního scroll/zoom
- ✅ Keyboard input - 16px font zabezpečuje, že se iOS keyboard nezoomuje
- ✅ Modály - maximálně zabírají 90vh, jsou scrollovatelné
- ✅ Tlačítka - all at least 44-48px pro pohodlné klikání

### Potenciální Problémy Vyřešeny:
- ❌ ~~iOS auto-zoom na < 16px input~~ → ✅ Fixováno
- ❌ ~~Příliš blízké tlačítka (gap 3px)~~ → ✅ Zvětšeno na 6px
- ❌ ~~Modal overflow na malých displayích~~ → ✅ max-height: 90vh
- ❌ ~~Pinch-to-zoom rozbitý UI~~ → ✅ Zakázáno
- ❌ ~~Home indicator overlaps~~ → ✅ Safe area handled

## 📊 Velikosti Displejů (Testováno)

| Velikost | Případ Použití | Status |
|----------|---|---|
| < 320px | Ultra-malé telefony | ✅ Optimalizováno |
| 320-480px | Starší Android | ✅ OK |
| 480-768px | Moderní telefony | ✅ OK |
| 768-1024px | Tablety (portrait) | ✅ OK |
| > 1024px | Desktop/Landscape | ✅ OK |

## 🎮 Orientace

### Portrait (Výška > Šířka)
- Toolbar: **dole, horizontálně**, 50% centered
- Canvas: **plná výška** minus toolbar
- Modály: Vertikálně v centru

### Landscape (Šířka > Výška)
- Toolbar: **vpravo, vertikálně**
- Canvas: **plná šířka** minus toolbar
- Modály: Vertikálně v centru

## 🔧 Technické Detaily

### viewport meta tag
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no, viewport-fit=cover">
```
- `viewport-fit=cover` - respektuje notches
- `user-scalable=no` - prevence pinch zoom (UI-breaking)

### Canvas Handling
```css
canvas {
  touch-action: none;  /* Prevence defaultního scroll/zoom */
  width: 100%;
  height: 100%;
}
```

### Font-size 16px Requirement
iOS Safari automaticky zoomuje při <16px input - nyní fixováno.

## 📱 Browser Support

- ✅ iOS Safari 14+
- ✅ Android Chrome/Firefox
- ✅ Samsung Internet
- ✅ Firefox Mobile
- ✅ Edge Mobile

## ⚠️ Poznámky

1. **Virtuální klávesnice** - obsadí ~50% výšky, ale modály mají `max-height: 90vh`
2. **Performance** - touch events bez debounce by mohly být problém na starších zařízeních
3. **Network** - Gemini API volání mohou být pomalá na 3G - zvažte loading spinner

## 📋 Checklist

- [x] Viewport meta tag - správný
- [x] Font-size >= 16px - všechny inputs
- [x] Touch targets >= 44px - OK
- [x] Responsive layout - OK
- [x] Safe area handling - env() used
- [x] Touch gestures - handled
- [x] Modal overflow - scrollable
- [x] Orientace support - both
- [x] Pinch-zoom - disabled
- [x] Canvas interaction - OK

---
**Stav:** ✅ Mobilně optimalizováno a testováno
**Poslední update:** 18. prosince 2025
