const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(__dirname, "..", "data", "db.json");
const DATA_DIR = path.join(__dirname, "..", "data");

const defaultDb = {
  guilds: {},
  postedJobs: {}, // per-guild: { [guildId]: string[] }
};

function load() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify(defaultDb, null, 2));
    return JSON.parse(JSON.stringify(defaultDb));
  }
  try {
    const db = JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
    // Migrate legacy global postedJobs array → per-guild object
    if (Array.isArray(db.postedJobs)) {
      db.postedJobs = {};
      fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
    }
    if (!db.postedJobs || typeof db.postedJobs !== "object") {
      db.postedJobs = {};
    }
    return db;
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

function isJobPosted(guildId, jobId) {
  const db = load();
  return (db.postedJobs[guildId] || []).includes(jobId);
}

function markJobPosted(guildId, jobId) {
  const db = load();
  if (!db.postedJobs[guildId]) db.postedJobs[guildId] = [];
  if (!db.postedJobs[guildId].includes(jobId)) {
    db.postedJobs[guildId].push(jobId);
    // Keep only last 5000 IDs per guild to avoid bloat
    if (db.postedJobs[guildId].length > 5000) {
      db.postedJobs[guildId] = db.postedJobs[guildId].slice(-5000);
    }
    save(db);
  }
}

function resetPostedJobs(guildId) {
  const db = load();
  const count = (db.postedJobs[guildId] || []).length;
  db.postedJobs[guildId] = [];
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
