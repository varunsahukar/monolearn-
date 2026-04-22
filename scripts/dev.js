import { spawn } from 'node:child_process';
import { once } from 'node:events';
import net from 'node:net';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const viteBin = path.join(rootDir, 'node_modules', 'vite', 'bin', 'vite.js');
const pythonVenvPath = path.join(rootDir, '.venv', 'bin', 'python');

const DEFAULT_API_PORT = 8000;
const DEFAULT_WEB_PORT = 5173;
const MAX_PORT = 65535;

const parsePort = (value, fallback) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 && parsed <= MAX_PORT ? parsed : fallback;
};

const isPortAvailable = (port) =>
  new Promise((resolve) => {
    const probe = net.createServer();

    probe.once('error', () => {
      resolve(false);
    });

    probe.once('listening', () => {
      probe.close(() => resolve(true));
    });

    probe.listen(port);
  });

const findAvailablePort = async (preferredPort) => {
  for (let port = preferredPort; port <= MAX_PORT; port += 1) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }

  throw new Error(`No open port found starting from ${preferredPort}.`);
};

const pipeWithPrefix = (stream, prefix, target) => {
  let buffer = '';
  stream.setEncoding('utf8');

  stream.on('data', (chunk) => {
    buffer += chunk;
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      target.write(`${prefix} ${line}\n`);
    }
  });

  stream.on('end', () => {
    if (buffer) {
      target.write(`${prefix} ${buffer}\n`);
    }
  });
};

const launch = (name, command, args, extraEnv) => {
  const child = spawn(command, args, {
    cwd: rootDir,
    env: {
      ...process.env,
      ...extraEnv,
    },
    stdio: ['inherit', 'pipe', 'pipe'],
  });

  pipeWithPrefix(child.stdout, `[${name}]`, process.stdout);
  pipeWithPrefix(child.stderr, `[${name}]`, process.stderr);

  child.on('error', (error) => {
    console.error(`[dev] Failed to start ${name}: ${error.message}`);
  });

  return child;
};

const requestedApiPort = parsePort(process.env.API_PORT ?? process.env.PORT, DEFAULT_API_PORT);
const requestedWebPort = parsePort(process.env.VITE_PORT ?? process.env.WEB_PORT, DEFAULT_WEB_PORT);

const apiPort = await findAvailablePort(requestedApiPort);
const webPort = await findAvailablePort(requestedWebPort);

if (apiPort !== requestedApiPort) {
  console.log(`[dev] API port ${requestedApiPort} is busy, using ${apiPort}.`);
}

if (webPort !== requestedWebPort) {
  console.log(`[dev] Web port ${requestedWebPort} is busy, using ${webPort}.`);
}

const children = [
  launch(
    'api',
    pythonVenvPath,
    [
      '-m',
      'uvicorn',
      'server_py.main:app',
      '--host',
      '0.0.0.0',
      '--port',
      String(apiPort),
    ],
    {
      PYTHONPATH: rootDir,
    }
  ),
  launch('web', process.execPath, [viteBin, '--port', String(webPort)], {
    VITE_API_PROXY_TARGET: `http://127.0.0.1:${apiPort}`,
    UV_LINK_MODE: 'copy',
  }),
];

let isShuttingDown = false;
let requestedExitCode = 0;

const waitForExit = (child) => {
  if (child.exitCode !== null || child.signalCode !== null) {
    return Promise.resolve();
  }

  return once(child, 'exit').then(() => undefined);
};

const stopChildren = async (signal = 'SIGTERM', exitCode = 0) => {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  requestedExitCode = exitCode;

  for (const child of children) {
    if (child.exitCode === null && child.signalCode === null && !child.killed) {
      child.kill(signal);
    }
  }

  await Promise.allSettled(children.map(waitForExit));
  process.exit(requestedExitCode);
};

for (const child of children) {
  child.on('exit', (code, signal) => {
    if (!isShuttingDown) {
      const reason = signal ? `signal ${signal}` : `exit code ${code ?? 0}`;
      console.error(`[dev] A child process stopped with ${reason}. Shutting down the rest.`);
      void stopChildren('SIGTERM', code ?? 1);
    }
  });
}

process.on('SIGINT', () => {
  void stopChildren('SIGINT', 0);
});

process.on('SIGTERM', () => {
  void stopChildren('SIGTERM', 0);
});