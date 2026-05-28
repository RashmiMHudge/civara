// acts like a temporary in-memory DB
const emergencyStore = [];

export const addEmergency = (emergency) => {
  emergencyStore.unshift(emergency); // newest on top
};

export const getEmergencies = () => {
  return emergencyStore;
};

export const updateEmergencyStatus = (id, updates) => {
  const index = emergencyStore.findIndex(e => e.id === id);
  if (index !== -1) {
    emergencyStore[index] = {
      ...emergencyStore[index],
      ...updates,
    };
  }
};
