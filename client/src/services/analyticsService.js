export const analyticsService = {
  getHourlyFlowData: () => [
    { hour: '08:00', arrivals: 8, completed: 3 },
    { hour: '09:00', arrivals: 14, completed: 9 },
    { hour: '10:00', arrivals: 19, completed: 15 },
    { hour: '11:00', arrivals: 24, completed: 18 },
    { hour: '12:00', arrivals: 18, completed: 21 },
    { hour: '13:00', arrivals: 15, completed: 17 },
    { hour: '14:00', arrivals: 22, completed: 20 },
    { hour: '15:00', arrivals: 26, completed: 23 },
    { hour: '16:00', arrivals: 17, completed: 19 },
    { hour: '17:00', arrivals: 12, completed: 14 },
  ],

  getTriageDistribution: (assessments) => {
    let l1 = 0, l2 = 0, l3 = 0, l4 = 0, l5 = 0;
    assessments.forEach(a => {
      const lvl = String(a.finalTriageLevel || '').toUpperCase();
      if (lvl === 'LEVEL 1' || lvl === 'RED' || lvl === 'CRITICAL') l1++;
      else if (lvl === 'LEVEL 2' || lvl === 'ORANGE') l2++;
      else if (lvl === 'LEVEL 3' || lvl === 'AMBER' || lvl === 'YELLOW') l3++;
      else if (lvl === 'LEVEL 4' || lvl === 'GREEN') l4++;
      else if (lvl === 'LEVEL 5' || lvl === 'BLUE') l5++;
    });
    return [
      { name: 'Immediate', value: l1 || 2, color: '#E11D48' },
      { name: 'Emergent', value: l2 || 3, color: '#EA580C' },
      { name: 'Urgent', value: l3 || 4, color: '#D97706' },
      { name: 'Less Urgent', value: l4 || 3, color: '#3B82F6' },
      { name: 'Non-Urgent', value: l5 || 2, color: '#2563EB' },
    ];
  },

  getDepartmentWaitChartData: (departments) => {
    return departments.map(d => ({
      name: d.code,
      fullName: d.name,
      avgWait: d.averageWaitTime,
      queue: d.currentQueueLength,
      capacity: d.capacity
    }));
  }
};

