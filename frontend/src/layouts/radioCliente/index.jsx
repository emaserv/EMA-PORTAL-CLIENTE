import React, { useState, useEffect } from "react";
import SoftBox from "components/SoftBox";
import ResponsiveAppBar from "layouts/home/components/responsiveAppBar";
import { Card, Divider } from "@mui/material";
import SoftTypography from "components/SoftTypography";
import DatePickerValue from "components/DatePicker";
import DropdownList from "components/DropdownList";
import { useForm, Controller } from "react-hook-form";
import EnhancedTable from "./data/fechaClienteTable";
import { API_BACK } from "../../config";

const RadioCliente = () => {
  const { handleSubmit, control } = useForm();  
  const [primerFetch, setPrimerFetchCompletado] = useState(false);
  const [segundoFetch, setSegundoFetchCompletado] = useState(false);
  const [tercerFetch, setTercerFetchCompletado] = useState(false);
  const [dataDropDwnSucursal, setDataDropDwnSucursal] = useState([]);
  const [dataDropDwnPlan, setDataDropDwnPlan] = useState([]);
  const [dataDropDwnRadio, setDataDropDwnRadio] = useState([]);
  const [dataTabla, setDataTabla] = useState([]);
  const [columns, setColumns] = useState([]);

  useEffect(() => {
    fetch(`${API_BACK}/api/fechaCliente`, { mode: "cors" })
      .then((response) => response.json())
      .then((apiData) => {
        if (apiData.dataTabla && apiData.columns) {
          setDataTabla(apiData.dataTabla);
          setColumns(apiData.columns);
          setPrimerFetchCompletado(true);
        }
      })
      .catch((error) => {});
  }, []);

  useEffect(() => {
    if(primerFetch){
    fetch(`${API_BACK}/api/plan`, { mode: "cors" })
      .then((response) => response.json())
      .then((apiData) => {
        if (apiData.dataDropDwnPlan) {
          setDataDropDwnPlan(apiData.dataDropDwnPlan);
          setSegundoFetchCompletado(true);
        }
      })
      .catch((error) => {});
    }
  }, [primerFetch]);

  useEffect(() => {
    if(segundoFetch){
    fetch(`${API_BACK}/api/radio`, { mode: "cors" })
      .then((response) => response.json())
      .then((apiData) => {
        if (apiData.dataDropDwnRadio) {
          setDataDropDwnRadio(apiData.dataDropDwnRadio);
          setTercerFetchCompletado(true);
        }
      })
      .catch((error) => {});
    }
  }, [segundoFetch]);

  useEffect(() => {
    if(tercerFetch){
    fetch(`${API_BACK}/api/sucursal`, { mode: "cors" })
      .then((response) => response.json())
      .then((apiData) => {
        if (apiData.dataDropDwnSucursal) {
          setDataDropDwnSucursal(apiData.dataDropDwnSucursal);
        }
      })
      .catch((error) => {});
    }
  }, [tercerFetch]);

  return (
    <SoftBox display="flex" flexDirection="column" alignItems="center">
      <SoftBox width="100%">
        <ResponsiveAppBar />
      </SoftBox>

      <Card style={{ marginTop: "7rem", width: "80%" }}>
        <SoftBox p={3}>
          <SoftTypography variant="h3">Filtros</SoftTypography>
          <Divider />

          <SoftBox
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <SoftBox mt={2}>
              <SoftTypography>Plan</SoftTypography>
              <Controller
                name="plan"
                control={control}
                render={({ field }) => (
                  <DropdownList
                    width="10vw !important"
                    list={dataDropDwnPlan}
                    placeholder="Seleccione plan"
                    campoAMostrar="planTurno"
                    campoID="planTurno"
                    inputRef={field.ref}
                    value={field.value}
                    onChange={(selectedValue) => field.onChange(selectedValue)}
                  />
                )}
              />
            </SoftBox>

            <SoftBox mt={2}>
              <SoftTypography>Radio</SoftTypography>
              <Controller
                name="radio"
                control={control}
                render={({ field }) => (
                  <DropdownList
                    width="10vw !important"
                    list={dataDropDwnRadio}
                    placeholder="Seleccione radio"
                    campoAMostrar="radio"
                    campoID="radio"
                    inputRef={field.ref}
                    value={field.value}
                    onChange={(selectedValue) => field.onChange(selectedValue)}
                  />
                )}
              />
            </SoftBox>

            <SoftBox mt={2}>
              <SoftTypography>Sucursal</SoftTypography>
              <Controller
                name="sucursal"
                control={control}
                render={({ field }) => (
                  <DropdownList
                    width="10vw !important"
                    list={dataDropDwnSucursal}
                    placeholder="Seleccione sucursal"
                    campoAMostrar="sucursal"
                    campoID="sucursal"
                    inputRef={field.ref}
                    value={field.value}
                    onChange={(selectedValue) => field.onChange(selectedValue)}
                  />
                )}
              />
            </SoftBox>

            <SoftBox mt={2} display="flex" flexDirection="column">
              <SoftTypography>Fecha</SoftTypography>

              <SoftBox display="flex" alignItems="center">
                <SoftBox display="flex" alignItems="center">
                  <SoftTypography>Desde:</SoftTypography>
                  <DatePickerValue />
                </SoftBox>

                <SoftBox marginLeft="1.5rem" display="flex" alignItems="center">
                  <SoftTypography>Hasta:</SoftTypography>
                  <DatePickerValue />
                </SoftBox>
              </SoftBox>
            </SoftBox>
          </SoftBox>
        </SoftBox>
      </Card>

      <SoftBox py={3} style={{ width: "80%" }} justifyContent="center">
        <SoftBox justifyContent="center">
          <Card>
            <SoftBox p={3}>
              <EnhancedTable data={dataTabla} columns={columns} />
            </SoftBox>
          </Card>
        </SoftBox>
      </SoftBox>
    </SoftBox>
  );
};

export default RadioCliente;
