// ============================================================================
// Formulaires L'Arche de Mallo
// ============================================================================

// ============================================================
// CONFIGURATION — À REMPLIR
// ============================================================
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx4vzrO0fmQngUPK7_3NUPxlyba8LKwzhYBLSh-NdN6nbhW5W2TVuUqp1l9uYy35uTz/exec';

// ============================================================
// ÉTAT DE SAUVEGARDE
// ============================================================
let formSaved = false;
let savedFilename = '';

// ============================================================
// CASES À COCHER
// ============================================================
function toggleCheck(element, groupName) {
    let box;

    if (element.classList.contains('checkbox')) {
        box = element;
        groupName = element.getAttribute('data-group');
    } else if (element.classList.contains('clickable-row')) {
        box = element.querySelector('.checkbox');
        if (!groupName) groupName = box && box.getAttribute('data-group');
    } else {
        box = element.querySelector ? element.querySelector('.checkbox') : element;
        if (!groupName && box) groupName = box.getAttribute('data-group');
    }

    if (!box) return;

    if (groupName) {
        document.querySelectorAll(`.checkbox[data-group="${groupName}"]`).forEach(cb => {
            if (cb !== box) cb.classList.remove('checked');
        });
    }

    box.classList.toggle('checked');
}

// ============================================================
// COLLECTE DES DONNÉES DU FORMULAIRE
// ============================================================
function collectFormData() {
    const data = {};

    document.querySelectorAll('input.editable, textarea.editable').forEach(el => {
        if (el.id) data[el.id] = el.value;
    });

    document.querySelectorAll('.checkbox.checked').forEach(cb => {
        const group = cb.getAttribute('data-group');
        const label = cb.parentElement.textContent.trim();
        if (group) {
            data['check_' + group] = data['check_' + group]
                ? data['check_' + group] + ', ' + label
                : label;
        }
    });

    document.querySelectorAll('input[type="checkbox"]:checked').forEach(cb => {
        const label = document.querySelector(`label[for="${cb.id}"]`);
        const key   = 'check_' + (cb.name || cb.id);
        data[key]   = data[key]
            ? data[key] + ', ' + (label ? label.textContent.trim() : cb.id)
            : (label ? label.textContent.trim() : cb.id);
    });

    return data;
}

// ============================================================
// NOM DU FICHIER PDF
// ============================================================
function buildFilename(data) {
    const date    = new Date();
    const dateStr = [
        String(date.getDate()).padStart(2, '0'),
        String(date.getMonth() + 1).padStart(2, '0'),
        date.getFullYear()
    ].join('-');

    const nom   = (data.nomAdoptant || data.nomComplet || data.nomProprietaire || data.nom || '').replace(/[^a-zA-Z0-9]/g, '_');
    const chat  = (data.nomChat || data.nomAnimal || data.chat || data.nom_animal || '').replace(/[^a-zA-Z0-9]/g, '_');
    const titre = document.title.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 40);

    const parts = [titre];
    if (nom)  parts.push(nom);
    if (chat) parts.push(chat);
    parts.push(dateStr);

    return parts.join('_');
}

// ============================================================
// ENVOI VERS GOOGLE APPS SCRIPT
// ============================================================
async function sendToGoogle(data) {
    const json = JSON.stringify(data);
    console.log('Taille des données envoyées :', Math.round(json.length / 1024) + ' Ko');

    try {
        console.log('Envoi en cours...');
        await fetch(APPS_SCRIPT_URL, {
            method:  'POST',
            mode:    'no-cors',
            headers: { 'Content-Type': 'text/plain' },
            body:    json
        });
        console.log('Envoi terminé');
        return true;
    } catch(e) {
        console.error('Erreur envoi Google :', e);
        return false;
    }
}

// ============================================================
// BOUTON SAUVEGARDER — Sheet + PDF Drive
// ============================================================
async function saveForm() {
    const data     = collectFormData();
    const filename = buildFilename(data);

    data.onglet      = document.body.getAttribute('data-form-id') || document.title.substring(0, 30);
    data.filename    = filename;
    data.htmlContent = btoa(unescape(encodeURIComponent(
        document.documentElement.outerHTML
    )));

    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);z-index:9999;display:flex;align-items:center;justify-content:center;color:white;font-size:18px;font-weight:bold;font-family:Arial;';
    overlay.innerHTML = '<div style="text-align:center">⏳<br><br>Sauvegarde en cours...<br><small>Veuillez patienter</small></div>';
    document.body.appendChild(overlay);

    const ok = await sendToGoogle(data);

    document.body.removeChild(overlay);

    if (ok !== false) {
        formSaved     = true;
        savedFilename = filename;

        const btnSave  = document.querySelector('.btn-save');
        const btnPrint = document.querySelector('.btn-print');

        if (btnSave) {
            btnSave.textContent = '✅ Sauvegardé';
            btnSave.className   = 'btn btn-saved';
            btnSave.disabled    = true;
        }

        if (btnPrint) {
            btnPrint.textContent = '🖨️ Imprimer';
            btnPrint.className   = 'btn btn-print';
            btnPrint.disabled    = false;
        }

        alert('✅ Sauvegarde réussie !\nVous pouvez maintenant imprimer le document.');

    } else {
        alert('❌ Erreur lors de la sauvegarde.\nVérifiez votre connexion et réessayez.');
    }
}

// ============================================================
// BOUTON IMPRIMER — uniquement accessible après sauvegarde
// ============================================================
function printForm() {
    if (!formSaved) {
        alert('⚠️ Veuillez d\'abord sauvegarder le formulaire.');
        return;
    }

    const originalTitle = document.title;
    document.title = savedFilename || document.title;
    window.print();
    setTimeout(() => document.title = originalTitle, 2000);
}

// ============================================================
// BOUTON NOUVEAU — Remet tout à zéro
// ============================================================
function resetForm() {
    if (!confirm('⚠️ Voulez-vous vraiment réinitialiser le formulaire ?\nToutes les données saisies seront perdues.')) return;

    const today      = getTodayISO();
    const excludeIds = ['dateNaissance', 'dateNaissancePersonne'];

    document.querySelectorAll('input.editable').forEach(input => {
        if (input.type === 'date') {
            input.value = excludeIds.includes(input.id) ? '' : today;
        } else {
            input.value = '';
        }
    });

    document.querySelectorAll('textarea.editable').forEach(t => t.value = '');
    document.querySelectorAll('.checkbox').forEach(cb => cb.classList.remove('checked'));
    document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);

    formSaved     = false;
    savedFilename = '';

    const btnSave  = document.querySelector('.btn-save');
    const btnPrint = document.querySelector('.btn-print');

    if (btnSave) {
        btnSave.textContent = '💾 Sauvegarder';
        btnSave.className   = 'btn btn-save';
        btnSave.disabled    = false;
    }

    if (btnPrint) {
        btnPrint.textContent = '🖨️ Imprimer';
        btnPrint.className   = 'btn btn-print btn-print-disabled';
        btnPrint.disabled    = true;
    }
}

// ============================================================
// UTILITAIRES
// ============================================================
function getTodayISO() {
    return new Date().toISOString().split('T')[0];
}

// ============================================================
// INIT AU CHARGEMENT
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    const today      = getTodayISO();
    const excludeIds = ['dateNaissance', 'dateNaissancePersonne'];

    document.querySelectorAll('input[type="date"]').forEach(el => {
        if (!excludeIds.includes(el.id) && !el.value) {
            el.value = today;
        }
    });

    makeDraggable();
});

// ============================================================
// DRAG & DROP DU PANNEAU BOUTONS
// ============================================================
function makeDraggable() {
    const panel = document.querySelector('.buttons');
    if (!panel) return;

    let isDragging = false;
    let startX, startY, offsetX = 0, offsetY = 0;

    function onStart(e) {
        if (e.target.classList.contains('btn')) return;
        isDragging = true;
        const point = e.touches ? e.touches[0] : e;
        startX = point.clientX - offsetX;
        startY = point.clientY - offsetY;
    }

    function onMove(e) {
        if (!isDragging) return;
        e.preventDefault();
        const point = e.touches ? e.touches[0] : e;
        offsetX = point.clientX - startX;
        offsetY = point.clientY - startY;
        panel.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
    }

    function onEnd() { isDragging = false; }

    panel.addEventListener('mousedown',  onStart);
    panel.addEventListener('touchstart', onStart, { passive: false });
    document.addEventListener('mousemove',  onMove);
    document.addEventListener('touchmove',  onMove, { passive: false });
    document.addEventListener('mouseup',  onEnd);
    document.addEventListener('touchend', onEnd);
}
