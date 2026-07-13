/**
 * Semantic scene types - the canonical data contract shared by the static
 * (SSR) render and the A-05 reducer. Surfaces render from these shapes; the
 * reducer computes the same shapes. Neither hardcodes strings.
 *
 * Scene definitions extend the same semantic shapes with a deliberately small
 * action vocabulary. Definitions never contain selectors, callbacks, or GSAP
 * instructions; the pure reducer and browser player consume the same data.
 */

/** Ribbon icon → pane identity. Order is the ribbon/showcase order. */
export type PaneKey = "chat" | "org" | "todos" | "flows" | "triggers";

export type MessageRole = "user" | "assistant";

/** A run of message/chip text; `strong` marks the app's bold emphasis. */
export interface TextSegment {
  text: string;
  strong?: boolean;
}

/** A resolved chat message. `target` is the component-local scene target id. */
export interface ChatMessage {
  kind: "message";
  id: string;
  target: string;
  role: MessageRole;
  body: TextSegment[];
}

/** The three-dot typing indicator - transient; ships `hidden` at rest. */
export interface TypingIndicator {
  kind: "typing";
  target: string;
  hidden: boolean;
}

/** A delegation chip. `lead` is the literal leading glyph (↳). */
export interface DelegationChip {
  target: string;
  lead: string;
  body: TextSegment[];
}

/** A group of delegation chips rendered as one thread item. */
export interface ChipGroup {
  kind: "chips";
  id: string;
  chips: DelegationChip[];
}

export type ThreadItem = ChatMessage | TypingIndicator | ChipGroup;

/** The header pill identity with a concrete model label. */
export interface HeaderPill {
  name: string;
  meta: string;
  presence: "active" | "idle";
}

/** The resolved state of the chat surface. */
export interface ChatSceneState {
  /** Dashboard pane identity; `none` for standalone card surfaces. */
  pane: PaneKey | "none";
  pill: HeaderPill;
  thread: ThreadItem[];
  composerPlaceholder: string;
  /** Present only while a `type-text` beat is semantically complete. */
  composerText?: string;
  /** Generic semantic state used by later dashboard surfaces. */
  targetStates?: Record<string, string>;
  /** Generic progress values used by workflow rails/fills. */
  progress?: Record<string, number>;
  /** Generic active-target state used by panes, ribbons, rows, and owners. */
  highlights?: Record<string, boolean>;
  /** Scene-local theme state for the later sunrise scene. */
  theme?: "dark" | "light";
}

/** A ribbon entry: which pane it activates and its icon symbol id. */
export interface RibbonItem {
  pane: PaneKey;
  icon: string;
}

/** A sessions-sidebar row. */
export interface SessionRow {
  /** EmployeeAvatar-parity emoji (the app's emojiForName look). */
  emoji: string;
  title: string;
  sub: string;
  active?: boolean;
}

export type PresenceState = "idle" | "active";

export interface OrgEmployee {
  target: `node-${string}`;
  emoji: string;
  name: string;
  role: string;
  engine: string;
  /** Landing org pane only - the features org renders no presence dots
   * (STORYBOARD-FEATURES Addendum B2-4). */
  presence?: PresenceState;
  initialPresence?: PresenceState;
  executive?: boolean;
}

export interface OrgDepartment {
  target: `dept-${string}`;
  label: string;
  employeeTargets: OrgEmployee["target"][];
  tone: "blue" | "green" | "purple";
}

export interface OrgPaneData {
  header: string;
  employees: OrgEmployee[];
  departments: OrgDepartment[];
}

export type TodoStatus = "assigned" | "executing" | "blocked" | "done";

export interface TodoCardData {
  target: `card-${string}`;
  emoji: string;
  title: string;
  owner: string;
  status: TodoStatus;
  initialStatus: TodoStatus;
  cost?: string;
  badge?: string;
  exec?: string;
  initialExec?: string;
  age?: string;
}

export interface TodosPaneData {
  header: string;
  segments: string[];
  cards: TodoCardData[];
}

export type WorkflowStepStatus =
  "done" | "running" | "queued" | "awaiting-approval";

export interface WorkflowStepData {
  target: `step-${string}`;
  title: string;
  detail: string;
  status: WorkflowStepStatus;
  initialStatus: WorkflowStepStatus;
  initialDetail: string;
}

export interface WorkflowPaneData {
  header: string;
  badge: "Running" | "Completed";
  /** Present when a scene flips the badge (backup run); defaults to badge. */
  initialBadge?: "Running" | "Completed";
  trigger: string;
  /** 0–1 fill, where 2/3 stops exactly at the third of four step centers. */
  progress: number;
  initialProgress: number;
  steps: WorkflowStepData[];
}

export type TriggerBindingStatus = "idle" | "fired";

export interface TriggerBindingData {
  target: `binding-${string}`;
  title: string;
  detail: string;
  kind: "cron" | "todo-status" | "webhook";
  status: TriggerBindingStatus;
  initialStatus: TriggerBindingStatus;
  fired?: string;
}

export interface TriggersPaneData {
  header: string;
  bindings: TriggerBindingData[];
  run: string;
  /** Ambient payoff row - run #140, revealed when the webhook binding fires. */
  runRefund: string;
}

/** One overnight-feed row: mono timestamp, plain text, one status glyph. */
export interface NightFeedRowData {
  target: `row-${string}`;
  time: string;
  text: string;
  /** Sprite symbol id for the row's status glyph. */
  icon: string;
  /** Honest state tone: neutral event, green done, amber waiting-on-you. */
  tone: "neutral" | "green" | "amber";
}

export interface NightFeedData {
  header: string;
  rows: NightFeedRowData[];
}

export type MorningStepStatus =
  "queued" | "running" | "done" | "awaiting-approval" | "approved";

export interface MorningStepData {
  target: `step-${string}`;
  title: string;
  detail: string;
  status: MorningStepStatus;
  initialStatus: MorningStepStatus;
  initialDetail: string;
}

/** The morning approval card + the run #142 rail tail it completes. */
export interface MorningPaneData {
  /** Approval-card header identity (Jimbo · COO). */
  header: string;
  title: string;
  line: string;
  holdLabel: string;
  approveLabel: string;
  /** Mono run label on the rail tail. */
  run: string;
  badge: "Running" | "Completed";
  initialBadge: "Running" | "Completed";
  /** 0–1 rail-tail fill from the gate center to the post center. */
  progress: number;
  initialProgress: number;
  steps: MorningStepData[];
}

export type SceneSurface =
  "chat" | "org" | "todos" | "flows" | "triggers" | "night" | "morning";
export type ScenePlaybackMode = "once" | "loop";
export type SceneEntryBehavior = "play" | "restart-on-enter";
export type SceneOffscreenBehavior = "pause";
export type SceneEasing = "smooth" | "spring" | "snappy";
export type SceneTargetKind =
  "text" | "element" | "state" | "progress" | "pane" | "theme";

export interface SceneStateTransition {
  from: string;
  to: string;
}

/** A component-local stable target id and its semantic transition contract. */
export interface SceneTargetDefinition {
  id: string;
  kind: SceneTargetKind;
  initialState?: string;
  transitions?: readonly SceneStateTransition[];
}

export interface TypeTextAction {
  type: "type-text";
  text: string;
}

export interface ReplaceTextAction {
  type: "replace-text";
  text: string;
}

export type SceneEnterContent =
  | { kind: "message"; item: ChatMessage }
  | { kind: "typing"; item: TypingIndicator }
  | { kind: "chip"; groupId: string; item: DelegationChip };

export interface ScenePlacement {
  before?: string;
  after?: string;
}

export interface EnterAction {
  type: "enter";
  content?: SceneEnterContent;
  placement?: ScenePlacement;
}

export interface ExitAction {
  type: "exit";
}

export interface SetStateAction {
  type: "set-state";
  from: string;
  to: string;
}

export interface SetProgressAction {
  type: "set-progress";
  value: number;
}

export interface HighlightAction {
  type: "highlight";
  active?: boolean;
}

export interface PulseAction {
  type: "pulse";
  cycles: 1 | 2;
}

export interface ThemeAction {
  type: "theme";
  theme: "dark" | "light";
}

export type SceneAction =
  | TypeTextAction
  | ReplaceTextAction
  | EnterAction
  | ExitAction
  | SetStateAction
  | SetProgressAction
  | HighlightAction
  | PulseAction
  | ThemeAction;

export interface SceneBeat {
  at: number;
  duration?: number;
  target: string;
  action: SceneAction;
  easing: SceneEasing;
  /** Human-readable storyboard intent; never interpreted by the runtime. */
  detail?: string;
}

export interface SceneCheckpoint {
  name: string;
  at: number;
}

export interface ScenePlaybackPolicy {
  mode: ScenePlaybackMode;
  entry: SceneEntryBehavior;
  offscreen: SceneOffscreenBehavior;
  /** Delay before a newly entered scene begins, preserving resolved SSR DOM. */
  startDelayMs?: number;
  dwellMs?: number;
  quietResetMs?: number;
}

export interface SceneAmbientPolicy {
  /** Scripted scene that must resolve before this loop may claim motion. */
  follows: string;
  /** Uninterrupted hold after host completion before ambient playback. */
  startDelay: number;
}

export interface SceneDefinition<
  TState extends ChatSceneState = ChatSceneState,
> {
  id: string;
  title: string;
  surface: SceneSurface;
  claim: string;
  transcript: string;
  initialState: TState;
  targets: readonly SceneTargetDefinition[];
  playback: ScenePlaybackPolicy;
  ambient?: SceneAmbientPolicy;
  beats: readonly SceneBeat[];
  checkpoints: readonly SceneCheckpoint[];
}

/** Marker alias returned after runtime validation. */
export type ValidatedSceneDefinition<
  TState extends ChatSceneState = ChatSceneState,
> = SceneDefinition<TState>;
