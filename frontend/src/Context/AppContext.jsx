import { createContext, useState } from "react";
import { doctors } from "../assets/assets";

const AppContext = createContext();

const AppContextProvider = ({ children }) => {
  const currencySymbol = '$';
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

  const value = {
    doctors,
    currencySymbol,
    isAuthenticated,
    setIsAuthenticated,
    userProfile,
    setUserProfile
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export { AppContext };
export default AppContextProvider;