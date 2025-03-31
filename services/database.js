const { MongoClient } = require('mongodb');

const DB_URL = 'mongodb://localhost:27017';
const DB_NAME = 'ffmpeg_desktop';

let client = null;
let db = null;
let isConnected = false;

// In-memory storage as fallback
const memoryStorage = {
  presets: [],
  history: []
};

const dbService = {
  /**
   * Connect to MongoDB database
   */
  connect: async () => {
    try {
      client = new MongoClient(DB_URL);
      await client.connect();
      db = client.db(DB_NAME);
      isConnected = true;
      console.log('Connected to MongoDB');
    } catch (error) {
      console.warn('Warning: MongoDB not available. Using in-memory storage instead.');
      isConnected = false;
    }
  },
  
  /**
   * Save a preset to the database or memory
   */
  savePreset: async (preset) => {
    if (isConnected && db) {
      try {
        const collection = db.collection('presets');
        const result = await collection.insertOne({
          ...preset,
          createdAt: new Date()
        });
        return result;
      } catch (error) {
        console.error('Error saving preset to MongoDB:', error);
      }
    }
    
    // Fallback to memory storage
    const newPreset = { ...preset, createdAt: new Date(), _id: Date.now().toString() };
    memoryStorage.presets.push(newPreset);
    return { insertedId: newPreset._id };
  },
  
  /**
   * Get all presets from the database or memory
   */
  getPresets: async () => {
    if (isConnected && db) {
      try {
        const collection = db.collection('presets');
        return await collection.find({}).sort({ createdAt: -1 }).toArray();
      } catch (error) {
        console.error('Error getting presets from MongoDB:', error);
      }
    }
    
    // Return from memory storage
    return [...memoryStorage.presets].sort((a, b) => 
      b.createdAt.getTime() - a.createdAt.getTime()
    );
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