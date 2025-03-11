import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Checkbox,
  LinearProgress,
  Typography,
  Box,
  Toolbar,
  alpha,
  IconButton,
  Tooltip,
} from "@mui/material";
import { useState } from "react";
import DeleteIcon from "@mui/icons-material/Delete";
import FilterListIcon from "@mui/icons-material/FilterList";

export interface Column<T> {
  id: string;
  label: string;
  minWidth?: number;
  align?: "right" | "left" | "center";
  format?: (value: any) => React.ReactNode;
  getValue: (row: T) => any;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  loading?: boolean;
  getRowId: (row: T) => string;
  title?: string;
  toolbarActions?: React.ReactNode;
  selectable?: boolean;
  onBulkDelete?: (selectedIds: string[]) => void;
  onBulkAction?: (selectedIds: string[], action: string) => void;
  bulkActions?: Array<{ label: string; action: string }>;
  dense?: boolean;
}

export function DataTable<T>({
  columns,
  rows,
  loading,
  getRowId,
  title,
  toolbarActions,
  selectable = true,
  onBulkDelete,
  onBulkAction,
  bulkActions = [],
  dense = true,
}: DataTableProps<T>) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [selected, setSelected] = useState<string[]>([]);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const newSelected = rows.map((row) => getRowId(row));
      setSelected(newSelected);
      return;
    }
    setSelected([]);
  };

  const handleClick = (id: string) => {
    const selectedIndex = selected.indexOf(id);
    let newSelected: string[] = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1)
      );
    }

    setSelected(newSelected);
  };

  const isSelected = (id: string) => selected.indexOf(id) !== -1;

  return (
    <Paper
      sx={{
        width: "100%",
        mb: 2,
        borderRadius: 1,
        overflow: "hidden",
        boxShadow: (theme) => theme.shadows[2],
      }}
    >
      {(selected.length > 0 || title) && (
        <Toolbar
          sx={{
            pl: { sm: 2 },
            pr: { xs: 1, sm: 1 },
            borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
            ...(selected.length > 0 && {
              bgcolor: (theme) =>
                alpha(
                  theme.palette.primary.main,
                  theme.palette.action.activatedOpacity
                ),
            }),
          }}
        >
          {selected.length > 0 ? (
            <Typography
              sx={{ flex: "1 1 100%" }}
              color="inherit"
              variant="subtitle1"
              component="div"
            >
              {selected.length} selected
            </Typography>
          ) : (
            <Typography
              sx={{ flex: "1 1 100%" }}
              variant="h6"
              id="tableTitle"
              component="div"
            >
              {title}
            </Typography>
          )}

          {selected.length > 0 ? (
            <Box sx={{ display: "flex", gap: 1 }}>
              {bulkActions.map((action) => (
                <Tooltip key={action.action} title={action.label}>
                  <IconButton
                    onClick={() => {
                      onBulkAction?.(selected, action.action);
                      setSelected([]);
                    }}
                    size="small"
                  >
                    <FilterListIcon />
                  </IconButton>
                </Tooltip>
              ))}
              {onBulkDelete && (
                <Tooltip title="Delete selected">
                  <IconButton
                    onClick={() => {
                      onBulkDelete(selected);
                      setSelected([]);
                    }}
                    size="small"
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          ) : (
            toolbarActions
          )}
        </Toolbar>
      )}

      {loading && (
        <Box sx={{ width: "100%", height: 4 }}>
          <LinearProgress />
        </Box>
      )}

      <TableContainer>
        <Table
          stickyHeader
          size={dense ? "small" : "medium"}
          sx={{
            "& .MuiTableRow-root:hover": {
              backgroundColor: (theme) =>
                alpha(theme.palette.primary.main, 0.04),
            },
          }}
        >
          <TableHead>
            <TableRow>
              {selectable && (
                <TableCell
                  padding="checkbox"
                  sx={{
                    bgcolor: (theme) => theme.palette.background.paper,
                  }}
                >
                  <Checkbox
                    color="primary"
                    indeterminate={
                      selected.length > 0 && selected.length < rows.length
                    }
                    checked={rows.length > 0 && selected.length === rows.length}
                    onChange={handleSelectAllClick}
                    size="small"
                  />
                </TableCell>
              )}
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  align={column.align}
                  style={{ minWidth: column.minWidth }}
                  sx={{
                    bgcolor: (theme) => theme.palette.background.paper,
                    fontWeight: 600,
                  }}
                >
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((row) => {
                const id = getRowId(row);
                const isItemSelected = isSelected(id);

                return (
                  <TableRow
                    hover
                    role="checkbox"
                    tabIndex={-1}
                    key={id}
                    selected={isItemSelected}
                    sx={{ cursor: "pointer" }}
                  >
                    {selectable && (
                      <TableCell padding="checkbox">
                        <Checkbox
                          color="primary"
                          checked={isItemSelected}
                          onChange={() => handleClick(id)}
                          size="small"
                        />
                      </TableCell>
                    )}
                    {columns.map((column) => {
                      const value = column.getValue(row);
                      return (
                        <TableCell key={column.id} align={column.align}>
                          {column.format ? column.format(value) : value}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })}
            {rows.length === 0 && !loading && (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  align="center"
                  sx={{ py: 8 }}
                >
                  <Typography color="text.secondary">
                    No data available
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[10, 25, 50, 100]}
        component="div"
        count={rows.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Paper>
  );
}
