import Chip from '@mui/material/Chip';
import type { AssessmentStatus, RelationshipStatus, RiskLevel } from '../api/types';
import { humanizeEnum } from '../utils/format';

type ChipColor = 'default' | 'success' | 'warning' | 'error' | 'info';

const RELATIONSHIP_COLORS: Record<RelationshipStatus, ChipColor> = {
  active: 'success',
  onboarding: 'info',
  inactive: 'default',
  offboarded: 'default',
};

const RISK_COLORS: Record<RiskLevel, ChipColor> = {
  low: 'success',
  medium: 'warning',
  high: 'error',
};

const ASSESSMENT_COLORS: Record<AssessmentStatus, ChipColor> = {
  completed: 'success',
  in_progress: 'info',
  not_started: 'default',
  expired: 'error',
};

export const RelationshipStatusChip = ({ status }: { status: RelationshipStatus }) => (
  <Chip size="small" label={humanizeEnum(status)} color={RELATIONSHIP_COLORS[status]} />
);

export const RiskChip = ({ level, score }: { level: RiskLevel; score?: number }) => (
  <Chip
    size="small"
    variant="outlined"
    color={RISK_COLORS[level]}
    label={score === undefined ? humanizeEnum(level) : `${humanizeEnum(level)} · ${score}`}
  />
);

export const AssessmentStatusChip = ({ status }: { status: AssessmentStatus }) => (
  <Chip size="small" label={humanizeEnum(status)} color={ASSESSMENT_COLORS[status]} />
);
