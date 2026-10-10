'use strict';
// Etapa 4: pevná měsíční mzda a verze mzdových pravidel "platí od".
// Spuštění: TZ=Europe/Prague node --test testy/*.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('./harness');
const baseline = require('./baseline.json');

const BASE_SETTINGS = baseline.wages.vychozi.firma1.cases[0].settings;

// Firma pondělí–pátek s pevnou mzdou, přepnutá jako aktivní
function fixedFirm(app) {
    const id = app.run(`createFirm('Pevná', null).id`);
    app.run(`applyScheduleVersion('${id}', versionFromDraft(presetDraft('monfri', new Date(2026, 9, 10))))`);
    app.run(`updateFirm('${id}', { rules: { fixedSalary: true } })`);
    app.run(`switchFirm('${id}')`);
    return id;
}

function monthWage(app, id, month, settingsPatch, overrides) {
    const settings = Object.assign({}, BASE_SETTINGS, { profile: id, baseWage: 200, fixedSalary: 32000 }, settingsPatch);
    return app.json(`(() => {
        ${(overrides || []).map(([k, v]) => `shiftOverrides.A.set('${k}', '${v}');`).join('\n')}
        return computeWageBreakdown(${JSON.stringify(settings)},
            generateShifts(2026, 'A').filter(s => s.date.getMonth() === ${month}), [], [], [], getHolidays(2026));
    })()`);
}

test('pevná mzda: měsíc bez nemoci a přesčasů = pevná částka', () => {
    const app = createApp();
    const id = fixedFirm(app);
    const w = monthWage(app, id, 8);
    assert.equal(w.normalWageWithOvertime, 32000);
    assert.equal(w.vacationWage, 0);
    assert.equal(w.fixedSalaryReduction, 0);
    assert.equal(w.nightWageWithOvertime, 0);
});

test('pevná mzda: dovolená nic neubírá a nepřidává', () => {
    const app = createApp();
    const id = fixedFirm(app);
    const w = monthWage(app, id, 8, {}, [['2026-09-08', 'D'], ['2026-09-09', 'D']]);
    assert.equal(w.vacationDays, 2);
    assert.equal(w.vacationWage, 0);
    assert.equal(w.normalWageWithOvertime, 32000);
});

test('pevná mzda: nemoc ji poměrně sníží a nahradí se náhradou mzdy', () => {
    const app = createApp();
    const id = fixedFirm(app);
    // září 2026 má 21 pracovních dní (28. 9. je svátek); 2 dny nemoci (úterý a středa)
    const w = monthWage(app, id, 8, {}, [['2026-09-08', 'NEM'], ['2026-09-09', 'NEM']]);
    assert.equal(w.fixedSalaryReduction, 32000 * 2 / 21);
    assert.equal(w.normalWageWithOvertime, 32000 - 32000 * 2 / 21);
    assert.equal(w.sickPaidShiftCount, 2);
    assert.ok(w.sickPay > 0);
});

test('pevná mzda: přesčas se platí sazbou a příplatkem navíc', () => {
    const app = createApp();
    const id = fixedFirm(app);
    const settings = Object.assign({}, BASE_SETTINGS, { profile: id, baseWage: 200, fixedSalary: 32000, overtimeBonus: 0.25 });
    const w = app.json(`computeWageBreakdown(${JSON.stringify(settings)},
        generateShifts(2026, 'A').filter(s => s.date.getMonth() === 8),
        [['2026-09-10', { type: 'R', hours: 2, start: 900, end: 1020 }]], [], [], getHolidays(2026))`);
    assert.equal(w.normalWageWithOvertime, 32000 + 200 * 2);
    assert.equal(w.overtimeBonusWage, 200 * 0.25 * 2);
});

test('pevná mzda: ve svátek se nepracuje, takže se nic nepřidává; měsíc se svátkem má stejnou mzdu', () => {
    const app = createApp();
    const id = fixedFirm(app);
    const w = monthWage(app, id, 9); // říjen 2026 se státním svátkem 28. 10.
    assert.equal(w.holidayHours, 0);
    assert.equal(w.normalWageWithOvertime, 32000);
});

test('firmy bez pevné mzdy dál počítají hodiny krát sazba', () => {
    const app = createApp();
    const settings = Object.assign({}, BASE_SETTINGS, { profile: 'firma1', fixedSalary: 99999 });
    const w = app.json(`computeWageBreakdown(${JSON.stringify(settings)},
        generateShifts(2026, 'A').filter(s => s.date.getMonth() === 8), [], [], [], getHolidays(2026))`);
    assert.equal(w.normalWageWithOvertime, w.totalHoursWithOvertime * BASE_SETTINGS.baseWage);
    assert.equal('fixedSalaryReduction' in w, false);
});

test('verze mzdových pravidel: změna od data nezmění starší měsíce', () => {
    const app = createApp();
    app.run(`updateFirm('firma1', { rules: { nightMode: 'flat', nightFrom: '20:00' }, from: '2027-01-01' })`);
    assert.equal(app.json(`getFirm('firma1').wage.length`), 2);
    assert.equal(app.json(`getWageRules('firma1', new Date(2026, 11, 31)).nightMode`), 'percent');
    assert.equal(app.json(`getWageRules('firma1', new Date(2026, 11, 31)).nightFrom`), '22:00');
    assert.equal(app.json(`getWageRules('firma1', new Date(2027, 0, 1)).nightMode`), 'flat');
    assert.equal(app.json(`getWageRules('firma1', new Date(2027, 0, 1)).nightFrom`), '20:00');
    // druhá změna od stejného data upraví tutéž verzi, nová od jiného data vznikne z platné
    app.run(`updateFirm('firma1', { rules: { multiMachine: true }, from: '2027-01-01' })`);
    assert.equal(app.json(`getFirm('firma1').wage.length`), 2);
    app.run(`updateFirm('firma1', { rules: { extras: true }, from: '2028-01-01' })`);
    assert.equal(app.json(`getWageRules('firma1', new Date(2028, 5, 1)).nightFrom`), '20:00');
    assert.equal(app.json(`getWageRules('firma1', new Date(2027, 5, 1)).extras`), false);
    // uloženo a seřazeno
    const stored = JSON.parse(app.storage.getItem('firms')).firms.find(f => f.id === 'firma1').wage;
    assert.deepEqual(stored.map(v => v.from), [null, '2027-01-01', '2028-01-01']);
});

test('mzda starého měsíce se po nové verzi pravidel nezmění, nový měsíc ano', () => {
    const app = createApp({ storage: { calculatorSettings_firma1: JSON.stringify({ baseWage: '150', nightBonus: '20', weekendBonus: '25', holidayBonus: '100', overtimeBonus: '25' }) } });
    app.run(`applyEmployerProfile('firma1')`);
    const month = (m, y) => app.json(`computeWageBreakdown(${JSON.stringify(Object.assign({}, BASE_SETTINGS, { profile: 'firma1', nightBonusFlat: 40 }))},
        generateShifts(${y}, 'A').filter(s => s.date.getMonth() === ${m}), [], [], [], getHolidays(${y}))`);
    const before = month(5, 2026);
    app.run(`updateFirm('firma1', { rules: { nightMode: 'flat' }, from: '2027-01-01' })`);
    assert.deepEqual(month(5, 2026), before);
    const after = month(5, 2027);
    assert.notEqual(after.nightWageWithOvertime, month(5, 2026).nightWageWithOvertime);
});
