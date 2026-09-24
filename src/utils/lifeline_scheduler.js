/**
 * Municipal Crisis Lifeline Priority Scheduler.
 * Ranks and sequences critical infrastructure recovery operations
 * under constrained auxiliary power megawatts (MW).
 */
export class LifelinePriorityScheduler {
  constructor(maxGridLoadCapacityMw = 50.0) {
    this.maxCapacityMw = maxGridLoadCapacityMw;
  }

  scheduleRestoration(nodes) {
    // Sort descending by priority weight (1 = highest), then descending by population served
    const sorted = [...nodes].sort((a, b) => {
      if (a.priorityTier !== b.priorityTier) {
        return a.priorityTier - b.priorityTier;
      }
      return b.populationServed - a.populationServed;
    });

    let currentLoad = 0;
    const activated = [];
    const queued = [];

    for (const node of sorted) {
      if (currentLoad + node.powerDemandMw <= this.maxCapacityMw) {
        currentLoad += node.powerDemandMw;
        activated.push({ ...node, status: 'ENERGIZED', scheduledLoadMw: currentLoad });
      } else {
        queued.push({ ...node, status: 'QUEUED_FOR_CAPACITY' });
      }
    }

    return {
      totalCapacityMw: this.maxCapacityMw,
      allocatedLoadMw: Number(currentLoad.toFixed(2)),
      activatedCount: activated.length,
      queuedCount: queued.length,
      activated,
      queued,
    };
  }
}
