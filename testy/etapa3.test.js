'use strict';
// Etapa 3: typy směn, editor rozvrhu (předvolby, bloky, skupiny, platí od, náhled).
// Spuštění: TZ=Europe/Prague node --test testy/*.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('./harness');
const { storageFor } = require('./fixture-storage');
const baseline = require('./baseline.json');

const TODAY = '2026-10-10';

function draftJson(app, preset) {
    return app.json(`presetDraft('${preset}', new Date(2026, 9, 10))`);
}

// Nastaví rozvrh firmy z předvolby (nahradí vše) a přepne na ni
function setupFirm(app, preset, patch) {
    const id = app.run(`createFirm('Test ${preset}', null).id`);
    const draft = draftJson(app, preset);
    if (patch) patch(draft);
    app.run(`applyScheduleVersion('${id}', versionFromDraft(${JSON.stringify(draft)}))`);
    app.run(`switchFirm('${id}')`);
    return id;
}

function dayCodes(app, group, y, m, d, count) {
    return app.json(`Array.from({ length: ${count} }, (_, i) => getRotationShift(new Date(${y}, ${m - 1}, ${d} + i), '${group}')).join('')`)
        .toString();
}

test('každá předvolba projde kontrolou a má očekávanou délku cyklu a počet skupin', () => {
    const app = createApp();
    const expected = { week12: [21, 3], days12: [8, 4], std8: [12, 4], monfri: [7, 1], custom: [12, 4] };
    Object.entries(expected).forEach(([preset, [length, groups]]) => {
        const draft = draftJson(app, preset);
        assert.deepEqual(app.json(`validateDraft(${JSON.stringify(draft)})`), [], preset);
        assert.equal(app.json(`expandBlocks(${JSON.stringify(draft.blocks)}).length`), length, preset);
        assert.equal(draft.groups.length, groups, preset);
    });
});

test('dnešní rozvrh Progresu a Bony jde složit v editoru a vyjde stejně jako původní kód', () => {
    const app = createApp({ storage: storageFor(baseline.fixture, 'ulozene') });
    const draft = draftJson(app, 'custom');
    const legacyStart = { A: '2025-01-04', B: '2025-01-07', C: '2025-01-13', D: '2025-01-10' };
    draft.groups.forEach(g => { g.start = legacyStart[g.id]; });
    app.run(`applyScheduleVersion('firma2', versionFromDraft(${JSON.stringify(draft)}))`);
    app.run(`applyScheduleVersion('firma1', versionFromDraft(${JSON.stringify(draft)}))`);
    ['firma1', 'firma2'].forEach(profile => {
        app.run(`switchFirm('${profile}')`);
        baseline.groups.forEach(g => {
            baseline.years.forEach(y => {
                assert.equal(app.run(`generateShifts(${y}, '${g}').map(s => s.scheduled).join('')`), baseline.rotation[g][y], `${profile} ${g} ${y}`);
            });
        });
        baseline.wages.ulozene[profile].cases.forEach(c => {
            const got = app.json(`computeYearlyWageSummary(${c.year}, '${c.group}', ${JSON.stringify(c.settings)})`);
            assert.deepEqual(got, c.summary, `${profile} ${c.group} ${c.year}`);
        });
    });
});

test('12h po dnech: 2 ranní, 2 noční, 4 volna, skupiny se střídají přes přelom roku', () => {
    const app = createApp();
    const id = setupFirm(app, 'days12');
    const draft = app.json(`getFirm('${id}').schedule[0].groups.map(g => g.start)`);
    assert.equal(draft[0], TODAY);
    // A od dneška: RRNN----, pak znovu
    assert.equal(dayCodes(app, 'A', 2026, 10, 10, 16), 'RRNN----RRNN----');
    // jiná skupina je posunutá o 2 dny
    assert.equal(dayCodes(app, 'B', 2026, 10, 10, 8), '--RRNN--');
    // přes přelom roku a letní/zimní čas (25. 10. 2026) je cyklus pořád po 8 dnech
    const long = dayCodes(app, 'A', 2026, 10, 10, 120);
    for (let i = 0; i < long.length - 8; i++) assert.equal(long[i], long[i + 8], 'den ' + i);
    assert.equal(dayCodes(app, 'A', 2026, 12, 28, 8).length, 8);
});

test('12h týdenní: týden ranní, týden noční, týden volno; tři skupiny pokrývají všechny stavy', () => {
    const app = createApp();
    setupFirm(app, 'week12');
    const monday = app.run(`mondayOnOrBefore(new Date(2026, 9, 10))`);
    assert.equal(monday, '2026-10-05');
    const [y, m, d] = monday.split('-').map(Number);
    assert.equal(dayCodes(app, 'A', y, m, d, 21), 'RRRRRRRNNNNNNN-------');
    for (let week = 0; week < 3; week++) {
        const firsts = ['A', 'B', 'C'].map(g => dayCodes(app, g, y, m, d + week * 7, 1)).sort().join('');
        assert.equal(firsts, '-NR', 'týden ' + week);
    }
});

test('8h třísměnný: ranní, odpolední, noční po 7,5 placených hodinách a noční hodiny podle okna', () => {
    const app = createApp();
    setupFirm(app, 'std8');
    assert.equal(dayCodes(app, 'A', 2026, 10, 10, 12), 'RRROOONNN---');
    assert.equal(app.run(`shiftPaidHours('R')`), 7.5);
    assert.equal(app.run(`shiftPaidHours('O')`), 7.5);
    assert.equal(app.run(`shiftKind('R')`), 'day');
    assert.equal(app.run(`shiftKind('O')`), 'day');
    assert.equal(app.run(`shiftKind('N')`), 'night');
    assert.equal(app.run(`isWorkShift('O')`), true);
    assert.equal(app.run(`isWorkShift('-')`), false);
    // noční 22-6: celé okno 22-6 minus přestávka 2:00-2:30 = 7,5 h
    const rules22 = { nightFrom: '22:00', nightTo: '06:00' };
    assert.equal(app.run(`typeNightHours(getShiftType('N'), ${JSON.stringify(rules22)})`), 7.5);
    assert.equal(app.run(`typeNightHours(getShiftType('O'), ${JSON.stringify(rules22)})`), 0);
    // okno 18-6: odpolední 14-22 má 4 h v okně minus přestávka 18:00-18:30 = 3,5 h
    const rules18 = { nightFrom: '18:00', nightTo: '06:00' };
    assert.equal(app.run(`typeNightHours(getShiftType('O'), ${JSON.stringify(rules18)})`), 3.5);
    assert.equal(app.run(`typeNightHours(getShiftType('R'), ${JSON.stringify(rules18)})`), 0);
});

test('pondělí–pátek: pracovní dny, víkendy volno, ve svátek směna odpadá', () => {
    const app = createApp();
    setupFirm(app, 'monfri');
    // 5. 10. 2026 je pondělí
    assert.equal(dayCodes(app, 'A', 2026, 10, 5, 7), 'RRRRR--');
    // 28. 10. 2026 (státní svátek, středa) je volno, 27. a 29. se pracuje
    assert.equal(dayCodes(app, 'A', 2026, 10, 27, 3), 'R-R');
    // (24. 12. je státní svátek, 25. a 26. 12. také)
    assert.equal(dayCodes(app, 'A', 2026, 12, 23, 4), 'R---');
    // Velký pátek 3. 4. 2026 a Velikonoční pondělí 6. 4. 2026
    assert.equal(dayCodes(app, 'A', 2026, 4, 2, 6), 'R----R');
});

test('mzda 8h firmy: hodiny z typu směny (7,5 h), ne pevných 11,5 h', () => {
    const app = createApp();
    setupFirm(app, 'monfri');
    const settings = Object.assign({}, baseline.wages.vychozi.firma1.cases[0].settings, { profile: app.run('employerProfile') });
    const shifts = app.json(`generateShifts(2026, 'A').filter(s => s.date.getMonth() === 8).map(s => s.shift)`);
    const workDays = shifts.filter(c => c !== '-').length;
    const w = app.json(`computeWageBreakdown(${JSON.stringify(settings)}, generateShifts(2026, 'A').filter(s => s.date.getMonth() === 8), [], [], [], getHolidays(2026))`);
    assert.equal(w.totalHoursWithOvertime, workDays * 7.5);
    assert.equal(w.nightBonusHours, 0);
});

test('verze "platí od": starší dny zůstanou, nové platí od data, náhled ukazuje přechod', () => {
    const app = createApp();
    const id = setupFirm(app, 'days12');
    const before = dayCodes(app, 'A', 2026, 10, 10, 40);
    const draft = draftJson(app, 'std8');
    draft.from = '2026-11-01';
    draft.groups.forEach(g => { g.start = '2026-11-01'; });
    app.run(`applyScheduleVersion('${id}', versionFromDraft(${JSON.stringify(draft)}))`);
    assert.equal(app.json(`getFirm('${id}').schedule.length`), 2);
    const after = dayCodes(app, 'A', 2026, 10, 10, 40);
    // 22 dní před 1. 11. (10.10.–31.10.) beze změny, od 1. 11. nový cyklus RRROOONNN---
    assert.equal(after.slice(0, 22), before.slice(0, 22));
    assert.equal(after.slice(22, 34), 'RRROOONNN---');
    // náhled s vloženou verzí ukazuje stejné
    const preview = app.json(`previewScheduleRows(getFirm('${id}').schedule, '2026-10-28', 8)`);
    const row = preview.rows.find(r => r.id === 'A').cells.map(c => c.code).join('');
    assert.equal(row.slice(4), 'RRRO');
    // stejné datum "platí od" verzi přepíše, neduplikuje
    app.run(`applyScheduleVersion('${id}', versionFromDraft(${JSON.stringify(draft)}))`);
    assert.equal(app.json(`getFirm('${id}').schedule.length`), 2);
    // verze bez data nahradí vše
    draft.from = '';
    app.run(`applyScheduleVersion('${id}', versionFromDraft(${JSON.stringify(draft)}))`);
    assert.equal(app.json(`getFirm('${id}').schedule.length`), 1);
});

test('nové skupiny dostanou prázdná data a tlačítka skupin odpovídají rozvrhu', () => {
    const app = createApp();
    setupFirm(app, 'week12');
    assert.deepEqual(app.json('getGroupIds()'), ['A', 'B', 'C']);
    assert.deepEqual(app.json('Object.keys(overtimeDays)'), ['A', 'B', 'C']);
    assert.equal(app.json('currentShift'), 'A');
});

test('kontrola návrhu: prázdný cyklus, jen volno, shodný čas, duplicitní skupina', () => {
    const app = createApp();
    const base = draftJson(app, 'days12');
    const check = (mutate) => { const d = JSON.parse(JSON.stringify(base)); mutate(d); return app.json(`validateDraft(${JSON.stringify(d)})`); };
    assert.equal(check(d => { d.blocks = []; }).length > 0, true);
    assert.match(check(d => { d.blocks = [{ code: '-', days: 3 }]; }).join(' '), /pracovní den/);
    assert.match(check(d => { d.types.R.to = d.types.R.from; }).join(' '), /stejné/);
    assert.match(check(d => { d.groups[1].id = 'A'; }).join(' '), /dvakrát/);
    assert.match(check(d => { d.groups[0].start = ''; }).join(' '), /datum/);
    assert.match(check(d => { d.from = 'blbost'; }).join(' '), /platí od/);
});

test('cyklus <-> bloky a placené hodiny z časů', () => {
    const app = createApp();
    assert.deepEqual(app.json(`cycleToBlocks(['R','R','-','N','-','-'])`), [
        { code: 'R', days: 2 }, { code: '-', days: 1 }, { code: 'N', days: 1 }, { code: '-', days: 2 }]);
    assert.equal(app.run(`computePaidHours({ from: '06:00', to: '18:00', breakMin: 30 })`), 11.5);
    assert.equal(app.run(`computePaidHours({ from: '22:00', to: '06:00', breakMin: 30 })`), 7.5);
});

test('přesčas na odpolední směně: okno a typ podle směny', () => {
    const app = createApp();
    setupFirm(app, 'std8');
    app.run(`selectedDate = new Date(2026, 9, 16)`);
    // odpolední 14-22: přesčas 22:00-24:00 se nepřekrývá a je ve stejném dni
    assert.deepEqual(app.json(`shiftWindow('O', new Date(2026, 9, 16))`), [840, 1320]);
    assert.deepEqual(app.json(`getOvertimeInterval('22:00', '23:30', 'O', new Date(2026, 9, 16))`), [1320, 1410]);
    // noční 22-6: ranní čas po konci směny patří na další den
    assert.deepEqual(app.json(`getOvertimeInterval('06:00', '08:00', 'N', new Date(2026, 9, 16))`), [1800, 1920]);
});

test('uložené firmy: neplatné kódy směn firmu vyřadí, neplatné typy se opraví na výchozí', () => {
    const app = createApp();
    const firm = (cycle, types) => ({ id: 'f_a', name: 'A', note: '', dataKey: 'f_a',
        schedule: [{ from: null, types, cycle, groups: [{ id: 'A', name: 'A', start: '2025-01-01' }] }] });
    assert.equal(app.run(`sanitizeFirm(${JSON.stringify(firm(['R', 'x y', '-'], {}))})`), null);
    assert.equal(app.run(`sanitizeFirm(${JSON.stringify(firm(['R', '<b>'], {}))})`), null);
    const fixed = app.json(`sanitizeFirm(${JSON.stringify(firm(['R', '-'], {
        R: { label: '', short: 'dlouhá zkratka', from: '99:99', to: '99:99', breakMin: -5, paidHours: 99 },
        D: { label: 'dovolená jako typ' },
        'x y': { label: 'špatný kód' }
    }))})`);
    assert.deepEqual(Object.keys(fixed.schedule[0].types), ['R']);
    assert.deepEqual(fixed.schedule[0].types.R, { label: 'Ranní', short: 'dlo', from: '06:00', to: '18:00', breakFrom: '12:00', breakMin: 30, paidHours: 11.5 });
});

test('okno dne nabízí typy směn firmy a předvolba přesčasu bere časy z typu', () => {
    const app = createApp();
    setupFirm(app, 'std8');
    assert.deepEqual(app.json('getFirmWorkCodes()'), ['R', 'O', 'N']);
    app.run(`selectedDate = new Date(2026, 9, 10)`);
    app.run(`presetOvertime('O')`);
    assert.equal(app.run(`document.getElementById('overtimeFrom').value`), '14:00');
    assert.equal(app.run(`document.getElementById('overtimeTo').value`), '22:00');
    assert.equal(app.run('dayShiftsWord(true)'), 'Denní');
    // původní firmy dál říkají "ranní"
    app.run(`switchFirm('firma2')`);
    assert.equal(app.run('dayShiftsWord(true)'), 'Ranní');
    assert.deepEqual(app.json('getFirmWorkCodes()'), ['R', 'N']);
});

test('12h kolotoč: počet dnů střídání, ranní/noční nebo jedna směna a den začátku cyklu', () => {
    const app = createApp();
    const run = (patch) => {
        const draft = app.json(`(() => { const d = presetDraft('simple12', new Date(2026, 9, 10)); Object.assign(d.simple, ${JSON.stringify(patch)}); applySimple(d); return d; })()`);
        assert.deepEqual(app.json(`validateDraft(${JSON.stringify(draft)})`), [], JSON.stringify(patch));
        const id = app.run(`createFirm('K', null).id`);
        app.run(`applyScheduleVersion('${id}', versionFromDraft(${JSON.stringify(draft)})); switchFirm('${id}')`);
        return { draft, id };
    };
    // výchozí 2 + 2 + 4 volna, začátek zvolený 14. 10. 2026
    run({ start: '2026-10-14' });
    assert.equal(dayCodes(app, 'A', 2026, 10, 14, 8), 'RRNN----');
    // před začátkem cyklu se vzor opakuje zpátky
    assert.equal(dayCodes(app, 'A', 2026, 10, 6, 8), 'RRNN----');
    // 3 dny střídání, 3 volna, začíná ranní
    run({ days: 3, off: 3, start: '2026-10-14' });
    assert.equal(dayCodes(app, 'A', 2026, 10, 14, 12), 'RRRNNN---RRR');
    // začíná noční: NNN---RRR
    run({ days: 3, off: 3, first: 'N', start: '2026-10-14' });
    assert.equal(dayCodes(app, 'A', 2026, 10, 14, 9), 'NNN---RRR');
    // jen ranní, 2 dny práce a 5 volna
    run({ days: 2, off: 5, mode: 'R', start: '2026-10-14' });
    assert.equal(dayCodes(app, 'A', 2026, 10, 14, 7), 'RR-----');
    // jen noční
    run({ days: 4, off: 4, mode: 'N', start: '2026-10-14' });
    assert.equal(dayCodes(app, 'A', 2026, 10, 14, 8), 'NNNN----');
    // další skupiny rovnoměrně posunuté, délka cyklu 8 a 4 skupiny -> po 2 dnech
    const { draft } = run({ days: 2, off: 4, start: '2026-10-14' });
    assert.deepEqual(draft.groups.map(g => g.start), ['2026-10-14', '2026-10-16', '2026-10-18', '2026-10-20']);
});
