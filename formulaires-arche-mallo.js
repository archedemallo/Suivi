// ============================================================================
// Formulaires L'Arche de Mallo
// ============================================================================


// ============================================================
// CONFIGURATION — À REMPLIR
// ============================================================
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx4vzrO0fmQngUPK7_3NUPxlyba8LKwzhYBLSh-NdN6nbhW5W2TVuUqp1l9uYy35uTz/exec';


// --- CASES À COCHER ---
// Gère deux syntaxes : onclick sur .clickable-row ou directement sur .checkbox
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
        // Comportement radio : décocher les autres du même groupe
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

    // Champs texte / date / number / email / tel
    document.querySelectorAll('input.editable, textarea.editable').forEach(el => {
        if (el.id) data[el.id] = el.value;
    });

    // Checkboxes personnalisées cochées
    document.querySelectorAll('.checkbox.checked').forEach(cb => {
        const group = cb.getAttribute('data-group');
        const label = cb.parentElement.textContent.trim();
        if (group) {
            data['check_' + group] = data['check_' + group]
                ? data['check_' + group] + ', ' + label
                : label;
        }
    });

    // Checkboxes HTML natives
    document.querySelectorAll('input[type="checkbox"]:checked').forEach(cb => {
        const label = document.querySelector(`label[for="${cb.id}"]`);
        const key = 'check_' + (cb.name || cb.id);
        data[key] = data[key]
            ? data[key] + ', ' + (label ? label.textContent.trim() : cb.id)
            : (label ? label.textContent.trim() : cb.id);
    });

    return data;
}

// ============================================================
// NOM DU FICHIER PDF
// ============================================================
function buildFilename(data) {
    const date = new Date();
    const dateStr = [
        String(date.getDate()).padStart(2, '0'),
        String(date.getMonth() + 1).padStart(2, '0'),
        date.getFullYear()
    ].join('-');

    // Infos importantes selon le formulaire
    const nom    = (data.nomAdoptant || data.nomComplet || data.nomProprietaire || data.nom || '').replace(/[^a-zA-Z0-9]/g, '_');
    const chat   = (data.nomChat || data.nomAnimal || data.chat || data.nom_animal || '').replace(/[^a-zA-Z0-9]/g, '_');
    const titre  = document.title.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 40);

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
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'text/plain' },
            body: json
        });
        console.log('Envoi terminé');
        return true;
    } catch(e) {
        console.error('Erreur envoi Google :', e);
        return false;
    }
}

// ============================================================
// BOUTON IMPRIMER — FONCTION PRINCIPALE
// ============================================================
async function printForm() {
    const data     = collectFormData();
    const filename = buildFilename(data);

    // Métadonnées
    data.onglet    = document.body.getAttribute('data-form-id') || document.title.substring(0, 30);
    data.filename  = filename;

    // Encoder le HTML en base64 pour Drive
    data.htmlContent = btoa(unescape(encodeURIComponent(
        document.documentElement.outerHTML
    )));

    // Afficher indicateur
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);z-index:9999;display:flex;align-items:center;justify-content:center;color:white;font-size:18px;font-weight:bold;font-family:Arial;';
    overlay.innerHTML = '<div style="text-align:center">⏳<br><br>Sauvegarde en cours...<br><small>L\'impression s\'ouvrira ensuite</small></div>';
    document.body.appendChild(overlay);

    // Envoyer vers Google
    await sendToGoogle(data);

    // Retirer l'overlay et imprimer
    document.body.removeChild(overlay);

    // Nom du fichier pour l'impression
    const originalTitle = document.title;
    document.title = filename;
    window.print();
    setTimeout(() => document.title = originalTitle, 2000);
}





// --- RÉINITIALISATION ---
function resetForm() {
    if (!confirm('⚠️ Voulez-vous vraiment réinitialiser le formulaire ?\nToutes les données saisies seront perdues.')) return;

    const today = getTodayISO();
    const excludeIds = ['dateNaissance', 'dateNaissancePersonne'];

    document.querySelectorAll('input.editable').forEach(input => {
        if (input.type === 'date') {
            input.value = excludeIds.includes(input.id) ? '' : today;
        } else {
            input.value = '';
        }
    });

    // Décocher toutes les cases
    document.querySelectorAll('.checkbox').forEach(cb => cb.classList.remove('checked'));
}

// --- UTILITAIRES ---
function getTodayISO() {
    return new Date().toISOString().split('T')[0];
}

// --- INIT AU CHARGEMENT ---
document.addEventListener('DOMContentLoaded', () => {
    const today = getTodayISO();

    // Initialiser TOUTES les dates à aujourd'hui, sauf les dates de naissance
    const excludeIds = ['dateNaissance', 'dateNaissancePersonne'];

    document.querySelectorAll('input[type="date"]').forEach(el => {
        if (!excludeIds.includes(el.id)) {
            el.value = today;
        }
    });

    // Rendre le panneau de boutons déplaçable
    makeDraggable();
});

// --- DRAG & DROP DU PANNEAU BOUTONS ---
function makeDraggable() {
    const panel = document.querySelector('.buttons');
    if (!panel) return;

    let isDragging = false;
    let startX, startY, offsetX = 0, offsetY = 0;

    function onStart(e) {
        if (e.target.classList.contains('btn')) return; // ne pas déclencher sur clic bouton
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
