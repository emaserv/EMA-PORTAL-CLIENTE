import React, { useState, useEffect } from "react";
import SoftBox from "components/SoftBox";
import ResponsiveAppBar from "layouts/home/components/responsiveAppBar";
import { Card, Divider } from "@mui/material";
import SoftTypography from "components/SoftTypography";
import DatePickerValue from "components/DatePicker";
import DropdownList from "components/DropdownList";
import { useForm, Controller } from "react-hook-form";
import EnhancedTable from "./data/fechaClienteTable"
import { API_BACK } from "../../config";
import { useAuth } from 'layouts/auth/AuthContext';

const FechaCliente = () => {

    const { user } = useAuth();
    const [multiplesClientes, setMultiplesClientes] = useState([]);
    const [primerFetch, setPrimerFetchCompletado] = useState(false);
    const { handleSubmit, control } = useForm();
    const [dataDropDwn, setDataDropDwn] = useState([]);
    const [dataTabla, setDataTabla] = useState([]);
    const [dataTablaEDESUR, setDataTablaEDESUR] = useState([]);
    const [dataTablaMETROGAS, setDataTablaMETROGAS] = useState([]);
    const [columns, setColumns] = useState([]);
    const [datosTabla, setDatosTabla] = useState([]);

    useEffect(() => {
        fetch(`${API_BACK}/api/fechaCliente`, { mode: "cors" })
          .then((response) => response.json())
          .then((apiData) => {
            if (apiData.dataTabla && apiData.columns) {
              setDataTabla(apiData.dataTabla);
              setColumns(apiData.columns);
              setPrimerFetchCompletado(true);
    
              setDataTablaEDESUR(apiData.dataTabla.filter((registro) => registro.idGrupoCliente === "EDESUR"));
              setDataTablaMETROGAS(apiData.dataTabla.filter((registro) => registro.idGrupoCliente === "METROGAS S.A."));
    
              if (user && user.idGrupoCliente === null){
                setDatosTabla(dataTabla);
              }
              else if (user && user.idGrupoCliente === 1){
                setDatosTabla(dataTablaEDESUR);
              }
              else if (user && user.idGrupoCliente === 4){
                setDatosTabla(dataTablaMETROGAS);
              }
              else {
                setDatosTabla([]);
              }
    
            }
          })
          .catch((error) => {});
      }, []);

      useEffect(() => {
        if(primerFetch){
            fetch(`${API_BACK}/api/nroCliente`, { mode: 'cors' })
            .then(response => response.json())
            .then(apiData => {
                if (apiData.dataDropDwn) {
                setDataDropDwn(apiData.dataDropDwn);
                }
            })
            .catch(error => { });
        }
    }, [primerFetch]);

    return (
        <SoftBox display="flex" flexDirection="column" alignItems="center">
            <SoftBox width="100%">
                <ResponsiveAppBar />
            </SoftBox>

            <Card style={{ marginTop: '7rem', width: '80%' }}>
                <SoftBox p={3}>
                    <SoftTypography variant="h3">Filtros</SoftTypography>
                    <Divider />
                    
                    <SoftBox display="flex" justifyContent= "space-between"  alignItems="center">
                        <SoftBox mt={2}>
                            <SoftTypography>N° de Cliente</SoftTypography>
                            <Controller
                                name="numCliente"
                                control={control}
                                render={({ field }) => (
                                    <DropdownList
                                        width="36vw !important"
                                        list={dataDropDwn}
                                        placeholder="Seleccione numero de cliente"
                                        campoAMostrar="nroCliente"
                                        campoID="nroCliente"
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
            
            <SoftBox py={3} style={{width: '80%' }} justifyContent="center">
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

export default FechaCliente;
