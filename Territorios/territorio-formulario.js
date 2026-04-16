/* ============================================================
   territorio-formulario.js – Mines & Monarch · Formulario de Territorio
   4 secciones: General · Descripción · Lore · Gobierno
   Guarda en Firebase Firestore → colección "solicitudes_territorio"
   ============================================================ */

import { initializeApp, getApps }  from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getFirestore, collection,
         addDoc, serverTimestamp }  from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

/* ── Firebase (reutiliza la instancia si ya existe) ── */
const firebaseConfig = {
    apiKey:            "AIzaSyC97DUSkDy8qOHnk5rm3P-263m4W6Okbzo",
    authDomain:        "minesandmonarch.firebaseapp.com",
    projectId:         "minesandmonarch",
    storageBucket:     "minesandmonarch.firebasestorage.app",
    messagingSenderId: "379898851786",
    appId:             "1:379898851786:web:b892cbf4d8508798d61f33"
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db  = getFirestore(app);

(function () {

    /* ════════════════════════════════════════
       HTML DEL MODAL
       ════════════════════════════════════════ */
    function injectFormModal() {
        const html = `
        <div class="form-overlay" id="formOverlay">
            <div class="form-box" id="formBox">

                <!-- Cabecera -->
                <div class="form-header">
                    <div class="form-header-deco"></div>
                    <button class="form-close" id="formClose" aria-label="Cerrar">✕</button>
                    <h2 class="form-title">Solicitar Territorio</h2>
                    <p class="form-subtitle">Completa las cuatro secciones para registrar tu reino en Belmaria</p>
                </div>

                <!-- Barra de progreso de secciones -->
                <div class="form-steps" id="formSteps">
                    <button class="form-step active" data-step="1">1 · General</button>
                    <button class="form-step" data-step="2">2 · Descripción</button>
                    <button class="form-step" data-step="3">3 · Lore</button>
                    <button class="form-step" data-step="4">4 · Gobierno</button>
                </div>

                <!-- ─────────────────────────────── -->
                <!-- SECCIÓN 1 · GENERAL             -->
                <!-- ─────────────────────────────── -->
                <div class="form-body form-section-panel" id="section1">

                    <p class="form-section-label">Identificación</p>
                    <div class="form-row full">
                        <div class="form-group">
                            <label class="form-label">Nombre completo del territorio <span>*</span></label>
                            <input class="form-input" type="text" id="f_nombre"
                                placeholder="Ej: Gran Kalheim del Norte" required>
                        </div>
                    </div>

                    <div class="form-row full">
                        <div class="form-group">
                            <label class="form-label">Nombre corto <span>*</span></label>
                            <input class="form-input" type="text" id="f_nombre_corto"
                                placeholder="Ej: Kalheim">
                        </div>
                    </div>

                    <p class="form-section-label">Gentilicio</p>
                    <p class="form-note" style="margin-bottom:12px">
                        Cómo se llama a los habitantes. Ejemplo: <em>kalheimiano, kalheimiana, kalheimiano, kalheimianos</em>
                    </p>

                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Masculino singular <span>*</span></label>
                            <input class="form-input" type="text" id="f_gent_masc_sg"
                                placeholder="Ej: kalheimiano">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Femenino singular <span>*</span></label>
                            <input class="form-input" type="text" id="f_gent_fem_sg"
                                placeholder="Ej: kalheimiana">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Masculino plural <span>*</span></label>
                            <input class="form-input" type="text" id="f_gent_masc_pl"
                                placeholder="Ej: kalheimianos">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Femenino plural <span>*</span></label>
                            <input class="form-input" type="text" id="f_gent_fem_pl"
                                placeholder="Ej: kalheimianas">
                        </div>
                    </div>

                    <div class="form-row full" style="margin-top:4px">
                        <div class="form-group">
                            <label class="form-label">
                                Neutro / No binario
                                <span class="form-badge-optional">Opcional</span>
                            </label>
                            <input class="form-input" type="text" id="f_gent_neutro"
                                placeholder="Ej: kalheimiane / kalheimianx">
                        </div>
                    </div>

                    <div class="form-nav-row">
                        <button class="form-cancel" id="formCancel" type="button">Cancelar</button>
                        <button class="form-next" type="button" data-next="2">Siguiente →</button>
                    </div>
                </div>

                <!-- ─────────────────────────────── -->
                <!-- SECCIÓN 2 · DESCRIPCIÓN         -->
                <!-- ─────────────────────────────── -->
                <div class="form-body form-section-panel" id="section2" style="display:none">

                    <p class="form-section-label">Descripción</p>
                    <div class="form-row full">
                        <div class="form-group">
                            <label class="form-label">Descripción del territorio <span>*</span></label>
                            <textarea class="form-textarea" id="f_descripcion" style="min-height:180px"
                                placeholder="Describe el territorio, su paisaje, su historia general, su cultura… Cada salto de línea será un párrafo separado." required></textarea>
                            <span class="form-note" style="margin-top:5px;display:block">
                                Cada salto de línea se convertirá en un párrafo separado.
                            </span>
                        </div>
                    </div>

                    <p class="form-section-label">Creencia</p>
                    <div class="form-row full">
                        <div class="form-group">
                            <label class="form-label">Religión / Creencia principal <span>*</span></label>
                            <textarea class="form-textarea" id="f_creencia" style="min-height:100px"
                                placeholder="¿En qué creen los habitantes? ¿Dioses, ancestros, la naturaleza, la magia…?"></textarea>
                        </div>
                    </div>

                    <div class="form-nav-row">
                        <button class="form-back" type="button" data-back="1">← Anterior</button>
                        <button class="form-next" type="button" data-next="3">Siguiente →</button>
                    </div>
                </div>

                <!-- ─────────────────────────────── -->
                <!-- SECCIÓN 3 · LORE                -->
                <!-- ─────────────────────────────── -->
                <div class="form-body form-section-panel" id="section3" style="display:none">

                    <p class="form-section-label">Miembro antes de empezar</p>
                    <div class="form-row full">
                        <div class="form-group">
                            <label class="form-label">
                                ¿Cuántos miembros necesitas antes de abrir el territorio?
                                <span class="form-badge-optional">Editable más tarde</span>
                            </label>
                            <input class="form-input" type="text" id="f_miembros_previos"
                                placeholder="Ej: 3 miembros fundadores confirmados"
                                disabled style="opacity:0.5;cursor:not-allowed">
                            <span class="form-note" style="margin-top:5px;display:block">
                                Este campo se habilitará en una actualización próxima.
                            </span>
                        </div>
                    </div>

                    <p class="form-section-label">Lore</p>
                    <div class="form-row full">
                        <div class="form-group">
                            <label class="form-label">Historia / Lore profundo <span>*</span></label>
                            <textarea class="form-textarea" id="f_lore" style="min-height:200px"
                                placeholder="Cuenta la historia del territorio con detalle: su origen, eventos clave, guerras pasadas, figuras legendarias, misterios…"></textarea>
                        </div>
                    </div>

                    <div class="form-nav-row">
                        <button class="form-back" type="button" data-back="2">← Anterior</button>
                        <button class="form-next" type="button" data-next="4">Siguiente →</button>
                    </div>
                </div>

                <!-- ─────────────────────────────── -->
                <!-- SECCIÓN 4 · GOBIERNO            -->
                <!-- ─────────────────────────────── -->
                <div class="form-body form-section-panel" id="section4" style="display:none">

                    <p class="form-section-label">Estructura de Gobierno</p>

                    <div class="form-row full">
                        <div class="form-group">
                            <label class="form-label">Explica la forma de gobierno <span>*</span></label>
                            <textarea class="form-textarea" id="f_gobierno_desc" style="min-height:100px"
                                placeholder="¿Cómo funciona el poder? ¿Quién manda y cómo se toman las decisiones?"></textarea>
                        </div>
                    </div>

                    <div class="form-row full">
                        <div class="form-group">
                            <label class="form-label">Planificación <span>*</span></label>
                            <textarea class="form-textarea" id="f_planificacion" style="min-height:90px"
                                placeholder="¿Qué planes tiene el territorio a corto/largo plazo? Construcciones, alianzas, expansión…"></textarea>
                        </div>
                    </div>

                    <div class="form-row full">
                        <div class="form-group">
                            <label class="form-label">Políticas exteriores <span>*</span></label>
                            <textarea class="form-textarea" id="f_politicas_ext" style="min-height:90px"
                                placeholder="¿Cómo se relaciona con otros territorios? ¿Es abierto, neutral, hostil…?"></textarea>
                        </div>
                    </div>

                    <div class="form-row full">
                        <div class="form-group">
                            <label class="form-label">Posibles guerras</label>
                            <textarea class="form-textarea" id="f_guerras" style="min-height:80px"
                                placeholder="¿Con qué territorios podría haber conflicto? ¿Por qué?"></textarea>
                        </div>
                    </div>

                    <p class="form-section-label">Tu personaje</p>

                    <div class="form-row full">
                        <div class="form-group">
                            <label class="form-label">¿Por qué tu personaje es el fundador? <span>*</span></label>
                            <textarea class="form-textarea" id="f_por_que_fundador" style="min-height:100px"
                                placeholder="Justifica desde el lore y la historia de tu personaje por qué es el fundador de este territorio."></textarea>
                        </div>
                    </div>

                    <div class="form-row full">
                        <div class="form-group">
                            <label class="form-label">Comentario adicional</label>
                            <textarea class="form-textarea" id="f_comentario" style="min-height:70px"
                                placeholder="Cualquier cosa que quieras añadir y no encaje en los apartados anteriores."></textarea>
                        </div>
                    </div>

                    <div class="form-submit-row">
                        <button class="form-back" type="button" data-back="3" style="margin-right:auto">← Anterior</button>
                        <span class="form-note">Los campos con <span style="color:#c0392b">*</span> son obligatorios</span>
                        <button class="form-submit" id="formSubmit" type="button">⚜ Enviar Solicitud</button>
                    </div>

                    <p class="form-error-msg" id="formError"></p>
                </div>

                <!-- Pantalla de éxito -->
                <div class="form-success" id="formSuccess">
                    <div class="form-success-icon">⚜</div>
                    <h3>¡Solicitud Enviada!</h3>
                    <p>Tu solicitud ha sido registrada en Belmaria.<br>
                    Un administrador la revisará y contactará contigo por Discord.</p>
                </div>

            </div>
        </div>`;

        document.body.insertAdjacentHTML('beforeend', html);
    }

    /* ════════════════════════════════════════
       NAVEGACIÓN ENTRE SECCIONES
       ════════════════════════════════════════ */
    function goToSection(n) {
        document.querySelectorAll('.form-section-panel').forEach(p => p.style.display = 'none');
        document.getElementById('section' + n).style.display = 'block';

        document.querySelectorAll('.form-step').forEach(s => {
            s.classList.toggle('active', parseInt(s.dataset.step) === n);
            s.classList.toggle('done',   parseInt(s.dataset.step) < n);
        });

        // Scroll al inicio del modal
        document.getElementById('formBox').scrollTo({ top: 0, behavior: 'smooth' });
    }

    /* ════════════════════════════════════════
       RECOGER DATOS
       ════════════════════════════════════════ */
    function val(id) {
        return document.getElementById(id)?.value?.trim() || '';
    }

    function collectData() {
        return {
            // Sección 1
            nombre:           val('f_nombre'),
            nombre_corto:     val('f_nombre_corto'),
            gentilicio: {
                masc_sg:  val('f_gent_masc_sg'),
                fem_sg:   val('f_gent_fem_sg'),
                masc_pl:  val('f_gent_masc_pl'),
                fem_pl:   val('f_gent_fem_pl'),
                neutro:   val('f_gent_neutro') || null
            },
            // Sección 2
            descripcion: val('f_descripcion')
                .split('\n').map(l => l.trim()).filter(Boolean),
            creencia:    val('f_creencia'),
            // Sección 3
            lore:        val('f_lore'),
            // Sección 4
            gobierno_desc:    val('f_gobierno_desc'),
            planificacion:    val('f_planificacion'),
            politicas_ext:    val('f_politicas_ext'),
            guerras:          val('f_guerras') || null,
            por_que_fundador: val('f_por_que_fundador'),
            comentario:       val('f_comentario') || null,
            // Meta
            estado:    'pendiente',
            creadoEn:  null   // se sustituye por serverTimestamp() al enviar
        };
    }

    /* ════════════════════════════════════════
       VALIDACIÓN
       ════════════════════════════════════════ */
    const REQUIRED = [
        ['f_nombre',          'Nombre completo del territorio (sección 1)'],
        ['f_nombre_corto',    'Nombre corto (sección 1)'],
        ['f_gent_masc_sg',    'Gentilicio masculino singular (sección 1)'],
        ['f_gent_fem_sg',     'Gentilicio femenino singular (sección 1)'],
        ['f_gent_masc_pl',    'Gentilicio masculino plural (sección 1)'],
        ['f_gent_fem_pl',     'Gentilicio femenino plural (sección 1)'],
        ['f_descripcion',     'Descripción del territorio (sección 2)'],
        ['f_creencia',        'Creencia / Religión (sección 2)'],
        ['f_lore',            'Lore (sección 3)'],
        ['f_gobierno_desc',   'Forma de gobierno (sección 4)'],
        ['f_planificacion',   'Planificación (sección 4)'],
        ['f_politicas_ext',   'Políticas exteriores (sección 4)'],
        ['f_por_que_fundador','Por qué tu personaje es el fundador (sección 4)']
    ];

    function validate() {
        for (const [id, label] of REQUIRED) {
            if (!val(id)) return `El campo "${label}" es obligatorio.`;
        }
        return null;
    }

    /* ════════════════════════════════════════
       ENVÍO A FIREBASE
       ════════════════════════════════════════ */
    async function submitForm() {
        const error = validate();
        if (error) {
            const errEl = document.getElementById('formError');
            errEl.textContent = '⚠ ' + error;
            errEl.style.display = 'block';
            return;
        }

        const btn = document.getElementById('formSubmit');
        btn.disabled = true;
        btn.textContent = 'Enviando…';

        try {
            const data = collectData();
            data.creadoEn = serverTimestamp();
            await addDoc(collection(db, 'solicitudes_territorio'), data);
            showSuccess();
        } catch (err) {
            console.error('[Territorio] Error al guardar:', err);
            const errEl = document.getElementById('formError');
            errEl.textContent = '⚠ Error al enviar. Inténtalo de nuevo.';
            errEl.style.display = 'block';
            btn.disabled = false;
            btn.textContent = '⚜ Enviar Solicitud';
        }
    }

    /* ── Pantalla de éxito ── */
    function showSuccess() {
        document.querySelectorAll('.form-section-panel').forEach(p => p.style.display = 'none');
        document.getElementById('formSteps').style.display = 'none';
        document.getElementById('formSuccess').classList.add('visible');
    }

    /* ════════════════════════════════════════
       INIT
       ════════════════════════════════════════ */
    function init() {
        injectFormModal();

        const overlay = document.getElementById('formOverlay');

        /* Abrir/cerrar */
        function openForm()  { overlay.classList.add('active'); document.body.style.overflow = 'hidden'; }
        function closeForm() { overlay.classList.remove('active'); document.body.style.overflow = ''; }

        document.getElementById('formClose').addEventListener('click', closeForm);
        document.getElementById('formCancel').addEventListener('click', closeForm);
        overlay.addEventListener('click', e => { if (e.target === overlay) closeForm(); });
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape' && overlay.classList.contains('active')) closeForm();
        });

        /* CTA de la página */
        const cta = document.getElementById('btnCrearTerritorio');
if (cta) cta.addEventListener('click', () => openForm());

        /* Botones de navegación (siguiente / anterior) */
        document.querySelectorAll('.form-next').forEach(btn => {
            btn.addEventListener('click', () => goToSection(parseInt(btn.dataset.next)));
        });
        document.querySelectorAll('.form-back').forEach(btn => {
            btn.addEventListener('click', () => goToSection(parseInt(btn.dataset.back)));
        });

        /* Tabs de pasos (solo navegación hacia atrás, sin saltar) */
        document.querySelectorAll('.form-step').forEach(tab => {
            tab.addEventListener('click', () => {
                const target = parseInt(tab.dataset.step);
                // Solo permite ir a secciones ya visitadas (done) o la actual
                if (tab.classList.contains('done') || tab.classList.contains('active')) {
                    goToSection(target);
                }
            });
        });

        /* Envío */
        document.getElementById('formSubmit').addEventListener('click', submitForm);

        /* Limpiar error al escribir */
        document.querySelectorAll('.form-input, .form-textarea').forEach(el => {
            el.addEventListener('input', () => {
                const errEl = document.getElementById('formError');
                if (errEl) { errEl.textContent = ''; errEl.style.display = 'none'; }
            });
        });
    }

    document.addEventListener('DOMContentLoaded', init);

})();
