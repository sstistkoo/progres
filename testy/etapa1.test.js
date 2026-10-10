'use strict';
// Etapa 1: datový model firem, migrace, rozpis z cyklu, data po firmách, záloha.
// Spuštění: TZ=Europe/Prague node --test testy/

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { createApp } = require('./harness');
const { storageFor } = require('./fixture-storage');
const baseline = require('./baseline.json');

const DATA_KEYS = ['overtimeDays', 'multiMachineDays', 'slidingShiftDays', 'shiftOverrides', 'notes',
    'yearlyNotes', 'vacationSettings', 'currentShift'];

// --- pomocné ---------------------------------------------------------------------

function addFirm(app, firm) {
    app.run(`firms.push(sanitizeFirm(${JSON.stringify(firm)})); saveFirms();`);
}

function switchFirm(app, id) {
    app.run(`employerProfile = ${JSON.stringify(id)}; localStorage.setItem('employerProfile', employerProfile); loadFirmData();`);
}

function testFirm(overrides) {
    return Object.assign({
        id: 'f_test',
        name: 'Testovací',
        note: '',
        dataKey: 'f_test',
        schedule: [{
            from: null,
            types: {},
            cycle: ['R', 'R', 'N', 'N', '-', '-', '-', '-'],
            groups: [
                { id: 'A', name: 'A', start: '2026-01-05' },
                { id: 'B', name: 'B', start: '2026-01-07' }
            ]
        }]
    }, overrides || {});
}

// Nezávislá kontrola cyklu: jde po dnech od data prvního dne (UTC), bez vzorce s modulem
function referenceShift(cycle, startKey, dateKey) {
    const [sy, sm, sd] = startKey.split('-').map(Number);
    const [ty, tm, td] = dateKey.split('-').map(Number);
    const target = Date.UTC(ty, tm - 1, td);
    const cursor = new Date(Date.UTC(sy, sm - 1, sd));
    let index = 0;
    const step = target >= cursor.getTime() ? 1 : -1;
    while (cursor.getTime() !== target) {
        cursor.setUTCDate(cursor.getUTCDate() + step);
        index = (index + step + cycle.length) % cycle.length;
    }
    return cycle[index];
}

function dateKeys(fromKey, toKey) {
    const out = [];
    const d = new Date(Date.UTC(...fromKey.split('-').map((n, i) => (i === 1 ? n - 1 : +n))));
    const end = Date.UTC(...toKey.split('-').map((n, i) => (i === 1 ? n - 1 : +n)));
    while (d.getTime() <= end) {
        out.push(d.toISOString().slice(0, 10));
        d.setUTCDate(d.getUTCDate() + 1);
    }
    return out;
}

// --- shoda s původním kódem ------------------------------------------------------

test('rozpisy A-D 2024-2031 jsou shodné s původním kódem', () => {
    const app = createApp();
    for (const group of baseline.groups) {
        for (const year of baseline.years) {
            const actual = app.run(`generateShifts(${year}, '${group}').map(s => s.shift).join('')`);
            assert.equal(actual, baseline.rotation[group][year], `skupina ${group}, rok ${year}`);
        }
    }
});

test('mzdy Progres i Bona jsou shodné s původním kódem (120 měsíců)', () => {
    let months = 0;
    for (const variant of Object.keys(baseline.wages)) {
        for (const profile of Object.keys(baseline.wages[variant])) {
            const expected = baseline.wages[variant][profile];
            const app = createApp({ storage: storageFor(baseline.fixture, variant) });
            app.run(`applyEmployerProfile('${profile}')`);
            const settings = app.json('getWageSettings()');
            settings.hasTaxDeclaration = true;
            assert.deepEqual(settings, expected.settings, `nastavení ${variant}/${profile}`);
            for (const c of expected.cases) {
                const summary = app.json(`computeYearlyWageSummary(${c.year}, '${c.group}', ${JSON.stringify(c.settings)})`);
                assert.deepEqual(summary, c.summary, `${variant}/${profile} ${c.group} ${c.year}`);
                months += 12;
            }
        }
    }
    assert.equal(months, 120);
});

// --- model firem a migrace -------------------------------------------------------

test('první spuštění vytvoří Bonu a Progres a nic nepřesune', () => {
    const app = createApp();
    const stored = JSON.parse(app.storage.getItem('firms'));
    assert.equal(stored.version, 2);
    assert.deepEqual(stored.firms.map(f => [f.id, f.name, f.note, f.dataKey]), [
        ['firma2', 'Bona', 'aktuální', ''],
        ['firma1', 'Progres', 'dřívější', '']
    ]);
    // žádné klíče s příponou firmy
    assert.deepEqual(app.storage._keys().filter(k => k.includes('__')), []);
    assert.deepEqual(app.json('getGroupIds()'), ['A', 'B', 'C', 'D']);
    assert.equal(app.run('employerProfile'), 'firma2');
    assert.equal(app.storage.getItem('employerProfile'), 'firma2');
});

test('výběr zaměstnavatele se plní z firem', () => {
    const app = createApp();
    const options = app.el('employerProfile').children;
    assert.deepEqual(options.map(o => o.value), ['firma2', 'firma1']);
    assert.deepEqual(options.map(o => o.textContent), ['Bona (aktuální)', 'Progres (dřívější)']);
    assert.equal(app.el('employerProfile').value, 'firma2');
});

test('původní data a nastavení po spuštění zůstanou beze změny', () => {
    const storage = Object.assign(storageFor(baseline.fixture, 'ulozene'), {
        notes: JSON.stringify({ '24. 9. 2026': 'zubař' }),
        yearlyNotes: JSON.stringify([{ id: 'x', gid: 'g', day: 3, month: 4, text: 'narozeniny' }]),
        vacationSettings: JSON.stringify({ unit: 'days', entitlement: 16, carryOver: { 2026: 2 } }),
        currentShift: 'C',
        employerProfile: 'firma1'
    });
    const app = createApp({ storage });
    assert.equal(app.run('employerProfile'), 'firma1');
    assert.equal(app.run('currentShift'), 'C');
    DATA_KEYS.forEach((key) => {
        assert.equal(app.storage.getItem(key), storage[key], `klíč ${key}`);
    });
    assert.equal(app.storage.getItem('calculatorSettings_firma1'), storage.calculatorSettings_firma1);
    assert.equal(app.storage.getItem('calculatorSettings_firma2'), storage.calculatorSettings_firma2);
    assert.deepEqual(app.json('vacationSettings'), { unit: 'days', entitlement: 16, carryOver: { 2026: 2 } });
    assert.equal(app.json('overtimeDays.A.length === undefined ? overtimeDays.A.size : -1'), 10);
});

test('starší jednotné nastavení kalkulačky se dál převede pod Progres', () => {
    const app = createApp({
        storage: {
            calculatorSettings: JSON.stringify({
                baseWage: 160, nightBonus: 20, weekendBonus: 25, holidayBonus: 100, overtimeBonus: 25,
                childCount: 1, disability: 0, hasTaxDeclaration: true
            })
        }
    });
    assert.equal(JSON.parse(app.storage.getItem('calculatorSettings_firma1')).baseWage, 160);
});

test('migrace je idempotentní: druhé spuštění nic nezmění', () => {
    const first = createApp({ storage: storageFor(baseline.fixture, 'vychozi') });
    const dump = first.storage._dump();
    const second = createApp({ storage: dump });
    assert.equal(second.storage.getItem('firms'), dump.firms);
    DATA_KEYS.forEach((key) => assert.equal(second.storage.getItem(key), dump[key] ?? null, key));
});

test('poškozený záznam firem nahradí výchozí firmy a původní text se uschová', () => {
    for (const broken of ['abc', '{"x":1}', '{"version":1,"firms":[]}',
        JSON.stringify({ version: 1, firms: [{ id: 'a b', dataKey: '', schedule: [] }] })]) {
        const app = createApp({ storage: { firms: broken } });
        assert.equal(app.storage.getItem('firmsPoskozene'), broken);
        assert.deepEqual(app.json('firms.map(f => f.id)'), ['firma2', 'firma1']);
        assert.equal(app.run('generateShifts(2026, "A")[0].shift'), 'R');
    }
});

test('neplatné id aktivní firmy v úložišti spadne na první firmu', () => {
    const app = createApp({ storage: { employerProfile: 'neexistuje' } });
    assert.equal(app.run('employerProfile'), 'firma2');
    const progres = createApp({ storage: { employerProfile: 'firma1' } });
    assert.equal(progres.run('employerProfile'), 'firma1');
});

test('verze rozvrhu se po načtení seřadí a duplicitní id firem se odmítnou', () => {
    const v0 = testFirm().schedule[0];
    const v1 = Object.assign({}, v0, { from: '2026-03-01' });
    const sorted = createApp({
        storage: { firms: JSON.stringify({ version: 1, firms: [testFirm({ schedule: [v1, v0] })] }) }
    });
    assert.deepEqual(sorted.json('firms[0].schedule.map(v => v.from)'), [null, '2026-03-01']);

    const dup = createApp({
        storage: { firms: JSON.stringify({ version: 1, firms: [testFirm(), testFirm()] }) }
    });
    assert.deepEqual(dup.json('firms.map(f => f.id)'), ['firma2', 'firma1']);
});

// --- rozpis z cyklu ----------------------------------------------------------------

test('rozpis z libovolného cyklu odpovídá nezávislému výpočtu po dnech', () => {
    const app = createApp();
    const firm = testFirm({ schedule: [{
        from: null,
        types: {},
        cycle: ['R', 'R', 'N', 'N', '-', '-', '-', '-'],
        groups: [
            { id: 'A', name: 'A', start: '2026-01-05' },
            { id: 'B', name: 'B', start: '2025-12-20' }, // začátek v minulosti
            { id: 'C', name: 'C', start: '2027-02-03' }  // začátek v budoucnosti
        ]
    }] });
    addFirm(app, firm);
    switchFirm(app, 'f_test');

    // přelom roku, letní čas 29. 3. a 25. 10. 2026, přestupný rok 2028
    const ranges = [['2024-12-15', '2027-03-15'], ['2028-02-20', '2028-03-10']];
    const cycle = firm.schedule[0].cycle;
    for (const group of firm.schedule[0].groups) {
        for (const [from, to] of ranges) {
            for (const key of dateKeys(from, to)) {
                const [y, m, d] = key.split('-').map(Number);
                const actual = app.run(`getRotationShift(new Date(${y}, ${m - 1}, ${d}), '${group.id}')`);
                assert.equal(actual, referenceShift(cycle, group.start, key), `${group.id} ${key}`);
            }
        }
    }
});

test('první den cyklu skupiny je v ten den první den cyklu', () => {
    const app = createApp();
    addFirm(app, testFirm());
    switchFirm(app, 'f_test');
    assert.equal(app.run('getRotationShift(new Date(2026, 0, 5), "A")'), 'R');
    assert.equal(app.run('getRotationShift(new Date(2026, 0, 6), "A")'), 'R');
    assert.equal(app.run('getRotationShift(new Date(2026, 0, 7), "A")'), 'N');
    assert.equal(app.run('getRotationShift(new Date(2026, 0, 7), "B")'), 'R');
    assert.equal(app.run('getRotationShift(new Date(2026, 0, 13), "A")'), 'R'); // další cyklus (8 dní)
    assert.equal(app.run('getRotationShift(new Date(2026, 0, 4), "A")'), '-');   // den před začátkem
    assert.equal(app.run('getRotationShift(new Date(2026, 0, 5), "Z")'), '-');   // neznámá skupina
});

test('verze "platí od": starší měsíce zůstanou, od data platí nový rozvrh', () => {
    const app = createApp();
    const oldCycle = ['R', 'R', 'N', 'N', '-', '-', '-', '-'];
    const newCycle = ['O', 'O', 'O', '-', '-'];
    addFirm(app, testFirm({ schedule: [
        { from: null, types: {}, cycle: oldCycle, groups: [{ id: 'A', name: 'A', start: '2026-01-05' }] },
        { from: '2026-03-01', types: {}, cycle: newCycle, groups: [{ id: 'A', name: 'A', start: '2026-03-02' }] }
    ] }));
    switchFirm(app, 'f_test');

    for (const key of dateKeys('2026-01-01', '2026-02-28')) {
        const [y, m, d] = key.split('-').map(Number);
        assert.equal(app.run(`getRotationShift(new Date(${y}, ${m - 1}, ${d}), 'A')`),
            referenceShift(oldCycle, '2026-01-05', key), key);
    }
    for (const key of dateKeys('2026-03-01', '2026-06-30')) {
        const [y, m, d] = key.split('-').map(Number);
        assert.equal(app.run(`getRotationShift(new Date(${y}, ${m - 1}, ${d}), 'A')`),
            referenceShift(newCycle, '2026-03-02', key), key);
    }
    // nejstarší verze s datem platí i zpětně
    const late = createApp();
    addFirm(late, testFirm({ schedule: [
        { from: '2026-03-01', types: {}, cycle: newCycle, groups: [{ id: 'A', name: 'A', start: '2026-03-02' }] }
    ] }));
    switchFirm(late, 'f_test');
    assert.equal(late.run('getRotationShift(new Date(2025, 5, 1), "A")'),
        referenceShift(newCycle, '2026-03-02', '2025-06-01'));
});

test('skupiny firmy určují, jaké skupiny aplikace nabízí', () => {
    const app = createApp();
    addFirm(app, testFirm({ schedule: [{
        from: null, types: {}, cycle: ['R', '-'],
        groups: [{ id: 'X', name: 'Skupina X', start: '2026-01-01' }, { id: 'Y', name: 'Y', start: '2026-01-02' }]
    }] }));
    switchFirm(app, 'f_test');
    assert.deepEqual(app.json('getGroupIds()'), ['X', 'Y']);
    assert.equal(app.run('currentShift'), 'X');
    assert.deepEqual(app.json('Object.keys(overtimeDays)'), ['X', 'Y']);
    assert.deepEqual(app.json('Object.keys(shiftOverrides)'), ['X', 'Y']);
});

// --- data po firmách -----------------------------------------------------------------

test('nová firma má vlastní data, původní klíče zůstávají nedotčené', () => {
    const storage = storageFor(baseline.fixture, 'vychozi');
    const app = createApp({ storage });
    addFirm(app, testFirm());

    switchFirm(app, 'f_test');
    assert.equal(app.run('overtimeDays.A.size'), 0);
    assert.equal(app.run('shiftOverrides.A.size'), 0);
    assert.equal(app.run('multiMachineDays.A.size'), 0);
    assert.equal(app.run('slidingShiftDays.A.size'), 0);

    app.run(`overtimeDays.A.set('2026-02-10', { type: 'R', hours: 2, from: '18:00', to: '20:00', start: 1080, end: 1200, nv: false }); saveOvertimeData();`);
    app.run(`shiftOverrides.B.set('2026-02-11', 'D'); saveShiftOverrides();`);
    app.run(`vacationSettings = { unit: 'days', entitlement: 20, carryOver: {} }; saveVacationSettingsData();`);
    app.run(`currentShift = 'B'; localStorage.setItem(dataStorageKey('currentShift'), currentShift);`);

    assert.ok(app.storage.getItem('overtimeDays__f_test'));
    assert.ok(app.storage.getItem('shiftOverrides__f_test'));
    assert.ok(app.storage.getItem('vacationSettings__f_test'));
    assert.equal(app.storage.getItem('currentShift__f_test'), 'B');
    ['overtimeDays', 'shiftOverrides', 'multiMachineDays', 'slidingShiftDays'].forEach((key) => {
        assert.equal(app.storage.getItem(key), storage[key], `původní klíč ${key} se nesmí změnit`);
    });
    assert.equal(app.storage.getItem('vacationSettings'), null);
    assert.equal(app.storage.getItem('currentShift'), null);

    // zpět na Bonu: vidí původní data, ne data nové firmy
    switchFirm(app, 'firma2');
    assert.equal(app.run('overtimeDays.A.size'), 10);
    assert.equal(app.run('shiftOverrides.B.size'), 13);
    assert.equal(app.run('currentShift'), 'A');
    assert.deepEqual(app.json('vacationSettings'), { unit: 'hours', entitlement: 187.5, carryOver: {} });

    // a zase na novou firmu: její data i zvolená skupina jsou zpět
    switchFirm(app, 'f_test');
    assert.equal(app.run('overtimeDays.A.size'), 1);
    assert.equal(app.run('currentShift'), 'B');
    assert.equal(app.run('vacationSettings.entitlement'), 20);
});

test('Progres a Bona sdílejí původní data (nic se nerozdělilo)', () => {
    const app = createApp({ storage: storageFor(baseline.fixture, 'vychozi') });
    switchFirm(app, 'firma1');
    assert.equal(app.run('overtimeDays.A.size'), 10);
    switchFirm(app, 'firma2');
    assert.equal(app.run('overtimeDays.A.size'), 10);
});

// --- záloha ---------------------------------------------------------------------------

test('záloha obsahuje firmy i data nových firem a po obnově je vše zpět', () => {
    const app = createApp({ storage: storageFor(baseline.fixture, 'ulozene') });
    addFirm(app, testFirm());
    switchFirm(app, 'f_test');
    app.run(`overtimeDays.A.set('2026-02-10', { type: 'R', hours: 2, from: '18:00', to: '20:00', start: 1080, end: 1200, nv: false }); saveOvertimeData();`);
    app.run(`currentShift = 'B'; localStorage.setItem(dataStorageKey('currentShift'), currentShift);`);
    app.storage.setItem('calculatorSettings_f_test', JSON.stringify({ baseWage: '200' }));

    const backup = app.json('buildBackup()');
    assert.equal(backup.version, 2);
    for (const key of ['firms', 'overtimeDays', 'overtimeDays__f_test', 'currentShift__f_test',
        'calculatorSettings_f_test', 'calculatorSettings_firma1', 'calculatorSettings_firma2', 'employerProfile']) {
        assert.equal(typeof backup.data[key], 'string', `v záloze chybí ${key}`);
    }

    const fresh = createApp();
    fresh.run(`applyBackup(${JSON.stringify(backup)})`);
    for (const key of Object.keys(backup.data)) {
        assert.equal(fresh.storage.getItem(key), backup.data[key], key);
    }
    const restored = fresh.reboot();
    assert.deepEqual(restored.json('firms.map(f => f.id)'), ['firma2', 'firma1', 'f_test']);
    switchFirm(restored, 'f_test');
    assert.equal(restored.run('overtimeDays.A.size'), 1);
    assert.equal(restored.run('currentShift'), 'B');
});

test('obnova starší zálohy (verze 1) vrátí výchozí firmy a odstraní data nových firem', () => {
    const app = createApp({ storage: storageFor(baseline.fixture, 'vychozi') });
    addFirm(app, testFirm());
    switchFirm(app, 'f_test');
    app.run(`overtimeDays.A.set('2026-02-10', { type: 'R', hours: 2 }); saveOvertimeData();`);
    app.storage.setItem('calculatorSettings_f_test', JSON.stringify({ baseWage: '200' }));

    const oldBackup = {
        app: 'progres-smeny',
        version: 1,
        data: {
            overtimeDays: JSON.stringify({ A: [['2025-01-01', { type: 'R', hours: 1 }]], B: [], C: [], D: [] }),
            calculatorSettings_firma1: JSON.stringify({ baseWage: '149' }),
            employerProfile: 'firma1'
        }
    };
    app.run(`applyBackup(${JSON.stringify(oldBackup)})`);

    assert.equal(app.storage.getItem('firms'), null);
    assert.equal(app.storage.getItem('overtimeDays__f_test'), null);
    assert.equal(app.storage.getItem('calculatorSettings_f_test'), null);
    assert.equal(app.storage.getItem('overtimeDays'), oldBackup.data.overtimeDays);
    assert.equal(app.storage.getItem('calculatorSettings_firma1'), oldBackup.data.calculatorSettings_firma1);

    const restored = app.reboot();
    assert.deepEqual(restored.json('firms.map(f => f.id)'), ['firma2', 'firma1']);
    assert.equal(restored.run('employerProfile'), 'firma1');
    assert.equal(restored.run('overtimeDays.A.size'), 1);
});

test('záloha ignoruje cizí klíče a hodnoty, které nejsou text', () => {
    const app = createApp();
    app.run(`applyBackup(${JSON.stringify({
        data: { cizi: 'x', overtimeDays: { A: [] }, 'overtimeDays__ok': '{}', 'overtimeDays__zly klic': '{}' }
    })})`);
    assert.equal(app.storage.getItem('cizi'), null);
    assert.equal(app.storage.getItem('overtimeDays'), null);
    assert.equal(app.storage.getItem('overtimeDays__ok'), '{}');
    assert.equal(app.storage.getItem('overtimeDays__zly klic'), null);
});

// --- service worker a zbytky starého kódu ---------------------------------------------

test('service worker má zvednutou verzi cache', () => {
    const sw = fs.readFileSync(path.join(__dirname, '..', 'sichty-sw.js'), 'utf8');
    const version = Number(/CACHE_NAME = 'sichty-cache-v(\d+)'/.exec(sw)[1]);
    assert.ok(version >= 14, `CACHE_NAME je v${version}`);
});

test('pevné konstanty rozvrhu z původního kódu už v aplikaci nejsou', () => {
    const html = fs.readFileSync(path.join(__dirname, '..', 'sichty.html'), 'utf8');
    assert.ok(!html.includes('SHIFT_CYCLE_REFERENCE_DATE'));
    assert.ok(!html.includes('SHIFT_CYCLE_A_OFFSET'));
});
