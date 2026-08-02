# Implementación: vinculación `usuarios` ↔ `verificaciones` en Firestore

## Contexto

Actualmente la base de datos (Cloud Firestore, proyecto `MinesAndMonarch`) tiene tres colecciones principales:

- `meta`
- `usuarios`
- `verificaciones`

Los datos de verificación de un jugador (raza, clase, trabajo, nombre de Minecraft, hash de contraseña, etc.) están duplicados: existen tanto en `verificaciones/{discordId}` como, parcialmente, dentro de `usuarios/{uid}`.

Se quiere eliminar esa duplicación: **la colección `usuarios` debe dejar de guardar los campos que ya existen en `verificaciones`**, y en su lugar debe guardar una referencia (por `discordId` u otro id común) que permita ir a buscar esos datos a `verificaciones` cuando el usuario entra en su cuenta.

## Estructura de datos observada

### `verificaciones/{discordId}` (documento de ejemplo)

```json
{
  "clase": "Mago Eléctrico",
  "discordId": "1166820193520066581",
  "discordTag": "jucsel",
  "nombreMinecraft": "Jucsel",
  "nombreRol": "Jucsel",
  "passwordHash": "$2a$10$...",
  "raza": "Elfo",
  "trabajo": "Agricultor",
  "verificadoEn": "30 de julio de 2026 a las 1..."
}
```

El id del documento es el `discordId`.

### `usuarios/{uid}` (documento de ejemplo)

```json
{
  "bio": {
    "estado": "aprobada",
    "texto": "hola"
  },
  "capitulos": [
    {
      "estado": "aprobado",
      "id": "cap_legacy",
      "notaRechazo": "",
      "texto": "hola",
      "titulo": "Historia"
    },
    {
      "estado": "pendiente",
      "id": "cap_1776023926881",
      "notaRechazo": "",
      "texto": "hola",
      "titulo": ""
    }
  ],
  "creadoEn": "...",
  "discord": "caramfibio",
  "email": "...",
  "id": "...",
  "perm...": "..."
}
```

El id del documento es un `uid` propio (ej. `PXUD8cYHONZpbj1KMprAsRRkyTZ2`), distinto del `discordId` de `verificaciones`.

> ⚠️ Falta confirmar el nombre exacto del campo que en `usuarios` enlaza con Discord/`verificaciones` (parece ser `discord`, pero hay que verificarlo contra el campo `discordTag`/`discordId` de `verificaciones`). Revisar también si `usuarios` ya guarda algún campo tipo `discordId` para poder mapear 1:1.

## Objetivo del cambio

1. **No duplicar** en `usuarios` los campos que ya viven en `verificaciones` (`clase`, `raza`, `trabajo`, `nombreMinecraft`, `nombreRol`, `passwordHash`, `discordTag`, `verificadoEn`, etc.).
2. `usuarios` debe conservar su estructura actual (`bio`, `capitulos`, `creadoEn`, `discord`, `email`, `id`, `permisos`, etc.), añadiendo únicamente el id de enlace hacia `verificaciones` (ej. `discordId`) si no existe ya.
3. Cuando el usuario abre su cuenta (modal de cuenta, `cuenta-modal.js`), la app debe:
   - Leer el documento de `usuarios/{uid}` como hasta ahora.
   - Usar el `discordId` (o el campo equivalente) para hacer un **segundo fetch** a `verificaciones/{discordId}`.
   - Combinar ambos resultados en memoria (front-end) para mostrar la info completa, **sin volver a escribir esos campos duplicados en `usuarios`**.

## Archivos relevantes ya existentes

- `cuenta-modal.js`: inyecta el modal de "Cuenta" (`#cmOverlay`) y expone `window.abrirModalCuenta()` / `window.cerrarModalCuenta()`. Hoy es solo un placeholder ("Próximamente podrás gestionar tu cuenta aquí"); aquí es donde hay que pintar los datos combinados de `usuarios` + `verificaciones`.
- `index.js`: engancha el botón `#nav-cuenta-btn` para llamar a `window.abrirModalCuenta()`. También carga `index.json` para rellenar el resto de la home. No tiene lógica de autenticación ni de Firestore todavía.

> ℹ️ **Falta el script de login/autenticación** (el que pide usuario y contraseña y resuelve el `uid`/`discordId` del usuario actual). Sin ese archivo no se puede detallar cómo se obtiene el id con el que consultar `usuarios` y `verificaciones`. Cuando lo tengas, añádelo para completar el checklist de Copilot con los nombres reales de funciones/variables.

## Checklist de implementación para Copilot

- [ ] Identificar/confirmar el campo común entre `usuarios` y `verificaciones` (`discordId` vs `discord`).
- [ ] Añadir (si falta) el campo `discordId` en los documentos de `usuarios` como referencia a `verificaciones/{discordId}`.
- [ ] Eliminar de los documentos de `usuarios` los campos duplicados que ya existen en `verificaciones`: `clase`, `raza`, `trabajo`, `nombreMinecraft`, `nombreRol`, `passwordHash`, `discordTag`, `verificadoEn`.
  - Hacerlo mediante un script de migración one-off (no manual, para no tener que tocar documento por documento).
- [ ] En el flujo de login/verificación de identidad, dejar de escribir esos campos duplicados en `usuarios` a partir de ahora; deben escribirse solo en `verificaciones`.
- [ ] En `cuenta-modal.js`:
  - [ ] Al llamar a `abrir()`, además de mostrar el modal, hacer fetch a Firestore:
    - `usuarios/{uid}` (datos de cuenta: bio, capítulos, permisos, etc.)
    - `verificaciones/{discordId}` (datos de personaje: clase, raza, trabajo, etc.)
  - [ ] Combinar ambos objetos en el render del modal, sin persistir el resultado combinado de vuelta en Firestore.
  - [ ] Manejar el caso de que `verificaciones/{discordId}` no exista todavía (usuario no verificado).
- [ ] Revisar las reglas de seguridad de Firestore (`Reglas` en la consola) para confirmar que el cliente tiene permiso de lectura sobre `verificaciones/{discordId}` cuando el `discordId` coincide con el usuario autenticado.
- [ ] Actualizar cualquier otra parte del código que hoy lea los campos duplicados desde `usuarios` para que en su lugar los lea desde `verificaciones`.

## Notas

- Los IDs de documento de `usuarios` (uid) y de `verificaciones` (discordId) son distintos, así que el enlace tiene que hacerse por campo, no asumiendo que el id del documento es el mismo en ambas colecciones.
- Conviene decidir si la migración de campos duplicados se hace con un script en Node (Admin SDK) ejecutado una sola vez, o manualmente desde la consola de Firebase si son pocos documentos.
