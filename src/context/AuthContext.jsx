import React, { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext({ user: null, setUser: () => {}, is_admin: false });

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        try {
            const raw = localStorage.getItem("user");
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    });

    useEffect(() => {
        if (user) localStorage.setItem("user", JSON.stringify(user));
        else localStorage.removeItem("user");
    }, [user]);

    return (
        <AuthContext.Provider value={{ user, setUser, is_admin: user?.is_admin || false }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}