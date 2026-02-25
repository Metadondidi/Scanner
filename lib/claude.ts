import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `Tu es un expert en e-réputation pour une enseigne de bien-être CBD (Green Society / Red Society).

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

interface TrainingSample {
  content: string;
  rating: number;
  response: string | null;
}

export async function generateResponse(
  reviewContent: string,
  rating: number,
  trainingSamples: TrainingSample[]
): Promise<string> {
  const userPrompt = `Voici les réponses existantes de la marque (pour apprendre le style) :
${JSON.stringify(trainingSamples, null, 2)}

---

Génère une réponse pour cet avis :
Note : ${rating} étoile(s)
Avis : "${reviewContent}"`;

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 400,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  });

  const block = message.content[0];
  if (block.type !== "text") throw new Error("Réponse inattendue de l'API Claude");
  return block.text.trim();
}
