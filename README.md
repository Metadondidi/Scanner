# Reviews Scanner — Green & Red Society

Web app Next.js fullstack pour scraper, générer et valider les réponses Google Reviews avec Claude (Anthropic).

## Architecture

```
app/
├── page.tsx                  → Dashboard kanban (client)
└── api/
    ├── reviews/route.ts      → GET liste, POST création
    ├── reviews/[id]/route.ts → PATCH statut, DELETE
    ├── scrape/route.ts       → POST scraping Google Maps
    └── generate/[id]/route.ts→ POST génération Claude

lib/
├── db.ts        → SQLite (better-sqlite3)
├── scraper.ts   → Playwright scraper Google Maps
└── claude.ts    → Appel API Claude

components/
├── KanbanBoard.tsx → Tableau 4 colonnes
├── ReviewCard.tsx  → Carte avis + actions
└── StarRating.tsx  → Étoiles

types/index.ts    → Types partagés
data/reviews.db   → Base SQLite (auto-créée, non versionnée)
```

## Installation

```bash
# 1. Cloner et installer les dépendances
npm install

# 2. Installer les navigateurs Playwright
npx playwright install chromium

# 3. Configurer les variables d'environnement
cp .env.example .env.local
# → Renseigner ANTHROPIC_API_KEY, GREEN_SOCIETY_MAPS_URL, RED_SOCIETY_MAPS_URL

# 4. Lancer en développement
npm run dev
```

Ouvrir http://localhost:3000

## Variables d'environnement (`.env.local`)

| Variable                  | Description                                      |
|---------------------------|--------------------------------------------------|
| `ANTHROPIC_API_KEY`       | Clé API Anthropic (https://console.anthropic.com)|
| `GREEN_SOCIETY_MAPS_URL`  | URL Google Maps de Green Society (onglet Avis)   |
| `RED_SOCIETY_MAPS_URL`    | URL Google Maps de Red Society (onglet Avis)     |
| `SCRAPE_MAX_REVIEWS`      | Nombre max d'avis à scraper (défaut : 50)        |

## Workflow

```
[Scraper Google Maps]
        ↓
  Avis → "À traiter"
        ↓
[Générer via Claude]
        ↓
  Réponse → "À valider"
        ↓
  Humain valide / rejette
        ↓
"Publié" → Copier-coller sur Google Maps
```

## Colonnes Kanban

| Colonne     | Description                              |
|-------------|------------------------------------------|
| À traiter   | Avis importés, sans réponse générée      |
| À valider   | Réponse générée, en attente de validation|
| Publié      | Validé et publié sur Google              |
| Rejeté      | Réponse rejetée                          |

## API

| Endpoint                       | Méthode | Description                     |
|--------------------------------|---------|---------------------------------|
| `/api/reviews?brand=green`     | GET     | Liste des avis (filtre optionnel)|
| `/api/reviews`                 | POST    | Créer un avis manuellement      |
| `/api/reviews/:id`             | PATCH   | Changer le statut                |
| `/api/reviews/:id`             | DELETE  | Supprimer un avis               |
| `/api/scrape`                  | POST    | Scraper Google Maps `{brand}`   |
| `/api/generate/:id`            | POST    | Générer une réponse Claude      |

## Notes

- Le scraping Google Maps est effectué avec Playwright (headless Chromium).
- Chaque avis est dédupliqué par `google_id` — un re-scraping ne crée pas de doublons.
- L'apprentissage du style utilise jusqu'à 40 vraies réponses existantes en base.
