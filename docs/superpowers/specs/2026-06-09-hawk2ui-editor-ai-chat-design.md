# Hawk2UI Editor AI Chat Design

Date: 2026-06-09
Status: Draft for user review

## Purpose

AI chat should help users plan, inspect, edit, and validate Hawk2UI projects. It should behave like an agent workbench, not a generic chatbot.

This spec defines the AI Chat architecture and UX boundaries. It depends on the Workbench UX spec for placement and the Code Editor spec for editor/LSP integration.

## Goals

- Use AI SDK UI for chat state, streaming, and message transport where compatible with Vue.
- Keep model execution, provider credentials, filesystem access, shell access, and tool execution behind the bridge or host boundary.
- Organize work into checkpoints that match how agents actually perform spec, plan, implementation, review, and validation phases.
- Persist chat history without loading entire transcripts into memory.
- Support future inline edits through the editor/LSP bridge.
- Record assistant tool events as timeline artifacts, not noisy chat prose.

## Non-Goals

- No implementation in the workbench shell phase.
- No direct provider execution in sealed Hawk frontend code.
- No raw API keys in `hawk.json`, `workspace.hawk`, logs, or webview content.
- No assistant inline edits until the editor bridge and LSP boundaries exist.
- No durable workflow engine requirement in the first chat implementation.

## Chat Panel UX

Chat lives in a floating panel opened from the command bar. The panel includes:

- Checkpoint selector at the top.
- Active provider summary.
- Transcript grouped by checkpoint.
- Composer with send, stop, and attach-context affordances.
- Tool-event rows for checkpoint creation, checkpoint completion, screenshots, validations, and edit proposals.
- Settings entry for provider and chat behavior.

Completed checkpoints collapse by default to a summary plus linked artifacts. Full transcript is available through an explicit open action so the default panel stays fast and scannable.

## Checkpoints

A checkpoint is the user-facing unit of work. It has:

- id
- title
- status: active, complete, or archived
- created and completed timestamps
- summary
- linked artifacts: specs, plans, commits, screenshots, validation logs, transcripts

Assistant-owned tools:

- `newCheckpoint`: creates a checkpoint when the work naturally moves to a new phase.
- `completeCheckpoint`: marks a checkpoint complete after the relevant artifact or validation is finished.

User-owned action:

- Rename checkpoint from the checkpoint dropdown or menu.

Checkpoint tool events should render as compact timeline events, for example `Created checkpoint: Workbench UX`.

## AI SDK Boundary

The frontend may use AI SDK UI primitives for chat state and streaming transport. The bridge should expose an AI SDK-compatible endpoint that returns UI message streams. Provider adapters, credentials, subscription-authenticated CLIs, and tool execution remain bridge-owned.

The current repo has `ai` installed but does not yet include `@ai-sdk/vue`. The implementation plan should verify the current AI SDK Vue package before adding it.

## Persistence

Chat persistence should use SQLite in a later implementation phase. The database should store:

- conversations
- checkpoints
- messages
- tool calls
- artifacts
- attachments
- provider metadata
- timestamps

The UI should virtualize long transcripts. The first loaded view should include the active checkpoint and compact summaries for completed checkpoints.

## Editor And LSP Integration

Inline edits require the Code Editor spec. The chat system should target editor bridge operations, not raw editor DOM:

- propose edit
- preview diff
- apply edit
- reject edit
- explain diagnostics
- request code action
- attach selected range to prompt

The assistant should use document ids, paths, ranges, and diagnostics from the editor/LSP bridge.

## Screenshot Tooling

The assistant needs a host-level app-window screenshot tool so it can inspect the Hawk2UI app surface. This should be a `hawk.ai` capability backed by framework windowing when available.

The editor records screenshots as checkpoint artifacts. A user-facing capture command may exist in the command palette or overflow menu, but assistant invocation is the primary workflow.

## Workflow Direction

AI SDK workflows and Workflow SDK-style durability map well to long-running agent work, but they should not drive the first chat implementation. The product model is checkpoint-aware chat first. Durable workflows can be introduced later when task execution, retries, resumability, and observability need stronger guarantees.

## Error States

The chat panel should handle:

- Bridge disconnected.
- Provider unavailable.
- Missing credentials.
- Streaming failure.
- Tool call rejected or failed.
- Checkpoint persistence failure.
- Transcript load failure.
- Editor integration unavailable.

Errors should remain attached to the relevant message, tool event, or checkpoint.

## Acceptance Criteria

- Chat is specified as a floating panel, not a sidebar.
- Checkpoint grouping is the primary transcript organization model.
- Assistant checkpoint creation and completion are tools.
- User checkpoint rename is a direct UI action.
- Persistence, virtualization, inline edits, and durable workflows are scoped to this AI Chat spec, not the Workbench UX spec.
- The design keeps provider execution and secrets outside sealed frontend code.

## References

- AI SDK UI: https://ai-sdk.dev/docs/reference/ai-sdk-ui
- AI SDK Workflows: https://ai-sdk.dev/docs/agents/workflows
- Workflow SDK: https://workflow-sdk.dev/
