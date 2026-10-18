'use strict';
// Etapa 7: tarifní stupně a volba hodinové / měsíční mzdy v mzdové kalkulačce.
// Spuštění: TZ=Europe/Prague node --test testy/*.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('./harness');

// Tabulka ze sborníku (čl. D.6): [Kč/hod, Kč/měs.]
const TABLE = {
    1: [144.30, 23400], 2: [148.80, 24200], 3: [149.70, 24600], 4: [151.90, 24900],
    5: [157.90, 25800], 6: [169.00, 27500], 7: [181.20, 29800], 8: [196.60, 32300],
    9: [211.30, 34600], 10: [null, 37600], 11: [null, 40700], 12: [null, 44500],
    13: [null, 49200]
};

function selectGrade(app, grade) {
    app.el('tariffGrade').value = String(grade);
    app.run('applyTariffGrade()');
}

test('tabulka tarifů v aplikaci odpovídá sborníku', () => {
    const app = createApp();
    assert.deepEqual(app.json(`tariffTableFor('2026-10')`), TABLE);
});

test('hodinová mzda: každý stupeň s hodinovým tarifem nastaví sazbu', () => {
    const app = createApp();
    app.el('payType').value = 'hourly';
    for (const [grade, [hourly]] of Object.entries(TABLE)) {
        if (hourly === null) continue;
        selectGrade(app, grade);
        assert.equal(Number(app.el('baseWage').value), hourly, `stupeň ${grade}`);
    }
});

test('hodinová mzda: stupeň bez hodinového tarifu sazbu nezmění', () => {
    const app = createApp();
    app.el('payType').value = 'hourly';
    app.el('baseWage').value = '160';
    selectGrade(app, 12);
    assert.equal(app.el('baseWage').value, '160');
});

test('měsíční mzda: každý stupeň nastaví měsíční tarif i hodinovou sazbu pro přesčas', () => {
    const app = createApp();
    app.el('payType').value = 'monthly';
    for (const [grade, [hourly, perMonth]] of Object.entries(TABLE)) {
        selectGrade(app, grade);
        assert.equal(Number(app.el('fixedSalary').value), perMonth, `stupeň ${grade}`);
        const expectedHourly = hourly !== null ? hourly : Math.round(perMonth / 162.5 * 100) / 100;
        assert.equal(Number(app.el('baseWage').value), expectedHourly, `stupeň ${grade}`);
    }
});

test('ruční úprava sazby přepne stupeň na "Vlastní"', () => {
    const app = createApp();
    app.el('payType').value = 'hourly';
    selectGrade(app, 7);
    app.run('syncTariffGradeWithWage()');
    assert.equal(app.el('tariffGrade').value, '7');
    app.el('baseWage').value = '182';
    app.run('syncTariffGradeWithWage()');
    assert.equal(app.el('tariffGrade').value, 'custom');

    app.el('payType').value = 'monthly';
    selectGrade(app, 7);
    app.el('fixedSalary').value = '30000';
    app.run('syncTariffGradeWithWage()');
    assert.equal(app.el('tariffGrade').value, 'custom');
});

test('volba "Vlastní" nic nepřepíše', () => {
    const app = createApp();
    app.el('payType').value = 'monthly';
    app.el('fixedSalary').value = '31000';
    app.el('baseWage').value = '190';
    selectGrade(app, 'custom');
    assert.equal(app.el('fixedSalary').value, '31000');
    assert.equal(app.el('baseWage').value, '190');
});

test('nastavení: měsíční mzda u firmy bez pevné mzdy přidá fixedSalary a výslovný payType', () => {
    const app = createApp();
    app.run(`applyEmployerProfile('firma1')`);
    app.el('payType').value = 'monthly';
    app.el('fixedSalary').value = '29800';
    app.el('baseWage').value = '181.2';
    const s = app.json('getWageSettings()');
    assert.equal(s.fixedSalary, 29800);
    assert.equal(s.payType, 'monthly');
});

test('nastavení: hodinová mzda u firmy s pevnou mzdou vynechá fixedSalary', () => {
    const app = createApp();
    app.run(`updateFirm('firma1', { rules: { fixedSalary: true } })`);
    app.run(`applyEmployerProfile('firma1')`);
    app.el('payType').value = 'hourly';
    app.el('fixedSalary').value = '29800';
    const s = app.json('getWageSettings()');
    assert.equal('fixedSalary' in s, false);
    assert.equal(s.payType, 'hourly');
});

test('nastavení bez výslovné změny oproti pravidlu firmy payType nepřidává', () => {
    const app = createApp();
    app.run(`applyEmployerProfile('firma1')`);
    app.el('payType').value = 'hourly';
    const s = app.json('getWageSettings()');
    assert.equal('payType' in s, false);
    assert.equal('fixedSalary' in s, false);
});

test('výpočet: měsíční mzda stupně 7 bez přesčasů a nemoci = tarif', () => {
    const app = createApp();
    app.run(`applyEmployerProfile('firma1')`);
    app.el('payType').value = 'monthly';
    selectGrade(app, 7);
    const settings = app.json('getWageSettings()');
    const w = app.json(`computeWageBreakdown(${JSON.stringify(settings)},
        generateShifts(2026, currentShift).filter(s => s.date.getMonth() === 8), [], [], [], getHolidays(2026))`);
    assert.equal(w.normalWageWithOvertime, 29800);
    assert.equal(w.vacationWage, 0);
});

test('výpočet: hodinová mzda stupně 7 = hodiny krát sazba', () => {
    const app = createApp();
    app.run(`applyEmployerProfile('firma1')`);
    app.el('payType').value = 'hourly';
    selectGrade(app, 7);
    const settings = app.json('getWageSettings()');
    const w = app.json(`computeWageBreakdown(${JSON.stringify(settings)},
        generateShifts(2026, currentShift).filter(s => s.date.getMonth() === 8), [], [], [], getHolidays(2026))`);
    assert.equal(w.normalWageWithOvertime, w.totalHoursWithOvertime * 181.2);
});

test('uložení a načtení: payType a stupeň se pamatují', () => {
    const app = createApp();
    app.run(`applyEmployerProfile('firma2')`);
    app.el('payType').value = 'monthly';
    selectGrade(app, 9);
    app.run('saveCalculatorSettings()');
    const saved = JSON.parse(app.storage.getItem('calculatorSettings_firma2'));
    assert.equal(saved.payType, 'monthly');
    assert.equal(saved.tariffGrade, '9');
    assert.equal(String(saved.fixedSalary), '34600');

    const again = app.reboot();
    again.run(`applyEmployerProfile('firma2')`);
    assert.equal(again.el('payType').value, 'monthly');
    assert.equal(again.el('tariffGrade').value, '9');
    assert.equal(String(again.el('fixedSalary').value), '34600');
});

test('načtení: starší nastavení bez stupně pozná stupeň podle sazby', () => {
    const app = createApp({ storage: { calculatorSettings_firma2: JSON.stringify({ baseWage: '181.2' }) } });
    app.run(`applyEmployerProfile('firma2')`);
    assert.equal(app.el('tariffGrade').value, '7');
    const custom = createApp({ storage: { calculatorSettings_firma2: JSON.stringify({ baseWage: '170' }) } });
    custom.run(`applyEmployerProfile('firma2')`);
    assert.equal(custom.el('tariffGrade').value, 'custom');
});

test('tabulka tarifů má verze "platí od": starší měsíce zůstanou, od data platí nová', () => {
    const app = createApp();
    app.run(`TARIFF_VERSIONS.push({ from: '2027-01', table: { 1: [150, 24000] } })`);
    assert.equal(app.json(`tariffTableFor('2026-12')[1]`)[1], 23400);
    assert.deepEqual(app.json(`tariffTableFor('2027-01')[1]`), [150, 24000]);
    assert.deepEqual(app.json(`tariffTableFor('2030-05')[1]`), [150, 24000]);
    // zobrazený měsíc rozhoduje o tabulce, ze které se stupeň vybírá
    app.run('currentYear = 2027; currentMonth = 2');
    app.el('payType').value = 'hourly';
    selectGrade(app, 1);
    assert.equal(Number(app.el('baseWage').value), 150);
    app.run('currentYear = 2026; currentMonth = 8');
    selectGrade(app, 1);
    assert.equal(Number(app.el('baseWage').value), 144.3);
});
