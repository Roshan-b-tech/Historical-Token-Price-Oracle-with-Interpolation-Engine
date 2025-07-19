import express from 'express';
import cors from 'cors';
import Redis from 'ioredis';
import { Queue, Worker } from 'bullmq';
import { MongoClient } from 'mongodb';
import axios from 'axios';
import 'dotenv/config';
import { Alchemy, Network, getAssetTransfers } from '@alch/alchemy-sdk';

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Redis connection
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD, // Only if your Redis requires auth
  maxRetriesPerRequest: null, // Updated to fix BullMQ deprecation warning
  retryDelayOnFailover: 100,
});

// MongoDB connection
let db;
MongoClient.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/token-oracle')
  .then(client => {
    db = client.db();
    console.log('Connected to MongoDB');
  })
  .catch(error => console.error('MongoDB connection error:', error));

// BullMQ Queue
const priceQueue = new Queue('price-fetching', { connection: redis });

// Interpolation Engine
class InterpolationEngine {
  static interpolate(ts_q, ts_before, price_before, ts_after, price_after) {
    const ratio = (ts_q - ts_before) / (ts_after - ts_before);
    return price_before + (price_after - price_before) * ratio;
  }

  static async findNearestPrices(token, network, timestamp) {
    if (!db) return null;

    const collection = db.collection('historical_prices');

    const before = await collection.findOne({
      token,
      network,
      timestamp: { $lte: timestamp }
    }, { sort: { timestamp: -1 } });

    const after = await collection.findOne({
      token,
      network,
      timestamp: { $gte: timestamp }
    }, { sort: { timestamp: 1 } });

    return { before, after };
  }
}

// Rate limiting with exponential backoff
class RateLimiter {
  constructor() {
    this.attempts = 0;
    this.baseDelay = 1000;
  }

  async executeWithBackoff(fn) {
    try {
      const result = await fn();
      this.attempts = 0;
      return result;
    } catch (error) {
      this.attempts++;
      const delay = this.baseDelay * Math.pow(2, this.attempts - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
      throw error;
    }
  }
}

const rateLimiter = new RateLimiter();

if (!process.env.ALCHEMY_API_KEY) {
  console.warn('WARNING: ALCHEMY_API_KEY is not set in environment variables. Alchemy SDK will not work.');
}

const alchemyInstances = {
  ethereum: new Alchemy({
    apiKey: process.env.ALCHEMY_API_KEY,
    network: Network.ETH_MAINNET,
  }),
  polygon: new Alchemy({
    apiKey: process.env.ALCHEMY_API_KEY,
    network: Network.MATIC_MAINNET,
  })
};

// Mock Alchemy API calls (replace with real Alchemy SDK)
async function fetchTokenPrice(token, network, timestamp) {
  return rateLimiter.executeWithBackoff(async () => {
    // Ensure timestamp is valid
    if (!timestamp || isNaN(timestamp)) {
      timestamp = Math.floor(Date.now() / 1000);
    }
    const date = new Date(timestamp * 1000);
    const dateString = `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;
    const coingeckoId = 'usd-coin';
    const url = `https://api.coingecko.com/api/v3/coins/${coingeckoId}/history?date=${dateString}`;
    const response = await axios.get(url);
    const price = response.data?.market_data?.current_price?.usd;
    return {
      price: price || null,
      timestamp,
    };
  });
}

async function getTokenCreationDate(token, network) {
  return rateLimiter.executeWithBackoff(async () => {
    const alchemy = alchemyInstances[network];
    console.log('DEBUG alchemy:', alchemy, 'network:', network);
    if (!alchemy) throw new Error('Unsupported network: ' + network);
    const transfers = await getAssetTransfers(alchemy, {
      fromBlock: "0x0",
      toBlock: "latest",
      contractAddresses: [token],
      category: ["erc20"],
      order: "asc",
      maxCount: 1,
    });
    console.log('Alchemy getAssetTransfers response:', transfers);
    const transfer = transfers.transfers[0];
    if (transfer) {
      // Get the block number as a decimal
      const blockNumber = parseInt(transfer.blockNum, 16);
      // Fetch the block details to get the timestamp
      const provider = alchemy.getProvider();
      const block = await provider.getBlock(blockNumber);
      if (block && block.timestamp) {
        return block.timestamp;
      }
    }
    throw new Error('No creation date found for token');
  });
}

// API Routes
app.get('/api/price', async (req, res) => {
  try {
    const { token, network, timestamp } = req.query;

    if (!token || !network) {
      return res.status(400).json({ error: 'Token and network are required' });
    }

    const cacheKey = `price:${token}:${network}:${timestamp || 'current'}`;

    // Check cache first
    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.json({
        ...JSON.parse(cached),
        source: 'cache'
      });
    }

    let result;

    if (timestamp) {
      // Check if exact price exists in database
      if (db) {
        const exact = await db.collection('historical_prices').findOne({
          token,
          network,
          timestamp: parseInt(timestamp)
        });

        if (exact) {
          result = {
            price: exact.price,
            timestamp: exact.timestamp,
            token,
            network,
            source: 'database'
          };
        } else {
          // Try interpolation
          const { before, after } = await InterpolationEngine.findNearestPrices(
            token, network, parseInt(timestamp)
          );

          if (before && after) {
            const interpolatedPrice = InterpolationEngine.interpolate(
              parseInt(timestamp),
              before.timestamp,
              before.price,
              after.timestamp,
              after.price
            );

            result = {
              price: interpolatedPrice,
              timestamp: parseInt(timestamp),
              token,
              network,
              source: 'interpolated'
            };
          } else {
            // Fallback to Alchemy API
            const alchemyResult = await fetchTokenPrice(token, network, parseInt(timestamp));
            result = {
              ...alchemyResult,
              token,
              network,
              source: 'alchemy'
            };
          }
        }
      }
    } else {
      // Current price from Alchemy
      const alchemyResult = await fetchTokenPrice(token, network);
      result = {
        ...alchemyResult,
        token,
        network,
        source: 'alchemy'
      };
    }

    // Cache the result
    await redis.setex(cacheKey, 300, JSON.stringify(result)); // 5 minutes cache

    res.json(result);
  } catch (error) {
    console.error('Price fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch price' });
  }
});

app.post('/api/schedule', async (req, res) => {
  try {
    const { token, network } = req.body;

    if (!token || !network) {
      return res.status(400).json({ error: 'Token and network are required' });
    }

    // Add job to queue
    await priceQueue.add('fetch-historical-prices', {
      token,
      network,
      startDate: await getTokenCreationDate(token, network)
    });

    res.json({ message: 'Historical price fetching scheduled' });
  } catch (error) {
    console.error('Schedule error:', error);
    res.status(500).json({ error: 'Failed to schedule job' });
  }
});

// API endpoint to get historical price history for a token/network
app.get('/api/history', async (req, res) => {
  try {
    const { token, network } = req.query;
    if (!token || !network) {
      return res.status(400).json({ error: 'Token and network are required' });
    }
    if (!db) {
      return res.status(500).json({ error: 'Database not connected' });
    }
    const prices = await db.collection('historical_prices')
      .find({ token, network })
      .sort({ timestamp: 1 })
      .project({ _id: 0, timestamp: 1, price: 1 })
      .toArray();
    res.json(prices);
  } catch (error) {
    console.error('History fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// BullMQ Worker
const worker = new Worker('price-fetching', async (job) => {
  const { token, network, startDate } = job.data;
  const endDate = Math.floor(Date.now() / 1000);

  console.log(`Fetching historical prices for ${token} on ${network}`);

  const dayInSeconds = 24 * 60 * 60;
  const dates = [];

  for (let date = startDate; date <= endDate; date += dayInSeconds) {
    dates.push(date);
  }

  // Process in batches to respect rate limits
  const batchSize = 5;
  for (let i = 0; i < dates.length; i += batchSize) {
    const batch = dates.slice(i, i + batchSize);

    await Promise.all(batch.map(async (date) => {
      try {
        const priceData = await fetchTokenPrice(token, network, date);
        if (db) {
          await db.collection('historical_prices').updateOne(
            { token, network, timestamp: date },
            {
              $set: {
                token,
                network,
                timestamp: date,
                price: priceData.price,
                date: new Date(date * 1000).toISOString().split('T')[0]
              }
            },
            { upsert: true }
          );
        }
      } catch (error) {
        console.error(`Error fetching price for ${date}:`, error);
      }
    }));

    // Progress update
    job.updateProgress(Math.round((i / dates.length) * 100));

    // Rate limiting delay (CoinGecko: 1.5s per call recommended)
    await new Promise(resolve => setTimeout(resolve, 1500));
  }
}, {
  connection: redis,
  lockDuration: 600000, // 10 minutes
  stalledInterval: 60000, // 1 minute
  maxStalledCount: 10, // allow more retries
});

worker.on('completed', (job) => {
  console.log(`Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed:`, err);
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

export default app;
export { InterpolationEngine };