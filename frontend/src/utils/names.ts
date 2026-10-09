/**
 * Deterministic fictional name generator for social network nodes.
 * Maps integer node IDs to stable, realistic human full names.
 */

const FIRST_NAMES = [
  "Elena", "Marcus", "Sophia", "Alexander", "Chloe", "Julian", "Aria", "Dominic",
  "Nora", "Sebastian", "Valentina", "Gabriel", "Seraphina", "Dante", "Isolde", "Xavier",
  "Genevieve", "Caspian", "Camilla", "Tristan", "Ophelia", "Lucian", "Celeste", "Felix",
  "Evangeline", "Gideon", "Aurora", "Lysander", "Vivienne", "Raphael", "Clara", "Victor",
  "Penelope", "Adrian", "Amara", "Silas", "Freya", "Atticus", "Maeve", "August"
];

const LAST_NAMES = [
  "Rostova", "Vance", "Reed", "Hayes", "Bennet", "Sinclair", "Vane", "Sterling",
  "Mercer", "Blackwood", "Montague", "Davenport", "Hawthorne", "Kensington", "St. Clair", "Westhaven",
  "Castellane", "Vanderbilt", "De Witt", "Ashford", "Kingsley", "Pembroke", "Somerset", "Winter",
  "Belcourt", "Cavendish", "Fairfax", "Holloway", "Lovelace", "Thorne", "Vanderhof", "Pemberton"
];

export function getUserFullName(nodeId: number): string {
  const firstIndex = Math.abs(nodeId) % FIRST_NAMES.length;
  const lastIndex = Math.floor(Math.abs(nodeId) / FIRST_NAMES.length) % LAST_NAMES.length;
  return `${FIRST_NAMES[firstIndex]} ${LAST_NAMES[lastIndex]}`;
}
