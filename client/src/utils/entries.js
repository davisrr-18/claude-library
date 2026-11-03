/** Uma entrada por card (a busca e a Home trabalham com elas). `text` é preenchido depois com o corpo das peças. */
export function buildEntries(manifest) {
  return manifest.tiers.flatMap((tierObj) =>
    tierObj.cards.map((cardObj) => ({
      tier: tierObj.id,
      card: cardObj.id,
      title: cardObj.title,
      summary: cardObj.summary || '',
      tags: cardObj.tags || [],
      text: '',
      tierObj,
      cardObj,
    })),
  );
}
