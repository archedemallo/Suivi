// ============================================================================
// Formulaires L'Arche de Mallo
// ============================================================================

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyBEURexbPp_1P4RVP-pc8_Sssi4xKwBVeGYW1doHDELkV-CJsSmhqoY1GKImdHcQBYcg/exec';

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
    // ── 1. Construire le HTML statique pour le PDF ────────────────────────────
    // On repart du outerHTML et on remplace les éléments interactifs
    // par leur équivalent statique lisible par le convertisseur Google

    var html = document.documentElement.outerHTML;

    // ── 2. Remplacer les <input> par leur valeur en texte souligné ────────────
    document.querySelectorAll('input.editable').forEach(function(input) {
        var val  = (input.value || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        var display = val
            ? '<span style="text-decoration:underline;min-width:80px;display:inline-block;">' + val + '</span>'
            : '<span style="text-decoration:underline;min-width:80px;display:inline-block;">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>';

        // Remplacer le tag input complet par le span
        var escapedId = input.id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        var regex = new RegExp('<input[^>]*id="' + escapedId + '"[^>]*>', 'g');
        html = html.replace(regex, display);
    });

    // ── 3. Remplacer les <textarea> par leur valeur ───────────────────────────
    document.querySelectorAll('textarea.editable').forEach(function(textarea) {
        if (!textarea.id) return;
        var val = (textarea.value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\n/g, '<br>');
        var display = '<div style="border:1px solid #999;min-height:60px;padding:4px;">' + val + '</div>';
        var escapedId = textarea.id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        var regex = new RegExp('<textarea[^>]*id="' + escapedId + '"[^>]*>[\\s\\S]*?<\\/textarea>', 'g');
        html = html.replace(regex, display);
    });

    // ── 4. Remplacer les cases à cocher par ☑ ou ☐ ──────────────────────────
    // On travaille sur le DOM pour avoir l'état réel des cases
    document.querySelectorAll('.checkbox').forEach(function(cb) {
        var isChecked = cb.classList.contains('checked');
        var symbol = isChecked ? '☑' : '☐';
        // Récupérer le texte parent
        var parent = cb.parentElement;
        var escapedOuter = cb.outerHTML
            .replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        html = html.replace(cb.outerHTML,
            '<span style="font-size:14px;font-family:Arial;">' + symbol + '</span>'
        );
    });

    // ── 5. Logo ───────────────────────────────────────────────────────────────
    // On garde le div.logo-box intact — Google Apps Script le remplacera par l'image

    // ── 6. Styles pour le PDF ─────────────────────────────────────────────────
    var pdfStyles = '<style>' +
        '.buttons{display:none!important}' +
        '.signature-pad-wrap{display:none!important}' +
        '.signature-controls{display:none!important}' +
        '#sig1-print{display:block!important}' +
        'body{font-family:Arial,sans-serif;font-size:12pt;}' +
        'input,textarea,button{display:none!important}' +
        '</style>';
    html = html.replace('<head>', '<head>' + pdfStyles);

    // ── 7. Signature ──────────────────────────────────────────────────────────
    var sigImage = getSignatureImage();
    if (sigImage) {
        html = html.replace('[[SIGNATURE_IMAGE]]',
            '<img src="' + sigImage + '" style="max-width:280px;max-height:120px;border:1px solid #ccc;display:block;">');
    } else {
        html = html.replace('[[SIGNATURE_IMAGE]]', '');
    }

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
// VALIDATION CHAMPS OBLIGATOIRES
// ============================================================
function validateRequiredFields() {
    var missing = [];
    document.querySelectorAll('[data-required="true"]').forEach(function(el) {
        var label = el.getAttribute('data-label') || el.id || 'Champ inconnu';
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
            if (!el.value || el.value.trim() === '') {
                missing.push(label);
                el.style.borderBottom = '2px solid red';
            } else {
                el.style.borderBottom = '';
            }
        }
    });

    // Vérifier la signature
    var sigCanvas = document.querySelector('#sig1 canvas');
    if (sigCanvas) {
        var ctx = sigCanvas.getContext('2d');
        var pixels = ctx.getImageData(0, 0, sigCanvas.width, sigCanvas.height).data;
        var empty  = true;
        for (var i = 0; i < pixels.length; i += 4) {
            if (pixels[i + 3] > 0) { empty = false; break; }
        }
        if (empty) missing.push('Signature');
    }

    return missing;
}

// ============================================================
// RÉCUPÉRER L'IMAGE DE SIGNATURE
// ============================================================
function getSignatureImage() {
    var canvas = document.querySelector('#sig1 canvas');
    if (!canvas) return '';
    return canvas.toDataURL('image/png');
}


// ============================================================
// BOUTON SAUVEGARDER
// ============================================================
async function saveForm() {
    // Validation des champs obligatoires
    var missing = validateRequiredFields();
    if (missing.length > 0) {
        alert('⚠️ Veuillez remplir les champs obligatoires :\n\n• ' + missing.join('\n• '));
        return;
    }

    var data     = collectFormData();
    var filename = buildFilename(data);

    data.onglet         = document.body.getAttribute('data-form-id') || document.title.substring(0, 30);
    data.filename       = filename;
    data.signatureImage = getSignatureImage();
    data.htmlContent    = encodeBase64Unicode(buildHtmlWithData());

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
    var excludeIds = ['dateNaissance', 'dateNaissancePersonne', 'dateVermifuge', 'prochainVermifuge', 'dateAntipuces', 'dateVaccin' ,'dateRappel', 'dateSterilisationCas1', 'dateLimiteSterilisation', 'dateCertificatVeto', 'date_debut', 'date_fin'];

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
    var excludeIds = ['dateNaissance', 'dateNaissancePersonne', 'dateVermifuge', 'prochainVermifuge', 'dateAntipuces', 'dateVaccin' ,'dateRappel', 'dateSterilisationCas1', 'dateLimiteSterilisation', 'dateCertificatVeto', 'date_debut', 'date_fin'];

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



// ============================================================
// SIGNATURE TACTILE
// ============================================================
function creerSignature(containerId, width, height) {
    width  = width  || 280;
    height = height || 120;

    var container = document.getElementById(containerId);
    if (!container) return;

    var wrap   = document.createElement('div');
    wrap.className = 'signature-pad-wrap';

    var canvas = document.createElement('canvas');
    canvas.width  = width;
    canvas.height = height;
    wrap.appendChild(canvas);
    container.appendChild(wrap);

    var btn = document.createElement('button');
    btn.textContent = 'Effacer';
    container.appendChild(btn);

    var ctx     = canvas.getContext('2d');
    var drawing = false;
    var signed  = false;

    ctx.strokeStyle = '#000';
    ctx.lineWidth   = 2;
    ctx.lineCap     = 'round';

    function hint() {
        ctx.fillStyle = '#bbb';
        ctx.font      = 'italic 12px Arial';
        ctx.fillText('Signez ici...', 8, height / 2);
    }
    hint();

    function getPos(e) {
        var rect  = canvas.getBoundingClientRect();
        var point = e.touches ? e.touches[0] : e;
        return { x: point.clientX - rect.left, y: point.clientY - rect.top };
    }
    function start(e) {
        e.preventDefault();
        if (!signed) { ctx.clearRect(0, 0, width, height); signed = true; }
        drawing = true;
        var pos = getPos(e);
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
    }
    function draw(e) {
        if (!drawing) return;
        e.preventDefault();
        var pos = getPos(e);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
    }
    function stop() { drawing = false; }

    canvas.addEventListener('mousedown',  start);
    canvas.addEventListener('mousemove',  draw);
    canvas.addEventListener('mouseup',    stop);
    canvas.addEventListener('mouseleave', stop);
    canvas.addEventListener('touchstart', start, { passive: false });
    canvas.addEventListener('touchmove',  draw,  { passive: false });
    canvas.addEventListener('touchend',   stop);

    btn.addEventListener('click', function() {
        ctx.clearRect(0, 0, width, height);
        signed = false;
        hint();
    });
}
