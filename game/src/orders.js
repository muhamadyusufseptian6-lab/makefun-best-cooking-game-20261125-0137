// orders.js — the order board: tickets arrive, their timers drain, and a
// ticket that runs out walks away angry. Pure logic, no drawing, no DOM.

import { CUSTOMERS, dishPoolFor, dishById } from './recipes.js';

let nextOrderId = 1;

export class OrderBoard {
  constructor() {
    this.orders = [];
    this.selectedIndex = 0;
    this.spawnTimer = 0;
    this.spawnInterval = 8;
    this.maxOrders = 4;
  }

  get selected() {
    return this.orders[this.selectedIndex] ?? null;
  }

  select(index) {
    if (this.orders.length === 0) return;
    this.selectedIndex = ((index % this.orders.length) + this.orders.length)
      % this.orders.length;
  }

  cycle(direction) {
    this.select(this.selectedIndex + direction);
  }

  spawnIntervalFor(elapsedSeconds, rushActive) {
    const base = Math.max(4.5, 8 - elapsedSeconds / 25);
    return rushActive ? base / 2 : base;
  }

  orderTimeFor(elapsedSeconds) {
    return Math.max(16, 28 - elapsedSeconds / 10);
  }

  addOrder(dish, customer, timeMax) {
    const order = {
      id: nextOrderId++,
      dish,
      customer,
      timeLeft: timeMax,
      timeMax,
      mood: 'happy',
    };
    this.orders.push(order);
    if (this.orders.length === 1) this.selectedIndex = 0;
    return order;
  }

  removeOrder(id) {
    const at = this.orders.findIndex((o) => o.id === id);
    if (at === -1) return null;
    const [gone] = this.orders.splice(at, 1);
    if (this.selectedIndex >= this.orders.length) {
      this.selectedIndex = Math.max(0, this.orders.length - 1);
    }
    return gone;
  }

  // Advance timers and spawn new tickets. Returns the orders that expired.
  update(dt, elapsedSeconds, rushActive) {
    const expired = [];
    for (const order of this.orders) {
      order.timeLeft -= dt;
      const ratio = order.timeLeft / order.timeMax;
      order.mood = ratio > 0.5 ? 'happy' : ratio > 0.25 ? 'impatient' : 'angry';
      if (order.timeLeft <= 0) expired.push(order);
    }
    for (const order of expired) this.removeOrder(order.id);

    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0 && this.orders.length < this.maxOrders) {
      const pool = dishPoolFor(elapsedSeconds);
      const dish = pool[Math.floor(Math.random() * pool.length)];
      const customer = CUSTOMERS[Math.floor(Math.random() * CUSTOMERS.length)];
      this.addOrder(dish, customer, this.orderTimeFor(elapsedSeconds));
      this.spawnTimer = this.spawnIntervalFor(elapsedSeconds, rushActive);
    }
    return expired;
  }

  // A fresh board for the title screen: two tickets already pinned up.
  static demo() {
    const board = new OrderBoard();
    board.addOrder(dishById('nasgor'), CUSTOMERS[0], 28);
    board.addOrder(dishById('esteh'), CUSTOMERS[3], 22);
    board.orders[0].timeLeft = 21;
    board.orders[1].timeLeft = 17;
    return board;
  }
}
