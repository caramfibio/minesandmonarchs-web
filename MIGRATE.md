# Migración `usuarios` → `verificaciones`

Este repositorio incluye un script para migrar los datos de personaje que hoy viven duplicados en `usuarios` hacia la colección `verificaciones`.

Archivo: `scripts/migrate_usuarios_to_verificaciones.js`

Instrucciones:

1. Coloca un service account JSON (credenciales) en la raíz del proyecto como `serviceAccountKey.json`, o exporta la variable de entorno:

```bash
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceAccountKey.json
# on Windows PowerShell
$env:GOOGLE_APPLICATION_CREDENTIALS = 'C:\path\to\serviceAccountKey.json'
```

2. Ejecuta un `dry-run` para revisar los cambios que se harán (por defecto el script corre en dry-run):

```bash
node scripts/migrate_usuarios_to_verificaciones.js
# o con npm script
npm run migrate:verifs
```

3. Si todo está correcto, aplica los cambios reales con `--apply`:

```bash
node scripts/migrate_usuarios_to_verificaciones.js --apply
# o
npm run migrate:verifs -- --apply
```

Notas:
- El script añade `discordId` en `usuarios` (si falta) y crea/actualiza `verificaciones/{discordId}` con los campos migrados.
- Si `usuarios` tiene el subcampo `personaje`, el script lo borrará cuando se aplique (para evitar duplicación).
- Haz backup de tu base de datos antes de ejecutar la migración con `--apply`.

*** End of document
