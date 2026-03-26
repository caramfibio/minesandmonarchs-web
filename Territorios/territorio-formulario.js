/* ============================================================
   territorio-formulario.js – Mines & Monarch · Formulario de Territorio
   ============================================================ */

(function () {

    const RAZAS_DISPONIBLES = [
        'Humanos', 'Elfos del Bosque', 'Elfos de las Nieves',
        'Enanos', 'Enanos del Norte', 'Goblins', 'Medianos',
        'Orcos', 'Semielfos', 'No-muertos', 'Draconidos'
    ];

    /* ── Inyectar HTML del modal en el body ── */
    function injectFormModal() {
        const razasCheckboxes = RAZAS_DISPONIBLES.map(r => `
            <label class="raza-check-label">
                <input type="checkbox" name="raza_permitida" value="${r}">
                <span>${r}</span>
            </label>`).join('');

        const html = `
        <div class="form-overlay" id="formOverlay">
            <div class="form-box" id="formBox">
                <div class="form-header">
                    <div class="form-header-deco"></div>
                    <button class="form-close" id="formClose" aria-label="Cerrar">✕</button>
                    <h2 class="form-title">Crear Territorio</h2>
                    <p class="form-subtitle">Completa todos los campos para registrar tu reino en Belmaria</p>
                </div>

                <div class="form-body" id="formBody">

                    <!-- Discord -->
                    <p class="form-section-label">Identificación</p>
                    <div class="form-row full">
                        <div class="form-group discord-field">
                            <label class="form-label">
                                Nombre de Discord <span>*</span>
                                <span class="discord-badge">⚡ Discord</span>
                            </label>
                            <input class="form-input" type="text" id="f_discord"
                                placeholder="usuario#0000 o @usuario" required>
                        </div>
                    </div>

                    <!-- Información básica -->
                    <p class="form-section-label">Información del Territorio</p>

                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Nombre del Territorio <span>*</span></label>
                            <input class="form-input" type="text" id="f_nombre"
                                placeholder="Ej: Kalheim" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Subtítulo / Lema</label>
                            <input class="form-input" type="text" id="f_subtitulo"
                                placeholder="Ej: El Reino Matriarcal del Norte">
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Forma de Gobierno <span>*</span></label>
                            <select class="form-select" id="f_gobierno">
                                <option value="" disabled selected>Selecciona…</option>
                                <option>Monarquía Absoluta</option>
                                <option>Monarquía Constitucional</option>
                                <option>Monarquía Hereditaria</option>
                                <option>República Democrática</option>
                                <option>República Oligárquica</option>
                                <option>Matriarcado</option>
                                <option>Patriarcado</option>
                                <option>Consejo de Ancianos</option>
                                <option>Teocracia</option>
                                <option>Anarquía Pactada</option>
                                <option>Dictadura</option>
                                <option>Otro</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">URL de imagen banner</label>
                            <input class="form-input" type="url" id="f_img_banner"
                                placeholder="https://…">
                        </div>
                    </div>

                    <div class="form-row full">
                        <div class="form-group">
                            <label class="form-label">Descripción corta <span>*</span></label>
                            <input class="form-input" type="text" id="f_desc_corta"
                                placeholder="Resumen en una frase de tu territorio" required>
                        </div>
                    </div>

                    <!-- Descripción larga — UN solo textarea -->
                    <p class="form-section-label">Historia & Lore</p>

                    <div class="form-row full">
                        <div class="form-group">
                            <label class="form-label">Descripción completa <span>*</span></label>
                            <textarea class="form-textarea" id="f_descripcion" style="min-height:160px"
                                placeholder="Escribe el lore de tu territorio. Pulsa Enter para separar párrafos." required></textarea>
                            <span class="form-note" style="margin-top:5px;display:block">
                                Cada salto de línea se convertirá en un párrafo separado.
                            </span>
                        </div>
                    </div>

                    <!-- Fundadores expandibles -->
                    <p class="form-section-label">Fundadores & Religión</p>

                    <div class="leyes-dynamic" id="fundadoresDynamic"></div>
                    <button class="ley-add" id="fundadorAddBtn" type="button">+ Añadir fundador</button>

                    <div class="form-row full" style="margin-top:14px">
                        <div class="form-group">
                            <label class="form-label">Religión / Creencia</label>
                            <input class="form-input" type="text" id="f_religion"
                                placeholder="Ej: Culto a las Ancestras">
                        </div>
                    </div>

                    <!-- Razas permitidas -->
                    <p class="form-section-label">Razas Permitidas</p>

                    <div class="razas-check-grid" id="razasCheckGrid">
                        ${razasCheckboxes}
                    </div>
                    <div class="raza-add-row">
                        <input class="form-input" type="text" id="razaCustomInput"
                            placeholder="Añadir raza personalizada…">
                        <button class="raza-add-btn" id="razaAddBtn" type="button" title="Añadir">+</button>
                    </div>
                    <div class="razas-pills" id="razasPills"></div>

                    <!-- Leyes -->
                    <p class="form-section-label">Leyes del Territorio</p>

                    <div class="leyes-dynamic" id="leyesDynamic"></div>
                    <button class="ley-add" id="leyAddBtn" type="button">+ Añadir ley</button>

                    <!-- Enviar -->
                    <div class="form-submit-row">
                        <span class="form-note">Los campos con <span style="color:#c0392b">*</span> son obligatorios</span>
                        <button class="form-cancel" id="formCancel" type="button">Cancelar</button>
                        <button class="form-submit" id="formSubmit" type="button">⚜ Enviar Solicitud</button>
                    </div>
                </div>

                <!-- Pantalla de éxito -->
                <div class="form-success" id="formSuccess">
                    <div class="form-success-icon">⚜</div>
                    <h3>¡Solicitud Enviada!</h3>
                    <p>Tu solicitud para crear el territorio ha sido registrada.<br>
                    Un administrador la revisará y contactará contigo por Discord.</p>
                </div>
            </div>
        </div>`;

        document.body.insertAdjacentHTML('beforeend', html);
    }

    /* ════════════════════════════════════════
       Lista dinámica genérica — leyes Y fundadores
       ════════════════════════════════════════ */
    function addItem(containerId, label, text = '') {
        const container = document.getElementById(containerId);
        const i = container.children.length + 1;
        const div = document.createElement('div');
        div.className = 'ley-item';
        div.innerHTML = `
            <input class="form-input" type="text" placeholder="${label} ${i}…" value="${text}">
            <button class="ley-remove" type="button" title="Eliminar">✕</button>`;
        div.querySelector('.ley-remove').addEventListener('click', () => {
            div.remove();
            renumberItems(containerId, label);
        });
        container.appendChild(div);
    }

    function renumberItems(containerId, label) {
        document.querySelectorAll(`#${containerId} .form-input`).forEach((inp, i) => {
            inp.placeholder = `${label} ${i + 1}…`;
        });
    }

    /* ── Razas personalizadas ── */
    let customRazas = [];

    function addCustomRaza(name) {
        name = name.trim();
        if (!name || customRazas.includes(name)) return;
        customRazas.push(name);
        renderPills();
    }
    function removeCustomRaza(name) {
        customRazas = customRazas.filter(r => r !== name);
        renderPills();
    }
    function renderPills() {
        const pills = document.getElementById('razasPills');
        pills.innerHTML = customRazas.map(r => `
            <span class="raza-pill">
                ${r}
                <button class="raza-pill-remove" type="button" data-raza="${r}" title="Eliminar">✕</button>
            </span>`).join('');
        pills.querySelectorAll('.raza-pill-remove').forEach(btn => {
            btn.addEventListener('click', () => removeCustomRaza(btn.dataset.raza));
        });
    }

    /* ── Recoger datos ── */
    function collectData() {
        const val = id => document.getElementById(id)?.value?.trim() || '';

        // Descripción: cada línea no vacía → párrafo
        const descripcion = val('f_descripcion')
            .split('\n')
            .map(l => l.trim())
            .filter(Boolean);

        const fundadores = Array.from(document.querySelectorAll('#fundadoresDynamic .form-input'))
            .map(i => i.value.trim()).filter(Boolean);

        const leyes = Array.from(document.querySelectorAll('#leyesDynamic .form-input'))
            .map(i => i.value.trim()).filter(Boolean);

        const razasSeleccionadas = [
            ...Array.from(document.querySelectorAll('input[name="raza_permitida"]:checked')).map(c => c.value),
            ...customRazas
        ];

        const religion = val('f_religion');

        return {
            discord:           val('f_discord'),
            nombre:            val('f_nombre'),
            subtitulo:         val('f_subtitulo'),
            forma_gobierno:    val('f_gobierno'),
            img_banner:        val('f_img_banner'),
            descripcion_corta: val('f_desc_corta'),
            descripcion,
            fundadores,
            religiones:        religion ? [religion] : [],
            razas_permitidas:  razasSeleccionadas,
            leyes
        };
    }

    /* ── Validación ── */
    function validate(data) {
        if (!data.discord)            return 'El nombre de Discord es obligatorio.';
        if (!data.nombre)             return 'El nombre del territorio es obligatorio.';
        if (!data.forma_gobierno)     return 'Selecciona una forma de gobierno.';
        if (!data.descripcion_corta)  return 'La descripción corta es obligatoria.';
        if (!data.descripcion.length) return 'La descripción del territorio es obligatoria.';
        if (!data.fundadores.length)  return 'Indica al menos un fundador.';
        return null;
    }

    /* ── Pantalla de éxito ── */
    function showSuccess() {
        document.getElementById('formBody').style.display = 'none';
        document.getElementById('formSuccess').classList.add('visible');
    }

    /* ── Init ── */
    function init() {
        injectFormModal();

        const overlay        = document.getElementById('formOverlay');
        const closeBtn       = document.getElementById('formClose');
        const cancelBtn      = document.getElementById('formCancel');
        const submitBtn      = document.getElementById('formSubmit');
        const leyAddBtn      = document.getElementById('leyAddBtn');
        const fundadorAddBtn = document.getElementById('fundadorAddBtn');
        const razaAddBtn     = document.getElementById('razaAddBtn');
        const razaInput      = document.getElementById('razaCustomInput');

        /* Enlazar botón CTA */
        const cta = document.querySelector('.intro-cta');
        if (cta) {
            cta.textContent = '⚔ Solicitar territorio';
            cta.href = '#';
            cta.addEventListener('click', e => { e.preventDefault(); openForm(); });
        }

        function openForm() {
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
        function closeForm() {
            overlay.classList.remove('active');
            document.body.style.overflow = '';
        }

        closeBtn.addEventListener('click', closeForm);
        cancelBtn.addEventListener('click', closeForm);
        overlay.addEventListener('click', e => { if (e.target === overlay) closeForm(); });
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape' && overlay.classList.contains('active')) closeForm();
        });

        /* Fundadores — empezar con uno */
        addItem('fundadoresDynamic', 'Fundador');
        fundadorAddBtn.addEventListener('click', () => addItem('fundadoresDynamic', 'Fundador'));

        /* Leyes — empezar con una */
        addItem('leyesDynamic', 'Ley');
        leyAddBtn.addEventListener('click', () => addItem('leyesDynamic', 'Ley'));

        /* Razas personalizadas */
        razaAddBtn.addEventListener('click', () => {
            addCustomRaza(razaInput.value);
            razaInput.value = '';
        });
        razaInput.addEventListener('keydown', e => {
            if (e.key === 'Enter') {
                e.preventDefault();
                addCustomRaza(razaInput.value);
                razaInput.value = '';
            }
        });

        /* Envío */
        submitBtn.addEventListener('click', () => {
            const data = collectData();
            const error = validate(data);
            if (error) { alert('⚠ ' + error); return; }
            console.log('[Territorio Solicitud]', JSON.stringify(data, null, 2));
            showSuccess();
        });
    }

    document.addEventListener('DOMContentLoaded', init);

})();
