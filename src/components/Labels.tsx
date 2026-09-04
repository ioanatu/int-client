import type { AssessmentStatus, RelationshipStatus, RiskLevel } from '../api/types';
import { humanizeEnum } from '../utils/format';
import { Chip } from '@ioanatu/component-library';

type ChipVariant = 'primary' | 'success' | 'secondary' | 'danger' | 'accent';

const RELATIONSHIP_COLORS: Record<RelationshipStatus, ChipVariant> = {
  active: 'accent',
  onboarding: 'success',
  inactive: 'secondary',
  offboarded: 'primary',
};

const RISK_COLORS: Record<RiskLevel, ChipVariant> = {
  low: 'success',
  medium: 'secondary',
  high: 'danger',
};

const ASSESSMENT_COLORS: Record<AssessmentStatus, ChipVariant> = {
  completed: 'success',
  in_progress: 'secondary',
  not_started: 'primary',
  expired: 'danger',
};

export const RelationshipStatusLabel = ({ status }: { status: RelationshipStatus }) => (
  <Chip label={humanizeEnum(status)} variant={RELATIONSHIP_COLORS[status]} />
);

export const RiskLabel = ({ level, score }: { level: RiskLevel; score?: number }) => (
  <Chip
    variant={RISK_COLORS[level]}
    label={score === undefined ? humanizeEnum(level) : `${humanizeEnum(level)} · ${score}`}
  />
);

export const AssessmentStatusChip = ({ status }: { status: AssessmentStatus }) => (
  <Chip label={humanizeEnum(status)} variant={ASSESSMENT_COLORS[status]} />
);
