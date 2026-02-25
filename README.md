# Google Reviews AI Generator

Générateur automatique de réponses Google Reviews pour **Green Society** et **Red Society**, propulsé par l'API Claude (Anthropic).

## Fonctionnalités

- Génère des réponses personnalisées en apprenant le style de la marque depuis les réponses existantes
- Gestion d'un workflow de validation (⏳ À valider → ✅ Publié / ❌ Rejeté)
- Initialisation automatique des onglets avec en-têtes et **liste déroulante** sur la colonne Statut
- Compatible multi-enseignes (GreenSociety / RedSociety)

## Installation

1. Ouvrez votre Google Sheets
2. **Extensions → Apps Script** → collez le contenu de `ReviewsGenerator.gs`
3. Remplacez `TA_CLE_API_ANTHROPIC` par votre vraie clé API Anthropic
4. Sauvegardez puis rechargez le spreadsheet

## Utilisation

### Première utilisation
Menu **🤖 Reviews IA → ⚙️ Initialiser les onglets**

Cela crée automatiquement :
- Les en-têtes formatés (ligne 1, fond vert, texte blanc)
- La ligne d'en-tête figée
- La liste déroulante sur toute la colonne D avec les valeurs :
  - `⏳ À valider`
  - `✅ Publié`
  - `❌ Rejeté`

### Générer les réponses
Menu **🤖 Reviews IA → ✨ Générer les réponses manquantes**

## Structure du Spreadsheet

| Colonne A      | Colonne B       | Colonne C          | Colonne D |
|----------------|-----------------|--------------------|-----------|
| Avis client    | Note (étoiles)  | Réponse générée    | Statut    |

## Workflow

```
Réponse vide ou "aucune"
        ↓
Script génère via Claude
        ↓
    ⏳ À valider
        ↓
  Tu lis et valides
        ↓
✅ Publié ou ❌ Rejeté   →  Tu copie-colles sur Google Maps
```

## Logique de traitement par statut

| Colonne C           | Colonne D      | Action du script              |
|---------------------|----------------|-------------------------------|
| vide ou "aucune"    | vide           | ✅ Génère + met ⏳ À valider   |
| vide ou "aucune"    | ⏳ À valider    | ⛔ Ignoré (déjà généré)        |
| vide ou "aucune"    | ✅ Publié       | ⛔ Ignoré                      |
| texte réel          | —              | Utilisé pour l'apprentissage  |
