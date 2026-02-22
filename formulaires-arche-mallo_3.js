// ============================================================================
// Formulaires L'Arche de Mallo
// ============================================================================

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbydedBMjH4TteG1e97NUQ7yGfMflZVyx0m3ZXAYP1d_cZv9H8_L4F05Zp5tQZTaTUXWtQ/exec';

let formSaved     = false;
let savedFilename = '';

// ============================================================
// CASES A COCHER
// ============================================================
function toggleCheck(element, groupName) {
    let box;
    if (element.classList.contains('checkbox')) {
        box       = element;
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
        document.querySelectorAll('.checkbox[data-group="' + groupName + '"]').forEach(function(cb) {
            if (cb !== box) cb.classList.remove('checked');
        });
    }
    box.classList.toggle('checked');
}

// ============================================================
// COLLECTE DES DONNEES
// ============================================================
function collectFormData() {
    var data = {};
    document.querySelectorAll('input.editable, textarea.editable').forEach(function(el) {
        if (el.id) data[el.id] = el.value;
    });
    document.querySelectorAll('.checkbox.checked').forEach(function(cb) {
        var group = cb.getAttribute('data-group');
        var label = cb.parentElement.textContent.trim();
        if (group) {
            data['check_' + group] = data['check_' + group]
                ? data['check_' + group] + ', ' + label
                : label;
        }
    });
    document.querySelectorAll('input[type="checkbox"]:checked').forEach(function(cb) {
        var label = document.querySelector('label[for="' + cb.id + '"]');
        var key   = 'check_' + (cb.name || cb.id);
        data[key] = data[key]
            ? data[key] + ', ' + (label ? label.textContent.trim() : cb.id)
            : (label ? label.textContent.trim() : cb.id);
    });
    return data;
}

// ============================================================
// NOM DU FICHIER
// ============================================================
function buildFilename(data) {
    var date    = new Date();
    var dateStr = [
        String(date.getDate()).padStart(2, '0'),
        String(date.getMonth() + 1).padStart(2, '0'),
        date.getFullYear()
    ].join('-');
    var nom   = (data.nomAdoptant || data.nomComplet || data.nomProprietaire || data.nom || '').replace(/[^a-zA-Z0-9]/g, '_');
    var chat  = (data.nomChat || data.nomAnimal || data.chat || data.nom_animal || '').replace(/[^a-zA-Z0-9]/g, '_');
    var titre = document.title.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 40);
    var parts = [titre];
    if (nom)  parts.push(nom);
    if (chat) parts.push(chat);
    parts.push(dateStr);
    return parts.join('_');
}

// ============================================================
// CONSTRUIRE HTML AVEC DONNEES
// ============================================================
function buildHtmlWithData() {
    var html = document.documentElement.outerHTML;

    document.querySelectorAll('input.editable').forEach(function(input) {
        if (!input.id || !input.value) return;
        var val = input.value
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;');
        var regex = new RegExp('(id="' + input.id + '")((?:[^>]*?))(>)', 'g');
        html = html.replace(regex, function(match, id, rest, end) {
            var cleanRest = rest.replace(/\s+value="[^"]*"/, '');
            return id + cleanRest + ' value="' + val + '"' + end;
        });
    });

    document.querySelectorAll('textarea.editable').forEach(function(textarea) {
        if (!textarea.id) return;
        var val = textarea.value
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
        var regex = new RegExp('(<textarea[^>]*?id="' + textarea.id + '"[^>]*>)[\\s\\S]*?(<\\/textarea>)', 'g');
        html = html.replace(regex, '$1' + val + '$2');
    });

    html = html.replace('<head>', '<head><style>.buttons{display:none!important}</style>');
    return html;
}

// ============================================================
// ENCODAGE BASE64 UNICODE
// ============================================================
function encodeBase64Unicode(str) {
    var uint8 = new TextEncoder().encode(str);
    var binary = '';
    uint8.forEach(function(b) { binary += String.fromCharCode(b); });
    return btoa(binary);
}

// ============================================================
// ENVOI VERS GOOGLE
// ============================================================
async function sendToGoogle(data) {
    var json = JSON.stringify(data);
    console.log('Taille des donnees : ' + Math.round(json.length / 1024) + ' Ko');
    try {
        console.log('Envoi en cours...');
        await fetch(APPS_SCRIPT_URL, {
            method:  'POST',
            mode:    'no-cors',
            headers: { 'Content-Type': 'text/plain' },
            body:    json
        });
        console.log('Envoi termine');
        return true;
    } catch(e) {
        console.error('Erreur envoi :', e);
        return false;
    }
}

// ============================================================
// BOUTON SAUVEGARDER
// ============================================================
async function saveForm() {
    var data     = collectFormData();
    var filename = buildFilename(data);

    data.onglet      = document.body.getAttribute('data-form-id') || document.title.substring(0, 30);
    data.filename    = filename;
    data.htmlContent = encodeBase64Unicode(buildHtmlWithData());

    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);z-index:9999;display:flex;align-items:center;justify-content:center;color:white;font-size:18px;font-weight:bold;font-family:Arial;';
    overlay.innerHTML = '<div style="text-align:center">En cours...<br><br><small>Veuillez patienter</small></div>';
    document.body.appendChild(overlay);

    var ok = await sendToGoogle(data);
    document.body.removeChild(overlay);

    if (ok !== false) {
        formSaved     = true;
        savedFilename = filename;

        var btnSave  = document.querySelector('.btn-save');
        var btnPrint = document.querySelector('.btn-print');

        if (btnSave) {
            btnSave.textContent = 'Sauvegarde OK';
            btnSave.className   = 'btn btn-saved';
            btnSave.disabled    = true;
        }
        if (btnPrint) {
            btnPrint.textContent = 'Imprimer';
            btnPrint.className   = 'btn btn-print';
            btnPrint.disabled    = false;
        }
        alert('Sauvegarde reussie ! Vous pouvez maintenant imprimer.');
    } else {
        alert('Erreur lors de la sauvegarde. Verifiez votre connexion.');
    }
}

// ============================================================
// BOUTON IMPRIMER
// ============================================================
function printForm() {
    if (!formSaved) {
        alert('Veuillez dabord sauvegarder le formulaire.');
        return;
    }
    var originalTitle = document.title;
    document.title    = savedFilename || document.title;
    window.print();
    setTimeout(function() { document.title = originalTitle; }, 2000);
}

// ============================================================
// BOUTON NOUVEAU
// ============================================================
function resetForm() {
    if (!confirm('Voulez-vous vraiment reinitialiser le formulaire ? Toutes les donnees saisies seront perdues.')) return;

    var today      = getTodayISO();
    var excludeIds = ['dateNaissance', 'dateNaissancePersonne'];

    document.querySelectorAll('input.editable').forEach(function(input) {
        if (input.type === 'date') {
            input.value = excludeIds.includes(input.id) ? '' : today;
        } else {
            input.value = '';
        }
    });

    document.querySelectorAll('textarea.editable').forEach(function(t) { t.value = ''; });
    document.querySelectorAll('.checkbox').forEach(function(cb) { cb.classList.remove('checked'); });
    document.querySelectorAll('input[type="checkbox"]').forEach(function(cb) { cb.checked = false; });

    formSaved     = false;
    savedFilename = '';

    var btnSave  = document.querySelector('.btn-save');
    var btnPrint = document.querySelector('.btn-print');

    if (btnSave) {
        btnSave.textContent = 'Sauvegarder';
        btnSave.className   = 'btn btn-save';
        btnSave.disabled    = false;
    }
    if (btnPrint) {
        btnPrint.textContent = 'Imprimer';
        btnPrint.className   = 'btn btn-print btn-print-disabled';
        btnPrint.disabled    = true;
    }
}

// ============================================================
// UTILITAIRES
// ============================================================
function getTodayISO() {
    var d = new Date();
    return [
        d.getFullYear(),
        String(d.getMonth() + 1).padStart(2, '0'),
        String(d.getDate()).padStart(2, '0')
    ].join('-');
}

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
    var today      = getTodayISO();
    var excludeIds = ['dateNaissance', 'dateNaissancePersonne'];

    document.querySelectorAll('input[type="date"].editable').forEach(function(el) {
        if (!excludeIds.includes(el.id) && !el.value) {
            el.value = today;
        }
    });

    makeDraggable();
});

// ============================================================
// DRAG & DROP
// ============================================================
function makeDraggable() {
    var panel = document.querySelector('.buttons');
    if (!panel) return;

    var isDragging = false;
    var startX, startY, offsetX = 0, offsetY = 0;

    function onStart(e) {
        if (e.target.classList.contains('btn')) return;
        isDragging = true;
        var point = e.touches ? e.touches[0] : e;
        startX = point.clientX - offsetX;
        startY = point.clientY - offsetY;
    }

    function onMove(e) {
        if (!isDragging) return;
        e.preventDefault();
        var point = e.touches ? e.touches[0] : e;
        offsetX = point.clientX - startX;
        offsetY = point.clientY - startY;
        panel.style.transform = 'translate(' + offsetX + 'px, ' + offsetY + 'px)';
    }

    function onEnd() { isDragging = false; }

    panel.addEventListener('mousedown',  onStart);
    panel.addEventListener('touchstart', onStart, { passive: false });
    document.addEventListener('mousemove',  onMove);
    document.addEventListener('touchmove',  onMove, { passive: false });
    document.addEventListener('mouseup',  onEnd);
    document.addEventListener('touchend', onEnd);
}