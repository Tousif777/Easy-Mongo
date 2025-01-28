const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 1000;

const cacheRead = async (Model, filter = {}, projection = {}, options = {}) => {
  const cacheKey = JSON.stringify({ filter, projection, options });
  const cached = cache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  
  const result = await Model.find(filter, projection, options);
  
  if (cache.size >= MAX_CACHE_SIZE) {
    const oldestKey = cache.keys().next().value;
    cache.delete(oldestKey);
  }
  
  cache.set(cacheKey, { data: result, timestamp: Date.now() });
  return result;
};

const clearCache = () => cache.clear();
const getCacheSize = () => cache.size;

module.exports = {
  cacheRead,
  clearCache,
  getCacheSize,
  _cache: process.env.NODE_ENV === 'test' ? cache : undefined
}; 