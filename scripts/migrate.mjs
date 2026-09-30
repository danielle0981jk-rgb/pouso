import mysql from "mysql2/promise";

function resolveDatabaseUrl() {
  const direct = [process.env.DATABASE_URL, process.env.MYSQL_URL, process.env.MYSQL_PUBLIC_URL].find(value => Boolean(value?.trim()));
  if (direct) return direct;
  const host = process.env.MYSQLHOST;
  const port = process.env.MYSQLPORT ?? "3306";
  const user = process.env.MYSQLUSER;
  const password = process.env.MYSQLPASSWORD;
  const database = process.env.MYSQLDATABASE;
  if (!host || !user || !password || !database) return "";
  return `mysql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${encodeURIComponent(database)}`;
}

const url = resolveDatabaseUrl();
if (!url) throw new Error("DATABASE_URL ou variáveis MYSQL_* não foram configuradas.");
const connection = await mysql.createConnection(url);
async function ensureColumn(table, column, definition) {
  const [rows] = await connection.query("SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?", [table, column]);
  if (!Array.isArray(rows) || rows.length === 0) await connection.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
}
try {
  await connection.query(`CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    openId VARCHAR(64) NOT NULL UNIQUE,
    name TEXT NULL,
    email VARCHAR(320) NULL,
    loginMethod VARCHAR(64) NULL,
    role ENUM('user','admin') NOT NULL DEFAULT 'user',
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    lastSignedIn TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB`);
  await connection.query(`CREATE TABLE IF NOT EXISTS brand_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    brandName VARCHAR(120) NOT NULL DEFAULT 'SUA MARCA',
    logoUrl TEXT NULL,
    logoPath VARCHAR(1024) NULL,
    primaryColor VARCHAR(7) NOT NULL DEFAULT '#ff7a22',
    accentColor VARCHAR(7) NOT NULL DEFAULT '#ffad36',
    backgroundColor VARCHAR(7) NOT NULL DEFAULT '#121313',
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB`);
  await connection.query(`CREATE TABLE IF NOT EXISTS landing_pages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(180) NOT NULL,
    description TEXT NULL,
    buttonLabel VARCHAR(80) NOT NULL,
    destinationUrl VARCHAR(2048) NOT NULL,
    slug VARCHAR(40) NOT NULL UNIQUE,
    status ENUM('draft','published') NOT NULL DEFAULT 'draft',
    coverImageUrl TEXT NULL,
    coverImagePath VARCHAR(1024) NULL,
    logoUrl TEXT NULL,
    logoPath VARCHAR(1024) NULL,
    primaryColor VARCHAR(7) NOT NULL DEFAULT '#ff7a22',
    accentColor VARCHAR(7) NOT NULL DEFAULT '#ffad36',
    backgroundColor VARCHAR(7) NOT NULL DEFAULT '#121313',
    clickMode ENUM('mobile_only','all_devices') NOT NULL DEFAULT 'all_devices',
    creatorEmail VARCHAR(320) NOT NULL,
    publishedAt TIMESTAMP NULL,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB`);
  await ensureColumn("landing_pages", "logoUrl", "TEXT NULL");
  await ensureColumn("landing_pages", "logoPath", "VARCHAR(1024) NULL");
  await ensureColumn("landing_pages", "primaryColor", "VARCHAR(7) NOT NULL DEFAULT '#ff7a22'");
  await ensureColumn("landing_pages", "accentColor", "VARCHAR(7) NOT NULL DEFAULT '#ffad36'");
  await ensureColumn("landing_pages", "backgroundColor", "VARCHAR(7) NOT NULL DEFAULT '#121313'");
  await ensureColumn("landing_pages", "clickMode", "ENUM('mobile_only','all_devices') NOT NULL DEFAULT 'all_devices'");
  await connection.query(`CREATE TABLE IF NOT EXISTS short_links (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(160) NOT NULL,
    slug VARCHAR(40) NOT NULL UNIQUE,
    mode ENUM('landing','direct') NOT NULL DEFAULT 'direct',
    landingPageId INT NULL,
    destinationUrl VARCHAR(2048) NULL,
    status ENUM('active','inactive') NOT NULL DEFAULT 'active',
    clicks INT NOT NULL DEFAULT 0,
    creatorEmail VARCHAR(320) NOT NULL,
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  ) ENGINE=InnoDB`);
  console.log("Database schema is ready.");
} finally {
  await connection.end();
}
