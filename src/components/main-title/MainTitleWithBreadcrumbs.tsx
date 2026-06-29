import { Link } from "react-router-dom";

// Material UI
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Box from "@mui/material/Box";

type BreadcrumbPath = {
  label: string;
  to?: string;
}

interface Props {
  header: BreadcrumbPath;
  breadcrumbPaths?: BreadcrumbPath[];
}

const MainTitleWithBreadcrumbs = ({ 
  header, 
  breadcrumbPaths = [] 
}: Props) => {
  return (
    <Box className="pt-1.5 pl-1">
      <Breadcrumbs
        sx={{
          "& .MuiBreadcrumbs-separator": {
            color: "var(--primary-color)",
            fontSize: "1.7rem",
          }
        }}
      >
        {header.to ? (
          <Link
            to={header.to}
            className={`text-[1.7rem] font-bold`}
            style={{
              color: breadcrumbPaths.length > 0 ? "var(--primary-color)" : "var(--secondary-color)"
            }}
          >
            {header.label}
          </Link>
        ) : (
          <span className="text-[1.7rem] font-bold text-(--primary-color)">
            {header.label}
          </span>
        )}
        {breadcrumbPaths &&
          breadcrumbPaths.length > 0 &&
          breadcrumbPaths.map((path, index) => (
            <Link
              className={`text-[1.7rem] font-bold`}
              key={index}
              to={path.to}
              style={{
                color: breadcrumbPaths.length > 0 ? "var(--secondary-color)" : "var(--primary-color)"
              }}
            >
              {path.label}
            </Link>
          ))}
      </Breadcrumbs>
    </Box>
  )
}

export default MainTitleWithBreadcrumbs;