
export const getStatusBadgeClass = (status) => {
  switch (status) {
    case "EXPECTED":
      return "status-expected";
    case "CHECKED_IN":
      return "status-checked-in";
    case "DENIED":
      return "status-denied";
    case "EXPIRED":
      return "status-expired";
    case "CHECKED_OUT":
      return "status-checked-out";
    default:
      return "";
  }
};
