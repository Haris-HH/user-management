// Material UI
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Skeleton from "@mui/material/Skeleton";

type Props = {
  headerColumn: number;
  row?: number;
}

const TableSkeleton = ({
  headerColumn,
  row = 10
}: Props) => {
  return (
    Array.from({ length: row }).map((_, rowIndex) => (
      <TableRow 
        key={rowIndex}
        sx={{
          "& .MuiTableCell-root": {
            borderBottom: "1px solid var(--primary-color)",
          }
        }}
      >
        {Array.from({ length: headerColumn }).map((_, columnIndex) => (
          <TableCell key={`column-${rowIndex}-${columnIndex}`}>
            <Skeleton
              animation="wave"
              height={30}
              sx={{ backgroundColor: "rgba(var(--secondary-color-rgb), 0.5)" }}
            />
          </TableCell>
        ))}
      </TableRow>
    ))
  )
};

export default TableSkeleton;