'use strict';
// Klouzák volno - směna navíc nad fond (Bona). Normálně se odpracuje a platí jako přesčas,
// výjimečně se dá vybrat volno ('KV'): den se neplatí a přesčas za směnu navíc se ubere.
// Ověřeno na výplatnici 10/2026 (skupina A, 14 dní, 161 h, svátek 28. 10. odpracován, bez přesčasu).
// Spuštění: TZ=Europe/Prague node --test testy/*.test.js

const test = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('./harness');

const PAYSLIP_SETTINGS = {
    profile: 'firma2', baseWage: 181.2, nightBonus: 0.17, nightBonusFlat: 17, weekendBonus: 0.6, holidayBonus: 1,
    overtimeBonus: 0.5, personalRating: 5, monthlyBonus: 3000, motivationBonus: 3000, childCount: 0, disability: 0,
    hasTaxDeclaration: true, vacationRate: 261.6
};

function october(app, kackoDay) {
    app.run(`switchFirm('firma2')`);
    if (kackoDay) {
        app.run(`shiftOverrides.A.set('2026-10-${String(kackoDay).padStart(2, '0')}', 'KV')`);
    }
    return app.json(`computeWageBreakdown(${JSON.stringify(PAYSLIP_SETTINGS)},
        generateShifts(2026, 'A').filter(s => s.date.getMonth() === 9), [], [], [], getHolidays(2026))`);
}

test('klouzák odpracován: směna ve svátek se platí jako přesčas (beze změny)', () => {
    const w = october(createApp(), null);
    assert.equal(w.totalHoursWithOvertime, 172.5);
    assert.equal(w.holidayShiftOvertimeHours, 11.5);
    assert.equal(w.slidingOffHours || 0, 0);
});

test('klouzák volno: výpočet sedí s výplatnicí 10/2026', () => {
    const w = october(createApp(), 2);
    assert.equal(w.totalHoursWithOvertime, 161);
    assert.equal(w.slidingOffHours, 11.5);
    assert.equal(w.holidayShiftOvertimeHours, 0);
    assert.equal(w.overtimeBonusWage, 0);
    assert.equal(Math.round(w.normalWageWithOvertime), 29173);
    assert.equal(Math.round(w.personalRatingWage), 805);
    assert.equal(Math.round(w.holidayWageWithOvertime), 3008);
    assert.equal(Math.round(w.weekendWageWithOvertime), 3751);
    assert.equal(Math.round(w.nightWageWithOvertime), 1173);
    assert.equal(Math.round(w.totalWage), 43910);
    assert.equal(w.socialInsurance, 3118);
    assert.equal(w.healthInsurance, 1976);
    assert.equal(w.tax, 4030);
    assert.equal(Math.round(w.netWage), 34786);
});

test('KV není pracovní směna a má popisek', () => {
    const app = createApp();
    assert.equal(app.run(`isWorkShift('KV')`), false);
    assert.equal(app.run(`shiftLabel('KV')`), 'Klouzák volno');
});
