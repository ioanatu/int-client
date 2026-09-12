import { Button } from '@ioanatu/component-library';
import { Chip } from '@ioanatu/component-library';
import SearchIcon from '@mui/icons-material/Search';
import Box from '@mui/material/Box';
import Checkbox from '@mui/material/Checkbox';
import CircularProgress from '@mui/material/CircularProgress';
import FormControl from '@mui/material/FormControl';
import InputAdornment from '@mui/material/InputAdornment';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import OutlinedInput from '@mui/material/OutlinedInput';
import Select, { type SelectChangeEvent } from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { type ReactNode, useEffect, useState } from 'react';
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

const selectProps = { size: 'small', select: true, sx: { minWidth: 170 } } as const;

type FilterChangeHandler = (key: keyof ListSuppliersQuery, value: FilterValueType) => void;

const FilterChips = ({ children }: { children: ReactNode }) => (
  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>{children}</Box>
);

const FilterChip = ({
  label,
  onDelete,
  variant,
}: {
  label: string;
  onDelete: () => void;
  variant: 'default' | 'success' | 'warning' | 'error' | 'info' | undefined;
}) => (
  <Chip
    label={label}
    size="sm"
    onDelete={onDelete}
    onMouseDown={(event) => event.stopPropagation()}
    variant={variant}
    // deleteIcon={<RemoveFilterIcon label={`Remove ${label}`} />}
  />
);

interface EnumFilterProps {
  label: string;
  filterKey: keyof ListSuppliersQuery;
  value: string;
  options: readonly string[];
  onFilterChange: FilterChangeHandler;
}

const EnumFilter = ({ label, filterKey, value, options, onFilterChange }: EnumFilterProps) => (
  <TextField
    {...selectProps}
    label={label}
    value={value}
    onChange={(event) => onFilterChange(filterKey, event.target.value || undefined)}
    slotProps={{
      select: {
        renderValue: (selected) => (
          <FilterChips>
            <FilterChip
              label={humanizeEnum(String(selected))}
              onDelete={() => onFilterChange(filterKey, undefined)}
              variant="info"
            />
          </FilterChips>
        ),
      },
    }}
  >
    {options.map((option) => (
      <MenuItem key={option} value={option}>
        {humanizeEnum(option)}
      </MenuItem>
    ))}
  </TextField>
);

interface SupplierFiltersProps {
  query: ListSuppliersQuery;
  onFilterChange: FilterChangeHandler;
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

  const handleIndustryMenuOpen = () => {
    setIsIndustryMenuOpened(true);
    if (industriesError) refetchIndustries();
  };

  const handleCountryMenuOpen = () => {
    setCountriesMenuOpened(true);
    if (countriesError) refetchCountries();
  };

  const industries = industryList?.data ?? [];
  const selectedIndustry = query.industry ?? '';
  const isIndustryQueryWrong =
    selectedIndustry !== '' && !industries.some(({ id }) => id === selectedIndustry);

  const renderIndustryValue = (value: unknown) => {
    const name = industries.find(({ id }) => id === value)?.name ?? String(value);

    return (
      <FilterChips>
        <FilterChip
          label={name}
          onDelete={() => onFilterChange('industry', undefined)}
          variant="success"
        />
      </FilterChips>
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
    <FilterChips>
      {selected.map((code) => (
        <FilterChip
          key={code}
          label={countryName(code)}
          onDelete={handleDeleteCountry(code)}
          variant="default"
        />
      ))}
    </FilterChips>
  );

  const handleCountryChange = (event: SelectChangeEvent<string[]>) => {
    const { value } = event.target;
    onFilterChange('country', typeof value === 'string' ? value.split(',') : value);
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
          onOpen={handleCountryMenuOpen}
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
            onOpen: handleIndustryMenuOpen,
            onClose: () => setIsIndustryMenuOpened(false),
            renderValue: renderIndustryValue,
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

      <EnumFilter
        label="Status"
        filterKey="status"
        value={query.status ?? ''}
        options={RELATIONSHIP_STATUSES}
        onFilterChange={onFilterChange}
      />

      <EnumFilter
        label="Risk level"
        filterKey="riskLevel"
        value={query.riskLevel ?? ''}
        options={RISK_LEVELS}
        onFilterChange={onFilterChange}
      />

      <EnumFilter
        label="Assessment"
        filterKey="assessmentStatus"
        value={query.assessmentStatus ?? ''}
        options={ASSESSMENT_STATUSES}
        onFilterChange={onFilterChange}
      />

      <Button label="Clear filters" onClick={onClear} size="sm" disabled={!hasFilters} />
    </Box>
  );
};
