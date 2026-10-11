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

test('Google přehled: řazení, celodenní rozsah, opakování a zrušené', () => {
    const app = createApp();
    const events = [
        { id: '1', summary: 'Zubař', start: { dateTime: '2026-11-03T08:30:00+01:00' } },
        { id: '2', summary: 'Dovolená', start: { date: '2026-10-20' }, end: { date: '2026-10-23' } },
        { id: '3', summary: 'Narozeniny', start: { date: '1990-05-14' }, end: { date: '1990-05-15' }, recurrence: ['RRULE:FREQ=YEARLY'] },
        { id: '4', summary: 'Zrušeno', status: 'cancelled', start: { date: '2026-10-21' } },
        { id: '5', summary: 'Minulost', start: { date: '2025-01-02' }, end: { date: '2025-01-03' } }
    ];
    const rows = app.json(`gcalAgendaItems(${JSON.stringify(events)}, new Date(2026, 9, 11)).map(i => [i.title, toDateKey(i.date), toDateKey(i.endDate), i.time, i.recur])`);
    assert.deepEqual(rows.map(r => r[0]), ['Minulost', 'Dovolená', 'Zubař', 'Narozeniny']);
    assert.deepEqual(rows[1].slice(1), ['2026-10-20', '2026-10-22', '', '']);
    assert.equal(rows[2][3], '08:30');
    assert.deepEqual(rows[3].slice(1, 3), ['2027-05-14', '2027-05-14']);
    assert.equal(rows[3][4], 'každý rok');
});

test('Google přehled: odkaz na den v Google Kalendáři', () => {
    const app = createApp();
    assert.equal(app.run(`gcalDayUrl(new Date(2026, 9, 5))`), 'https://calendar.google.com/calendar/u/0/r/day/2026/10/5');
});

test('Google přehled: opakování nezkreslí neexistující dny a týdenní BYDAY', () => {
    const app = createApp();
    const run = (ev, today) => app.json(`gcalAgendaItems([${JSON.stringify(ev)}], new Date(${today})).map(i => toDateKey(i.date))[0]`);
    // 31. v měsíci: duben nemá 31 dní, další výskyt je 31. 5.
    assert.equal(run({ id: 'a', summary: 'x', start: { date: '2026-01-31' }, end: { date: '2026-02-01' }, recurrence: ['RRULE:FREQ=MONTHLY'] }, '2026, 3, 10'), '2026-05-31');
    // 29. 2.: v nepřestupném roce 28. 2.
    assert.equal(run({ id: 'b', summary: 'x', start: { date: '2020-02-29' }, end: { date: '2020-03-01' }, recurrence: ['RRULE:FREQ=YEARLY'] }, '2026, 5, 1'), '2027-02-28');
    // týdně v pátek (BYDAY=FR), dnes neděle 11. 10. 2026
    assert.equal(run({ id: 'c', summary: 'x', start: { date: '2015-03-06' }, end: { date: '2015-03-07' }, recurrence: ['RRULE:FREQ=WEEKLY;BYDAY=FR'] }, '2026, 9, 11'), '2026-10-16');
    // skončené opakování zůstane u prvního data (2015)
    assert.equal(run({ id: 'd', summary: 'x', start: { date: '2015-03-06' }, end: { date: '2015-03-07' }, recurrence: ['RRULE:FREQ=YEARLY;UNTIL=20180101'] }, '2026, 9, 11'), '2015-03-06');
});
