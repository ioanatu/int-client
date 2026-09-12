import { Button } from '@ioanatu/component-library';
import CancelIcon from '@mui/icons-material/Cancel';
import SearchIcon from '@mui/icons-material/Search';
import Box from '@mui/material/Box';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import FormControl from '@mui/material/FormControl';
import InputAdornment from '@mui/material/InputAdornment';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import OutlinedInput from '@mui/material/OutlinedInput';
import Select, { type SelectChangeEvent } from '@mui/material/Select';
import type { SvgIconProps } from '@mui/material/SvgIcon';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useEffect, useState } from 'react';
import { getErrorMessage } from '../../api/errors';
import { useListCountriesQuery, useListIndustriesQuery } from '../../api/suppliersApi';
import {
  ASSESSMENT_STATUSES,
  type ListSuppliersQuery,
  RELATIONSHIP_STATUSES,
  RISK_LEVELS,
  type Search,
} from '../../api/types';
import { formatNumber, humanizeEnum } from '../../utils/format';
import type { FilterValueType } from './useSupplierListParams';

const SEARCH_DEBOUNCE_MS = 300;
/** Keeps a long country list scrollable instead of running off the viewport. */
const COUNTRY_MENU_PROPS = { slotProps: { paper: { sx: { maxHeight: 264, width: 240 } } } };

const RemoveFilterIcon = ({ label, ...iconProps }: SvgIconProps & { label: string }) => (
  <CancelIcon {...iconProps} aria-label={label} onMouseDown={(event) => event.stopPropagation()} />
);

const selectProps = { size: 'small', select: true, sx: { minWidth: 170 } } as const;

interface SupplierFiltersProps {
  query: ListSuppliersQuery;
  onFilterChange: (key: keyof ListSuppliersQuery, value: FilterValueType) => void;
  onClear: () => void;
  hasFilters: boolean;
}

export const SupplierFilters = ({
  query,
  onFilterChange,
  onClear,
  hasFilters,
}: SupplierFiltersProps) => {
  const [search, setSearch] = useState<Search>(query.search ?? '');
  const [lastAppliedSearch, setLastAppliedSearch] = useState<Search>(query.search);
  const [isIndustryMenuOpened, setIsIndustryMenuOpened] = useState<boolean>(false);
  const [countriesMenuOpened, setCountriesMenuOpened] = useState<boolean>(false);
  const [statusMenuOpened, setStatusMenuOpened] = useState<boolean>(false);

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
  } = useListIndustriesQuery(undefined, { skip: !isIndustryMenuOpened && !query.industry });

  const {
    data: countriesList,
    isFetching: isLoadingCountries,
    error: countriesError,
    refetch: refetchCountries,
  } = useListCountriesQuery(undefined, { skip: !countriesMenuOpened && !query.country });

  const handleMenuOpen = (filter: string) => () => {
    if (filter === 'Industry') {
      setIsIndustryMenuOpened(true);
      if (industriesError) refetchIndustries();
    }
    if (filter === 'Country') {
      setCountriesMenuOpened(true);
      if (countriesError) refetchCountries();
    }
  };

  const industries = industryList?.data ?? [];
  const selectedIndustry = query.industry ?? '';
  const isIndustryQueryWrong =
    selectedIndustry !== '' && !industries.some(({ id }) => id === selectedIndustry);

  const renderFilterValue = (value: unknown, filter: 'industry' | 'status') => {
    let name = '';
    if (filter === 'industry') {
      name = industries.find(({ id }) => id === value)?.name ?? String(value);
    }
    if (filter === 'status') {
      name = RELATIONSHIP_STATUSES.find((status) => status === value) ?? String(value);
    }
    return (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
        <Chip
          label={name}
          size="small"
          onDelete={() => onFilterChange(filter, undefined)}
          deleteIcon={<RemoveFilterIcon label={`Remove ${name}`} />}
        />
      </Box>
    );
  };

  const countries = countriesList?.data ?? [];
  const selectedCountries = query.country ?? [];
  const checked = new Set(selectedCountries);

  const countryName = (code: string) => countries.find(({ id }) => id === code)?.name ?? code;

  const handleDeleteCountry = (code: string) => () =>
    onFilterChange(
      'country',
      selectedCountries.filter((selected) => selected !== code),
    );

  const renderCountryValue = (selected: string[]) => (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
      {selected.map((code) => (
        <Chip
          key={code}
          label={countryName(code)}
          size="small"
          onDelete={handleDeleteCountry(code)}
          deleteIcon={<RemoveFilterIcon label={`Remove ${countryName(code)}`} />}
        />
      ))}
    </Box>
  );

  const handleCountryChange = (event: SelectChangeEvent<string[]>) => {
    const { value } = event.target;
    onFilterChange('country', typeof value === 'string' ? value.split(',') : value);
  };

  const handleCloseMenu = (filter: string) => () => {
    if (filter === 'industry') setIsIndustryMenuOpened(false);
    if (filter === 'status') setStatusMenuOpened(false);
  };

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

      <FormControl size="small" sx={{ minWidth: 220 }}>
        <InputLabel id="country-filter-label">Countries</InputLabel>
        <Select
          labelId="country-filter-label"
          multiple
          value={selectedCountries}
          onOpen={handleMenuOpen('Country')}
          onClose={() => setCountriesMenuOpened(false)}
          onChange={handleCountryChange}
          input={<OutlinedInput label="Countries" />}
          renderValue={renderCountryValue}
          MenuProps={COUNTRY_MENU_PROPS}
        >
          {isLoadingCountries && (
            <MenuItem disabled>
              <CircularProgress size={16} sx={{ mr: 1 }} aria-hidden />
              Loading countries…
            </MenuItem>
          )}

          {countriesError && (
            <MenuItem disabled sx={{ display: 'block', whiteSpace: 'normal', maxWidth: 280 }}>
              <Typography variant="body2">{getErrorMessage(countriesError)}</Typography>
              <Typography variant="caption" color="text.secondary">
                Close and reopen to try again.
              </Typography>
            </MenuItem>
          )}

          {countries.map((country) => (
            <MenuItem key={country.id} value={country.id}>
              <Checkbox size="small" checked={checked.has(country.id)} sx={{ mr: 1, p: 0.5 }} />
              {country.name}
              <Typography
                component="span"
                variant="caption"
                color="text.secondary"
                sx={{ ml: 'auto', pl: 2 }}
              >
                {formatNumber(country.supplierCount)}
              </Typography>
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <TextField
        {...selectProps}
        label="Industry"
        value={!isIndustryQueryWrong ? selectedIndustry : ''}
        onChange={(event) => onFilterChange('industry', event.target.value || undefined)}
        focused={isIndustryMenuOpened}
        slotProps={{
          select: {
            onOpen: handleMenuOpen('Industry'),
            renderValue: (value) => renderFilterValue(value, 'industry'),
            onClose: handleCloseMenu('industry'),
          },
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
        focused={statusMenuOpened}
        slotProps={{
          select: {
            renderValue: (value) => renderFilterValue(value, 'status'),
            onClose: handleCloseMenu('status'),
          },
        }}
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
