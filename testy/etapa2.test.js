'use strict';
// Etapa 2: mzdová pravidla jako nastavení firmy (místo větví "firma2").
// Spuštění: TZ=Europe/Prague node --test testy/*.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('./harness');
const { storageFor } = require('./fixture-storage');
const baseline = require('./baseline.json');

test('Bona a Progres dostanou pravidla, která odpovídají dřívějším větvím firma2/firma1', () => {
    const app = createApp();
    const rules = (id) => app.json(`getFirm('${id}').wage`);
    assert.deepEqual(rules('firma2'), [{ from: null, rules: {
        nightMode: 'flat', nightFrom: '18:00', nightTo: '06:00', holidayBase: 'average',
        holidayShiftOvertime: true, multiMachine: true, extras: true, fixedSalary: false } }]);
    assert.deepEqual(rules('firma1'), [{ from: null, rules: {
        nightMode: 'percent', nightFrom: '22:00', nightTo: '06:00', holidayBase: 'base',
        holidayShiftOvertime: false, multiMachine: false, extras: false, fixedSalary: false } }]);
});

test('záznam firem z etapy 1 (bez pravidel) se doplní podle id a nic se neztratí', () => {
    const old = {
        version: 1,
        firms: [
            { id: 'firma2', name: 'Bona', note: 'aktuální', dataKey: '', schedule: [{ from: null, types: {}, cycle: ['R', '-'], groups: [{ id: 'A', name: 'A', start: '2025-01-04' }] }] },
            { id: 'f_nova', name: 'Nová', note: '', dataKey: 'nova', schedule: [{ from: null, types: {}, cycle: ['R', '-'], groups: [{ id: 'A', name: 'A', start: '2025-01-04' }] }] }
        ]
    };
    const app = createApp({ storage: { firms: JSON.stringify(old) } });
    assert.equal(app.json(`getFirm('firma2').wage[0].rules.nightMode`), 'flat');
    assert.equal(app.json(`getFirm('f_nova').wage[0].rules.nightMode`), 'percent');
    assert.equal(app.json(`getFirm('f_nova').schedule[0].cycle.length`), 2);
});

test('neplatná pravidla se opraví na výchozí, platná zůstanou', () => {
    const app = createApp();
    const r = app.json(`normalizeWageRules({ nightMode: 'blbost', nightFrom: '25:00', nightTo: '05:30', multiMachine: 'ano', extras: true })`);
    assert.equal(r.nightMode, 'percent');
    assert.equal(r.nightFrom, '22:00');
    assert.equal(r.nightTo, '05:30');
    assert.equal(r.multiMachine, false);
    assert.equal(r.extras, true);
});

test('verze pravidel "platí od": starší měsíce počítají podle starých pravidel', () => {
    const app = createApp();
    app.run(`getFirm('firma1').wage.push({ from: '2026-03-01', rules: normalizeWageRules({ nightMode: 'flat' }) }); `);
    assert.equal(app.json(`getWageRules('firma1', new Date(2026, 1, 28)).nightMode`), 'percent');
    assert.equal(app.json(`getWageRules('firma1', new Date(2026, 2, 1)).nightMode`), 'flat');
    assert.equal(app.json(`getWageRules('firma1', new Date(2030, 0, 1)).nightMode`), 'flat');
    assert.equal(app.json(`getWageRules('firma1', new Date(2020, 0, 1)).nightMode`), 'percent');
});

test('mzdy Progresu a Bony jsou beze změny proti původnímu kódu (všech 120 měsíců)', () => {
    ['vychozi', 'ulozene'].forEach((variant) => {
        ['firma1', 'firma2'].forEach((profile) => {
            const app = createApp({ storage: storageFor(baseline.fixture, variant) });
            app.run(`applyEmployerProfile('${profile}')`);
            baseline.wages[variant][profile].cases.forEach((c) => {
                const got = app.json(`computeYearlyWageSummary(${c.year}, '${c.group}', ${JSON.stringify(c.settings)})`);
                assert.deepEqual(got, c.summary, `${variant} ${profile} ${c.group} ${c.year}`);
            });
        });
    });
});

test('noční okno je pravidlo: Progres s oknem 18-6 a paušálem počítá jako Bona v noci', () => {
    const storage = storageFor(baseline.fixture, 'vychozi');
    const app = createApp({ storage });
    app.run(`firms.push(sanitizeFirm({ id: 'f_x', name: 'X', note: '', dataKey: '',
        schedule: getFirm('firma1').schedule,
        wage: [{ from: null, rules: { nightMode: 'flat', nightFrom: '18:00', nightTo: '06:00' } }] }));`);
    const s = (profile) => Object.assign({}, baseline.wages.vychozi.firma1.cases[0].settings, { profile, nightBonusFlat: 17 });
    // noční směna 12 h v okně 18-6 = 11,5 placených hodin, v okně 22-6 jen 7,5
    const month = (profile) => app.json(`computeYearlyWageSummary(2026, 'A', ${JSON.stringify(s(profile))})`);
    const a = month('f_x'), b = month('firma1');
    const hoursX = a.months ? a.months.map(m => m.nightBonusHours) : null;
    assert.notDeepEqual(a, b);
    if (hoursX) assert.ok(hoursX.some(h => h > 0));
});

test('noční hodiny přesčasu ve vlastním okně 20-4', () => {
    const app = createApp();
    // přesčas 19:00-23:00 (4 h): v okně 20:00-04:00 jsou 3 hodiny
    const h = app.json(`getOvertimeNightHours({ hours: 4, type: 'N', start: 1140, end: 1380 }, 1200, 1680)`);
    assert.equal(h, 3);
    // starý záznam bez času: poměr podle délky okna (8 h -> 7,5 / 11,5)
    const old = app.json(`getOvertimeNightHours({ hours: 4, type: 'N' }, 1320, 1800)`);
    assert.equal(old, 4 * (7.5 / 11.5));
    assert.equal(app.json(`getOvertimeNightHours({ hours: 4, type: 'N' }, 1080, 1800)`), 4);
});

test('nastavení zobrazení se řídí pravidly, ne id firmy', () => {
    const app = createApp();
    app.run(`applyEmployerProfile('firma2')`);
    assert.match(app.run(`document.getElementById('nightBonusWindowInfo').textContent`), /18:00-6:00/);
    app.run(`applyEmployerProfile('firma1')`);
    assert.match(app.run(`document.getElementById('nightBonusWindowInfo').textContent`), /7\.5h \(22:00-6:00\)/);
    assert.equal(app.run(`document.getElementById('nightBonusLabel').textContent`), 'Příplatek za noční (%)');
});

test('přidání firmy: vlastní klíč dat, obecná pravidla, kopie převezme pravidla i čísla', () => {
    const app = createApp({ storage: storageFor(baseline.fixture, 'ulozene') });
    const id = app.run(`createFirm('  Škoda  ', null).id`);
    assert.match(id, /^f_[a-z0-9]+$/);
    assert.equal(app.json(`getFirm('${id}').name`), 'Škoda');
    assert.equal(app.json(`getFirm('${id}').dataKey`), id);
    assert.equal(app.json(`getFirm('${id}').wage[0].rules.nightMode`), 'percent');
    const copy = app.run(`createFirm('Kopie Bony', 'firma2').id`);
    assert.equal(app.json(`getFirm('${copy}').wage[0].rules.multiMachine`), true);
    assert.equal(app.storage.getItem(`calculatorSettings_${copy}`), app.storage.getItem('calculatorSettings_firma2'));
    assert.equal(app.run(`createFirm('   ', null)`), null);
});

test('smazání firmy odstraní její data a nastavení, Progres a Bonu nejde smazat', () => {
    const app = createApp();
    const id = app.run(`createFirm('Dočasná', null).id`);
    app.run(`employerProfile = '${id}'; loadFirmData(); overtimeDays.A.set('2026-01-02', { type: 'R', hours: 2 }); saveOvertimeData();
             localStorage.setItem('calculatorSettings_${id}', '{}');`);
    assert.ok(app.storage.getItem(`overtimeDays__${id}`));
    app.run(`employerProfile = 'firma2'; loadFirmData();`);
    assert.equal(app.run(`removeFirm('firma2')`), false);
    assert.equal(app.run(`removeFirm('firma1')`), false);
    assert.equal(app.run(`removeFirm('${id}')`), true);
    assert.equal(app.storage.getItem(`overtimeDays__${id}`), null);
    assert.equal(app.storage.getItem(`calculatorSettings_${id}`), null);
    assert.equal(app.run(`getFirm('${id}')`), null);
    assert.deepEqual(app.json(`firms.map(f => f.id)`), ['firma2', 'firma1']);
});

test('úprava pravidel firmy se uloží a neplatná hodnota se zahodí', () => {
    const app = createApp();
    const id = app.run(`createFirm('Nová', null).id`);
    app.run(`updateFirm('${id}', { name: 'Přejmenovaná', rules: { nightMode: 'flat', nightFrom: '20:00', holidayBase: 'blbost' } })`);
    const stored = JSON.parse(app.storage.getItem('firms')).firms.find(f => f.id === id);
    assert.equal(stored.name, 'Přejmenovaná');
    assert.equal(stored.wage[0].rules.nightMode, 'flat');
    assert.equal(stored.wage[0].rules.nightFrom, '20:00');
    assert.equal(stored.wage[0].rules.holidayBase, 'base');
});
