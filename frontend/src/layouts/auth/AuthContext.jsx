// AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from 'services/api';

// Crear el contexto
const AuthContext = createContext();

// Proveedor del contexto
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // Estado para almacenar el usuario
  const [loading, setLoading] = useState(true); // Mientras se valida la sesion existente

  useEffect(() => {
    // La sesion vive en una cookie httpOnly (no accesible desde JS), asi
    // que para saber si ya hay un login vigente le preguntamos al backend.
    apiClient
      .get('/api/me')
      .then((response) => setUser(response.data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  // Función para iniciar sesión
  const login = (userData) => {
    setUser(userData);
  };

  // Función para cerrar sesión
  const logout = async () => {
    try {
      await apiClient.post('/api/logout');
    } catch (e) {
      // Si falla igual limpiamos el estado local
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook personalizado para usar el contexto de autenticación
export const useAuth = () => {
  return useContext(AuthContext);
};
