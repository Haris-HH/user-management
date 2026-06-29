import { useEffect } from "react";

const usePageTitle = (title: string) => {
  useEffect(() => {
    document.title = `${title} | NSB User Management`;
  }, [title]);
};

export default usePageTitle;