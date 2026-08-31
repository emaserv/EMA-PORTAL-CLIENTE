import { useEffect, useState, useCallback, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Checkbox,
  Card,
  Divider,
  TablePagination,
  InputBase,
  InputAdornment,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import PersonAddIcon from "@mui/icons-material/PersonAddAlt1";
import SearchIcon from "@mui/icons-material/Search";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";
import SoftInputBase from "components/SoftInputBase";
import DropdownList from "components/DropdownList";
import PopUp from "components/PopUp";
import ResponsiveAppBar from "layouts/home/components/responsiveAppBar";
import { useAuth } from "layouts/auth/AuthContext";
import { apiClient } from "services/api";

// Mismo degradé "info" que usa el resto del sitio (headers de tabla, botones gradient)
const GRADIENTE_INFO = "linear-gradient(45deg, #0D47A1, #1976D2, #2196F3, #64B5F6, #BBDEFB)";

const headerCellSx = {
  background: "linear-gradient(to top, #2152ff, #21d4fd)",
  fontFamily: '"Roboto","Helvetica","Arial",sans-serif',
  fontSize: "0.75rem",
  fontWeight: "700",
  color: "#ffffff",
  textTransform: "uppercase",
  letterSpacing: "0.03em",
  padding: "10px 16px",
  border: "none",
};

const emptyForm = {
  nombre: "",
  apellido: "",
  userName: "",
  password: "",
  idGrupoCliente: null,
  esAdmin: false,
};

const AdminUsuarios = () => {
  const { user } = useAuth();

  const [usuariosList, setUsuariosList] = useState([]);
  const [gruposCliente, setGruposCliente] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState(null); // { tipo: 'error' | 'success', texto }

  const [dialogAbierto, setDialogAbierto] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState(null); // null = alta

  const [usuarioABorrar, setUsuarioABorrar] = useState(null);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [busqueda, setBusqueda] = useState("");

  const handleChangePage = (event, newPage) => setPage(newPage);

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleBuscar = (texto) => {
    setBusqueda(texto);
    setPage(0);
  };

  const usuariosFiltrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    if (!termino) return usuariosList;
    return usuariosList.filter((u) =>
      [u.nombre, u.apellido, u.userName, u.grupoCliente]
        .filter(Boolean)
        .some((campo) => campo.toLowerCase().includes(termino))
    );
  }, [usuariosList, busqueda]);

  const usuariosPagina = usuariosFiltrados.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const {
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm({ defaultValues: emptyForm });

  const cargarDatos = useCallback(async () => {
    setLoading(true);
    try {
      const [resUsuarios, resGrupos] = await Promise.all([
        apiClient.get("/api/admin/usuarios"),
        apiClient.get("/api/admin/grupos-cliente"),
      ]);
      setUsuariosList(resUsuarios.data.usuarios || []);
      setGruposCliente(resGrupos.data.gruposCliente || []);
    } catch (error) {
      setMensaje({ tipo: "error", texto: "No se pudieron cargar los usuarios." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // Evita quedar en una pagina vacia si se borra el ultimo usuario de la ultima pagina
  // o si un filtro de busqueda reduce los resultados
  useEffect(() => {
    const totalPaginas = Math.max(1, Math.ceil(usuariosFiltrados.length / rowsPerPage));
    if (page > totalPaginas - 1) {
      setPage(totalPaginas - 1);
    }
  }, [usuariosFiltrados, rowsPerPage, page]);

  const abrirAlta = () => {
    setUsuarioEditando(null);
    reset(emptyForm);
    setMensaje(null);
    setDialogAbierto(true);
  };

  const abrirEdicion = (usuario) => {
    setUsuarioEditando(usuario);
    reset({
      nombre: usuario.nombre || "",
      apellido: usuario.apellido || "",
      userName: usuario.userName || "",
      password: "",
      idGrupoCliente: usuario.idGrupoCliente,
      esAdmin: usuario.esAdmin,
    });
    setMensaje(null);
    setDialogAbierto(true);
  };

  const cerrarDialog = () => {
    setDialogAbierto(false);
    setUsuarioEditando(null);
  };

  const onSubmit = async (data) => {
    setMensaje(null);
    try {
      if (usuarioEditando) {
        const payload = {
          nombre: data.nombre,
          apellido: data.apellido,
          idGrupoCliente: data.idGrupoCliente,
          esAdmin: data.esAdmin,
          userName: data.userName,
        };
        if (data.password) {
          payload.password = data.password;
        }
        await apiClient.put(`/api/admin/usuarios/${usuarioEditando.id}`, payload);
        setMensaje({ tipo: "success", texto: "Usuario actualizado con éxito." });
      } else {
        await apiClient.post("/api/admin/usuarios", data);
        setMensaje({ tipo: "success", texto: "Usuario creado con éxito." });
      }
      cerrarDialog();
      cargarDatos();
    } catch (error) {
      const texto =
        error.response?.data?.message || "Ocurrió un error al guardar el usuario.";
      setMensaje({ tipo: "error", texto });
    }
  };

  const confirmarBorrado = async () => {
    if (!usuarioABorrar) return;
    try {
      await apiClient.delete(`/api/admin/usuarios/${usuarioABorrar.id}`);
      setMensaje({ tipo: "success", texto: "Usuario eliminado con éxito." });
      setUsuarioABorrar(null);
      cargarDatos();
    } catch (error) {
      const texto =
        error.response?.data?.message || "Ocurrió un error al eliminar el usuario.";
      setMensaje({ tipo: "error", texto });
      setUsuarioABorrar(null);
    }
  };

  return (
    <>
      <SoftBox display="flex" flexDirection="column" alignItems="center">
        <SoftBox width="100%">
          <ResponsiveAppBar />
        </SoftBox>

        <Card style={{ marginTop: "7rem", width: "90%", marginBottom: "3rem" }}>
          <SoftBox p={3}>
            <SoftBox
              display="flex"
              flexDirection={{ xs: "column", sm: "row" }}
              justifyContent="space-between"
              alignItems={{ xs: "stretch", sm: "center" }}
              gap={2}
              mb={1}
            >
              <SoftTypography variant="h4">Administrar Usuarios</SoftTypography>

              <SoftBox
                display="flex"
                flexDirection={{ xs: "column", sm: "row" }}
                alignItems={{ xs: "stretch", sm: "center" }}
                gap={1.5}
              >
                <InputBase
                  value={busqueda}
                  onChange={(e) => handleBuscar(e.target.value)}
                  placeholder="Buscar usuario..."
                  startAdornment={
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" sx={{ color: "#8392ab" }} />
                    </InputAdornment>
                  }
                  sx={{
                    width: { xs: "100%", sm: "18rem" },
                    fontSize: "0.875rem",
                    color: "#67748e",
                    backgroundColor: "#ffffff",
                    border: "1px solid #d2d6da",
                    borderRadius: "0.5rem",
                    padding: "0.4375rem 0.75rem",
                    gap: "0.5rem",
                    transition: "border-color 150ms ease, box-shadow 150ms ease",
                    "&.Mui-focused": {
                      borderColor: "#21d4fd",
                      boxShadow: "0 0 0 2px rgba(33, 212, 253, 0.25)",
                    },
                    "& .MuiInputBase-input": {
                      padding: 0,
                    },
                  }}
                />

                <SoftButton
                  variant="gradient"
                  color="info"
                  onClick={abrirAlta}
                  sx={{ whiteSpace: "nowrap" }}
                >
                  <PersonAddIcon fontSize="small" sx={{ mr: 1 }} />
                  Nuevo usuario
                </SoftButton>
              </SoftBox>
            </SoftBox>
            <Divider />

            {mensaje && (
              <SoftBox
                mb={2}
                mt={1}
                py={1}
                px={2}
                borderRadius="0.5rem"
                sx={{
                  backgroundColor: mensaje.tipo === "error" ? "#fdecea" : "#e6f7ec",
                }}
              >
                <SoftTypography
                  color={mensaje.tipo === "error" ? "error" : "success"}
                  fontWeight="medium"
                  fontSize="0.875rem"
                >
                  {mensaje.texto}
                </SoftTypography>
              </SoftBox>
            )}

            <TableContainer sx={{ borderRadius: "0.75rem", overflow: "hidden", mt: 2 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={headerCellSx}>Nombre</TableCell>
                    <TableCell sx={headerCellSx}>Apellido</TableCell>
                    <TableCell sx={headerCellSx}>Usuario</TableCell>
                    <TableCell sx={headerCellSx}>Cliente</TableCell>
                    <TableCell sx={headerCellSx}>Rol</TableCell>
                    <TableCell sx={headerCellSx} align="right">
                      Acciones
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {usuariosPagina.map((u) => (
                    <TableRow
                      key={u.id}
                      hover
                      sx={{
                        "&:last-child td": { borderBottom: 0 },
                      }}
                    >
                      <TableCell sx={{ fontSize: "0.875rem" }}>{u.nombre}</TableCell>
                      <TableCell sx={{ fontSize: "0.875rem" }}>{u.apellido}</TableCell>
                      <TableCell sx={{ fontSize: "0.875rem" }}>{u.userName}</TableCell>
                      <TableCell sx={{ fontSize: "0.875rem" }}>{u.grupoCliente}</TableCell>
                      <TableCell>
                        {u.esAdmin ? (
                          <Chip
                            label="Admin"
                            size="small"
                            sx={{
                              background: "linear-gradient(to top, #2152ff, #21d4fd)",
                              color: "#ffffff",
                              fontWeight: "700",
                              fontSize: "0.7rem",
                            }}
                          />
                        ) : (
                          <SoftTypography fontSize="0.8rem" color="text">
                            Cliente
                          </SoftTypography>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          onClick={() => abrirEdicion(u)}
                          size="small"
                          sx={{ color: "#2152ff" }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          onClick={() => setUsuarioABorrar(u)}
                          size="small"
                          disabled={u.id === user?.idUsuario}
                          sx={{ color: "#ea0606" }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!loading && usuariosFiltrados.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                        <SoftTypography fontSize="0.9rem" color="text">
                          {usuariosList.length === 0
                            ? "No hay usuarios cargados."
                            : "No se encontraron usuarios para esa búsqueda."}
                        </SoftTypography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              rowsPerPageOptions={[10, 25, 50]}
              component="div"
              count={usuariosFiltrados.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelRowsPerPage="Filas por página"
              labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
            />
          </SoftBox>
        </Card>
      </SoftBox>

      <PopUp
        estado={dialogAbierto}
        cambiarEstado={cerrarDialog}
        titulo={usuarioEditando ? "Editar usuario" : "Nuevo usuario"}
        mostrarHeader
        mostrarOverlay
        posicionModal="center"
        padding="0px"
        width="30vw"
        height="auto"
        background={GRADIENTE_INFO}
        paddingTopEncabezado="20px"
      >
        <form onSubmit={handleSubmit(onSubmit)} style={{ padding: "24px" }}>
          <SoftBox mb={2}>
            <SoftBox mb={1} ml={0.5}>
              <SoftTypography component="label" variant="caption" fontWeight="bold">
                Nombre
              </SoftTypography>
            </SoftBox>
            <Controller
              name="nombre"
              control={control}
              rules={{ required: "Campo obligatorio" }}
              render={({ field }) => (
                <SoftInputBase field={field} placeholder="Nombre" error={!!errors.nombre} />
              )}
            />
            {errors.nombre && (
              <SoftTypography variant="caption" color="error">
                {errors.nombre.message}
              </SoftTypography>
            )}
          </SoftBox>

          <SoftBox mb={2}>
            <SoftBox mb={1} ml={0.5}>
              <SoftTypography component="label" variant="caption" fontWeight="bold">
                Apellido
              </SoftTypography>
            </SoftBox>
            <Controller
              name="apellido"
              control={control}
              render={({ field }) => <SoftInputBase field={field} placeholder="Apellido" />}
            />
          </SoftBox>

          <SoftBox mb={2}>
            <SoftBox mb={1} ml={0.5}>
              <SoftTypography component="label" variant="caption" fontWeight="bold">
                Usuario
              </SoftTypography>
            </SoftBox>
            <Controller
              name="userName"
              control={control}
              rules={{ required: "Campo obligatorio" }}
              render={({ field }) => (
                <SoftInputBase
                  field={field}
                  placeholder="Nombre de usuario"
                  error={!!errors.userName}
                />
              )}
            />
            {errors.userName && (
              <SoftTypography variant="caption" color="error">
                {errors.userName.message}
              </SoftTypography>
            )}
          </SoftBox>

          <SoftBox mb={2}>
            <SoftBox mb={1} ml={0.5}>
              <SoftTypography component="label" variant="caption" fontWeight="bold">
                {usuarioEditando ? "Nueva contraseña (opcional)" : "Contraseña"}
              </SoftTypography>
            </SoftBox>
            <Controller
              name="password"
              control={control}
              rules={
                usuarioEditando
                  ? {}
                  : { required: "Campo obligatorio", minLength: { value: 4, message: "Mínimo 4 caracteres" } }
              }
              render={({ field }) => (
                <SoftInputBase
                  type="password"
                  field={field}
                  placeholder={usuarioEditando ? "Dejar en blanco para no cambiarla" : "Contraseña"}
                  error={!!errors.password}
                />
              )}
            />
            {errors.password && (
              <SoftTypography variant="caption" color="error">
                {errors.password.message}
              </SoftTypography>
            )}
          </SoftBox>

          <SoftBox mb={2}>
            <SoftBox mb={1} ml={0.5}>
              <SoftTypography component="label" variant="caption" fontWeight="bold">
                Cliente
              </SoftTypography>
            </SoftBox>
            <Controller
              name="idGrupoCliente"
              control={control}
              rules={{ required: "Campo obligatorio" }}
              render={({ field }) => (
                <DropdownList
                  width="26vw"
                  list={gruposCliente}
                  placeholder="Seleccione un cliente"
                  campoAMostrar="nombre"
                  campoID="id"
                  value={gruposCliente.find((g) => g.id === field.value) || null}
                  onChange={(selectedValue) => field.onChange(selectedValue)}
                />
              )}
            />
            {errors.idGrupoCliente && (
              <SoftTypography variant="caption" color="error">
                {errors.idGrupoCliente.message}
              </SoftTypography>
            )}
          </SoftBox>

          <SoftBox mb={1} display="flex" alignItems="center">
            <Controller
              name="esAdmin"
              control={control}
              render={({ field }) => (
                <Checkbox
                  checked={!!field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                  sx={{
                    color: "#2152ff",
                    "&.Mui-checked": { color: "#2152ff" },
                  }}
                />
              )}
            />
            <SoftTypography fontSize="0.875rem">
              Es administrador (puede administrar otros usuarios)
            </SoftTypography>
          </SoftBox>

          <SoftBox display="flex" justifyContent="flex-end" mt={3}>
            <SoftButton variant="gradient" color="info" type="submit">
              {usuarioEditando ? "Guardar cambios" : "Crear usuario"}
            </SoftButton>
          </SoftBox>
        </form>
      </PopUp>

      <PopUp
        estado={!!usuarioABorrar}
        cambiarEstado={() => setUsuarioABorrar(null)}
        titulo="Eliminar usuario"
        mostrarHeader
        mostrarOverlay
        posicionModal="center"
        padding="0px"
        width="25vw"
        height="auto"
        background="#ea0606"
        paddingTopEncabezado="20px"
      >
        <SoftBox p={3}>
          <SoftTypography fontSize="0.9rem" mb={3}>
            ¿Seguro que querés eliminar a {usuarioABorrar?.nombre} {usuarioABorrar?.apellido} (
            {usuarioABorrar?.userName})? Esta acción no se puede deshacer.
          </SoftTypography>
          <SoftBox display="flex" justifyContent="flex-end" gap={1}>
            <SoftButton variant="outlined" color="dark" onClick={() => setUsuarioABorrar(null)}>
              Cancelar
            </SoftButton>
            <SoftButton variant="gradient" color="error" onClick={confirmarBorrado}>
              Eliminar
            </SoftButton>
          </SoftBox>
        </SoftBox>
      </PopUp>
    </>
  );
};

export default AdminUsuarios;
