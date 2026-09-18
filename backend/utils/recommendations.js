function averageRating(listing) {
  if (!listing.reviews || !listing.reviews.length) return 0;
  return (
    listing.reviews.reduce((sum, review) => sum + (review.rating || 0), 0) /
    listing.reviews.length
  );
}

function recommendationScore(source, candidate) {
  let score = 0;
  const sourceLocation = String(source.location || '').toLowerCase();
  const candidateLocation = String(candidate.location || '').toLowerCase();
  const sourceCountry = String(source.country || '').toLowerCase();
  const candidateCountry = String(candidate.country || '').toLowerCase();
  const sourceWords = String(
    `${source.title || ''} ${source.description || ''}`
  )
    .toLowerCase()
    .split(/\W+/)
    .filter((word) => word.length > 3);
  const candidateText = String(
    `${candidate.title || ''} ${candidate.description || ''}`
  ).toLowerCase();

  if (sourceLocation && sourceLocation === candidateLocation) score += 6;
  if (sourceCountry && sourceCountry === candidateCountry) score += 3;
  if (source.price != null && candidate.price != null) {
    const priceDifference =
      Math.abs(source.price - candidate.price) / Math.max(source.price, 1);
    score += Math.max(0, 4 - priceDifference * 4);
  }
  score += sourceWords.filter((word) => candidateText.includes(word)).length;
  score += averageRating(candidate);

  return score;
}

function getRecommendations(source, listings, limit = 3) {
  return listings
    .filter((listing) => String(listing._id) !== String(source._id))
    .map((listing) => ({
      listing,
      score: recommendationScore(source, listing),
    }))
    .sort((first, second) => second.score - first.score)
    .slice(0, limit)
    .map(({ listing }) => listing);
}

module.exports = { getRecommendations };
