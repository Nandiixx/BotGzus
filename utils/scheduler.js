const cron = require("node-cron");
const { scrapeAll } = require("../scrapers");
const {
  getAllGuilds,
  isJobPosted,
  markJobPosted,
  getGuildInterval,
  setLastRun,
  getLastRun,
} = require("./db");
const { postJobsPaginated } = require("./poster");

let schedulerTask = null;
let schedulerRunning = false;

/**
 * Runs a single scrape+post cycle for a specific guild.
 * @param {import("discord.js").Client} client
 * @param {string} guildId
 * @param {object} config
 */
async function runScrapeForGuild(client, guildId, config) {
  if (!config.channelId) return;

  const { keywords = [], location = "" } = config.filters || {};
  if (keywords.length === 0 && !location) {
    console.log(
      `[Scheduler] Guild ${guildId}: sem filtros configurados, pulando.`,
    );
    return;
  }

  const channel = await client.channels
    .fetch(config.channelId)
    .catch(() => null);
  if (!channel) {
    console.log(`[Scheduler] Guild ${guildId}: canal não encontrado.`);
    return;
  }

  console.log(`[Scheduler] Buscando vagas para guild ${guildId}...`);
  const jobs = await scrapeAll(keywords, location);
  console.log(
    `[Scheduler] ${jobs.length} vagas encontradas para guild ${guildId}.`,
  );

  // Collect all new (unposted) jobs first, then mark them and post in one paginated embed
  const newJobs = [];
  for (const job of jobs) {
    if (!job.id || isJobPosted(job.id)) continue;
    newJobs.push(job);
  }

  if (newJobs.length > 0) {
    try {
      await postJobsPaginated(channel, newJobs);
      for (const job of newJobs) markJobPosted(job.id);
    } catch (err) {
      console.error(
        `[Scheduler] Erro ao postar vagas para guild ${guildId}:`,
        err.message,
      );
    }
  }

  console.log(
    `[Scheduler] ${newJobs.length} novas vagas postadas para guild ${guildId}.`,
  );

  setLastRun(guildId, Date.now());
}

/**
 * Runs a single scrape+post cycle for all guilds that are due.
 * @param {import("discord.js").Client} client
 * @param {string|null} forceGuildId  If set, forces run for that guild regardless of interval.
 */
async function runScrapeAndPost(client, forceGuildId = null) {
  const guilds = getAllGuilds();
  const now = Date.now();

  for (const [guildId, config] of Object.entries(guilds)) {
    if (forceGuildId && guildId !== forceGuildId) continue;

    const intervalMs = getGuildInterval(guildId) * 60 * 60 * 1000;
    const lastRun = getLastRun(guildId);

    if (!forceGuildId && now - lastRun < intervalMs) {
      continue; // Not yet time to run for this guild
    }

    await runScrapeForGuild(client, guildId, config);
  }
}

/**
 * Starts the scheduler (checks every 15 minutes, respects per-guild interval).
 * @param {import("discord.js").Client} client
 */
function startScheduler(client) {
  if (schedulerTask) {
    schedulerTask.start();
    schedulerRunning = true;
    console.log("[Scheduler] Agendador retomado.");
    return;
  }

  // Run immediately on start
  runScrapeAndPost(client).catch(console.error);

  // Check every 15 minutes; each guild runs according to its own intervalHours
  schedulerTask = cron.schedule("*/15 * * * *", () => {
    console.log("[Scheduler] Verificando guilds para busca de vagas...");
    runScrapeAndPost(client).catch(console.error);
  });

  schedulerRunning = true;

  console.log(
    "[Scheduler] Agendador iniciado. Verificação a cada 15 minutos (intervalo configurável por servidor).",
  );
}

/**
 * Stops the scheduler cron task.
 * @returns {boolean} true if it was running and was stopped, false if already stopped.
 */
function stopScheduler() {
  if (schedulerTask && schedulerRunning) {
    schedulerTask.stop();
    schedulerRunning = false;
    console.log("[Scheduler] Agendador parado.");
    return true;
  }
  return false;
}

/**
 * Returns whether the scheduler task is currently active.
 * @returns {boolean}
 */
function isSchedulerRunning() {
  return schedulerRunning;
}

module.exports = {
  startScheduler,
  stopScheduler,
  isSchedulerRunning,
  runScrapeAndPost,
};
