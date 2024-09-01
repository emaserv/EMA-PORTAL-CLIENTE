import React from "react";
import PropTypes from "prop-types";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ element: Component, token }) => {
  return token ? <Component /> : <Navigate to="/authentication/sign-in" />;
};

ProtectedRoute.propTypes = {
  element: PropTypes.object,
  token: PropTypes.string
};

export default ProtectedRoute;
