'use strict';
// Etapa 5: historie mzdových sazeb "platí od".
const test = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('./harness');

test('bez historie: ukládání má stejný tvar jako dřív', () => {
    const app = createApp();
    app.run(`switchFirm('firma1')`);
    app.run(`saveCalculatorSettings()`);
    const saved = JSON.parse(app.run(`localStorage.getItem('calculatorSettings_firma1')`));
    assert.equal(saved.from, undefined);
    assert.equal(saved.history, undefined);
    assert.equal(app.run(`wageVersions('firma1').length`), 1);
});

test('nová verze sazeb: starší měsíce zůstanou, novější mají nové hodnoty', () => {
    const app = createApp();
    app.run(`switchFirm('firma1')`);
    app.run(`document.getElementById('baseWage').value = '200'; saveCalculatorSettings()`);
    app.run(`document.getElementById('wageNewFrom').value = '2026-08'; addWageVersion()`);
    app.run(`document.getElementById('baseWage').value = '230'; saveCalculatorSettings()`);
    assert.equal(app.json(`wageValuesFor('firma1', '2026-07').baseWage`), '200');
    assert.equal(app.json(`wageValuesFor('firma1', '2026-08').baseWage`), '230');
    assert.equal(app.json(`wageValuesFor('firma1', '2027-01').baseWage`), '230');
    assert.equal(app.json(`wageValuesFor('firma1', '2020-01').baseWage`), '200');
    assert.equal(app.json(`getWageSettings(2026, 6).baseWage`), 200);
    assert.equal(app.json(`getWageSettings(2026, 9).baseWage`), 230);
});

test('zobrazený měsíc přepne formulář na platnou verzi a úprava nepřepíše jinou verzi', () => {
    const app = createApp();
    app.run(`switchFirm('firma1')`);
    app.run(`document.getElementById('baseWage').value = '200'; saveCalculatorSettings()`);
    app.run(`document.getElementById('wageNewFrom').value = '2026-08'; addWageVersion()`);
    app.run(`document.getElementById('baseWage').value = '230'; saveCalculatorSettings()`);
    app.run(`currentYear = 2026; currentMonth = 2;`);
    assert.equal(app.json(`getWageSettings().baseWage`), 200);
    app.run(`document.getElementById('baseWage').value = '210'; saveCalculatorSettings()`);
    assert.equal(app.json(`wageValuesFor('firma1', '2026-09').baseWage`), '230');
    assert.equal(app.json(`wageValuesFor('firma1', '2026-02').baseWage`), '210');
    app.run(`currentMonth = 9;`);
    assert.equal(app.json(`getWageSettings().baseWage`), 230);
});

test('smazání verze a roční souhrn po měsících', () => {
    const app = createApp();
    app.run(`switchFirm('firma1')`);
    app.run(`document.getElementById('baseWage').value = '200'; saveCalculatorSettings()`);
    app.run(`currentYear = 2026; currentMonth = 0; document.getElementById('wageNewFrom').value = '2026-07'; addWageVersion()`);
    app.run(`document.getElementById('baseWage').value = '300'; saveCalculatorSettings()`);
    const rows = app.json(`computeYearlyWageSummary(2026, 'A', (m) => getWageSettings(2026, m)).rows.map(r => r.w.baseWage || 0)`);
    assert.equal(app.json(`wageVersions('firma1').length`), 2);
    app.run(`confirm = () => true; removeWageVersion('2026-07')`);
    assert.equal(app.json(`wageVersions('firma1').length`), 1);
    assert.ok(Array.isArray(rows));
});
