import { startBridgeMain, type BridgeMainHandle, type BridgeMainOptions } from "../bridge/server";
import { closeEditorSidecar } from "../bridge/webviewEditor";
import { closeTerminalSidecar } from "../bridge/webviewTerminal";

type DevEnv = Record<string, string | undefined>;

interface DevSpawnOptions {
  cmd: string[];
  cwd: string;
  env: DevEnv;
  stdin: "inherit";
  stdout: "inherit";
  stderr: "inherit";
}

interface DevSubprocess {
  exited: Promise<number>;
  kill(signal?: string): void;
}

export interface DevMainOptions {
  cwd?: string;
  env?: DevEnv;
  exit?: (code: number) => void;
  log?: (message: string) => void;
  startBridge?: (options: BridgeMainOptions) => BridgeMainHandle;
  spawn?: (options: DevSpawnOptions) => DevSubprocess;
  closeEditorSidecar?: () => void;
  closeTerminalSidecar?: () => void;
}

export interface DevMainHandle {
  bridge: BridgeMainHandle;
  hawk: DevSubprocess;
  exited: Promise<number>;
  stop(signal?: string): void;
}

export function startDevMain(options: DevMainOptions = {}): DevMainHandle {
  const cwd = options.cwd ?? process.cwd();
  const env: DevEnv = { ...process.env, ...options.env };
  env.HAWK2UI_EDITOR_PROJECT_ROOT ??= cwd;

  const log = options.log ?? console.log;
  const bridge = (options.startBridge ?? startBridgeMain)({ root: cwd, env, log });
  const hawk = (options.spawn ?? spawnHawkDev)({
    cmd: ["hawk2ui-cli", "dev"],
    cwd,
    env,
    stdin: "inherit",
    stdout: "inherit",
    stderr: "inherit",
  });

  let stopped = false;
  function stopBridgeAndSidecars() {
    if (stopped) return;
    stopped = true;
    (options.closeEditorSidecar ?? closeEditorSidecar)();
    (options.closeTerminalSidecar ?? closeTerminalSidecar)();
    const server = bridge.server as { stop?: () => void };
    server.stop?.();
  }

  const exit = options.exit ?? process.exit;
  const exited = hawk.exited.then(
    (code) => {
      stopBridgeAndSidecars();
      exit(code);
      return code;
    },
    (error) => {
      log(`Hawk2UI dev runtime failed: ${error instanceof Error ? error.message : "unknown error"}`);
      stopBridgeAndSidecars();
      exit(1);
      return 1;
    },
  );

  return {
    bridge,
    hawk,
    exited,
    stop(signal) {
      hawk.kill(signal);
      stopBridgeAndSidecars();
    },
  };
}

function spawnHawkDev(options: DevSpawnOptions): DevSubprocess {
  return Bun.spawn(options);
}

if (import.meta.main) {
  const dev = startDevMain();

  process.once("SIGINT", () => {
    dev.stop("SIGINT");
    process.exit(130);
  });

  process.once("SIGTERM", () => {
    dev.stop("SIGTERM");
    process.exit(143);
  });

  await dev.exited;
}
