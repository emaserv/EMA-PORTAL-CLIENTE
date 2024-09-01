import React, { useState, useEffect } from "react";
import SoftBox from "components/SoftBox";
import ResponsiveAppBar from "layouts/home/components/responsiveAppBar";
import { Card, Divider } from "@mui/material";
import SoftTypography from "components/SoftTypography";
import DatePickerValue from "components/DatePicker";
import DropdownList from "components/DropdownList";
import { useForm, Controller } from "react-hook-form";
import { API_BACK } from "../../config";

const RadioCliente = () => {
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
                    <SoftTypography>Plan</SoftTypography>
                    
                </SoftBox>

                <SoftBox mt={2}>
                    <SoftTypography>Radio</SoftTypography>
                    
                </SoftBox>

                <SoftBox mt={2}>
                    <SoftTypography>Sucursal</SoftTypography>
                    
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

    <Card style={{ marginTop: '1rem', width: '80%' }}>
        <SoftBox p={3}>
            <SoftTypography variant="h3">Filtros</SoftTypography>
            <Divider />
            
            <SoftBox display="flex" justifyContent= "space-between"  alignItems="center">
                <SoftBox mt={2}>
                    <SoftTypography>Plan</SoftTypography>
                    
                </SoftBox>

                <SoftBox mt={2}>
                    <SoftTypography>Radio</SoftTypography>
                    
                </SoftBox>

                <SoftBox mt={2}>
                    <SoftTypography>Sucursal</SoftTypography>
                    
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
    
</SoftBox>
  )
};


export default RadioCliente;