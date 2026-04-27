# Sprint 1 — Diseño Técnico
**Fecha:** 2026-04-25  
**Proyecto:** Ado App (adoracion-app)  
**Objetivo:** Intervención estructural y correctiva. Dejar estable la navegación principal, corregir bugs visibles y preparar base para sprints siguientes.

---

## Contexto del Codebase

- **Router:** Expo Router (file-based) con grupos `(tabs)`, `(auth)`, `(onboarding)`
- **Estado:** Zustand (auth, character) + TanStack Query (server state)
- **Backend:** Firebase Firestore (adoracion-app-57d56)
- **Styling:** NativeWind + StyleSheet
- **Fuente de verdad de nivel:** `buildProgressSnapshot(xp, streakDays)` en `src/features/progress/engine/progressEngine.ts`

---

## Tarea 1 — Reordenar Tabs y Fijar Pestaña Biblia

### Estado actual
Orden actual en `app/(tabs)/_layout.tsx`:
1. Inicio (`index`)
2. Contenido (`content/index`)
3. **Biblia** (`bible-tab`) ← con `href: '/bible'` que saca al usuario fuera del sistema de tabs
4. Comunidad (`community/index`)
5. Progreso (`progress/index`)

### Orden objetivo
1. Inicio
2. Contenido
3. **Comunidad**
4. **Biblia**
5. Progreso

### Cambios

**`app/(tabs)/_layout.tsx`**
- Mover `Tabs.Screen name="community/index"` a posición 3
- Mover `Tabs.Screen name="bible-tab"` a posición 4
- Eliminar `href: '/bible'` del `bible-tab` para que renderice su propio screen

**`app/(tabs)/bible-tab.tsx`**
- Verificar primero cómo está exportado `BibleHomeScreen` en `app/bible/index.tsx` (default export vs named export) antes de importar
- Reemplazar `<Redirect href="/bible" />` por renderizado directo de `BibleHomeScreen`
- Pasar `showHomeButton={false}` para que en contexto de tab no aparezca el botón Home

**`app/bible/index.tsx`**
- Agregar prop `showHomeButton?: boolean` (default `true`) al componente
- Renderizar el botón Home condicionalmente: `{showHomeButton !== false && <TouchableOpacity .../>}`
- No cambiar comportamiento cuando `showHomeButton` es `true` (modo standalone preservado)
- Mantener solución mínima: solo la prop, sin refactorizar el componente

### Restricciones
- Las rutas `/bible/reader`, `/bible/book/[id]`, `/bible/saved` siguen siendo full-screen (sin tab bar). Esto es correcto y esperado.
- No implementar motor bíblico completo ni búsqueda en este sprint.
- No crear placeholder — usar pantalla existente.

---

## Tarea 2 — Perfil dentro de Progreso

### Decisión
**Sin cambios en código.** Perfil ya NO existe como tab independiente en `_layout.tsx`. El acceso funciona vía `ProfileModal` lanzado desde el avatar circular en el header de `progress/index.tsx`.

### Documentación de estado
- Las sub-rutas `profile/*` tienen `href: null` en `_layout.tsx` → accesibles desde `ProfileModal` vía `router.push`. ✓
- El `ProfileModal` se abre desde: `<Pressable onPress={() => setProfileModalVisible(true)}>` en el header de Progreso. ✓

---

## Tarea 3 — Bug "siempre aparece Novato"

### Diagnóstico
El display es correcto: `buildProgressSnapshot(xp, streakDays).stage.visibleName` calcula dinámicamente el nombre. No hay strings hardcodeados.

La causa probable: `data` de `useProgress()` llega como `undefined` (query disabled, documento inexistente, o campo `progress.xp` ausente en Firestore). El screen hace `data ?? DEFAULT_PROGRESS_DATA` donde `DEFAULT_PROGRESS_DATA.xp = 0` → muestra "Novato" silenciosamente.

### Cambios

**`app/(tabs)/progress/index.tsx`**
- Agregar guard explícito: si `data === undefined && !isLoading && !isError` (query terminó pero no hay documento), mostrar empty/diagnostic state en lugar de `DEFAULT_PROGRESS_DATA`
- `data` con `xp === 0` es un estado válido — mostrar "Novato" normalmente. No tratar `xp = 0` como error.
- Mensaje sugerido para el caso sin documento: "No encontramos tu progreso todavía. Intenta completar una actividad o actualizar la app."
- Tono amigable, no técnico

**`src/features/progress/repository.ts` — `fetchProgressSnapshot`**
- Si el documento existe pero `user.progress?.xp` es `undefined`, emitir `console.warn('[Progress] Firestore user document exists but progress.xp is undefined. Check Firestore structure.')`
- No lanzar error, no romper producción

### Lo que NO se toca
- `buildProgressSnapshot`
- Thresholds de niveles (`STAGES`, `LEVELS`)
- XP rewards
- Motor de rachas

---

## Tarea 4 — Flujo post-creación de petición

### Problema
`create.tsx` llama `router.back()` tras éxito. Si el stack de navegación no tiene `prayer-requests/index` como pantalla previa (e.g. deep link, `router.replace`), el usuario puede ir a Inicio u otra pantalla inesperada.

### Cambio

**`app/(tabs)/community/prayer-requests/create.tsx`**
- Reemplazar `router.back()` por `router.replace('/(tabs)/community/prayer-requests')`
- El banner de éxito verde (800ms) se conserva exactamente igual
- El mensaje de éxito existente es adecuado: "¡Petición enviada! La comunidad orará contigo."

### Lo que NO se toca
- Formulario, validaciones, campos
- Lógica Firestore de creación
- Modelo de peticiones

---

## Tarea 5 — Botón "Orar"

### Problema
- No hay `onError` handler → errores se pierden silenciosamente
- El usuario no sabe si su oración se registró o no
- Si ya oró (idempotencia), el botón no da ninguna señal

### Cambios

**`app/(tabs)/community/prayer-requests/index.tsx`**

1. En el llamado a `pray(...)`, agregar `onError`:
```ts
pray(
  { requestId: request.id, userId: user.uid, role },
  {
    onError: (err) => {
      const msg = err instanceof Error ? err.message : String(err)
      const isAlreadyPrayed = msg.toLowerCase().includes('already') // best effort: detectar idempotencia
      Alert.alert(
        isAlreadyPrayed ? 'Ya oraste' : 'No se pudo registrar',
        isAlreadyPrayed
          ? 'Ya registraste tu oración por esta petición.'
          : 'No pudimos registrar tu oración en este momento. Inténtalo nuevamente.'
      )
    },
  }
)
```

2. El botón ya muestra estado de loading con `isPraying` (ícono `sync` + texto `...`). Asegurar que `disabled={isPraying}` esté presente para evitar taps múltiples.

3. **Sin optimistic update** — no existe estado `hasPrayed` local. El contador se actualiza con la invalidación de query existente tras `onSuccess`. No arriesgar contador inconsistente.

### Lo que NO se toca
- Transacción Firestore
- Estructura de datos de oraciones
- Regla "una vez por día" (Sprint 4)
- Subcolecciones `prayers/{userId}`

---

## Tarea 6 — Navegación hacia atrás

### Alcance
Revisar e intervenir solo en pantallas donde el usuario pueda quedar atrapado.

### Pantallas a inspeccionar antes de implementar
- `app/bible/reader.tsx` — si no tiene back button visible, agregar header mínimo
- `app/bible/book/[id].tsx` — mismo criterio

### Patrón a usar (si aplica)
```tsx
<TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
  <Ionicons name="arrow-back" size={24} color={Tokens.colors.primary} />
</TouchableOpacity>
```
Referencia visual: `app/(tabs)/profile/detail.tsx`

### Pantallas ya resueltas
- `app/(tabs)/community/prayer-requests/create.tsx` — tiene back button ✓
- `app/bible/index.tsx` — resuelto con `showHomeButton={false}` desde `bible-tab` ✓

### Restricciones
- No rediseñar headers completos
- No cambiar estructura de navegación
- No agregar gestos complejos
- Solo agregar salida visible donde falte

---

## Fuera de alcance en Sprint 1

Los siguientes ítems fueron explícitamente excluidos y no deben implementarse:

- Versículo del día
- Mensaje del día
- Diezmos/ofrendas
- Botón En Vivo inteligente
- Sistema completo de tareas
- Rachas
- Puntajes nuevos
- Biblia completa
- Favoritos bíblicos
- IA DORA
- Voz del pastor
- Comentarios en peticiones
- Retos semanales/mensuales

---

## Criterios de validación post-implementación

| Check | Método |
|---|---|
| Tabs en orden: Inicio/Contenido/Comunidad/Biblia/Progreso | Visual en app |
| Biblia muestra contenido dentro de la tab bar | Visual en app |
| Perfil no aparece como tab | Visual en app |
| Progreso sigue funcionando | Visual en app |
| Si XP es 0/undefined, se muestra empty state (no "Novato" silencioso) | Probar con usuario sin progreso |
| Si XP tiene datos, el nivel se muestra correctamente | Probar con usuario con XP |
| Crear petición navega a listado de peticiones (no a Inicio) | Flujo completo |
| Botón "Orar" muestra loading y onError | Tap en modo offline |
| Lectores bíblicos tienen salida visible | Navegar a `/bible/reader` |
| `npx tsc --noEmit` sin errores nuevos | Terminal |

---

## Archivos a modificar

| Archivo | Cambio |
|---|---|
| `app/(tabs)/_layout.tsx` | Reordenar tabs, eliminar `href` de bible-tab |
| `app/(tabs)/bible-tab.tsx` | Reemplazar Redirect por BibleHomeScreen con prop |
| `app/bible/index.tsx` | Agregar prop `showHomeButton` |
| `app/(tabs)/community/prayer-requests/create.tsx` | `router.replace` post-creación |
| `app/(tabs)/community/prayer-requests/index.tsx` | `onError` en botón Orar |
| `app/(tabs)/progress/index.tsx` | Guard explícito para `data === undefined` |
| `src/features/progress/repository.ts` | `console.warn` si `xp` es undefined |
| `app/bible/reader.tsx` | Back button si falta (a confirmar en implementación) |
| `app/bible/book/[id].tsx` | Back button si falta (a confirmar en implementación) |
