// ============================================================================
// Formulaires L'Arche de Mallo
// ============================================================================

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby9frGljhtWQ4abfEFn9-FJYPJqz_4sr4brkUek4WQNnnZAT5VTm_dGTBbyGeQGG8Be/exec';

// ============================================================
// EN-TÊTE ASSOCIATION
// ============================================================
function creerEntete(options) {
    options = options || {};
    var dateId    = options.dateId    || 'dateAdoption';
    var dateLabel = options.dateLabel || 'Date :';
    var titre     = options.titre     || '';

    var el = document.getElementById('entete');
    if (!el) return;

    el.innerHTML =
        '<div class="header-adoption">' +
            '<div style="display:flex;align-items:center;gap:20px;flex:1;">' +
                '<div class="logo-box"></div>' +
                '<div class="header-info" style="font-size:11pt;">' +
                    '<p class="bold">Association L\'ARCHE DE MALLO</p>' +
                    '<p>' +
                        '8 ter rue d\'Eschène<br>' +
                        '90140 AUTRECHÊNE<br>' +
                        '07.71.64.69.89<br>' +
                        '<a href="mailto:archedemallo@gmail.com" class="blue">archedemallo@gmail.com</a>' +
                    '</p>' +
                '</div>' +
            '</div>' +
            '<div class="header-adoption-right">' +
                dateLabel + ' <input type="date" class="editable editable-date" id="' + dateId + '">' +
            '</div>' +
        '</div>' +
        (titre ? '<div class="title">' + titre + '</div>' : '');

    // Pré-remplir la date à aujourd'hui
    var dateEl = document.getElementById(dateId);
    if (dateEl && !dateEl.value) {
        dateEl.value = new Date().toISOString().split('T')[0];
    }
}


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
    
	
	// Collecter le sexe (cases à cocher)
	var sexeCoche = document.querySelector('.checkbox[data-group="sexe"].checked');
	if (sexeCoche) {
		data['sexe'] = sexeCoche.parentElement.textContent.trim();
	}
	
 // Collecter les cases multi-sélection (data-checked-group)
    document.querySelectorAll('.checkbox.checked[data-checked-group]').forEach(function(cb) {
        var group = cb.getAttribute('data-checked-group');
        var label = cb.parentElement.textContent.trim();
        data['check_' + group] = data['check_' + group]
            ? data['check_' + group] + ', ' + label
            : label;
    });
    
    document.querySelectorAll('input[type="checkbox"]:checked').forEach(function(cb) {
        var label = document.querySelector('label[for="' + cb.id + '"]');
        var key   = 'check_' + (cb.name || cb.id);
        data[key] = data[key]
            ? data[key] + ', ' + (label ? label.textContent.trim() : cb.id)
            : (label ? label.textContent.trim() : cb.id);
    });
    // Collecter les modes de paiement (multi-sélection par id)
    var modesPaiement = [];
    var payIds = {
        'pay_virement': 'Virement',
        'pay_cb':       'CB',
        'pay_espece':   'Espèce',
        'pay_cheque':   'Chèque'
    };
    Object.keys(payIds).forEach(function(id) {
        var el = document.getElementById(id);
        if (el && el.classList.contains('checked')) {
            modesPaiement.push(payIds[id]);
        }
    });
    var pay2 = document.getElementById('pay_2cheques');
    if (pay2 && pay2.classList.contains('checked')) {
        modesPaiement.push('Paiement en plusieurs fois');
    }
    if (modesPaiement.length > 0) {
        data['check_paiement'] = modesPaiement.join(', ');
    }

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

    // Remplacer les cases à cocher par ☑ ou ☐ selon leur état réel
    document.querySelectorAll('.checkbox').forEach(function(cb) {
        var isChecked = cb.classList.contains('checked');
        var symbol = isChecked ? '☑' : '☐';
        html = html.replace(cb.outerHTML,
            '<span style="font-size:14px;font-family:Arial;vertical-align:middle;">' + symbol + '</span>'
        );
    });

    // Cacher les boutons, canvas et bouton Effacer — afficher toutes les signatures images
    html = html.replace('<head>', '<head><style>' +
        '.buttons{display:none!important}' +
        '.signature-pad-wrap{display:none!important}' +
        '.signature-controls{display:none!important}' +
        '[id$="-print"]{display:block!important}' +
        'button{display:none!important}' +
        'input.editable{border:none!important;border-bottom:1px solid #333!important;background:transparent!important;-webkit-appearance:none!important;box-shadow:none!important;outline:none!important;}' +
'#puce,#nom,#prenom,#adresse,#email,#nomAttestation{min-width:300px!important;width:auto!important;}' +
        'label[style*="background:#0563c1"]{display:none!important}' +
'.preview-wrap p.small{display:none!important}' +
        '</style>');

    // Injecter les images de signature dans les placeholders
    // Chercher toutes les signatures disponibles (sig1, sig2, sig3...)
    var sigIds = ['sig1', 'sig2', 'sig3', 'sig4'];
    sigIds.forEach(function(sigId) {
        var canvas = document.querySelector('#' + sigId + ' canvas');
        if (canvas) {
            var sigImage = canvas.toDataURL('image/png');
            var printId = sigId + '-print';
            // Remplacer le [[SIGNATURE_IMAGE]] dans le div correspondant
            var regex = new RegExp('(id="' + printId + '"[^>]*>)\\[\\[SIGNATURE_IMAGE\\]\\]', 'g');
            html = html.replace(regex, '$1<img src="' + sigImage + '" style="max-width:280px;max-height:120px;border:1px solid #ccc;display:block;">');
        }
    });
    // Effacer les placeholders non remplis
    html = html.replace(/\[\[SIGNATURE_IMAGE\]\]/g, '');

    
// Dates : format français + masque invisible si vide
   html = html.replace(
    /<input([^>]*?)type="date"([^>]*?)>/g,
    function(match) {
        var valMatch = match.match(/value="([^"]*)"/);
        var val = valMatch ? valMatch[1] : '';
        var affichage = '';
        if (val) {
            var parts = val.split('-');
            if (parts.length === 3) affichage = parts[2] + '/' + parts[1] + '/' + parts[0];
        }
        return '<span style="border-bottom:1px solid #333;display:inline-block;min-width:100px;padding:0 2px;">'
            + affichage + '</span>';
    }
);
    
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

    // Champs input avec data-required
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

    // Cases "Lu et approuvé"
    ['luApprouve1', 'luApprouve2'].forEach(function(id) {
        var el = document.getElementById(id);
        if (el && !el.querySelector('.checkbox').classList.contains('checked')) {
            var labels = { luApprouve1: 'Lu et approuvé (Arche de Mallo)', luApprouve2: 'Lu et approuvé (Adoptant)' };
            missing.push(labels[id]);
        }
    });

    // Signatures
    ['sig1', 'sig2'].forEach(function(sigId) {
        var container = document.getElementById(sigId);
        if (!container) return;
        if (!container._signed) {
            var sigLabels = { sig1: 'Signature Arche de Mallo', sig2: 'Signature de l\'adoptant' };
            missing.push(sigLabels[sigId] || 'Signature manquante');
        }
    });

// Civilité obligatoire
    var civiliteChecked = document.querySelector('.checkbox[data-group="civilite"].checked');
    if (!civiliteChecked) {
        missing.push('Civilité (Monsieur ou Madame)');
        // Mettre en rouge uniquement les cases à cocher
        document.querySelectorAll('.checkbox[data-group="civilite"]').forEach(function(cb) {
            cb.style.outline = '2px solid red';
            cb.style.outlineOffset = '1px';
        });
    } else {
        // Retirer le rouge si une civilité est cochée
        document.querySelectorAll('.checkbox[data-group="civilite"]').forEach(function(cb) {
            cb.style.outline = '';
        });
    }
	
    // Paiement : au moins un mode obligatoire
    var paiementCoche = document.querySelector('#pay_virement.checked, #pay_cb.checked, #pay_espece.checked, #pay_cheque.checked');
    var pay2cheques   = document.getElementById('pay_2cheques');
    if (!paiementCoche && !(pay2cheques && pay2cheques.classList.contains('checked'))) {
        missing.push('Mode de règlement (au moins un à cocher)');
    }

    // N° chèque obligatoire si Chèque coché
    var payCheque = document.getElementById('pay_cheque');
    if (payCheque && payCheque.classList.contains('checked')) {
        var numPaiement = document.getElementById('numeroPaiement');
        if (!numPaiement || !numPaiement.value.trim()) {
            missing.push('Numéro de chèque');
            if (numPaiement) numPaiement.style.borderBottom = '2px solid red';  // ← rouge
        }
    }

    // Paiement en plusieurs fois : soit 2 chèques remplis, soit au moins 3 des 4 chèques remplis
    if (pay2cheques && pay2cheques.classList.contains('checked')) {
        var val1 = (document.getElementById('cheque1') || {}).value || '';
        var val2 = (document.getElementById('cheque2') || {}).value || '';
        var vals4 = ['cheque3','cheque4','cheque5','cheque6'].map(function(id) {
            return ((document.getElementById(id) || {}).value || '').trim();
        });
        var nb4remplis = vals4.filter(function(v) { return v !== ''; }).length;

        var ok2 = val1.trim() && val2.trim();          // les 2 chèques remplis
        var ok4 = nb4remplis >= 3;                     // au moins 3 des 4 chèques remplis

        if (!ok2 && !ok4) {
            missing.push('Paiement en plusieurs fois : remplir les 2 chèques OU au moins 3 des 4 chèques');
            // Mettre en rouge les champs vides selon le contexte
            if (!ok2) {
                ['cheque1','cheque2'].forEach(function(id) {
                    var el = document.getElementById(id);
                    if (el && !el.value.trim()) el.style.borderBottom = '2px solid red';
                });
            }
            if (!ok4) {
                ['cheque3','cheque4','cheque5','cheque6'].forEach(function(id, i) {
                    var el = document.getElementById(id);
                    if (el && !vals4[i]) el.style.borderBottom = '2px solid red';
                });
            }
        }
    }

    // Résultat FIV et Diarrhée si OUI coché
    var libRes = {
        resultatFIV:      'Résultat FIV/FEL (Négatif ou Positif)',
        resultatDiarrhee: 'Résultat test diarrhée (Négatif ou Positif)'
    };
	
    ['resultatFIV', 'resultatDiarrhee'].forEach(function(group) {
        if (document.body.getAttribute('data-required-group-' + group) === 'true') {
            var checked = document.querySelector('.checkbox[data-group="' + group + '"].checked');
            if (!checked) {
                missing.push(libRes[group]);
                // Mettre en rouge les cases NÉGATIF et POSITIF
                document.querySelectorAll('.checkbox[data-group="' + group + '"]').forEach(function(cb) {
                    cb.style.outline = '2px solid red';
                    cb.style.outlineOffset = '1px';
                });
            } else {
                // Retirer le rouge si une case est cochée
                document.querySelectorAll('.checkbox[data-group="' + group + '"]').forEach(function(cb) {
                    cb.style.outline = '';
                });
            }
        }
    });;

    // Email format
    document.querySelectorAll('input[type="email"].editable').forEach(function(el) {
        if (!el.value || el.value.trim() === '') return;
        var valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value.trim());
        if (!valid) {
            missing.push('Email invalide : ' + el.value);
            el.style.borderBottom = '2px solid red';
        }
    });

    // Dates conditionnelles : marquer en rouge si obligatoires et vides
    ['dateVermifuge', 'prochainVermifuge', 'dateAntiPuces', 'dateprochainAntiPuces',
     'dateVaccin', 'dateRappel',
     'dateSterilisationCas1', 'dateLimiteSterilisation'].forEach(function(id) {
        var el = document.getElementById(id);
        if (el && el.getAttribute('data-required') === 'true' && !el.value) {
            el.style.borderBottom = '2px solid red';
        }
    });

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
       afficherMessage('⚠️ Veuillez remplir les champs obligatoires :<br><br>• ' + missing.join('<br>• '), 'erreur');
        return;
    }

    var data     = collectFormData();
    var filename = buildFilename(data);

    data.onglet         = document.body.getAttribute('data-form-id') || document.title.substring(0, 30);
    data.filename       = filename;
    data.signatureImage = getSignatureImage(); // sig1 pour compatibilité
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
        afficherMessage('✅ Mail généré<br>Vous pouvez maintenant imprimer si besoin.');
    } else {
        alert('Erreur lors de la sauvegarde. Verifiez votre connexion.');
    }
}

// ============================================================
// Fonction afficher message
// ============================================================
function afficherMessage(texte, type) {
    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:99999;display:flex;align-items:center;justify-content:center;';

    var couleurBordure = (type === 'erreur') ? '#c00000' : '#28a745';

    var boite = document.createElement('div');
    boite.style.cssText = 'background:white;border-radius:10px;padding:30px 40px;max-width:400px;width:90%;box-shadow:0 4px 20px rgba(0,0,0,0.3);border-top:4px solid ' + couleurBordure + ';font-family:Calibri,Arial,sans-serif;text-align:center;';
    boite.innerHTML =
        '<p style="font-size:15px;line-height:1.6;margin:0 0 20px;">' + texte + '</p>' +
        '<button onclick="this.closest(\'div[style*=fixed]\').remove()" ' +
        'style="background:' + couleurBordure + ';color:white;border:none;padding:10px 30px;border-radius:5px;cursor:pointer;font-size:14px;font-weight:bold;">OK</button>';

    overlay.appendChild(boite);
    document.body.appendChild(overlay);
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
    var excludeIds = ['dateNaissance', 'dateNaissancePersonne', 'dateVermifuge', 'prochainVermifuge','dateprochainAntiPuces', 'dateAntipuces', 'dateVaccin' ,'dateRappel', 'dateSterilisationCas1', 'dateLimiteSterilisation', 'dateCertificatVeto', 'date_debut', 'date_fin'];

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
    var excludeIds = ['dateNaissance', 'dateNaissancePersonne', 'dateVermifuge', 'prochainVermifuge', 'dateAntipuces', 'dateAntiPuces', 'dateprochainAntiPuces', 'dateVaccin', 'dateRappel', 'dateSterilisationCas1', 'dateLimiteSterilisation', 'dateCertificatVeto', 'date_debut', 'date_fin'];

    document.querySelectorAll('input[type="date"].editable').forEach(function(el) {
        if (!excludeIds.includes(el.id) && !el.value) {
            el.value = today;
        }
    });

    // Forcer le vidage des dates qui ne doivent pas se remplir automatiquement
    // (annule l'autofill de Chrome)
    excludeIds.forEach(function(id) {
        var el = document.getElementById(id);
        if (el) el.value = '';
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

    // FLAG : indique qu'une signature a été tracée
    container._signed = false;

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
        container._signed = true;  // FLAG activé
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
        container._signed = false;  // FLAG remis à zéro
        hint();
    });
}

function majObligatoire(group, champIds, valeursOui) {
    valeursOui = valeursOui || ['OUI'];
    var checked  = document.querySelector('.checkbox[data-group="' + group + '"].checked');
    var estActif = false;
    if (checked) {
        var texte = checked.parentElement.textContent.trim().toUpperCase();
        estActif  = valeursOui.some(function(v) { return texte.startsWith(v.toUpperCase()); });
    }
    // Cas 1 / Cas 2 : testés via leur id direct
    if (group === 'cas1direct') {
        var c = document.getElementById('cas1_check');
        estActif = c ? c.classList.contains('checked') : false;
    }
    if (group === 'cas2direct') {
        var c = document.getElementById('cas2_check');
        estActif = c ? c.classList.contains('checked') : false;
    }
    champIds.forEach(function(id) {
        var el = document.getElementById(id);
        if (!el) { document.body.setAttribute('data-required-group-' + id, estActif ? 'true' : ''); return; }
        if (estActif) {
            el.setAttribute('data-required', 'true');
            el.setAttribute('data-label', el.getAttribute('data-label') || id);
        } else {
            el.removeAttribute('data-required');
            el.style.borderBottom = '';
        }
    });
}
