#!/usr/bin/env node
/**
 * Script de migración:
 * - Recorre `usuarios` y copia datos de personaje a `verificaciones/{discordId}`
 * - Añade `discordId` en `usuarios` si falta
 * - Elimina el campo `personaje` de `usuarios` si se aplica
 *
 * Seguridad: por defecto corre en `--dry-run` (no modifica). Pasar `--apply` para aplicar.
 * Requiere: un service account JSON en `GOOGLE_APPLICATION_CREDENTIALS` o ./serviceAccountKey.json
 */

const admin = require('firebase-admin');
const path = require('path');

const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || path.join(__dirname, '..', 'serviceAccountKey.json');
try {
    const serviceAccount = require(credPath);
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
} catch (err) {
    console.error('No se pudo cargar las credenciales. Define GOOGLE_APPLICATION_CREDENTIALS o coloca serviceAccountKey.json en el repo.');
    console.error(err.message || err);
    process.exit(1);
}

const db = admin.firestore();
const DRY_RUN = !process.argv.includes('--apply');

function normalizeDiscordId(tag) {
    if (!tag) return null;
    return String(tag).replace(/[#\s]/g, '_');
}

function compact(obj) {
    const out = {};
    for (const k of Object.keys(obj)) {
        if (obj[k] !== undefined && obj[k] !== null) out[k] = obj[k];
    }
    return out;
}

async function migrateOne(uid, data) {
    const discordTag = data.discord || data.discordTag || (data.personaje && data.personaje.discordTag) || null;
    if (!discordTag) {
        console.log(`[skip] usuario ${uid} — sin discordTag`);
        return;
    }
    const verifId = normalizeDiscordId(discordTag);
    const personaje = data.personaje || {};

    const verifData = compact({
        discordId: verifId,
        discordTag,
        nombreMinecraft: personaje.nombreMC || personaje.nombreMinecraft || data.nombreMinecraft || null,
        nombreRol: personaje.nombreRol || data.nombreRol || null,
        raza: personaje.raza || data.raza || null,
        clase: personaje.clase || data.clase || null,
        trabajo: personaje.trabajo || data.trabajo || null,
        verificadoEn: admin.firestore.FieldValue.serverTimestamp()
    });

    const verifRef = db.collection('verificaciones').doc(verifId);
    const usuarioRef = db.collection('usuarios').doc(uid);

    if (DRY_RUN) {
        console.log(`[dry] crear/actualizar verificaciones/${verifId} =>`, verifData);
        if (!data.discordId) console.log(`[dry] actualizar usuarios/${uid} para agregar discordId: ${verifId}`);
        if (data.personaje) console.log(`[dry] eliminar campo usuarios/${uid}.personaje`);
        return;
    }

    // Apply changes
    await verifRef.set(verifData, { merge: true });
    const updates = {};
    if (!data.discordId) updates.discordId = verifId;
    if (data.personaje) updates.personaje = admin.firestore.FieldValue.delete();
    if (Object.keys(updates).length) await usuarioRef.update(updates);
    console.log(`[ok] migrado usuario ${uid} -> verificaciones/${verifId}`);
}

async function run() {
    console.log(`MIGRATION: start (dryRun=${DRY_RUN})`);
    const snapshot = await db.collection('usuarios').get();
    console.log(`Usuarios encontrados: ${snapshot.size}`);
    for (const doc of snapshot.docs) {
        try {
            await migrateOne(doc.id, doc.data());
        } catch (err) {
            console.error(`Error migrando ${doc.id}:`, err.message || err);
        }
    }
    console.log('MIGRATION: done');
}

run().catch(err => { console.error(err); process.exit(1); });
