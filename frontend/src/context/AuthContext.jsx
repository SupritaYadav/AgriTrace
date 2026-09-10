import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { onAuthStateChanged } from "firebase/auth";

import { auth } from "../config/firebase";
import { getCurrentUser } from "../api/authApi";

import {
  loginUser,
  registerUser,
  logoutUser,
} from "../services/authService";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser || null);
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Fetch backend profile when Firebase user is available
  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        try {
          const profileData = await getCurrentUser();
          setProfile(profileData);
        } catch (err) {
          console.error('Failed to fetch user profile', err);
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
    };
    fetchProfile();
  }, [user]);

  const login = async (email, password) => {
    return await loginUser(email, password);
  };

  const register = async (name, email, password) => {
    return await registerUser(name, email, password);
  };

  const logout = async () => {
    await logoutUser();
    setUser(null);
    setProfile(null);
  };

  const value = {
    user,
    profile,
    role: profile?.role ?? null,
    authLoading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
};