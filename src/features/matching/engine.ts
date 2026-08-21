import type { MatchResult, Property, Requirement } from '@/types/domain';

export const MINIMUM_MATCH_SCORE = 70;

function normalized(value: string): string {
  return value.trim().toLocaleLowerCase('ar-KW');
}

export function calculateMatch(requirement: Requirement, property: Property): MatchResult {
  const reasons: string[] = [];
  const blockers: string[] = [];
  let earned = 0;
  let possible = 0;

  if (requirement.areas.length) {
    possible += 35;
    if (requirement.areas.some(area => normalized(area) === normalized(property.area))) {
      earned += 35; reasons.push('area');
    } else blockers.push('area');
  }
  if (requirement.propertyTypes.length) {
    possible += 25;
    if (requirement.propertyTypes.includes(property.type)) { earned += 25; reasons.push('type'); }
    else blockers.push('type');
  }
  if (requirement.maxRent !== null || requirement.minRent !== null) {
    possible += 25;
    const aboveMin = requirement.minRent === null || property.monthlyRent >= requirement.minRent;
    const belowMax = requirement.maxRent === null || property.monthlyRent <= requirement.maxRent;
    if (aboveMin && belowMax) { earned += 25; reasons.push('rent'); } else blockers.push('rent');
  }
  if (requirement.minBedrooms !== null) {
    possible += 10;
    if ((property.bedrooms ?? 0) >= requirement.minBedrooms) { earned += 10; reasons.push('bedrooms'); }
    else blockers.push('bedrooms');
  }
  if (requirement.furnishing !== 'any') {
    possible += 5;
    if (property.furnishing === requirement.furnishing) { earned += 5; reasons.push('furnishing'); }
    else blockers.push('furnishing');
  }
  const score = possible === 0 ? 0 : Math.round((earned / possible) * 100);
  return {propertyId: property.id, requirementId: requirement.id, score, reasons, blockers};
}

export function findMatches(requirements: Requirement[], properties: Property[]): MatchResult[] {
  return requirements.flatMap(requirement => properties
    .filter(property => property.status === 'available')
    .map(property => calculateMatch(requirement, property)))
    .filter(match => match.score >= MINIMUM_MATCH_SCORE)
    .filter(match => !match.blockers.some(blocker => blocker === 'area' || blocker === 'type' || blocker === 'rent'))
    .sort((a,b) => b.score-a.score);
}
