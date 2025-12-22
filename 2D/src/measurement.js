/**
 * Měření a Fixace - Vylepšená funkčnost
 */

/**
 * Toggle sekce kót
 */
window.toggleCotasSection = function() {
  const section = document.getElementById('cotasPanel');
  const toggle = document.getElementById('cotasToggle');
  if (section) {
    if (section.style.display === 'none') {
      section.style.display = 'block';
      if (toggle) toggle.textContent = '▼';
    } else {
      section.style.display = 'none';
      if (toggle) toggle.textContent = '▶';
    }
  }
};

/**
 * Vytvoří dialog pro fixaci měřené hodnoty
 * Uloží ji jako kótu do "upravy/kota"
 */
window.fixateMeasurement = function() {
  if (!window.measurementData) {
    alert('❌ Žádné měření k fixaci. Nejdříve změř 2 objekty!');
    return;
  }

  const data = window.measurementData;
  let value = null;
  let label = null;

  // Získej hodnotu z měření
  if (data.type === 'single_line') {
    value = data.value;
    label = 'Délka usečky';
  } else if (data.type === 'circle') {
    value = data.value;
    label = 'Poloměr kružnice';
  } else if (data.type === 'two_points') {
    value = data.value;
    label = 'Vzdálenost bodů';
  } else if (data.type === 'two_lines') {
    // Pro 2 usečky zobraz dialog s výběrem který rozměr fixovat
    const measurements = data.measurements;
    const options = measurements.map((m, i) => `${i + 1}. ${m.label}: ${m.value.toFixed(m.label.includes('Úhel') ? 1 : 2)} ${m.unit}`).join('\n');
    
    const choice = prompt(
      `Vyber kterou kótu chceš fixovat:\n${options}\n\nZadej číslo (1-${measurements.length}):`,
      '1'
    );
    
    if (choice === null) return;
    
    const idx = parseInt(choice) - 1;
    if (idx < 0 || idx >= measurements.length) {
      alert('❌ Chybná volba');
      return;
    }
    
    const selectedMeasurement = measurements[idx];
    value = selectedMeasurement.value;
    label = selectedMeasurement.label;
  }

  if (value === null) {
    alert('❌ Nemohu fixovat - chybí hodnota');
    return;
  }

  // Dialog pro zadání nové hodnoty
  const newValue = prompt(
    `Fixace: ${label}\n\nAktuální hodnota: ${value.toFixed(2)}\n\nZadej novou hodnotu (nebo Enter pro zachování):`,
    value.toFixed(2)
  );

  if (newValue === null) return; // Zrušit

  const finalValue = newValue === '' ? value : parseFloat(newValue);
  
  if (isNaN(finalValue)) {
    alert('❌ Chybný formát čísla');
    return;
  }

  // Vytvoř kótu v "upravy/kota" sekci
  createCota(label, finalValue, data);
};

/**
 * Vytvoří kótu a uloží ji do sekce upravy/kota
 */
function createCota(label, value, measurementData) {
  if (!window.shapes) window.shapes = [];

  // Vytvoř dimension objekt
  let dimension = null;
  
  if (measurementData.type === 'single_line') {
    dimension = {
      type: 'dimension',
      dimType: 'linear',
      target: measurementData.item,
      value: value,
      x1: measurementData.item.x1,
      y1: measurementData.item.y1,
      x2: measurementData.item.x2,
      y2: measurementData.item.y2,
      fixedValue: true,
      fixedLabel: label,
      color: '#ff6600', // Oranžová pro fixované
    };
  } else if (measurementData.type === 'circle') {
    dimension = {
      type: 'dimension',
      dimType: 'radius',
      target: measurementData.item,
      value: value,
      cx: measurementData.item.cx,
      cy: measurementData.item.cy,
      r: measurementData.item.r,
      fixedValue: true,
      fixedLabel: label,
      color: '#ff6600', // Oranžová pro fixované
      label: 'R',
    };
  } else if (measurementData.type === 'two_points') {
    // Pro body, vytvoř pomocný objekt
    dimension = {
      type: 'dimension',
      dimType: 'distance',
      value: value,
      x1: measurementData.item1.x,
      y1: measurementData.item1.y,
      x2: measurementData.item2.x,
      y2: measurementData.item2.y,
      fixedValue: true,
      fixedLabel: label,
      color: '#ff6600',
    };
  } else if (measurementData.type === 'two_lines') {
    // Pro usečky, vytvoř pomocný objekt
    dimension = {
      type: 'dimension',
      dimType: 'measurement',
      value: value,
      targets: [measurementData.item1, measurementData.item2],
      fixedValue: true,
      fixedLabel: label,
      color: '#ff6600',
    };
  }

  if (dimension) {
    window.shapes.push(dimension);
    
    // Ulož stav
    if (window.saveState) window.saveState();
    if (window.updateSnapPoints) window.updateSnapPoints();
    if (window.draw) window.draw();
    
    // Aktualizuj panel kót
    window.displayFixedCotasPanel();
    
    alert(`✅ Kóta fixována: ${label} = ${value.toFixed(2)} mm`);
  }
}

/**
 * Zobrazí seznam všech fixovaných kót v panelu "upravy/kota"
 */
window.displayFixedCotasPanel = function() {
  if (!window.shapes) return;

  const cotasContainer = document.getElementById('cotasPanel');
  if (!cotasContainer) return;

  const fixedDimensions = window.shapes.filter(s => s.type === 'dimension' && s.fixedValue);

  if (fixedDimensions.length === 0) {
    cotasContainer.innerHTML = '<div style="padding: 8px; color: #888; text-align: center; font-size: 12px;">Žádné fixované kóty</div>';
    return;
  }

  let html = '<div style="padding: 8px;">';
  fixedDimensions.forEach((dim, idx) => {
    const label = dim.fixedLabel || dim.dimType || 'Kóta';
    const value = dim.value.toFixed(dim.fixedLabel?.includes('Úhel') ? 1 : 2);
    const unit = dim.fixedLabel?.includes('Úhel') ? '°' : 'mm';
    
    html += `
      <div style="
        padding: 6px 8px;
        background: rgba(255, 102, 0, 0.1);
        border: 1px solid #ff6600;
        margin: 4px 0;
        border-radius: 4px;
        font-size: 12px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      ">
        <div>
          <strong>${label}</strong>: ${value} ${unit}
        </div>
        <button onclick="window.deleteCota(${idx})" style="
          padding: 2px 6px;
          background: #ff4444;
          color: white;
          border: none;
          border-radius: 3px;
          cursor: pointer;
          font-size: 10px;
        ">✕</button>
      </div>
    `;
  });
  html += '</div>';

  cotasContainer.innerHTML = html;
};

/**
 * Smaže fixovanou kótu
 */
window.deleteCota = function(index) {
  if (!window.shapes) return;

  const fixedDimensions = window.shapes.filter(s => s.type === 'dimension' && s.fixedValue);
  
  if (index < 0 || index >= fixedDimensions.length) return;

  const dimensionToDelete = fixedDimensions[index];
  window.shapes = window.shapes.filter(s => s !== dimensionToDelete);

  if (window.saveState) window.saveState();
  if (window.updateSnapPoints) window.updateSnapPoints();
  if (window.draw) window.draw();
  
  window.displayFixedCotasPanel();
};

// Aktualizuj panel kót když se kresba změní
if (typeof window !== 'undefined') {
  window.addEventListener('draw', () => {
    window.displayFixedCotasPanel?.();
  });
}
