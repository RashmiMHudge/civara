const complaintsData = [
  {
    id: "C001",

    resident: {
      id: "R01",
      name: "Arjun Malik",
      flat: "A-001",
      phone: "+91XXXXXXXXXX"
    },

    category: "Water Leakage",
    location: "Bathroom",
    priority: "HIGH",
    description: "Leakage in bathroom ceiling",

    status: "OPEN",

    assignment: {
      assigned: false,
      assignedTo: null,
      role: null,
      assignedAt: null
    },

    sla: {
      hours: 48,
      startedAt: "2026-01-03T10:00:00",
      paused: false,
      pausedAt: null,
      breached: false
    },

    automation: {
      callAllowed: true,
      callStatus: "SCHEDULED",
      callAttempts: 1,
      lastCallAt: "2026-01-03T18:00:00",
      nextCallAt: null,
      preferredCallTime: "EVENING",
      repeatedIssue: false,
      linkedComplaintId: null
    },

    attachments: [],

    timeline: [
      {
        event: "COMPLAINT_RAISED",
        actor: "RESIDENT",
        meta: {},
        time: "2026-01-03T10:00:00"
      }
    ],

    feedback: {
      eligible: false,
      submitted: false,
      rating: null,
      comment: null
    },

    createdAt: "2026-01-03T10:00:00",
    resolvedAt: null
  },
  {
    id: "C002", 

    resident: {
      id: "R01",
      name: "Arjun Malik",
      flat: "A-001",
      phone: "+91XXXXXXXXXX"
    },  
    
    category: "Electrical Fault",
    location: "Living Room",
    priority: "MEDIUM",
    description: "Flickering lights in living room",

    status: "COMPLETED",

    assignment: {
      assigned: true,
      assignedTo: "S01",
      role: "ELECTRICIAN",
      assignedAt: "2026-01-03T12:00:00"
    },

    sla: {
      hours: 72,
      startedAt: "2026-01-03T12:00:00",
      paused: false,
      pausedAt: null,
      breached: false
    },

    automation: {
      callAllowed: true,
      callStatus: "COMPLETED",
      callAttempts: 1,
      lastCallAt: "2026-01-03T18:30:00",
      nextCallAt: null,
      preferredCallTime: "EVENING",
      repeatedIssue: false,
      linkedComplaintId: null
    },

    attachments: [
      {
        name: "fan.webp",
        type: "image/webp",
        url: "/uploads/fan.webp"
      }
    ],

    timeline: [
      {
        event: "COMPLAINT_RAISED",
        actor: "RESIDENT",
        time: "2026-01-03T12:00:00"
      },
      {
        event: "ASSIGNED_TO_ELECTRICIAN",
        actor: "ADMIN",
        time: "2026-01-03T14:00:00"
      },
      {
        event: "AUTOMATED_CALL_COMPLETED",
        actor: "SYSTEM",
        time: "2026-01-03T18:30:00"
      },
      {
        event: "COMPLAINT_RESOLVED",
        actor: "ELECTRICIAN",
        time: "2026-01-03T15:30:00"
      }
    ],


    feedback : {
      eligible : true,
      submitted : true,
      rating : 5,
      comment : "The issue was resolved quickly and professionally."
    },

    createdAt:"2026-01-03T12:35:45Z",
    resolvedAt:"2026-01-03T15:30:00Z"
  }
];

export default complaintsData;
