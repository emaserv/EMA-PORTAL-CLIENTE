import React from "react";
import { DateCalendar, PickersDay } from "@mui/x-date-pickers";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

const markedDates = ["2024-03-15", "2024-03-20", "2024-03-25"]; // Fechas a marcar

const CustomDay = (props) => {
  const { day, outsideCurrentMonth, ...other } = props;
  const formattedDate = day.format("YYYY-MM-DD");

  return (
    <PickersDay
      {...other}
      outsideCurrentMonth={outsideCurrentMonth}
      day={day}
      sx={{
        position: "relative",
        "&::after": markedDates.includes(formattedDate)
          ? {
              content: '""',
              width: 5,
              height: 5,
              backgroundColor: "red",
              borderRadius: "50%",
              position: "absolute",
              bottom: 2, // Puedes cambiar esto a "top" para moverlo arriba
              left: "50%",
              transform: "translateX(-50%)",
            }
          : undefined,
      }}
    />
  );
};

export default function CustomDatePicker() {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <DateCalendar
        renderDay={(day, _, pickersDayProps) => (
          <CustomDay {...pickersDayProps} day={day} />
        )}
      />
    </LocalizationProvider>
  );
}
