// ============================================
// GREEN SOCIETY & RED SOCIETY
// Générateur de réponses Google Reviews
// Powered by Claude (Anthropic)
// ============================================

const ANTHROPIC_API_KEY = "TA_CLE_API_ANTHROPIC"; // 🔑 À remplacer
const MODEL = "claude-sonnet-4-6";
const MAX_EXISTING = 40;

const SHEETS = ["GreenSociety", "RedSociety"];

const STATUS_OPTIONS = ["⏳ À valider", "✅ Publié", "❌ Rejeté"];
const HEADERS = ["Avis client", "Note (étoiles)", "Réponse générée", "Statut"];

// ============================================
// INITIALISATION : en-têtes + liste déroulante
// ============================================

/**
 * Initialise les en-têtes et la liste déroulante de statut (colonne D)
 * sur tous les onglets concernés.
 */
function setupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();

  SHEETS.forEach(sheetName => {
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
    }

    _applyHeaders(sheet);
    _applyStatusDropdown(sheet);
  });

  ui.alert("✅ Onglets initialisés avec en-têtes et listes déroulantes !");
}

/**
 * Écrit les en-têtes en ligne 1 et les formate.
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet
 */
function _applyHeaders(sheet) {
  const headerRange = sheet.getRange(1, 1, 1, HEADERS.length);
  headerRange.setValues([HEADERS]);
  headerRange.setFontWeight("bold");
  headerRange.setBackground("#2d7a4f");
  headerRange.setFontColor("#ffffff");
  headerRange.setHorizontalAlignment("center");

  // Largeurs adaptées
  sheet.setColumnWidth(1, 350); // Avis
  sheet.setColumnWidth(2, 120); // Note
  sheet.setColumnWidth(3, 420); // Réponse
  sheet.setColumnWidth(4, 140); // Statut

  // Fige la ligne d'en-tête
  sheet.setFrozenRows(1);
}

/**
 * Applique une liste déroulante sur toute la colonne D (sauf l'en-tête).
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet
 */
function _applyStatusDropdown(sheet) {
  const lastRow = Math.max(sheet.getMaxRows(), 100);
  const dropdownRange = sheet.getRange(2, 4, lastRow - 1, 1);

  const rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(STATUS_OPTIONS, true)
    .setAllowInvalid(false)
    .setHelpText("Choisissez un statut parmi la liste.")
    .build();

  dropdownRange.setDataValidation(rule);
}

// ============================================
// GÉNÉRATION DES RÉPONSES
// ============================================

function generateAllResponses() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // --- Collecte TOUTES les vraies réponses (excluant "aucune") ---
  let allExisting = [];

  SHEETS.forEach(sheetName => {
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) return;
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      const reponse = data[i][2];
      if (reponse && reponse.toLowerCase() !== "aucune") {
        allExisting.push({
          avis: data[i][0],
          etoile: data[i][1],
          reponse: reponse
        });
      }
    }
  });

  const sample = allExisting.slice(-MAX_EXISTING);

  // --- Traitement de chaque onglet ---
  SHEETS.forEach(sheetName => {
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) return;

    // S'assurer que la liste déroulante couvre les nouvelles lignes
    _applyStatusDropdown(sheet);

    const data = sheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
      const avis    = data[i][0];
      const etoile  = data[i][1];
      const reponse = data[i][2];
      const statut  = data[i][3];

      if (!avis) continue;
      if (statut === "✅ Publié") continue;
      if (statut === "⏳ À valider") continue;

      const needsResponse = !reponse || reponse.toLowerCase() === "aucune";
      if (!needsResponse) continue;

      const generated = callClaude(avis, etoile, sample);

      if (generated) {
        sheet.getRange(i + 1, 3).setValue(generated);
        sheet.getRange(i + 1, 4).setValue("⏳ À valider");
        SpreadsheetApp.flush();
        Utilities.sleep(1500);
      }
    }
  });

  SpreadsheetApp.getUi().alert("✅ Réponses générées ! Pense à valider avant publication.");
}

// ============================================
// APPEL API CLAUDE
// ============================================

function callClaude(avis, etoile, existingResponses) {
  const url = "https://api.anthropic.com/v1/messages";

  const systemPrompt = `Tu es un expert en e-réputation pour une enseigne de bien-être CBD (Green Society / Red Society).

Tu dois analyser les réponses existantes fournies pour déduire :
- Le ton de la marque (chaleureux, professionnel, local, etc.)
- Le niveau de formalité
- La longueur typique
- Les expressions récurrentes
- La gestion des critiques
- L'usage du prénom et du "nous"

Puis tu génères une réponse parfaitement alignée avec ce style.

Règles absolues :
- Personnalise toujours en reprenant un élément précis de l'avis
- Ne jamais inventer d'informations
- Ne jamais être défensif
- Varier les formulations (ne jamais copier une réponse existante)
- Adapter la longueur à la moyenne observée

Logique par note :
⭐⭐⭐⭐⭐ → enthousiasme + fidélisation
⭐⭐⭐⭐ → gratitude + ouverture amélioration
⭐⭐⭐ → reconnaissance + écoute active
⭐⭐ / ⭐ → empathie + professionnalisme + invitation au dialogue privé

Retourne UNIQUEMENT la réponse, sans explication ni formatage.`;

  const userPrompt = `Voici les réponses existantes de la marque (pour apprendre le style) :
${JSON.stringify(existingResponses, null, 2)}

---

Génère une réponse pour cet avis :
Note : ${etoile} étoile(s)
Avis : "${avis}"`;

  const payload = {
    model: MODEL,
    max_tokens: 400,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }]
  };

  const options = {
    method: "post",
    contentType: "application/json",
    headers: {
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01"
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(url, options);
    const json = JSON.parse(response.getContentText());
    return json.content[0].text.trim();
  } catch (e) {
    Logger.log("Erreur Claude : " + e.message);
    return null;
  }
}

// ============================================
// MENU PERSONNALISÉ
// ============================================

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("🤖 Reviews IA")
    .addItem("⚙️ Initialiser les onglets", "setupSheets")
    .addSeparator()
    .addItem("✨ Générer les réponses manquantes", "generateAllResponses")
    .addToUi();
}
