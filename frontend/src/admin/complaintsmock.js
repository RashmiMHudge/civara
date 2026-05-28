// src/admin/complaints.mock.js

export const mockComplaints = [
  {
    id: "C001",
    resident: {
      name: "Flat 02",
      phone: "+919876543210",
    },
    category: "Water Leakage",
    priority: "HIGH",

    status: "IN_PROGRESS", 
    // OPEN | IN_PROGRESS | RESOLVED | AWAITING_FEEDBACK | CLOSED | ESCALATED

    createdAt: "2026-01-03T10:00:00",

    sla: {
      totalHours: 48,
      remainingHours: 20,
      breached: false,
    },

    automation: {
      callStatus: "COMPLETED",        // PENDING | COMPLETED | NO_RESPONSE | FAILED
      availability: "Today at 3:00 PM",
      callSummary:
        "Resident confirmed leakage in bathroom ceiling. Available today at 3 PM.",
      suggestedTechnician: "Plumber",
    },

    attachments: [
      {
        id: "att1",
        url: "https://via.placeholder.com/300",
        uploadedAt: "2026-01-03T10:05:00",
      },
    ],

    feedback: null, // Filled only after resident submits

    timeline: [
      {
        by: "RESIDENT",
        message: "Complaint registered",
        time: "2026-01-03T10:00:00",
      },
      {
        by: "SYSTEM",
        message: "Automated call completed",
        time: "2026-01-03T10:03:00",
      },
      {
        by: "ADMIN",
        message: "Technician assigned",
        time: "2026-01-03T10:10:00",
      },
    ],
  },
];
