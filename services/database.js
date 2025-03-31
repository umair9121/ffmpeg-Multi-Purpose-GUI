const { MongoClient } = require('mongodb');

const DB_URL = 'mongodb://localhost:27017';
const DB_NAME = 'ffmpeg_desktop';

let client = null;
let db = null;

const dbService = {
  /**
   * Connect to MongoDB database
   */
  connect: async () => {
    try {
      client = new MongoClient(DB_URL);
      await client.connect();
      db = client.db(DB_NAME);
      console.log('Connected to MongoDB');
    } catch (error) {
      console.error('Failed to connect to MongoDB:', error);
    }
  },
  
  /**
   * Save a preset to the database
   * @param {Object} preset - The preset to save
   */
  savePreset: async (preset) => {
    if (!db) return null;
    
    try {
      const collection = db.collection('presets');
      const result = await collection.insertOne({
        ...preset,
        createdAt: new Date()
      });
      return result;
    } catch (error) {
      console.error('Error saving preset:', error);
      return null;
    }
  },
  
  /**
   * Get all presets from the database
   */
  getPresets: async () => {
    if (!db) return [];
    
    try {
      const collection = db.collection('presets');
      return await collection.find({}).sort({ createdAt: -1 }).toArray();
    } catch (error) {
      console.error('Error getting presets:', error);
      return [];
    }
  },
  
  /**
   * Save job history to the database
   * @param {Object} job - The job to save
   */
  saveJobHistory: async (job) => {
    if (!db) return null;
    
    try {
      const collection = db.collection('history');
      const result = await collection.insertOne({
        ...job,
        timestamp: new Date()
      });
      return result;
    } catch (error) {
      console.error('Error saving job history:', error);
      return null;
    }
  },
  
  /**
   * Get job history from the database
   */
  getJobHistory: async () => {
    if (!db) return [];
    
    try {
      const collection = db.collection('history');
      return await collection.find({}).sort({ timestamp: -1 }).toArray();
    } catch (error) {
      console.error('Error getting job history:', error);
      return [];
    }
  }
};

module.exports = dbService; 