## Context

Le middleware `SessionCreationRateLimitMiddleware` (backend Go) retourne HTTP 429 + header `Retry-After` quand une IP dépasse 3 créations/heure. Côté frontend, `createSession()` dans `sessions.ts` throw une erreur générique si `!res.ok`, et `LandingPage.handleStart()` n'a aucun `catch` — l'erreur est avalée silencieusement par le browser. Le header `Retry-After` n'est jamais lu.

En développement local, chaque redémarrage de server ne réinitialise pas les buckets mémoire (ils persistent le temps du process), et il n'existe aucun moyen de désactiver la limite sans modifier le code.

## Goals / Non-Goals

**Goals:**
- Afficher un message clair à l'utilisateur quand createSession retourne 429, avec le délai exact avant nouvelle tentative
- Désactiver le bouton "Start Building" pendant le cooldown avec un compte à rebours
- Permettre de bypasser le rate limit via une variable d'environnement (`DISABLE_SESSION_CREATION_RATE_LIMIT=true`)

**Non-Goals:**
- Modifier la logique de rate limiting elle-même (tokens, fenêtre de temps)
- Persister les buckets en base (actuellement en mémoire, c'est volontaire)
- Ajouter un feedback pour les autres limites (YAML size, génération) dans ce changement

## Decisions

### Décision 1 : Erreur typée dans `createSession()` plutôt que try/catch dans chaque appelant

**Choix** : `createSession()` retourne un objet `{ error: 'rate_limited', retryAfter: number }` (union type) au lieu de throw, ou throw une erreur typée `RateLimitError`.

**Retenu** : Throw une erreur typée `RateLimitError extends Error` avec une propriété `retryAfter: number`. Les appelants qui veulent distinguer attrapent `instanceof RateLimitError`, les autres voient une erreur normale.

**Alternatif écarté** : Union return type — casse l'ergonomie et nécessite une refonte de tous les appelants.

**Implémentation** :
```typescript
// services/sessions.ts
export class RateLimitError extends Error {
  retryAfter: number
  constructor(retryAfter: number) {
    super(`Rate limited. Retry after ${retryAfter}s`)
    this.retryAfter = retryAfter
  }
}
```
Le header `Retry-After` est lu depuis la réponse 429. S'il est absent, on utilise `3600 / session_creation_rate_limit_per_hour` (3 sessions/h → fallback de 1200s).

---

### Décision 2 : Feedback inline sur LandingPage, pas un toast global

**Choix** : Message inline sous le bouton "Start Building" + désactivation du bouton avec countdown, vs toast global (type `sonner`/`react-hot-toast`).

**Retenu** : Inline sur le bouton. La page de landing est simple et le feedback contextuel (sous le bouton qui a déclenché l'erreur) est plus clair. Pas de dépendance toast à ajouter.

**État local dans LandingPage** :
```typescript
const [rateLimitedUntil, setRateLimitedUntil] = useState<Date | null>(null)
```
Un `useEffect` avec `setInterval(1s)` décrémente le compteur. Quand `Date.now() >= rateLimitedUntil`, le bouton est réactivé.

---

### Décision 3 : Bypass via variable d'environnement au niveau du middleware Go

**Choix** : Lire `os.Getenv("DISABLE_SESSION_CREATION_RATE_LIMIT")` dans `SessionCreationRateLimitMiddleware`. Si `"true"`, le middleware appelle `c.Next()` immédiatement sans vérification.

**Retenu** : Simple, sans surcharge de config. Pattern cohérent avec `ADMIN_USERNAME` / `ADMIN_PASSWORD_HASH` déjà utilisés dans `admin/auth.go`.

**Alternatif écarté** : Système de profils (dev/prod) — sur-engineering pour ce besoin.

**Sécurité** : La variable est lue à chaque requête (pas de cache) pour éviter qu'un redémarrage partiel laisse la limite désactivée sans s'en rendre compte. En production, l'absence de la variable = comportement normal.

## Risks / Trade-offs

- [Countdown JS incorrect si l'horloge client est désynchro] → Mitigation : utiliser `Date.now() + retryAfter * 1000` au moment de catch, pas l'horloge serveur
- [L'env var de bypass peut être activée en prod par erreur] → Mitigation : documenter clairement dans `.env.example` que c'est "dev only", et ajouter un warning log Go au démarrage si la variable est active
- [Aucune persistance du rate limit bucket entre redémarrages] → Accepté : comportement actuel intentionnel, hors scope
