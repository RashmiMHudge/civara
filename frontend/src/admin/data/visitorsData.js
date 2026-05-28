const visitorsData = [
  {
    id: "VIS-1001",
    name: "Rahul Sharma",
    flat: "A-001",
    purpose: "Delivery",
    inviteCode: "795389",
    validFrom: "2026-02-07T10:00:00",
    validTo: "2026-02-07T12:00:00",

    status: "EXPECTED", // EXPECTED | ENTERED | DENIED | EXPIRED | EXITED

    entry: {
      time: null,
      guardId: null,
      gate: null
    },

    exit: {
      time: null,
      guardId: null
    },

    createdBy: "RES-0001", // resident id
    createdAt: "2026-02-06T18:00:00"
  }
];

export default visitorsData;
