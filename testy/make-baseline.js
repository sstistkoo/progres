'use strict';
// Vyrobí testy/baseline.json z ORIGINÁLNÍHO kódu sichty.html (před přestavbou na více firem,
// commit 40f917a). Baseline obsahuje:
//   - rozpisy směn A-D za roky 2024-2031 (řetězec R/N/- na každý den),
//   - fixture (přesčasy, vícestroj, klouzáky, ruční změny, nemoc) uložená v localStorage,
//   - mzdové rozpisy po měsících pro Progres i Bonu s tímto fixture.
// Po každé etapě musí nový kód vyjít stejně. Skript se pouští jen znovu, když se úmyslně
// mění očekávané chování (a pak se to musí zdůvodnit v commitu).
//
// Použití: TZ=Europe/Prague node testy/make-baseline.js [cesta-k-původnímu-html]

const fs = require('fs');
const path = require('path');
const { createApp } = require('./harness');
const { storageFor } = require('./fixture-storage');

const htmlPath = process.argv[2] || undefined;
const GROUPS = ['A', 'B', 'C', 'D'];
const YEARS = [2024, 2025, 2026, 2027, 2028, 2029, 2030, 2031];

function boot(storage) {
    return createApp({ storage, htmlPath });
}

// --- rozpisy -----------------------------------------------------------------
const clean = boot({});
const rotation = {};
GROUPS.forEach((g) => {
    rotation[g] = {};
    YEARS.forEach((y) => {
        rotation[g][y] = clean.run(`generateShifts(${y}, '${g}').map(s => s.shift).join('')`);
    });
});

// --- fixture -------------------------------------------------------------------
// n-tý den, kdy má skupina podle rozvrhu práci (R nebo N), v daném měsíci (month 1-12)
function pickWork(group, year, month, nth) {
    const days = clean.json(
        `generateShifts(${year}, '${group}').filter(s => s.date.getMonth() === ${month - 1} && (s.shift === 'R' || s.shift === 'N')).map(s => toDateKey(s.date))`
    );
    if (!days[nth]) throw new Error(`Chybí pracovní den ${group} ${year}-${month} #${nth}`);
    return days[nth];
}

const pad = (n) => String(n).padStart(2, '0');
function range(fromKey, toKey) {
    const out = [];
    const [fy, fm, fd] = fromKey.split('-').map(Number);
    const [ty, tm, td] = toKey.split('-').map(Number);
    const d = new Date(fy, fm - 1, fd);
    const end = new Date(ty, tm - 1, td);
    while (d <= end) {
        out.push(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`);
        d.setDate(d.getDate() + 1);
    }
    return out;
}

function ot(type, hours, from, to, start, end, nv) {
    return { type, hours, from, to, start, end, nv };
}

const fixture = {
    overtimeDays: {
        A: [
            ['2025-03-15', ot('R', 11.5, '06:00', '18:00', 360, 1080, false)],
            ['2025-05-01', ot('N', 11.5, '18:00', '06:00', 1080, 1800, false)],
            ['2025-07-12', ot('N', 2, '06:00', '08:00', 1800, 1920, false)],
            ['2025-11-08', ot('N', 4, '18:00', '22:30', 1080, 1350, true)],
            ['2025-12-27', { type: 'N', hours: 4 }],
            ['2026-03-29', ot('R', 3, '06:00', '09:30', 360, 570, false)],
            ['2026-05-08', ot('R', 2, '18:00', '20:00', 1080, 1200, false)],
            ['2026-09-28', ot('R', 5.5, '06:00', '12:00', 360, 720, false)],
            ['2026-10-25', ot('N', 6, '22:00', '04:00', 1320, 1680, true)],
            ['2026-12-24', ot('R', 4, '08:00', '12:30', 480, 750, false)]
        ],
        B: [
            ['2026-02-14', ot('R', 11.5, '06:00', '18:00', 360, 1080, false)],
            ['2026-09-27', ot('N', 3, '19:00', '22:00', 1140, 1320, false)]
        ],
        C: [],
        D: []
    },
    multiMachineDays: {
        A: [
            ['2025-04-02', { percent: 30, hours: null }],
            ['2026-09-11', { percent: 25, hours: 6 }],
            ['2026-10-02', { percent: 50, hours: null }]
        ],
        B: [['2026-09-14', { percent: 40, hours: null }]],
        C: [],
        D: []
    },
    slidingShiftDays: {
        A: [['2025-04-10', true], ['2026-01-02', true], ['2026-12-31', true]],
        B: [['2026-09-20', true]],
        C: [],
        D: []
    },
    shiftOverrides: { A: [], B: [], C: [], D: [] }
};

// ruční změny směn - dovolená/náhradní volno jen na dny s rozvrhovou směnou
const overridesA = new Map();
[0, 1, 2].forEach((i) => overridesA.set(pickWork('A', 2025, 2, i), 'D'));
[4, 5].forEach((i) => overridesA.set(pickWork('A', 2025, 8, i), 'NV'));
overridesA.set(pickWork('A', 2025, 6, 3), 'R');
overridesA.set(pickWork('A', 2025, 6, 6), 'N');
overridesA.set(pickWork('A', 2026, 3, 2), '-');
overridesA.set(pickWork('A', 2026, 5, 1), 'D');
overridesA.set(pickWork('A', 2026, 9, 6), 'D');
overridesA.set(pickWork('A', 2026, 11, 2), 'NV');
// nemoc přes přelom roku a dlouhá nemoc přes přelom čtrvtletí (víc než 14 dní)
range('2025-12-29', '2026-01-05').forEach((k) => overridesA.set(k, 'NEM'));
range('2026-09-07', '2026-09-26').forEach((k) => overridesA.set(k, 'NEM'));
fixture.shiftOverrides.A = Array.from(overridesA.entries());

const overridesB = new Map();
overridesB.set(pickWork('B', 2026, 9, 3), 'D');
overridesB.set(pickWork('B', 2026, 9, 4), 'D');
range('2026-10-20', '2026-10-30').forEach((k) => overridesB.set(k, 'NEM'));
fixture.shiftOverrides.B = Array.from(overridesB.entries());

// --- mzdy ------------------------------------------------------------------------
const WAGE_CASES = {
    vychozi: [
        { group: 'A', year: 2026, vacationRate: 0 },
        { group: 'A', year: 2026, vacationRate: 190 },
        { group: 'A', year: 2025, vacationRate: 0 }
    ],
    ulozene: [
        { group: 'A', year: 2026, vacationRate: null },
        { group: 'B', year: 2026, vacationRate: null }
    ]
};

const wages = {};
Object.keys(WAGE_CASES).forEach((variant) => {
    wages[variant] = {};
    ['firma1', 'firma2'].forEach((profile) => {
        const app = boot(storageFor(fixture, variant));
        app.run(`applyEmployerProfile('${profile}')`);
        const settings = app.json('getWageSettings()');
        // atrapa DOM nemá zaškrtnuté políčko z HTML - prohlášení k dani se bere z taxSettings
        settings.hasTaxDeclaration = true;
        wages[variant][profile] = { settings, cases: [] };
        WAGE_CASES[variant].forEach((c) => {
            const s = Object.assign({}, settings);
            if (c.vacationRate !== null) s.vacationRate = c.vacationRate;
            const summary = app.json(`computeYearlyWageSummary(${c.year}, '${c.group}', ${JSON.stringify(s)})`);
            wages[variant][profile].cases.push({ ...c, settings: s, summary });
        });
    });
});

const out = { zdroj: 'původní kód sichty.html, commit 40f917a', groups: GROUPS, years: YEARS, rotation, fixture, wages };
const target = path.join(__dirname, 'baseline.json');
fs.writeFileSync(target, JSON.stringify(out));
const months = Object.values(wages).reduce((n, v) => n + Object.values(v).reduce((m, p) => m + p.cases.length * 12, 0), 0);
console.log(`Zapsáno ${target} (${(fs.statSync(target).size / 1024).toFixed(0)} kB), ${months} měsíčních výpočtů mezd.`);
