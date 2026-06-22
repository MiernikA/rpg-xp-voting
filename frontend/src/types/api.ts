export type Role = 'admin' | 'player';
export type SessionStatus = 'draft' | 'active' | 'closed';

export interface Player {
  id: number;
  username: string;
  display_name: string;
  email: string | null;
  avatar_url: string | null;
  profile_color: string;
  theme_primary: string;
  theme_secondary: string;
  theme_background: string;
  theme_paper: string;
  role: Role;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PlayerCreate {
  username: string;
  display_name: string;
  email?: string;
  password: string;
  avatar_url?: string;
  profile_color?: string;
  theme_primary?: string;
  theme_secondary?: string;
  theme_background?: string;
  theme_paper?: string;
  role: Role;
}

export interface VotingSession {
  id: number;
  title: string;
  description: string | null;
  group_id: number | null;
  group_name: string | null;
  participant_ids: number[];
  points_pool: number;
  anonymous_mode: boolean;
  results_published: boolean;
  results_archived: boolean;
  xp_per_point: number;
  status: SessionStatus;
  created_at: string;
  activated_at: string | null;
  closed_at: string | null;
}

export interface VotingSessionCreate {
  title: string;
  description?: string;
  group_id: number;
  participant_ids: number[];
  points_pool: number;
}

export interface Group {
  id: number;
  name: string;
  description: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
  members: Player[];
}

export interface GroupCreate {
  name: string;
  description?: string | null;
  image_url?: string | null;
  member_ids: number[];
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: 'bearer';
  user: Player;
}

export interface VoteLine {
  recipient_id: number;
  points: number;
  justification: string;
}

export interface VoteSubmission {
  votes: VoteLine[];
  gm_note?: string;
}

export interface SessionProgress {
  session_id: number;
  total_players: number;
  submitted_votes: number;
  pending_votes: number;
  completion_percentage: number;
}

export interface ResultRow {
  player_id: number;
  player: string;
  username: string;
  avatar_url: string | null;
  profile_color: string;
  total_points: number;
  average_points: number;
  number_of_voters: number;
  percentage_of_points: number;
  xp_awarded: number;
  comments: ResultComment[];
  gm_notes: ResultComment[];
}

export interface PublishedSessionResults {
  session_id: number;
  session_title: string;
  group_name: string | null;
  results: ResultRow[];
}

export interface ResultComment {
  author: string | null;
  text: string;
}

export interface CommentRead {
  session_id: number;
  session_title: string;
  recipient_id: number;
  recipient: string;
  voter: string | null;
  points: number;
  justification: string;
  gm_note: string;
}

export interface GMSessionVoteLine {
  id: number;
  voter_id: number;
  voter: string;
  recipient_id: number;
  recipient: string;
  points: number;
  justification: string;
  gm_note: string;
}

export interface GMSessionView {
  session_id: number;
  session_title: string;
  group_name: string | null;
  total_points: number;
  votes: GMSessionVoteLine[];
}

export interface DashboardStats {
  active_session_id: number | null;
  active_session_title: string | null;
  total_players: number;
  submitted_votes: number;
  pending_players: number;
  total_sessions: number;
  total_votes: number;
}

export interface ChartPoint {
  label: string;
  value: number;
}

export interface Statistics {
  votes_over_time: ChartPoint[];
  participation_rate: ChartPoint[];
  player_rankings: ChartPoint[];
  average_points_by_session: ChartPoint[];
}

export interface MySessionPoints {
  session_id: number;
  session_title: string;
  group_name: string | null;
  points_received: number;
  max_points_available: number;
  comments: string[];
}

export interface MyInfo {
  user: Player;
  groups: Group[];
  history: MySessionPoints[];
}
