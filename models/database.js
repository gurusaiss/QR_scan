const path = require('path');

// Determine which database to use based on environment
const USE_POSTGRES = process.env.DATABASE_URL ? true : false;

let db;

if (USE_POSTGRES) {
  // PostgreSQL for production (Render)
  const { Pool } = require('pg');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  class PostgresDatabase {
    constructor() {
      this.pool = pool;
      this.initialize();
    }

    async initialize() {
      try {
        // Create tables
        await this.pool.query(`
          CREATE TABLE IF NOT EXISTS shares (
            id SERIAL PRIMARY KEY,
            share_id TEXT UNIQUE NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            expires_at TIMESTAMP,
            password_hash TEXT,
            brand_name TEXT,
            language TEXT DEFAULT 'en',
            is_active INTEGER DEFAULT 1
          )
        `);

        await this.pool.query(`
          CREATE TABLE IF NOT EXISTS files (
            id SERIAL PRIMARY KEY,
            share_id TEXT NOT NULL,
            original_name TEXT NOT NULL,
            stored_name TEXT NOT NULL,
            file_size BIGINT NOT NULL,
            mime_type TEXT NOT NULL,
            FOREIGN KEY (share_id) REFERENCES shares(share_id) ON DELETE CASCADE
          )
        `);

        await this.pool.query(`
          CREATE TABLE IF NOT EXISTS analytics (
            id SERIAL PRIMARY KEY,
            event_type TEXT NOT NULL,
            share_id TEXT NOT NULL,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            user_agent TEXT,
            ip_address TEXT,
            FOREIGN KEY (share_id) REFERENCES shares(share_id) ON DELETE CASCADE
          )
        `);

        console.log('✓ PostgreSQL database tables initialized');
      } catch (error) {
        console.error('Database initialization error:', error);
      }
    }

    async createShare(shareId, expiresAt, passwordHash, brandName, language) {
      const result = await this.pool.query(
        `INSERT INTO shares (share_id, expires_at, password_hash, brand_name, language) 
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [shareId, expiresAt, passwordHash, brandName, language]
      );
      return result.rows[0].id;
    }

    async addFile(shareId, originalName, storedName, fileSize, mimeType) {
      const result = await this.pool.query(
        `INSERT INTO files (share_id, original_name, stored_name, file_size, mime_type) 
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [shareId, originalName, storedName, fileSize, mimeType]
      );
      return result.rows[0].id;
    }

    async getShare(shareId) {
      const result = await this.pool.query(
        `SELECT * FROM shares WHERE share_id = $1 AND is_active = 1`,
        [shareId]
      );
      return result.rows[0];
    }

    async getFiles(shareId) {
      const result = await this.pool.query(
        `SELECT * FROM files WHERE share_id = $1`,
        [shareId]
      );
      return result.rows;
    }

    async trackEvent(eventType, shareId, userAgent, ipAddress) {
      const result = await this.pool.query(
        `INSERT INTO analytics (event_type, share_id, user_agent, ip_address) 
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [eventType, shareId, userAgent, ipAddress]
      );
      return result.rows[0].id;
    }

    async getAnalytics(shareId) {
      const result = await this.pool.query(
        `SELECT event_type, COUNT(*) as count, MAX(timestamp) as last_event
         FROM analytics 
         WHERE share_id = $1 
         GROUP BY event_type`,
        [shareId]
      );
      return result.rows;
    }

    async cleanupExpired() {
      await this.pool.query(
        `UPDATE shares SET is_active = 0 
         WHERE expires_at < NOW() AND is_active = 1`
      );
    }

    close() {
      this.pool.end();
    }
  }

  db = new PostgresDatabase();

} else {
  // SQLite for local development
  const sqlite3 = require('sqlite3').verbose();
  const DB_PATH = path.join(__dirname, '..', 'database.db');

  class SQLiteDatabase {
    constructor() {
      this.db = new sqlite3.Database(DB_PATH, (err) => {
        if (err) {
          console.error('Error opening database:', err);
        } else {
          console.log('✓ Connected to SQLite database');
          this.initialize();
        }
      });
    }

    initialize() {
      this.db.serialize(() => {
        this.db.run(`
          CREATE TABLE IF NOT EXISTS shares (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            share_id TEXT UNIQUE NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            expires_at DATETIME,
            password_hash TEXT,
            brand_name TEXT,
            language TEXT DEFAULT 'en',
            is_active INTEGER DEFAULT 1
          )
        `);

        this.db.run(`
          CREATE TABLE IF NOT EXISTS files (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            share_id TEXT NOT NULL,
            original_name TEXT NOT NULL,
            stored_name TEXT NOT NULL,
            file_size INTEGER NOT NULL,
            mime_type TEXT NOT NULL,
            FOREIGN KEY (share_id) REFERENCES shares(share_id) ON DELETE CASCADE
          )
        `);

        this.db.run(`
          CREATE TABLE IF NOT EXISTS analytics (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            event_type TEXT NOT NULL,
            share_id TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            user_agent TEXT,
            ip_address TEXT,
            FOREIGN KEY (share_id) REFERENCES shares(share_id) ON DELETE CASCADE
          )
        `);

        console.log('✓ SQLite database tables initialized');
      });
    }

    createShare(shareId, expiresAt, passwordHash, brandName, language) {
      return new Promise((resolve, reject) => {
        this.db.run(
          `INSERT INTO shares (share_id, expires_at, password_hash, brand_name, language) 
           VALUES (?, ?, ?, ?, ?)`,
          [shareId, expiresAt, passwordHash, brandName, language],
          function (err) {
            if (err) reject(err);
            else resolve(this.lastID);
          }
        );
      });
    }

    addFile(shareId, originalName, storedName, fileSize, mimeType) {
      return new Promise((resolve, reject) => {
        this.db.run(
          `INSERT INTO files (share_id, original_name, stored_name, file_size, mime_type) 
           VALUES (?, ?, ?, ?, ?)`,
          [shareId, originalName, storedName, fileSize, mimeType],
          function (err) {
            if (err) reject(err);
            else resolve(this.lastID);
          }
        );
      });
    }

    getShare(shareId) {
      return new Promise((resolve, reject) => {
        this.db.get(
          `SELECT * FROM shares WHERE share_id = ? AND is_active = 1`,
          [shareId],
          (err, row) => {
            if (err) reject(err);
            else resolve(row);
          }
        );
      });
    }

    getFiles(shareId) {
      return new Promise((resolve, reject) => {
        this.db.all(
          `SELECT * FROM files WHERE share_id = ?`,
          [shareId],
          (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
          }
        );
      });
    }

    trackEvent(eventType, shareId, userAgent, ipAddress) {
      return new Promise((resolve, reject) => {
        this.db.run(
          `INSERT INTO analytics (event_type, share_id, user_agent, ip_address) 
           VALUES (?, ?, ?, ?)`,
          [eventType, shareId, userAgent, ipAddress],
          function (err) {
            if (err) reject(err);
            else resolve(this.lastID);
          }
        );
      });
    }

    getAnalytics(shareId) {
      return new Promise((resolve, reject) => {
        this.db.all(
          `SELECT event_type, COUNT(*) as count, MAX(timestamp) as last_event
           FROM analytics 
           WHERE share_id = ? 
           GROUP BY event_type`,
          [shareId],
          (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
          }
        );
      });
    }

    cleanupExpired() {
      return new Promise((resolve, reject) => {
        this.db.run(
          `UPDATE shares SET is_active = 0 
           WHERE expires_at < datetime('now') AND is_active = 1`,
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });
    }

    close() {
      this.db.close();
    }
  }

  db = new SQLiteDatabase();
}

module.exports = db;
