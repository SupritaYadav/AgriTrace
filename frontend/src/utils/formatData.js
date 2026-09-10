export const formatDate = (
  date,
  options = {}
) => {
  if (!date) return "-";

  const parsedDate =
    date instanceof Date
      ? date
      : new Date(date);

  if (
    Number.isNaN(
      parsedDate.getTime()
    )
  ) {
    return "-";
  }

  const defaultOptions = {
    day: "2-digit",
    month: "short",
    year: "numeric",
  };

  return parsedDate.toLocaleDateString(
    "en-IN",
    {
      ...defaultOptions,
      ...options,
    }
  );
};


export const formatDateTime = (
  date
) => {
  if (!date) return "-";

  const parsedDate =
    new Date(date);

  if (
    Number.isNaN(
      parsedDate.getTime()
    )
  ) {
    return "-";
  }

  return parsedDate.toLocaleString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",

      hour: "2-digit",
      minute: "2-digit",

      hour12: true,
    }
  );
};


export const formatTime = (
  date
) => {
  if (!date) return "-";

  const parsedDate =
    new Date(date);

  if (
    Number.isNaN(
      parsedDate.getTime()
    )
  ) {
    return "-";
  }

  return parsedDate.toLocaleTimeString(
    "en-IN",
    {
      hour: "2-digit",
      minute: "2-digit",

      hour12: true,
    }
  );
};


export const formatRelativeTime = (
  date
) => {
  if (!date) return "-";

  const parsedDate =
    new Date(date);

  const now =
    new Date();

  const difference =
    now.getTime() -
    parsedDate.getTime();

  const seconds =
    Math.floor(
      difference / 1000
    );

  const minutes =
    Math.floor(
      seconds / 60
    );

  const hours =
    Math.floor(
      minutes / 60
    );

  const days =
    Math.floor(
      hours / 24
    );

  if (seconds < 60) {
    return "Just now";
  }

  if (minutes < 60) {
    return `${minutes} min ago`;
  }

  if (hours < 24) {
    return `${hours} hr ago`;
  }

  if (days === 1) {
    return "Yesterday";
  }

  if (days < 7) {
    return `${days} days ago`;
  }

  return formatDate(parsedDate);
};


export default formatDate;