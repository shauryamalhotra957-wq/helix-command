import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { LifelinePriorityScheduler } from '../src/utils/lifeline_scheduler.js';

describe('LifelinePriorityScheduler Test Suite', () => {
  test('allocates high priority nodes up to capacity', () => {
    const scheduler = new LifelinePriorityScheduler(30.0);
    const nodes = [
      { id: 'water-plant-1', priorityTier: 1, powerDemandMw: 10.0, populationServed: 50000 },
      { id: 'hospital-metro', priorityTier: 1, powerDemandMw: 15.0, populationServed: 120000 },
      { id: 'shopping-mall', priorityTier: 4, powerDemandMw: 10.0, populationServed: 5000 },
      { id: 'data-center', priorityTier: 2, powerDemandMw: 10.0, populationServed: 20000 },
    ];

    const plan = scheduler.scheduleRestoration(nodes);
    assert.strictEqual(plan.activatedCount, 2);
    assert.strictEqual(plan.queuedCount, 2);
    assert.strictEqual(plan.allocatedLoadMw, 25.0);
    assert.strictEqual(plan.activated[0].id, 'hospital-metro');
    assert.strictEqual(plan.activated[1].id, 'water-plant-1');
  });

  test('handles empty input nodes gracefully', () => {
    const scheduler = new LifelinePriorityScheduler(50.0);
    const plan = scheduler.scheduleRestoration([]);
    assert.strictEqual(plan.activatedCount, 0);
    assert.strictEqual(plan.allocatedLoadMw, 0.0);
  });
});
