import { Button } from '@ioanatu/component-library';
import SearchIcon from '@mui/icons-material/Search';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useEffect, useState } from 'react';
import { getErrorMessage } from '../../api/errors';
import { useListIndustriesQuery } from '../../api/suppliersApi';
import {
  ASSESSMENT_STATUSES,
  type ListSuppliersQuery,
  RELATIONSHIP_STATUSES,
  RISK_LEVELS,
  type Search,
} from '../../api/types';
import { formatNumber, humanizeEnum } from '../../utils/format';

const SEARCH_DEBOUNCE_MS = 300;

interface SupplierFiltersProps {
  query: ListSuppliersQuery;
  onFilterChange: (key: keyof ListSuppliersQuery, value: string | undefined) => void;
  onClear: () => void;
  hasFilters: boolean;
}

const selectProps = { size: 'small', select: true, sx: { minWidth: 170 } } as const;

export const SupplierFilters = ({
  query,
  onFilterChange,
  onClear,
  hasFilters,
}: SupplierFiltersProps) => {
  const [search, setSearch] = useState<Search>(query.search ?? '');
  const [lastAppliedSearch, setLastAppliedSearch] = useState<Search>(query.search);
  const [isIndustryMenuOpened, setIsIndustryMenuOpened] = useState<boolean>(false);

  if (query.search !== lastAppliedSearch) {
    setLastAppliedSearch(query.search);
    setSearch(query.search ?? '');
  }

  useEffect(() => {
    if (search === (query.search ?? '') || search === undefined) return;

    const timer = setTimeout(
      () => onFilterChange('search', search.trim() || undefined),
      SEARCH_DEBOUNCE_MS,
    );
    return () => clearTimeout(timer);
  }, [search, query.search, onFilterChange]);

  const {
    data: industryList,
    isFetching: isLoadingIndustries,
    error: industriesError,
    refetch: refetchIndustries,
  } = useListIndustriesQuery(undefined, {
    skip: !isIndustryMenuOpened && !query.industry,
  });

  const handleIndustryMenuOpen = () => {
    setIsIndustryMenuOpened(true);
    if (industriesError) refetchIndustries();
  };

  const industries = industryList?.data ?? [];
  const selectedIndustry = query.industry ?? '';
  const isIndustryQueryWrong =
    selectedIndustry !== '' && !industries.some(({ id }) => id === selectedIndustry);

  const renderIndustryValue = (value: unknown): string =>
    industries.find(({ id }) => id === value)?.name ?? String(value);

  return (
    <Box
      component="section"
      aria-label="Supplier filters"
      sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}
    >
      <TextField
        size="small"
        label="Search"
        placeholder="Name or id"
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
        label="Industry"
        value={!isIndustryQueryWrong ? selectedIndustry : ''}
        onChange={(event) => onFilterChange('industry', event.target.value || undefined)}
        slotProps={{
          select: { onOpen: handleIndustryMenuOpen, renderValue: renderIndustryValue },
        }}
      >
        {isLoadingIndustries && (
          <MenuItem disabled>
            <CircularProgress size={16} sx={{ mr: 1 }} aria-hidden />
            Loading industries…
          </MenuItem>
        )}

        {industriesError && (
          <MenuItem disabled sx={{ display: 'block', whiteSpace: 'normal', maxWidth: 280 }}>
            <Typography variant="body2">{getErrorMessage(industriesError)}</Typography>
            <Typography variant="caption" color="text.secondary">
              Close and reopen to try again.
            </Typography>
          </MenuItem>
        )}

        {industries.map((industry) => (
          <MenuItem key={industry.id} value={industry.id}>
            {industry.name}
            <Typography
              component="span"
              variant="caption"
              color="text.secondary"
              sx={{ ml: 'auto', pl: 2 }}
            >
              {formatNumber(industry.supplierCount)}
            </Typography>
          </MenuItem>
        ))}
      </TextField>

      <TextField
        {...selectProps}
        label="Status"
        value={query.status ?? ''}
        onChange={(event) => onFilterChange('status', event.target.value || undefined)}
      >
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
        {ASSESSMENT_STATUSES.map((status) => (
          <MenuItem key={status} value={status}>
            {humanizeEnum(status)}
          </MenuItem>
        ))}
      </TextField>

      <Button label="Clear filters" onClick={onClear} size="sm" disabled={!hasFilters} />
    </Box>
  );
};
