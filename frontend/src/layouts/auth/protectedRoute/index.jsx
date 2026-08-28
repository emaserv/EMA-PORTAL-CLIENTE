import React from "react";
import PropTypes from "prop-types";
import { Navigate } from "react-router-dom";
import { useAuth } from "layouts/auth/AuthContext";

const ProtectedRoute = ({ element }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  return user ? element : <Navigate to="/authentication/sign-in" replace />;
};

ProtectedRoute.propTypes = {
  element: PropTypes.node,
};

export default ProtectedRoute;
