const complaintsData = [
  {
    id: "C001",
    resident: {
      id: "R02",
      name: "Flat 02",
      phone: "+91 9876543210",
    },
    category: "Water Leakage",
    priority: "HIGH",
    description: "Leakage in bathroom ceiling",
    status: "OPEN",
    assignedTo: null,
    createdAt: "2026-01-03T10:00:00",
    slaDeadline: "2026-01-05T10:00:00",
    timeline: [
      {
        id: 1,
        actor: "RESIDENT",
        action: "Complaint raised",
        time: "2026-01-03T10:00:00",
      },
    ],
  },
  {
    id: "C002",
    resident: {
      id: "R10",
      name: "Flat 10",
      phone: "+91 9876543210",
    },
    category: "Electricity",
    priority: "MEDIUM",
    description: "Ceiling fan not working",
    status: "IN_PROGRESS",
    assignedTo: {
      id: "S01",
      name: "Electrician",
      phone: "+91 4567735890",
    },
    createdAt: "2026-01-02T09:30:00",
    slaDeadline: "2026-01-04T09:30:00",
    timeline: [
      {
        id: 1,
        actor: "RESIDENT",
        action: "Complaint raised",
        time: "2026-01-02T09:30:00",
      },
      {
        id: 2,
        actor: "ADMIN",
        action: "Assigned to Electrician",
        time: "2026-01-02T11:00:00",
      },
    ],
  },
];

export default complaintsData;
