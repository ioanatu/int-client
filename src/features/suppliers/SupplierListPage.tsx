import Box from '@mui/material/Box'
import Fade from '@mui/material/Fade'
import LinearProgress from '@mui/material/LinearProgress'
import Paper from '@mui/material/Paper'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TablePagination from '@mui/material/TablePagination'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import { useNavigate } from 'react-router-dom'
import { getErrorMessage } from '../../api/errors'
import { useListSuppliersQuery } from '../../api/suppliersApi'
import { EmptyState, ErrorState, LoadingState } from '../../components/QueryStates'
import { RelationshipStatusChip, RiskChip } from '../../components/StatusChips'
import { SupplierFilters } from './SupplierFilters'
import { PAGE_SIZE_OPTIONS, useSupplierListParams } from './useSupplierListParams'

export const SupplierListPage = () => {
  const navigate = useNavigate()
  const { query, setFilter, setPage, setLimit, clearFilters, hasFilters } = useSupplierListParams()

  const { data, error, isLoading, isFetching, refetch } = useListSuppliersQuery(query)

  const suppliers = data?.data ?? []
  const total = data?.pagination.total ?? 0

  return (
    <Box>
      <Typography variant="h1" gutterBottom>
        Suppliers
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Browse the supplier master data served by the IntNext API.
      </Typography>

      <SupplierFilters
        query={query}
        onFilterChange={setFilter}
        onClear={clearFilters}
        hasFilters={hasFilters}
      />

      {/* `isLoading` is only true without cached data; a refetch keeps the table on screen
          and reports itself through the thin progress bar instead. */}
      {isLoading ? <LoadingState label="Loading suppliers…" /> : null}

      {error ? (
        <ErrorState
          title="Could not load suppliers"
          message={getErrorMessage(error)}
          onRetry={() => void refetch()}
        />
      ) : null}

      {!isLoading && !error ? (
        <Paper variant="outlined">
          <Fade in={isFetching}>
            <LinearProgress aria-label="Refreshing suppliers" />
          </Fade>

          {suppliers.length === 0 ? (
            <EmptyState
              message={
                hasFilters
                  ? 'No suppliers match these filters.'
                  : 'The API returned no suppliers.'
              }
            />
          ) : (
            <TableContainer>
              <Table aria-label="Suppliers">
                <TableHead>
                  <TableRow>
                    <TableCell>Supplier</TableCell>
                    <TableCell>Id</TableCell>
                    <TableCell>Country</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Risk</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {suppliers.map((supplier) => (
                    <TableRow
                      key={supplier.id}
                      hover
                      tabIndex={0}
                      sx={{ cursor: 'pointer' }}
                      onClick={() => void navigate(`/suppliers/${supplier.id}`)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          void navigate(`/suppliers/${supplier.id}`)
                        }
                      }}
                    >
                      <TableCell>{supplier.name}</TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                          {supplier.id}
                        </Typography>
                      </TableCell>
                      <TableCell>{supplier.country}</TableCell>
                      <TableCell>
                        <RelationshipStatusChip status={supplier.status} />
                      </TableCell>
                      <TableCell>
                        <RiskChip level={supplier.risk.level} score={supplier.risk.score} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          <TablePagination
            component="div"
            count={total}
            // The API is 1-based, MUI is 0-based.
            page={Math.max((query.page ?? 1) - 1, 0)}
            onPageChange={(_event, page) => setPage(page + 1)}
            rowsPerPage={query.limit ?? PAGE_SIZE_OPTIONS[0]}
            rowsPerPageOptions={PAGE_SIZE_OPTIONS}
            onRowsPerPageChange={(event) => setLimit(Number(event.target.value))}
          />
        </Paper>
      ) : null}
    </Box>
  )
}
