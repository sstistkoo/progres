// Funkce pro zobrazení modalu s odpočtem při rate limitu
function showRateLimitModal(seconds) {
  var modal = document.getElementById('rateLimitModal');
  var text = document.getElementById('rateLimitText');
  if (!modal || !text) return;
  modal.style.display = 'flex';
  let remaining = seconds;
  text.textContent = `Čekám na další pokus: ${remaining}s`;
  if (window._rateLimitInterval) clearInterval(window._rateLimitInterval);
  window._rateLimitInterval = setInterval(() => {
    remaining--;
    if (remaining > 0) {
      text.textContent = `Čekám na další pokus: ${remaining}s`;
    } else {
      text.textContent = 'Probíhá další pokus...';
      clearInterval(window._rateLimitInterval);
    }
  }, 1000);
}
// Synchronizace scrollování mezi textarea a čísly řádků
document.addEventListener('DOMContentLoaded', function() {
  var codeInput = document.getElementById('codeInput');
  var lineNumbers = document.getElementById('lineNumbers');
  if (codeInput && lineNumbers) {
    codeInput.addEventListener('scroll', function() {
      lineNumbers.scrollTop = codeInput.scrollTop;
    });
  }
});
// Moderní toggle pro AI dropdown menu
document.addEventListener('DOMContentLoaded', function() {
  var toggle = document.getElementById('aiDropdownToggle');
  if (!toggle) {
    console.warn('AI Dropdown Toggle button nenalezen!');
    return;
  }
  toggle.addEventListener('click', function(e) {
    e.stopPropagation();
    var modal = document.getElementById('aiQuickModal');
    if (modal) {
      // Pokud už je modal otevřený, zavři ho
      modal.remove();
      return;
    }
      // Jinak vytvoř modal pouze s placeholderem
      modal = document.createElement('div');
      modal.id = 'aiQuickModal';
      modal.style.position = 'fixed';
      modal.style.top = '50%';
      modal.className = 'modal-overlay';
      modal.innerHTML = `
        <div class="modal-content modal-content-center">
          <b>Rychlé akce</b><br><br>
          <em>(Zde budou další AI akce...)</em><br><br>
          <button id="closeAiQuickModal" class="btn-modal-close">Zavřít</button>
        </div>
      `;
      document.body.appendChild(modal);
      document.getElementById('closeAiQuickModal').onclick = function() {
        modal.remove();
      };
  });
});
// Vrátí aktuální kód z hlavního textarea editoru
function getCurrentCode() {
	var el = document.getElementById('codeInput');
	if (el) return el.value;
	return '';
}
// Přesunuto z html_studio.html

// ============================================
// VIEW SWITCHING
// ============================================
// ...existing code z původního <script> bloku html_studio.html...
// (Zde bude vložen veškerý JS kromě AI modulu)

// Odstraněno: starý toggleAIDropdownMenu a d-none logika – vše řeší nový toggle výše
