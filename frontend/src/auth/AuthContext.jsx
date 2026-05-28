import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState({
    isAuth: false,
    role: null,
    token: null,
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    const isAuth = localStorage.getItem("isAuth");

    if (token && role && isAuth === "true") {
      setAuth({
        isAuth: true,
        role,
        token,
      });
    }
  }, []);

  const logout = () => {
    localStorage.clear();
    setAuth({ isAuth: false, role: null, token: null });
  };

  return (
    <AuthContext.Provider value={{ auth, setAuth, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
//all the tabs will read the same session and no overwrites