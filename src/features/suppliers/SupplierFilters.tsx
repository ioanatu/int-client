import ClearIcon from '@mui/icons-material/Clear'
import SearchIcon from '@mui/icons-material/Search'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import InputAdornment from '@mui/material/InputAdornment'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import { useEffect, useState } from 'react'
import {
  ASSESSMENT_STATUSES,
  RELATIONSHIP_STATUSES,
  RISK_LEVELS,
  type ListSuppliersQuery,
} from '../../api/types'
import { humanizeEnum } from '../../utils/format'

const SEARCH_DEBOUNCE_MS = 300

interface SupplierFiltersProps {
  query: ListSuppliersQuery
  onFilterChange: (key: keyof ListSuppliersQuery, value: string | undefined) => void
  onClear: () => void
  hasFilters: boolean
}

const selectProps = { size: 'small', select: true, sx: { minWidth: 170 } } as const

export const SupplierFilters = ({
  query,
  onFilterChange,
  onClear,
  hasFilters,
}: SupplierFiltersProps) => {
  // The text field stays responsive while the debounced value drives the request.
  const [search, setSearch] = useState(query.search ?? '')
  const [lastAppliedSearch, setLastAppliedSearch] = useState(query.search)

  // Adjusting state during render (rather than in an effect) is React's recommended way to
  // resync with a changed prop — it keeps the input in step with back/forward navigation.
  if (query.search !== lastAppliedSearch) {
    setLastAppliedSearch(query.search)
    setSearch(query.search ?? '')
  }

  useEffect(() => {
    if (search === (query.search ?? '')) {
      return
    }
    const timer = setTimeout(() => onFilterChange('search', search.trim() || undefined), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [search, query.search, onFilterChange])

  return (
    <Box
      component="section"
      aria-label="Supplier filters"
      sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}
    >
      <TextField
        size="small"
        label="Search"
        placeholder="Name, id, industry or country"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        sx={{ minWidth: 260, flexGrow: 1 }}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          },
        }}
      />

      <TextField
        {...selectProps}
        label="Status"
        value={query.status ?? ''}
        onChange={(event) => onFilterChange('status', event.target.value || undefined)}
      >
        <MenuItem value="">All statuses</MenuItem>
        {RELATIONSHIP_STATUSES.map((status) => (
          <MenuItem key={status} value={status}>
            {humanizeEnum(status)}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        {...selectProps}
        label="Risk level"
        value={query.riskLevel ?? ''}
        onChange={(event) => onFilterChange('riskLevel', event.target.value || undefined)}
      >
        <MenuItem value="">All risk levels</MenuItem>
        {RISK_LEVELS.map((level) => (
          <MenuItem key={level} value={level}>
            {humanizeEnum(level)}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        {...selectProps}
        label="Assessment"
        value={query.assessmentStatus ?? ''}
        onChange={(event) => onFilterChange('assessmentStatus', event.target.value || undefined)}
      >
        <MenuItem value="">All assessments</MenuItem>
        {ASSESSMENT_STATUSES.map((status) => (
          <MenuItem key={status} value={status}>
            {humanizeEnum(status)}
          </MenuItem>
        ))}
      </TextField>

      <Button
        onClick={onClear}
        disabled={!hasFilters}
        startIcon={<ClearIcon />}
        sx={{ alignSelf: 'center' }}
      >
        Clear
      </Button>
    </Box>
  )
}
