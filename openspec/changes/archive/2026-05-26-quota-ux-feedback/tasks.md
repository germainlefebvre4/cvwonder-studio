## 1. Backend — Bypass local du rate limit

- [x] 1.1 Dans `backend/internal/adapters/http/ratelimit.go`, au début de `SessionCreationRateLimitMiddleware`, lire `os.Getenv("DISABLE_SESSION_CREATION_RATE_LIMIT")` : si `== "true"`, appeler `c.Next()` et `return` immédiatement
- [x] 1.2 Dans `backend/cmd/api/main.go` (ou le point d'entrée), logger un warning au démarrage si `DISABLE_SESSION_CREATION_RATE_LIMIT=true` (ex: `slog.Warn("session creation rate limit is DISABLED — dev only")`)
- [x] 1.3 Créer `.env.example` à la racine du projet avec les variables d'environnement documentées, incluant `DISABLE_SESSION_CREATION_RATE_LIMIT=false` commenté "dev only"

## 2. Frontend — Erreur typée dans createSession

- [x] 2.1 Dans `frontend/src/services/sessions.ts`, ajouter la classe `RateLimitError extends Error` avec une propriété `retryAfter: number`
- [x] 2.2 Dans `createSession()`, si `res.status === 429`, lire le header `Retry-After` de la réponse, construire et throw un `RateLimitError(retryAfter)`
- [x] 2.3 Ajouter une valeur de fallback pour `retryAfter` quand le header est absent : `Math.ceil(3600 / session_creation_rate_limit_per_hour)` — utiliser la valeur hardcodée `1200` (3 sessions/h) comme fallback de dernier recours

## 3. Frontend — Feedback visuel sur LandingPage

- [x] 3.1 Dans `frontend/src/app/page.tsx`, ajouter le state `rateLimitedUntil: Date | null` avec `useState`
- [x] 3.2 Ajouter un `useEffect` avec `setInterval(1000)` qui calcule les secondes restantes depuis `rateLimitedUntil` et met à jour un state `secondsLeft: number`
- [x] 3.3 Dans `handleStart()`, wrapper l'appel `createSession()` dans un try/catch : si `err instanceof RateLimitError`, mettre à jour `rateLimitedUntil = new Date(Date.now() + err.retryAfter * 1000)`
- [x] 3.4 Passer `disabled={secondsLeft > 0}` sur le `SplitButton` "Start Building"
- [x] 3.5 Afficher sous le bouton un message inline quand `secondsLeft > 0` : "Trop de tentatives. Réessayez dans **Xs**." (remplacer le label du bouton ou ajouter un `<p>` sous le bouton)
- [x] 3.6 Appliquer le même mécanisme catch sur `handleTemplateSelect()` (qui appelle aussi `createSession`)
