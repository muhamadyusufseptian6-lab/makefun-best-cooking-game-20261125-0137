// recipes.js — the menu of Warung Kilat: every ingredient on the counter and
// every dish a customer can order. All names, dishes and jokes are original.

export const INGREDIENTS = [
  { id: 'nasi',  name: 'Nasi',  emoji: '🍚', key: '1', color: '#f7ead0' },
  { id: 'mie',   name: 'Mie',   emoji: '🍜', key: '2', color: '#ffd166' },
  { id: 'telur', name: 'Telur', emoji: '🥚', key: '3', color: '#fff3c4' },
  { id: 'ayam',  name: 'Ayam',  emoji: '🍗', key: '4', color: '#e8a34c' },
  { id: 'sate',  name: 'Sate',  emoji: '🍢', key: '5', color: '#c98a4b' },
  { id: 'cabai', name: 'Cabai', emoji: '🌶️', key: '6', color: '#e63946' },
  { id: 'kecap', name: 'Kecap', emoji: '🍶', key: '7', color: '#5b3a29' },
  { id: 'teh',   name: 'Teh',   emoji: '🧋', key: '8', color: '#c98f4e' },
  { id: 'gula',  name: 'Gula',  emoji: '🍬', key: '9', color: '#ffffff' },
];

export const DISHES = [
  {
    id: 'nasgor', name: 'Nasi Goreng Petir', emoji: '🍚', price: 12,
    ingredients: ['nasi', 'telur', 'kecap', 'cabai'],
    blurb: 'Nasi digoreng sampai berasap, petirnya gratis.',
  },
  {
    id: 'miegor', name: 'Mie Goreng Kilat', emoji: '🍜', price: 12,
    ingredients: ['mie', 'telur', 'ayam', 'kecap'],
    blurb: 'Mie-nya kilat, makannya jangan kilat-kilat.',
  },
  {
    id: 'sate', name: 'Sate Kilat', emoji: '🍢', price: 14,
    ingredients: ['sate', 'kecap', 'cabai'],
    blurb: 'Tiga tusuk, satu kipas, nol sabar.',
  },
  {
    id: 'geprek', name: 'Ayam Geprek', emoji: '🍗', price: 13,
    ingredients: ['nasi', 'ayam', 'cabai'],
    blurb: 'Ayamnya digeprek, cabainya jangan digeprek balik.',
  },
  {
    id: 'esteh', name: 'Es Teh Manis', emoji: '🧋', price: 8,
    ingredients: ['teh', 'gula'],
    blurb: 'Manisnya pas, esnya jangan pelit.',
  },
  {
    id: 'nyemek', name: 'Mie Nyemek', emoji: '🍜', price: 11,
    ingredients: ['mie', 'telur', 'cabai'],
    blurb: 'Nyemek itu seni: tidak kering, tidak berkuah.',
  },
];

export const CUSTOMERS = [
  { name: 'Bang Ojek', face: '🛵' },
  { name: 'Mbak Sari', face: '💁' },
  { name: 'Pak RT', face: '👨‍💼' },
  { name: 'Kak Kunti', face: '👻' },
  { name: 'Mas Budi', face: '🧑' },
  { name: 'Tante Rosa', face: '👩‍🦱' },
  { name: 'Om Gendut', face: '🧔' },
  { name: 'Dek Kiko', face: '🧒' },
];

export function ingredientById(id) {
  return INGREDIENTS.find((ing) => ing.id === id);
}

export function dishById(id) {
  return DISHES.find((dish) => dish.id === id);
}

// A dish is harder the more ingredients it needs; late in the shift the
// kitchen only serves the fiddly ones.
export function dishPoolFor(elapsedSeconds) {
  if (elapsedSeconds < 40) return DISHES.filter((d) => d.ingredients.length <= 3);
  if (elapsedSeconds < 80) return DISHES.filter((d) => d.ingredients.length <= 4);
  return DISHES;
}
