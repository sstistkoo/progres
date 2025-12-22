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
 * Zobrazí modal pro fixaci měření
 */
function showMeasurementFixationModal() {
  const modal = document.getElementById('fixationMeasurementModal');
  if (!modal || !window.pendingFixation) return;

  const fixation = window.pendingFixation;

  // Vyplnit label a hint
  const labelEl = document.getElementById('fixationLabel');
  const hintEl = document.getElementById('fixationHint');
  const valueInput = document.getElementById('fixationValueInput');

  if (labelEl) labelEl.textContent = fixation.label;

  if (hintEl) {
    if (fixation.label.includes('Úhel')) {
      hintEl.textContent = 'Původní hodnota: ' + fixation.originalValue.toFixed(1) + '°';
    } else {
      hintEl.textContent = 'Původní hodnota: ' + fixation.originalValue.toFixed(2) + ' mm';
    }
  }

  if (valueInput) {
    if (fixation.label.includes('Úhel')) {
      valueInput.value = fixation.value.toFixed(1);
      valueInput.step = '0.1';
    } else {
      valueInput.value = fixation.value.toFixed(2);
      valueInput.step = '0.01';
    }
    valueInput.focus();
    valueInput.select();
  }

  modal.style.display = 'flex';
}

/**
 * Zavře modal pro fixaci měření
 */
window.closeMeasurementFixationModal = function() {
  const modal = document.getElementById('fixationMeasurementModal');
  if (modal) {
    modal.style.display = 'none';
  }
  window.pendingFixation = null;
};

/**
 * Potvrdí fixaci a vytvoří kótu
 */
window.confirmMeasurementFixation = function() {
  if (!window.pendingFixation) return;

  const valueInput = document.getElementById('fixationValueInput');
  if (!valueInput) return;

  const newValue = parseFloat(valueInput.value);

  if (isNaN(newValue)) {
    alert('❌ Chybný formát čísla');
    return;
  }

  const fixation = window.pendingFixation;

  // Vytvoř kótu
  createCota(fixation.label, newValue, fixation.data);

  // Zavři modal
  window.closeMeasurementFixationModal();
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

  // Uložit do window pro modal
  window.pendingFixation = {
    type: data.type,
    data: data,
    value: value,
    label: label,
    originalValue: value
  };

  // Otevřít modal
  showMeasurementFixationModal();
};

/**
 * Zobrazí modal pro fixaci měření
 */
window.showMeasurementFixationModal = function() {
  if (!window.pendingFixation) return;

  const modal = document.getElementById('fixationMeasurementModal');
  if (!modal) return;

  const label = document.getElementById('fixationLabel');
  const input = document.getElementById('fixationValueInput');
  const hint = document.getElementById('fixationHint');

  if (label) label.textContent = window.pendingFixation.label;
  if (input) input.value = window.pendingFixation.value.toFixed(2);
  if (hint) hint.textContent = `(Původní hodnota: ${window.pendingFixation.originalValue.toFixed(2)})`;

  modal.style.display = 'flex';
};

/**
 * Zavře modal pro fixaci měření
 */
window.closeMeasurementFixationModal = function() {
  const modal = document.getElementById('fixationMeasurementModal');
  if (modal) modal.style.display = 'none';
  window.pendingFixation = null;
};

/**
 * Potvrdí fixaci měření s hodnotou z modalu
 */
window.confirmMeasurementFixation = function() {
  if (!window.pendingFixation) return;

  const input = document.getElementById('fixationValueInput');
  if (!input) return;

  const value = parseFloat(input.value);
  if (isNaN(value)) {
    alert('❌ Neplatná hodnota');
    return;
  }

  const data = window.pendingFixation.data;
  const label = window.pendingFixation.label;
  let dimension = null;

  // Vytvoř kótu na základě typu měření
  if (data.type === 'single_line') {
    dimension = {
      type: 'dimension',
      dimType: 'line_length',
      value: value,
      targets: [data.item],
      fixedValue: true,
      fixedLabel: label,
      color: '#ff6600',
    };
  } else if (data.type === 'circle') {
    dimension = {
      type: 'dimension',
      dimType: 'radius',
      value: value,
      targets: [data.item],
      fixedValue: true,
      fixedLabel: label,
      color: '#ff6600',
    };
  } else if (data.type === 'two_points') {
    dimension = {
      type: 'dimension',
      dimType: 'distance',
      value: value,
      targets: [data.item1, data.item2],
      fixedValue: true,
      fixedLabel: label,
      color: '#ff6600',
    };
  } else if (data.type === 'two_lines') {
    dimension = {
      type: 'dimension',
      dimType: 'measurement',
      value: value,
      targets: [data.item1, data.item2],
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

  // Zavři modal
  window.closeMeasurementFixationModal();
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
