const emergencyData = {
  active: true,
  type: "Lift Breakdown",
  location: "Block B",
  reportedAt: "2026-01-04T08:30:00",
  notified: false,

  history: [
    {
      id: 1,
      type: "Fire Alarm",
      location: "Block A",
      resolvedAt: "02 Jan 2026",
    },
    {
      id: 2,
      type: "Power Failure",
      location: "Block C",
      resolvedAt: "31 Dec 2025",
    },
  ],
};

export default emergencyData;
