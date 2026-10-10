# Testy sichty.html

Testy spouštějí skutečný skript z `sichty.html` v node (modul `vm`) s atrapou DOM a localStorage.
Potřebují jen node (bez instalace balíčků).

    TZ=Europe/Prague node --test testy/*.test.js

- `baseline.json` – výsledky původního kódu (commit 40f917a): rozpisy A–D za 2024–2031 a 120 měsíčních
  výpočtů mezd Progresu a Bony. Po každé změně musí aplikace vyjít stejně.
- `make-baseline.js` – vyrobí baseline z původního kódu. Pouštět jen když se chování mění úmyslně.
- `harness.js` – spuštění aplikace v node, `fixture-storage.js` – obsah localStorage pro testy.
- `etapa1.test.js` – model firem, migrace, rozpis z cyklu, data po firmách, záloha.
