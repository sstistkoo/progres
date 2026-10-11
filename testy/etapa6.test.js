'use strict';
// Etapa 6: přehled záznamů seřazených podle data.
const test = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('./harness');

const ALL = `{ leave: true, override: true, ot: true, note: true, yearly: true, other: true, holiday: false }`;

function prepare() {
    const app = createApp();
    app.run(`switchFirm('firma1'); currentYear = 2026; currentMonth = 9;`);
    app.run(`overtimeDays.A.set('2026-10-20', { type: 'R', hours: 4 });`);
    app.run(`notes[noteKey(new Date(2026, 2, 5))] = 'Zubař';`);
    app.run(`['2026-08-03','2026-08-04','2026-08-05'].forEach(d => shiftOverrides.A.set(d, 'D'));`);
    app.run(`shiftOverrides.A.set('2026-09-01', 'NEM');`);
    app.run(`slidingShiftDays.A.set('2026-01-15', true);`);
    app.run(`yearlyNotes = [{ day: 1, month: 12, text: 'Narozeniny' }];`);
    app.run(`currentShift = 'A';`);
    return app;
}

test('přehled: záznamy jsou seřazené podle data a dny dovolené se spojí', () => {
    const app = prepare();
    const rows = app.json(`collectAgendaRows('year', ${ALL}).map(r => [toDateKey(r.date), toDateKey(r.endDate), r.markers.map(m => m.cat).join(',')])`);
    const dates = rows.map(r => r[0]);
    assert.deepEqual(dates, [...dates].sort());
    assert.deepEqual(dates, ['2026-01-15', '2026-03-05', '2026-08-03', '2026-09-01', '2026-10-20', '2026-12-01']);
    const vac = rows.find(r => r[0] === '2026-08-03');
    assert.equal(vac[1], '2026-08-05');
});

test('přehled: filtr kategorií a svátky', () => {
    const app = prepare();
    const onlyNotes = app.json(`collectAgendaRows('year', { note: true }).length`);
    assert.equal(onlyNotes, 1);
    const withHolidays = app.json(`collectAgendaRows('year', { holiday: true }).length`);
    assert.ok(withHolidays >= 10);
});

test('přehled: rozsah všechno a vykreslení', () => {
    const app = prepare();
    app.run(`overtimeDays.A.set('2025-05-05', { type: 'N', hours: 2 });`);
    assert.equal(app.json(`collectAgendaRows('year', ${ALL}).some(r => toDateKey(r.date) === '2025-05-05')`), false);
    assert.equal(app.json(`collectAgendaRows('all', ${ALL}).some(r => toDateKey(r.date) === '2025-05-05')`), true);
    app.run(`renderAgenda()`);
});
