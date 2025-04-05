export const formatDateTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const formatDateRange = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (start.toDateString() === end.toDateString()) {
    return `${start.toLocaleDateString("id-ID")} ${start.toLocaleTimeString(
      "id-ID",
      { hour: "2-digit", minute: "2-digit" }
    )} - ${end.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  }

  return `${formatDateTime(start)} - ${formatDateTime(end)}`;
};
