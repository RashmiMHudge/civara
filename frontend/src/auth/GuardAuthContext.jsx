import React, { createContext, useContext, useState } from "react";

const GuardAuthContext = createContext(null);

export const GuardAuthProvider = ({ children }) => {
  const [activeGuard, setActiveGuard] = useState(null);

  // LOGIN = PUNCH IN
  const loginGuard = (guard) => {
    setActiveGuard({
      guardId: guard.id,
      name: guard.name,
      gate: guard.gate,
      loginTime: new Date().toISOString(),
    });
  };

  // LOGOUT = PUNCH OUT
  const logoutGuard = () => {
    setActiveGuard(null);
  };

  return (
    <GuardAuthContext.Provider
      value={{
        activeGuard,
        loginGuard,
        logoutGuard,
      }}
    >
      {children}
    </GuardAuthContext.Provider>
  );
};

export const useGuardAuth = () => {
  return useContext(GuardAuthContext);
};
