import { Chip } from '@ioanatu/component-library';
import type { AssessmentStatus, RelationshipStatus, RiskLevel } from '../api/types';
import { humanizeEnum } from '../utils/format';

type ChipVariant = 'error' | 'default' | 'success' | 'info' | 'warning';

const RELATIONSHIP_COLORS: Record<RelationshipStatus, ChipVariant> = {
  active: 'default',
  onboarding: 'success',
  inactive: 'warning',
  offboarded: 'info',
};

const RISK_COLORS: Record<RiskLevel, ChipVariant> = {
  low: 'success',
  medium: 'info',
  high: 'error',
};

const ASSESSMENT_COLORS: Record<AssessmentStatus, ChipVariant> = {
  completed: 'success',
  in_progress: 'default',
  not_started: 'info',
  expired: 'error',
};

export const RelationshipStatusLabel = ({ status }: { status: RelationshipStatus }) => (
  <Chip label={humanizeEnum(status)} variant={RELATIONSHIP_COLORS[status]} fill="filled" />
);

export const RiskLabel = ({ level, score }: { level: RiskLevel; score?: number }) => (
  <Chip
    variant={RISK_COLORS[level]}
    label={score === undefined ? humanizeEnum(level) : `${humanizeEnum(level)} · ${score}`}
  />
);

export const AssessmentStatusChip = ({ status }: { status: AssessmentStatus }) => (
  <Chip label={humanizeEnum(status)} variant={ASSESSMENT_COLORS[status]} fill="filled" />
);
