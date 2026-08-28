// Vacio + el "proxy" de package.json (dev) hace que las llamadas queden
// same-origin y la cookie de sesion httpOnly viaje sin configuracion extra.
// En build de produccion, definir REACT_APP_API_BACK si el frontend no se
// sirve desde el mismo origen que el backend.
export const API_BACK = process.env.REACT_APP_API_BACK || '';