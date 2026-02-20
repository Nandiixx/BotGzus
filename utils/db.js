const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(__dirname, "..", "data", "db.json");
const DATA_DIR = path.join(__dirname, "..", "data");

const defaultDb = {
  guilds: {},
  postedJobs: [],
};

function load() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify(defaultDb, null, 2));
    return JSON.parse(JSON.stringify(defaultDb));
  }
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
  } catch {
    return JSON.parse(JSON.stringify(defaultDb));
  }
}

function save(data) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

function getGuild(guildId) {
  const db = load();
  return db.guilds[guildId] || null;
}

function setChannel(guildId, channelId) {
  const db = load();
  if (!db.guilds[guildId]) {
    db.guilds[guildId] = {
      channelId: null,
      filters: { keywords: [], location: "" },
    };
  }
  db.guilds[guildId].channelId = channelId;
  save(db);
}

function setFilters(guildId, keywords, location) {
  const db = load();
  if (!db.guilds[guildId]) {
    db.guilds[guildId] = {
      channelId: null,
      filters: { keywords: [], location: "" },
    };
  }
  db.guilds[guildId].filters = { keywords, location };
  save(db);
}

function getAllGuilds() {
  const db = load();
  return db.guilds;
}

function setGuildInterval(guildId, hours) {
  const db = load();
  if (!db.guilds[guildId]) {
    db.guilds[guildId] = {
      channelId: null,
      filters: { keywords: [], location: "" },
    };
  }
  db.guilds[guildId].intervalHours = hours;
  save(db);
}

function getGuildInterval(guildId) {
  const db = load();
  return (db.guilds[guildId] && db.guilds[guildId].intervalHours) || 1;
}

function setLastRun(guildId, timestamp) {
  const db = load();
  if (!db.guilds[guildId]) {
    db.guilds[guildId] = {
      channelId: null,
      filters: { keywords: [], location: "" },
    };
  }
  db.guilds[guildId].lastRunAt = timestamp;
  save(db);
}

function getLastRun(guildId) {
  const db = load();
  return (db.guilds[guildId] && db.guilds[guildId].lastRunAt) || 0;
}

function isJobPosted(jobId) {
  const db = load();
  return db.postedJobs.includes(jobId);
}

function markJobPosted(jobId) {
  const db = load();
  if (!db.postedJobs.includes(jobId)) {
    db.postedJobs.push(jobId);
    // Keep only last 5000 IDs to avoid bloat
    if (db.postedJobs.length > 5000) {
      db.postedJobs = db.postedJobs.slice(-5000);
    }
    save(db);
  }
}

function resetPostedJobs() {
  const db = load();
  const count = db.postedJobs.length;
  db.postedJobs = [];
  save(db);
  return count;
}

module.exports = {
  getGuild,
  setChannel,
  setFilters,
  getAllGuilds,
  setGuildInterval,
  getGuildInterval,
  setLastRun,
  getLastRun,
  isJobPosted,
  markJobPosted,
  resetPostedJobs,
};
