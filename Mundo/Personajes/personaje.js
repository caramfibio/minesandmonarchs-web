import { initializeApp, getApp, getApps }
    from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getAuth, onAuthStateChanged }
    from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import { getFirestore, doc, getDoc, updateDoc }
    from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

const firebaseConfig = {
    apiKey:            "AIzaSyC97DUSkDy8qOHnk5rm3P-263m4W6Okbzo",
    authDomain:        "minesandmonarch.firebaseapp.com",
    projectId:         "minesandmonarch",
    storageBucket:     "minesandmonarch.firebasestorage.app",
    messagingSenderId: "379898851786",
    appId:             "1:379898851786:web:b892cbf4d8508798d61f33"
};

const app  = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

const RAZAS = {
    humano:"Humano", elfobosque:"Elfo del Bosque", alfiq:"Alfiq",
    goblin:"Goblin", enano:"Enano", aracnido:"Arácnido", yeti:"Yeti",
    demonio:"Demonio", sirena:"Sirena", valquiria:"Valquiria",
    hadapixie:"Hada Pixie", hadafae:"Hada Fae", granelfo:"Gran Elfo",
    gorgona:"Gorgona", victimapeste:"Víctima de la Peste",
    banshee:"Banshee", elfolunar:"Elfo Lunar", ogro:"Ogro",
    revenant:"Revenant", ribbit:"Ribbit"
};
const CLASES = {
    cazador:"Cazador", guardabosques:"Guardabosques", curador:"Curador",
    magoender:"Mago del Ender", magoelectrico:"Mago Eléctrico",
    magosangre:"Mago de Sangre", magohelado:"Mago Helado",
    magoinvocador:"Mago Invocador", magofuego:"Mago de Fuego",
    granmago:"Gran Mago", granmagooscuro:"Gran Mago Oscuro",
    guerrerobendito:"Guerrero Bendito", hiedravenenosa:"Hiedra Venenosa",
    rogue:"Rogue", tanque:"Tanque", berserker:"Berserker",
    guerrero:"Guerrero", bardo:"Bardo", guerrerodelmar:"Guerrero del Mar",
    carterista:"Carterista", paladin:"Paladín", ingeniero:"Ingeniero",
    bestiasalvaje:"Bestia Salvaje", angler:"Angler",
    magoeldritch:"Mago del Eldritch", niceGuy:"Nice Guy"
};
const TRABAJOS = {
    constructor:"Constructor", inutilerrante:"Inútil Errante",
    explorador:"Explorador", clerigo:"Clérigo", mercader:"Mercader",
    metalurgico:"Metalúrgico", agricultor:"Agricultor",
    granjero:"Granjero", cocinero:"Cocinero"
};

function badgeHtml(estado) {
    const map = {
        pendiente: ['pendiente', '⏳ Pendiente'],
        aprobado:  ['aprobada',  '✓ Aprobado'],
        rechazado: ['rechazada', '✗ Rechazado'],
    };
    const [cls, txt] = map[estado] || map.pendiente;
    return `<span class="pj-bio-badge ${cls}">${txt}</span>`;
}

const params = new URLSearchParams(window.location.search);
const uid    = params.get('uid');
const page   = document.getElementById('pjPage');
const estado = document.getElementById('pjEstado');

if (!uid) {
    estado.textContent = 'No se especificó ningún personaje.';
} else {
    onAuthStateChanged(auth, async currentUser => {
        try {
            const snap = await getDoc(doc(db, 'usuarios', uid));
            if (!snap.exists() || !snap.data().personaje) {
                estado.textContent = 'Este personaje no existe aún.';
                return;
            }

            const d   = snap.data();
            const pj  = d.personaje;

            /* capítulos: array de { id, titulo, texto, estado, notaRechazo }
               Retrocompatible: si existe bio antigua la migramos visualmente */
            let capitulos = d.capitulos || [];
            if (capitulos.length === 0 && d.bio && d.bio.texto) {
                // Migración visual del sistema antiguo
                capitulos = [{
                    id: 'cap_legacy',
                    titulo: 'Historia',
                    texto: d.bio.texto,
                    estado: d.bio.estado === 'aprobada' ? 'aprobado' : d.bio.estado || 'pendiente',
                    notaRechazo: ''
                }];
            }

            const esPropietario = currentUser && currentUser.uid === uid;
            let   esAdmin       = false;
            if (currentUser && !esPropietario) {
                try {
                    const mySnap = await getDoc(doc(db, 'usuarios', currentUser.uid));
                    esAdmin = mySnap.exists() && mySnap.data().rol === 'admin';
                } catch (_) {}
            }

            /* Capítulos visibles según rol:
               - aprobado     → todo el mundo
               - pendiente    → dueño y admin
               - rechazado    → dueño y admin */
            const capitulosVisibles = capitulos.filter(c =>
                c.estado === 'aprobado' || esPropietario || esAdmin
            );

            /* ── Render principal ── */
            page.innerHTML = `
                <div class="pj-main">
                    <div class="pj-header">
                        <h1 class="pj-nombre">⚜ ${pj.nombreRol}</h1>
                        <p class="pj-registro">Registro # ${String(d.id || '0').padStart(4,'0')}</p>
                        <div class="pj-divider"></div>
                        <div class="pj-divider-ornament">✦ ✦ ✦</div>
                    </div>

                    <div class="pj-bio-section">
                        <p class="pj-section-label">Historia</p>
                        <div class="caps-lista" id="capsLista"></div>
                        ${esPropietario ? `<button class="cap-nuevo-btn" id="btnNuevoCap">+ Añadir nuevo capítulo</button>` : ''}
                    </div>
                </div>

                <aside class="pj-sidebar">
                    <div class="pj-ficha">
                        <div class="pj-avatar-wrap">
                            ${pj.imagenUrl
                                ? `<img class="pj-avatar-custom" src="${pj.imagenUrl}" alt="${pj.nombreRol}">`
                                : pj.nombreMC
                                    ? `<img
                                        src="https://mc-heads.net/body/${encodeURIComponent(pj.nombreMC)}/100"
                                        alt="${pj.nombreMC}"
                                        style="width:auto;height:85%;image-rendering:pixelated;display:block;margin:auto"
                                        onerror="this.style.display='none'">`
                                    : `<span class="pj-avatar-placeholder">⚜</span>`}
                        </div>
                        <div class="pj-ficha-body">
                            <div class="pj-ficha-fila">
                                <span class="pj-ficha-label">Nombre de rol</span>
                                <span class="pj-ficha-valor pj-ficha-nombre-rol">${pj.nombreRol}</span>
                            </div>
                            <div class="pj-ficha-fila">
                                <span class="pj-ficha-label">Minecraft</span>
                                <span class="pj-ficha-valor">${pj.nombreMC || '—'}</span>
                            </div>
                            <div class="pj-ficha-fila">
                                <span class="pj-ficha-label">Raza</span>
                                <span class="pj-ficha-valor">${RAZAS[pj.raza] || pj.raza}</span>
                            </div>
                            <div class="pj-ficha-fila">
                                <span class="pj-ficha-label">Clase</span>
                                <span class="pj-ficha-valor">${CLASES[pj.clase] || pj.clase}</span>
                            </div>
                            <div class="pj-ficha-fila">
                                <span class="pj-ficha-label">Trabajo</span>
                                <span class="pj-ficha-valor">${TRABAJOS[pj.trabajo] || pj.trabajo}</span>
                            </div>
                        </div>
                    </div>
                </aside>
            `;

            /* ── Renderizar capítulos ── */
            const lista = document.getElementById('capsLista');

            function renderCapitulos() {
                lista.innerHTML = '';
                const visibles = capitulos.filter(c =>
                    c.estado === 'aprobado' || esPropietario || esAdmin
                );

                if (visibles.length === 0) {
                    lista.innerHTML = `<span class="pj-bio-vacio" style="padding:16px 0;display:block">
                        ${esPropietario ? 'Aún no has escrito ningún capítulo. Pulsa el botón de abajo para comenzar.' : 'Sin historia aún.'}
                    </span>`;
                    return;
                }

                visibles.forEach((cap, idx) => {
                    const bloqueId = 'cap_' + cap.id;
                    const div = document.createElement('div');
                    div.className = `cap-bloque ${cap.estado}`;
                    div.id = bloqueId;

                    const esEditable = (esPropietario && cap.estado !== 'aprobado');
                    const numCap = capitulos.indexOf(cap) + 1;

                    div.innerHTML = `
                        <div class="cap-header">
                            <p class="cap-titulo">Capítulo ${numCap}${cap.titulo ? ' · ' + cap.titulo : ''}</p>
                            ${(esPropietario || esAdmin) ? badgeHtml(cap.estado) : ''}
                        </div>

                        ${cap.estado === 'rechazado' && cap.notaRechazo && (esPropietario || esAdmin) ? `
                        <div class="cap-rechazo-nota">
                            <span class="cap-rechazo-icono">✗</span>
                            <div>
                                <p class="cap-rechazo-label">Motivo del rechazo</p>
                                <p class="cap-rechazo-texto">${cap.notaRechazo}</p>
                            </div>
                        </div>` : ''}

                        <div class="cap-texto" id="texto_${cap.id}">${cap.texto ? cap.texto.replace(/\n/g,'<br>') : '<span class="pj-bio-vacio">Sin contenido aún.</span>'}</div>

                        ${esEditable ? `<input class="cap-input-titulo" id="inputTitulo_${cap.id}" type="text" placeholder="Título del capítulo (opcional)" value="${cap.titulo || ''}" style="display:none">` : ''}
                        ${esEditable ? `<textarea class="cap-textarea" id="textarea_${cap.id}" placeholder="Escribe este capítulo…">${cap.texto || ''}</textarea>` : ''}

                        ${esEditable ? `
                        <div class="cap-acciones" id="acciones_${cap.id}">
                            <button class="pj-btn pj-btn-editar" id="btnEditar_${cap.id}">✏ Editar</button>
                            <button class="pj-btn pj-btn-guardar" id="btnGuardar_${cap.id}" style="display:none">⚜ Enviar para aprobación</button>
                            <button class="pj-btn pj-btn-cancelar" id="btnCancelar_${cap.id}" style="display:none">Cancelar</button>
                        </div>
                        <p class="pj-privado-note" id="note_${cap.id}">🔒 Solo tú y los administradores ven esto hasta que sea aprobado</p>
                        ` : ''}

                        ${esAdmin && cap.estado === 'pendiente' ? `
                        <div class="cap-acciones" id="adminAcciones_${cap.id}">
                            <span style="font-family:Georgia,serif;font-size:0.8em;color:#a89060;font-style:italic">Revisar:</span>
                            <button class="pj-btn pj-btn-aprobar" id="btnAprobar_${cap.id}">✓ Aprobar</button>
                            <button class="pj-btn pj-btn-rechazar" id="btnRechazarToggle_${cap.id}">✗ Rechazar</button>
                        </div>
                        <textarea class="cap-textarea-nota" id="notaRechazo_${cap.id}" placeholder="Escribe el motivo del rechazo para el jugador…"></textarea>
                        <div class="cap-acciones" id="adminConfirm_${cap.id}" style="display:none">
                            <button class="pj-btn pj-btn-rechazar" id="btnRechazarConfirm_${cap.id}">✗ Confirmar rechazo</button>
                            <button class="pj-btn pj-btn-cancelar" id="btnRechazarCancelar_${cap.id}">Cancelar</button>
                        </div>
                        ` : ''}

                        <p class="cap-msg" id="msg_${cap.id}" style="display:none"></p>
                    `;

                    lista.appendChild(div);

                    /* ── Lógica propietario por capítulo ── */
                    if (esEditable) {
                        const btnE = document.getElementById('btnEditar_' + cap.id);
                        const btnG = document.getElementById('btnGuardar_' + cap.id);
                        const btnC = document.getElementById('btnCancelar_' + cap.id);
                        const ta   = document.getElementById('textarea_' + cap.id);
                        const ti   = document.getElementById('inputTitulo_' + cap.id);
                        const tx   = document.getElementById('texto_' + cap.id);
                        const msg  = document.getElementById('msg_' + cap.id);

                        btnE.addEventListener('click', () => {
                            tx.style.display  = 'none';
                            ta.style.display  = 'block';
                            ti.style.display  = 'block';
                            btnE.style.display = 'none';
                            btnG.style.display = '';
                            btnC.style.display = '';
                        });

                        btnC.addEventListener('click', () => {
                            ta.value = cap.texto || '';
                            ti.value = cap.titulo || '';
                            ta.style.display  = 'none';
                            ti.style.display  = 'none';
                            tx.style.display  = '';
                            btnE.style.display = '';
                            btnG.style.display = 'none';
                            btnC.style.display = 'none';
                        });

                        btnG.addEventListener('click', async () => {
                            const nuevoTexto  = ta.value.trim();
                            const nuevoTitulo = ti.value.trim();
                            if (!nuevoTexto) { msg.textContent = 'Escribe algo antes de enviar.'; msg.style.display = ''; return; }
                            btnG.disabled = true; btnG.textContent = 'Guardando…';
                            try {
                                cap.texto  = nuevoTexto;
                                cap.titulo = nuevoTitulo;
                                cap.estado = 'pendiente';
                                cap.notaRechazo = '';
                                await updateDoc(doc(db, 'usuarios', uid), { capitulos });
                                renderCapitulos();
                            } catch(err) {
                                msg.textContent = 'Error al guardar.'; msg.style.display = ''; console.error(err);
                                btnG.disabled = false; btnG.textContent = '⚜ Enviar para aprobación';
                            }
                        });
                    }

                    /* ── Lógica admin por capítulo ── */
                    if (esAdmin && cap.estado === 'pendiente') {
                        const btnAp  = document.getElementById('btnAprobar_' + cap.id);
                        const btnRTg = document.getElementById('btnRechazarToggle_' + cap.id);
                        const btnRC  = document.getElementById('btnRechazarConfirm_' + cap.id);
                        const btnRCn = document.getElementById('btnRechazarCancelar_' + cap.id);
                        const nota   = document.getElementById('notaRechazo_' + cap.id);
                        const conf   = document.getElementById('adminConfirm_' + cap.id);
                        const accio  = document.getElementById('adminAcciones_' + cap.id);
                        const msg    = document.getElementById('msg_' + cap.id);

                        btnAp.addEventListener('click', async () => {
                            btnAp.disabled = true;
                            try {
                                cap.estado = 'aprobado';
                                cap.notaRechazo = '';
                                await updateDoc(doc(db, 'usuarios', uid), { capitulos });
                                renderCapitulos();
                            } catch(err) { console.error(err); btnAp.disabled = false; }
                        });

                        btnRTg.addEventListener('click', () => {
                            nota.style.display = 'block';
                            conf.style.display = '';
                            accio.style.display = 'none';
                            nota.focus();
                        });

                        btnRCn.addEventListener('click', () => {
                            nota.style.display = 'none';
                            conf.style.display = 'none';
                            accio.style.display = '';
                        });

                        btnRC.addEventListener('click', async () => {
                            const notaTexto = nota.value.trim();
                            if (!notaTexto) { nota.placeholder = '⚠ Escribe el motivo antes de confirmar'; nota.focus(); return; }
                            btnRC.disabled = true;
                            try {
                                cap.estado = 'rechazado';
                                cap.notaRechazo = notaTexto;
                                await updateDoc(doc(db, 'usuarios', uid), { capitulos });
                                renderCapitulos();
                            } catch(err) { console.error(err); btnRC.disabled = false; }
                        });
                    }
                });
            }

            renderCapitulos();

            /* ── Añadir nuevo capítulo ── */
            if (esPropietario) {
                document.getElementById('btnNuevoCap')?.addEventListener('click', () => {
                    const nuevoCap = {
                        id: 'cap_' + Date.now(),
                        titulo: '',
                        texto: '',
                        estado: 'pendiente',
                        notaRechazo: ''
                    };
                    capitulos.push(nuevoCap);
                    renderCapitulos();
                    // Abrir automáticamente en modo edición
                    const btnE = document.getElementById('btnEditar_' + nuevoCap.id);
                    if (btnE) btnE.click();
                    // Scroll al nuevo capítulo
                    document.getElementById('cap_' + nuevoCap.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                });
            }

        } catch (err) {
            estado.textContent = 'Error al cargar el personaje.';
            console.error(err);
        }
    });
}