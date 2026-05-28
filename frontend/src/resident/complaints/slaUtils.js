export const getSLAStatus = (
  startedAt,
  slaHours,
  status,
  resolvedAt,
  paused = false
) => {
  if (!startedAt || !slaHours) {
    return {
      label: "SLA Not Started",
      className: "sla-warning",
      show: false
    };
  }

  if(paused) {
    return {
      label: "SLA Paused",
      className: "sla-warning",
      show: true
    };
  }

  const startTime = new Date(startedAt).getTime();
  const slaMs = slaHours * 60 * 60 * 1000;

  const comparisonTime =
    status === "RESOLVED" && resolvedAt
      ? new Date(resolvedAt).getTime()
      : Date.now();

  const elapsed = comparisonTime - startTime;
  const remainingMs = slaMs - elapsed;

  // SLA BREACHED
  if (remainingMs <= 0) {
    return {
      label: "SLA Breached",
      className: "sla-breached",
      show: true
    };
  }

  // COMPLETED WITHIN SLA
  if (status === "RESOLVED") {
    return {
      label: "Resolved within SLA",
      className: "sla-safe",
      show: true
    };
  }

  const remainingHours = Math.ceil(remainingMs / (60 * 60 * 1000));

  return {
    label: `${remainingHours}h remaining`,
    className: remainingHours <= 6 ? "sla-warning" : "sla-safe",
    show: true
  };
};
