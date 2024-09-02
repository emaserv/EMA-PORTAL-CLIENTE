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

const FechaCliente = () => {

    const [multiplesClientes, setMultiplesClientes] = useState([]);
    const [primerFetch, setPrimerFetchCompletado] = useState(false);
    const { handleSubmit, control } = useForm();
    const [dataDropDwn, setDataDropDwn] = useState([]);
    const [dataTabla, setDataTabla] = useState([]);
    const [columns, setColumns] = useState([]);

      useEffect(() => {
          fetch(`${API_BACK}/api/fechaCliente`, { mode: 'cors' })
            .then(response => response.json())
            .then(apiData => {
              if (apiData.dataTabla && apiData.columns) {
                setDataTabla(apiData.dataTabla);
                setColumns(apiData.columns);
                setPrimerFetchCompletado(true);
              }
            })
            .catch(error => { });
        
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
