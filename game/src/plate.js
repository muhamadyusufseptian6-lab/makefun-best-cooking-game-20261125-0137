// plate.js — the dish mid-assembly: what is on the plate, whether it matches
// the selected order, and what a served dish is worth. Pure logic, no DOM.

export class Plate {
  constructor() {
    this.reset();
  }

  reset() {
    this.added = [];
    this.wrong = false;
  }

  // Add one ingredient for the given dish.
  // Returns 'added' | 'duplicate' | 'wrong'.
  add(ingredientId, dish) {
    if (!dish) return 'wrong';
    if (this.added.includes(ingredientId)) return 'duplicate';
    if (!dish.ingredients.includes(ingredientId)) {
      this.wrong = true;
      this.added.push(ingredientId);
      return 'wrong';
    }
    this.added.push(ingredientId);
    return 'added';
  }

  isComplete(dish) {
    if (!dish || this.wrong) return false;
    return dish.ingredients.every((id) => this.added.includes(id));
  }

  progress(dish) {
    if (!dish) return 0;
    const good = this.added.filter((id) => dish.ingredients.includes(id)).length;
    return good / dish.ingredients.length;
  }
}

export class Score {
  constructor() {
    this.coins = 0;
    this.served = 0;
    this.combo = 0;
    this.bestCombo = 0;
    this.hearts = 3;
    this.tips = 0;
  }

  // A served dish pays its price plus a tip for speed; a streak multiplies it.
  serve(order) {
    const speedBonus = Math.round((order.timeLeft / order.timeMax) * 6);
    const comboBonus = this.combo >= 2 ? this.combo : 0;
    const earned = order.dish.price + speedBonus + comboBonus;
    this.coins += earned;
    this.tips += speedBonus;
    this.served += 1;
    this.combo += 1;
    this.bestCombo = Math.max(this.bestCombo, this.combo);
    return earned;
  }

  missOrder() {
    this.hearts = Math.max(0, this.hearts - 1);
    this.combo = 0;
  }

  spoilPlate() {
    this.combo = 0;
  }

  get rankTitle() {
    if (this.served >= 20) return 'LEGENDA WARUNG 👑';
    if (this.served >= 14) return 'KOKI PETIR ⚡';
    if (this.served >= 9) return 'TUKANG MASAK ANDAL 🍳';
    if (this.served >= 5) return 'MAGANG NAIK KELAS 🧑‍🍳';
    return 'MAGANG BARU 🐣';
  }
}
