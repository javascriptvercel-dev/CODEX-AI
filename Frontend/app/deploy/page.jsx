"use client";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import GenerateConsole from "@/components/session/GenerateConsole";
import Container from "@/components/ui/Container";
import PageHeader from "@/components/ui/PageHeader";
import { ChevronDown } from "lucide-react";

function DeploymentMethod({ title, description, children, defaultOpen = false }) {
  return (
    <details
      className="group overflow-hidden rounded-xl border border-edge bg-surface"
      open={defaultOpen}
    >
      <summary className="focus-ring flex cursor-pointer list-none items-center justify-between gap-4 p-5 sm:p-6 [&::-webkit-details-marker]:hidden">
        <span className="min-w-0">
          <span className="block font-display text-lg font-bold text-fg">{title}</span>
          <span className="mt-1 block text-sm leading-6 text-muted">{description}</span>
        </span>
        <ChevronDown
          size={20}
          className="flex-none text-muted transition-transform group-open:rotate-180"
          aria-hidden="true"
        />
      </summary>
      <div className="border-t border-edge p-5 sm:p-6">{children}</div>
    </details>
  );
}

function DeploymentSteps({ children }) {
  return (
    <ol className="list-decimal space-y-3 pl-5 text-sm leading-6 text-muted marker:font-semibold marker:text-azure-500">
      {children}
    </ol>
  );
}

function DeploymentCode({ children }) {
  return (
    <pre className="my-3 overflow-x-auto rounded-lg border border-edge bg-ink-950 p-4 font-mono text-xs leading-6 text-azure-300">
      <code>{children}</code>
    </pre>
  );
}

const REPO_URL = "https://github.com/codexverified/CODEX-AI";
const DEPLOY_GUIDE_URL = `${REPO_URL}/blob/main/DEPLOY.md`;

export default function DeployPage() {
  return (
    <div className="flex min-h-screen animate-rise flex-col">
      <Navbar />
      <main className="flex flex-1 flex-col items-center px-5 py-10">
        <Container size="narrow" className="mb-8 text-center">
          <PageHeader
            kicker="Deploy"
            title="Deploy your bot"
            titleClassName="text-2xl sm:text-3xl"
            description="Choose a deployment method to see its setup steps. The host must support the bot's runtime and storage needs."
          />
        </Container>
        <Container size="narrow" className="space-y-4 !px-0 sm:!px-5">
          <DeploymentMethod
            title="Panel deployment"
            description="Generate a setup script and run it on a Node.js server in your hosting panel."
          >
            <div className="space-y-6">
              <DeploymentSteps>
                <li>
                  Create a server using <strong className="text-fg">Node.js 22 or newer</strong>.
                  It needs persistent server files, outbound internet access, and Git installed
                  in its container.
                </li>
                <li>
                  Generate the <code className="rounded bg-surface2 px-1.5 py-0.5 font-mono text-xs text-fg">index.js</code> below
                  and save it to your computer. It contains your generated bot configuration
                  and session ID, so keep it private.
                </li>
                <li>
                  Upload that file to the server&apos;s root directory in the panel&apos;s file
                  manager.
                </li>
                <li>
                  Set the panel startup command to{" "}
                  <code className="rounded bg-surface2 px-1.5 py-0.5 font-mono text-xs text-fg">node index.js</code>,
                  then start the server. The script downloads the bot source, installs its
                  dependencies, and launches it.
                </li>
                <li>
                  Keep exactly one running server for this WhatsApp session. The panel&apos;s
                  server files must persist through restarts so the saved WhatsApp login and
                  bot data aren&apos;t lost.
                </li>
              </DeploymentSteps>
              <div className="space-y-4">
                <p className="text-sm font-semibold text-fg">Generate your panel setup script</p>
                <GenerateConsole />
              </div>
            </div>
          </DeploymentMethod>

          <DeploymentMethod
            title="Linux VPS"
            description="Run the bot directly on a Linux virtual private server with PM2."
          >
            <div className="space-y-5">
              <p className="text-sm leading-6 text-muted">
                These commands follow the{" "}
                <a
                  href={DEPLOY_GUIDE_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-azure-400 underline underline-offset-4 hover:text-azure-300"
                >
                  Linux VPS instructions in the deployment guide
                </a>
                . They assume an Ubuntu/Debian-style server and a user with sudo access.
              </p>
              <DeploymentSteps>
                <li>Connect to your server over SSH.</li>
                <li>
                  Install Git and curl, then install Node.js 22:
                  <DeploymentCode>{`sudo apt update && sudo apt install -y git curl
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs`}</DeploymentCode>
                </li>
                <li>
                  Install pnpm and PM2 globally:
                  <DeploymentCode>{`sudo npm install -g pnpm pm2`}</DeploymentCode>
                </li>
                <li>
                  Clone the{" "}
                  <a
                    href={REPO_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-azure-400 underline underline-offset-4 hover:text-azure-300"
                  >
                    {`${REPO_URL}.git`}
                  </a>{" "}
                  and install its locked dependencies:
                  <DeploymentCode>{`git clone ${REPO_URL}.git codex-ai
cd codex-ai
pnpm install --frozen-lockfile`}</DeploymentCode>
                </li>
                <li>
                  Edit <code className="rounded bg-surface2 px-1.5 py-0.5 font-mono text-xs text-fg">config.json</code>{" "}
                  with your bot settings. Set your session ID privately in the shell (replace
                  the placeholder; don&apos;t paste a real ID into public logs or commit it):
                  <DeploymentCode>{`nano config.json
export SESSION_ID="<your-session-id>"`}</DeploymentCode>
                </li>
                <li>
                  Start the bot under PM2 and configure it to return after a server reboot:
                  <DeploymentCode>{`npm run pm2:start
pm2 save
pm2 startup`}</DeploymentCode>
                  Run the extra command printed by <code className="rounded bg-surface2 px-1.5 py-0.5 font-mono text-xs text-fg">pm2 startup</code>{" "}
                  to enable the system service.
                </li>
                <li>
                  Check the process and logs:
                  <DeploymentCode>{`npm run pm2:status
npm run pm2:logs`}</DeploymentCode>
                  Keep <code className="rounded bg-surface2 px-1.5 py-0.5 font-mono text-xs text-fg">session/</code>{" "}
                  and <code className="rounded bg-surface2 px-1.5 py-0.5 font-mono text-xs text-fg">database/</code>{" "}
                  on storage that survives restarts. Run only one bot process for this session;
                  do not also run <code className="rounded bg-surface2 px-1.5 py-0.5 font-mono text-xs text-fg">node index.js</code>{" "}
                  manually.
                </li>
              </DeploymentSteps>
            </div>
          </DeploymentMethod>

          <DeploymentMethod
            title="Render"
            description="Deploy from the repository Blueprint and retain runtime files on persistent storage."
          >
            <div className="space-y-5">
              <p className="text-sm leading-6 text-muted">
                The repo contains a Blueprint at{" "}
                <a
                  href={`${REPO_URL}/blob/main/render.yaml`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-azure-400 underline underline-offset-4 hover:text-azure-300"
                >
                  render.yaml in CODEX-AI
                </a>
                . Follow these steps to deploy it:
              </p>
              <DeploymentSteps>
                <li>
                  Sign in to Render and start a new Blueprint deployment. Connect the{" "}
                  <a
                    href={REPO_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-azure-400 underline underline-offset-4 hover:text-azure-300"
                  >
                    {REPO_URL}
                  </a>
                  , select its branch, and let Render read its existing{" "}
                  <code className="rounded bg-surface2 px-1.5 py-0.5 font-mono text-xs text-fg">render.yaml</code>.
                </li>
                <li>
                  Review the service settings from the Blueprint. It defines Node.js 22,
                  installs pnpm dependencies, starts the bot, and mounts persistent storage
                  for both <code className="rounded bg-surface2 px-1.5 py-0.5 font-mono text-xs text-fg">session/</code>{" "}
                  and <code className="rounded bg-surface2 px-1.5 py-0.5 font-mono text-xs text-fg">database/</code>.
                  Choose an available service plan that supports an always-running service
                  and a persistent disk; the plan in the repo Blueprint may need adjusting
                  to match your account.
                </li>
                <li>
                  Before creating the service, add the private environment variable{" "}
                  <code className="rounded bg-surface2 px-1.5 py-0.5 font-mono text-xs text-fg">SESSION_ID</code>{" "}
                  in Render. Do not put its value in the repo or commit it.
                </li>
                <li>
                  Create the Blueprint service and follow the first deployment in the Render
                  event/log view. Wait for the build and start command to finish.
                </li>
                <li>
                  Confirm the service health check for{" "}
                  <code className="rounded bg-surface2 px-1.5 py-0.5 font-mono text-xs text-fg">/live</code>{" "}
                  passes, then check the runtime logs for successful WhatsApp connection.
                  The bot also exposes <code className="rounded bg-surface2 px-1.5 py-0.5 font-mono text-xs text-fg">/ready</code>{" "}
                  to indicate when WhatsApp is connected.
                </li>
                <li>
                  Keep exactly one instance for this WhatsApp session. Verify the disk remains
                  attached across redeploys and back up the session and database data.
                </li>
              </DeploymentSteps>
              <p className="rounded-lg border border-amber-400/25 bg-amber-400/5 p-3 text-sm leading-6 text-muted">
                The repository explicitly marks this Blueprint as untested. Check the first
                deployment logs and validate the persistent disk before relying on it.
              </p>
            </div>
          </DeploymentMethod>

          <DeploymentMethod
            title="Docker"
            description="Run one Node.js container with persistent mounts for the bot's runtime files."
          >
            <div className="space-y-5">
              <p className="text-sm leading-6 text-muted">
                The{" "}
                <a
                  href={DEPLOY_GUIDE_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-azure-400 underline underline-offset-4 hover:text-azure-300"
                >
                  deployment guide
                </a>{" "}
                describes the requirements, but the repo does not include Docker build files.
                The following is a starter setup to create and test on a Docker host.
              </p>
              <DeploymentSteps>
                <li>
                  Install Docker Engine and the Docker Compose plugin on a Linux host. Clone
                  the{" "}
                  <a
                    href={REPO_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-azure-400 underline underline-offset-4 hover:text-azure-300"
                  >
                    {`${REPO_URL}.git`}
                  </a>{" "}
                  on that host:
                  <DeploymentCode>{`git clone ${REPO_URL}.git codex-ai
cd codex-ai`}</DeploymentCode>
                </li>
                <li>
                  Create a file named <code className="rounded bg-surface2 px-1.5 py-0.5 font-mono text-xs text-fg">Dockerfile</code>{" "}
                  in the repository root:
                  <DeploymentCode>{`FROM node:22-bookworm-slim
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
ENV NODE_ENV=production
CMD ["npm", "start"]`}</DeploymentCode>
                </li>
                <li>
                  Create <code className="rounded bg-surface2 px-1.5 py-0.5 font-mono text-xs text-fg">compose.yaml</code>{" "}
                  in the same directory. It mounts separate persistent volumes and starts one
                  container:
                  <DeploymentCode>{`services:
  codex-ai:
    build: .
    restart: unless-stopped
    environment:
      NODE_ENV: production
      SESSION_ID: \${SESSION_ID}
      PORT: 3000
    ports:
      - "3000:3000"
    volumes:
      - codex-session:/app/session
      - codex-database:/app/database

volumes:
  codex-session:
  codex-database:`}</DeploymentCode>
                </li>
                <li>
                  Create a private <code className="rounded bg-surface2 px-1.5 py-0.5 font-mono text-xs text-fg">.env</code>{" "}
                  file in the same directory with your session ID. Do not commit or share it:
                  <DeploymentCode>{`SESSION_ID=<your-session-id>`}</DeploymentCode>
                </li>
                <li>
                  Build and start the container:
                  <DeploymentCode>{`docker compose up --build -d`}</DeploymentCode>
                </li>
                <li>
                  Check the startup output and health endpoint:
                  <DeploymentCode>{`docker compose logs -f codex-ai
docker compose ps`}</DeploymentCode>
                  The bot exposes <code className="rounded bg-surface2 px-1.5 py-0.5 font-mono text-xs text-fg">/live</code>{" "}
                  for process health and <code className="rounded bg-surface2 px-1.5 py-0.5 font-mono text-xs text-fg">/ready</code>{" "}
                  when WhatsApp is connected. Configure a health check in your host if needed.
                </li>
                <li>
                  Back up both Docker volumes. Keep one running container for each WhatsApp
                  session; do not scale this service to multiple replicas.
                </li>
              </DeploymentSteps>
              <p className="rounded-lg border border-amber-400/25 bg-amber-400/5 p-3 text-sm leading-6 text-muted">
                Docker support files are not included or tested by the repository. Treat these
                files as a starting point and validate the build, persistent volumes, and restart
                behavior on your host before using the bot.
              </p>
            </div>
          </DeploymentMethod>

          <DeploymentMethod
            title="Heroku"
            description="The repo lists Heroku but explicitly advises against deploying this bot there as-is."
          >
            <div className="space-y-4">
              <p className="rounded-lg border border-red-400/25 bg-red-400/5 p-4 text-sm leading-6 text-muted">
                <strong className="text-fg">Do not follow a normal Heroku deploy for this bot as-is.</strong>{" "}
                The bot writes its WhatsApp login and runtime data to local files, while Heroku&apos;s
                dyno filesystem is ephemeral. A restart or replacement can erase that data and
                force a new WhatsApp pairing. The repository lists Heroku as not recommended.
              </p>
              <p className="text-sm leading-6 text-muted">
                To make Heroku viable, the bot would first need to be changed so its WhatsApp
                authentication state and all required runtime database/media files are stored
                in external persistent services, with safe single-writer behavior. Only after
                that redesign should you:
              </p>
              <DeploymentSteps>
                <li>
                  Fork or connect the{" "}
                  <a
                    href={REPO_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-azure-400 underline underline-offset-4 hover:text-azure-300"
                  >
                    {REPO_URL}
                  </a>{" "}
                  to a Heroku app.
                </li>
                <li>
                  Configure its Node.js build and start process to use the repository&apos;s{" "}
                  <code className="rounded bg-surface2 px-1.5 py-0.5 font-mono text-xs text-fg">npm start</code>{" "}
                  script, and set <code className="rounded bg-surface2 px-1.5 py-0.5 font-mono text-xs text-fg">SESSION_ID</code>{" "}
                  as a private app configuration variable.
                </li>
                <li>
                  Deploy one worker and validate that authentication and runtime state survive
                  a dyno restart before using it with your WhatsApp account.
                </li>
              </DeploymentSteps>
              <p className="text-xs leading-5 text-muted">
                These are prerequisites, not a verified Heroku recipe; the repository has no
                Heroku-specific deployment files, and the current file-backed bot is not safe
                to operate there reliably.
              </p>
            </div>
          </DeploymentMethod>

          <p className="px-1 text-xs leading-5 text-muted">
            Every method should run one bot process per WhatsApp session, keep the session and
            database on persistent storage, and keep your session ID private. Review the{" "}
            <a
              href={DEPLOY_GUIDE_URL}
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-azure-400 underline underline-offset-4 hover:text-azure-300"
            >
              exact deployment instructions in the guide
            </a>
            .
          </p>
        </Container>
      </main>
      <Footer />
    </div>
  );
}
