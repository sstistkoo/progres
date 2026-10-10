'use strict';
// Obsah localStorage pro testy: fixture z baseline.json (přesčasy, vícestroj, klouzáky,
// ruční změny směn, nemoc) ve dvou variantách mzdového nastavení.
//   'vychozi' - žádné uložené nastavení kalkulačky (platí výchozí hodnoty firem)
//   'ulozene' - uložené vlastní hodnoty pro obě firmy a daňové slevy

function storageFor(fixture, variant) {
    const storage = {
        overtimeDays: JSON.stringify(fixture.overtimeDays),
        multiMachineDays: JSON.stringify(fixture.multiMachineDays),
        slidingShiftDays: JSON.stringify(fixture.slidingShiftDays),
        shiftOverrides: JSON.stringify(fixture.shiftOverrides)
    };
    if (variant === 'vychozi') {
        storage.taxSettings = JSON.stringify({ childCount: '0', disability: '0', hasTaxDeclaration: true });
    } else {
        storage.taxSettings = JSON.stringify({ childCount: '2', disability: '1', hasTaxDeclaration: true });
        storage.calculatorSettings_firma1 = JSON.stringify({
            baseWage: '155.5', nightBonus: '22', weekendBonus: '30', holidayBonus: '100',
            overtimeBonus: '25', vacationRate: '170'
        });
        storage.calculatorSettings_firma2 = JSON.stringify({
            baseWage: '181.2', nightBonus: '17', weekendBonus: '60', holidayBonus: '100',
            overtimeBonus: '50', vacationRate: '', personalRating: '5',
            monthlyBonus: '2900', motivationBonus: '3000', payslipFix202609: true
        });
    }
    return storage;
}

module.exports = { storageFor };
