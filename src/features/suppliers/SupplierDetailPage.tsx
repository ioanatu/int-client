import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Divider from '@mui/material/Divider';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { getErrorMessage, getErrorStatus } from '../../api/errors';
import { useGetSupplierQuery } from '../../api/suppliersApi';
import { ErrorState, LoadingState } from '../../components/QueryStates';
import { AssessmentStatusChip, RiskLabel, RelationshipStatusLabel } from '../../components/Labels';
import { formatCurrency, formatDate, formatDateTime, formatNumber } from '../../utils/format';

const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <Box>
    <Typography variant="caption" color="text.secondary" component="dt">
      {label}
    </Typography>
    <Typography component="dd" sx={{ m: 0 }}>
      {children}
    </Typography>
  </Box>
);

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <Card>
    <CardContent>
      <Typography variant="h2" gutterBottom>
        {title}
      </Typography>
      <Divider sx={{ mb: 2 }} />
      <Box
        component="dl"
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
          gap: 2,
          m: 0,
        }}
      >
        {children}
      </Box>
    </CardContent>
  </Card>
);

export const SupplierDetailPage = () => {
  const { supplierId = '' } = useParams<{ supplierId: string }>();
  const {
    data: supplier,
    error,
    isLoading,
    refetch,
  } = useGetSupplierQuery(supplierId, {
    skip: !supplierId,
  });

  const backButton = (
    <Button component={RouterLink} to="/suppliers" startIcon={<ArrowBackIcon />} sx={{ mb: 2 }}>
      Back to suppliers
    </Button>
  );

  if (isLoading) {
    return (
      <Box>
        {backButton}
        <LoadingState label="Loading supplier…" />
      </Box>
    );
  }

  if (error || !supplier) {
    const notFound = getErrorStatus(error) === 404;
    return (
      <Box>
        {backButton}
        <ErrorState
          title={notFound ? 'Supplier not found' : 'Could not load supplier'}
          message={
            notFound ? `No supplier exists with id “${supplierId}”.` : getErrorMessage(error)
          }
          onRetry={notFound ? undefined : () => void refetch()}
        />
      </Box>
    );
  }

  const { identity, address, contact, company, relationship, risk, assessment, documents } =
    supplier;

  return (
    <Box>
      {backButton}

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ alignItems: { sm: 'center' }, mb: 3 }}
      >
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h1">{identity.name}</Typography>
          <Typography color="text.secondary" sx={{ fontFamily: 'monospace' }}>
            {supplier.id}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <RelationshipStatusLabel status={relationship.status} />
          <RiskLabel level={risk.level} score={risk.score} />
        </Stack>
      </Stack>

      <Stack spacing={3}>
        <Section title="Identity">
          <Field label="Legal name">{identity.legalName}</Field>
          <Field label="Industry">{company.industry}</Field>
          <Field label="VAT number">{identity.identifiers.vatNumber}</Field>
          <Field label="LEI">{identity.identifiers.lei}</Field>
          <Field label="DUNS">{identity.identifiers.duns}</Field>
          <Field label="Employees">{formatNumber(company.employeeCount)}</Field>
          <Field label="Founded">{company.foundedYear}</Field>
        </Section>

        <Section title="Contact">
          <Field label="Address">
            {address.street}, {address.postalCode} {address.city}, {address.country.name} (
            {address.country.code})
          </Field>
          <Field label="Email">
            <Link href={`mailto:${contact.email}`}>{contact.email}</Link>
          </Field>
          <Field label="Phone">
            <Link href={`tel:${contact.phone.replaceAll(' ', '')}`}>{contact.phone}</Link>
          </Field>
          <Field label="Website">
            <Link href={contact.website} target="_blank" rel="noopener noreferrer">
              {contact.website}
            </Link>
          </Field>
        </Section>

        <Section title="Relationship">
          <Field label="Status">
            <RelationshipStatusLabel status={relationship.status} />
          </Field>
          <Field label="Tier">{relationship.tier}</Field>
          <Field label="Supplier since">{formatDate(relationship.since)}</Field>
          <Field label="Procurement category">{relationship.procurement.category}</Field>
          <Field label="Annual spend">
            {formatCurrency(
              relationship.procurement.annualSpend.amount,
              relationship.procurement.annualSpend.currency,
            )}
          </Field>
        </Section>

        <Section title="Risk & assessment">
          <Field label="Risk">
            <RiskLabel level={risk.level} score={risk.score} />
          </Field>
          <Field label="Risk last calculated">{formatDateTime(risk.lastCalculatedAt)}</Field>
          <Field label="Assessment status">
            <AssessmentStatusChip status={assessment.status} />
          </Field>
          <Field label="Assessment score">{formatNumber(assessment.score)}</Field>
          <Field label="Last completed">{formatDateTime(assessment.lastCompletedAt)}</Field>
          <Field label="Expires">{formatDateTime(assessment.expiresAt)}</Field>
        </Section>

        <Section title="Documents">
          <Field label="Total">{formatNumber(documents.total)}</Field>
          <Field label="Valid">{formatNumber(documents.valid)}</Field>
          <Field label="Expiring soon">{formatNumber(documents.expiringSoon)}</Field>
          <Field label="Expired">{formatNumber(documents.expired)}</Field>
        </Section>

        <Typography variant="caption" color="text.secondary">
          Created {formatDateTime(supplier.createdAt)} · Updated{' '}
          {formatDateTime(supplier.updatedAt)}
        </Typography>
      </Stack>
    </Box>
  );
};
