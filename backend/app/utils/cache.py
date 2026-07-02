"""
Cache layer for improvement plans.
Supports Redis (preferred) and in-memory cache fallback.
"""

import json
import os
from abc import ABC, abstractmethod
from functools import lru_cache
from datetime import datetime, timedelta
from typing import Any, Optional, Dict
import asyncio
from app.logger import logger

# 90 days in seconds
CACHE_TTL_SECONDS = 7776000


class CacheStore(ABC):
    """Abstract cache store interface."""
    
    @abstractmethod
    async def get(self, key: str) -> Optional[Any]:
        """Retrieve value from cache."""
        pass
    
    @abstractmethod
    async def set(self, key: str, value: Any, ttl: int = CACHE_TTL_SECONDS) -> bool:
        """Store value in cache with TTL in seconds."""
        pass
    
    @abstractmethod
    async def delete(self, key: str) -> bool:
        """Delete value from cache."""
        pass
    
    @abstractmethod
    async def exists(self, key: str) -> bool:
        """Check if key exists in cache."""
        pass


class RedisCacheStore(CacheStore):
    """Redis-based cache store (preferred)."""
    
    def __init__(self, redis_url: Optional[str] = None):
        """Initialize Redis cache store.
        
        Args:
            redis_url: Redis connection URL (e.g., 'redis://localhost:6379')
                      Defaults to REDIS_URL environment variable
        """
        try:
            import redis.asyncio as redis
            self.redis = redis
            
            # Get Redis URL from env or parameter
            self.url = redis_url or os.getenv(
                "REDIS_URL", 
                "redis://localhost:6379"
            )
            self.client = None
            logger.info(f"Redis cache store initialized with URL: {self.url}")
        except ImportError:
            logger.warning(
                "redis package not installed. Falling back to in-memory cache. "
                "Install with: pip install redis"
            )
            self.client = None
    
    async def _ensure_connection(self):
        """Ensure Redis connection is established."""
        if self.client is None:
            try:
                self.client = await self.redis.from_url(self.url)
                await self.client.ping()
                logger.info("Redis connection established")
            except Exception as e:
                logger.error(f"Failed to connect to Redis: {e}")
                self.client = None
    
    async def get(self, key: str) -> Optional[Any]:
        """Retrieve value from Redis cache."""
        try:
            await self._ensure_connection()
            if self.client is None:
                return None
            
            value = await self.client.get(key)
            if value:
                return json.loads(value)
            return None
        except Exception as e:
            logger.warning(f"Redis get error for key {key}: {e}")
            return None
    
    async def set(self, key: str, value: Any, ttl: int = CACHE_TTL_SECONDS) -> bool:
        """Store value in Redis cache with TTL."""
        try:
            await self._ensure_connection()
            if self.client is None:
                return False
            
            serialized = json.dumps(value, default=str)
            await self.client.setex(key, ttl, serialized)
            logger.info(f"Cached {key} with TTL {ttl}s")
            return True
        except Exception as e:
            logger.warning(f"Redis set error for key {key}: {e}")
            return False
    
    async def delete(self, key: str) -> bool:
        """Delete value from Redis cache."""
        try:
            await self._ensure_connection()
            if self.client is None:
                return False
            
            result = await self.client.delete(key)
            logger.info(f"Deleted {key} from cache")
            return bool(result)
        except Exception as e:
            logger.warning(f"Redis delete error for key {key}: {e}")
            return False
    
    async def exists(self, key: str) -> bool:
        """Check if key exists in Redis cache."""
        try:
            await self._ensure_connection()
            if self.client is None:
                return False
            
            result = await self.client.exists(key)
            return bool(result)
        except Exception as e:
            logger.warning(f"Redis exists error for key {key}: {e}")
            return False


class InMemoryCacheStore(CacheStore):
    """In-memory cache store (fallback)."""
    
    def __init__(self):
        """Initialize in-memory cache store."""
        self.cache: Dict[str, Dict[str, Any]] = {}
        logger.info("In-memory cache store initialized")
    
    async def get(self, key: str) -> Optional[Any]:
        """Retrieve value from in-memory cache."""
        if key not in self.cache:
            return None
        
        entry = self.cache[key]
        
        # Check if entry has expired
        if entry["expires_at"] and datetime.now() >= entry["expires_at"]:
            del self.cache[key]
            logger.info(f"Cache entry {key} expired")
            return None
        
        logger.info(f"Cache hit for {key}")
        return entry["value"]
    
    async def set(self, key: str, value: Any, ttl: int = CACHE_TTL_SECONDS) -> bool:
        """Store value in in-memory cache with TTL."""
        expires_at = datetime.now() + timedelta(seconds=ttl)
        self.cache[key] = {
            "value": value,
            "expires_at": expires_at,
            "created_at": datetime.now()
        }
        logger.info(f"Cached {key} in memory with TTL {ttl}s, expires at {expires_at}")
        return True
    
    async def delete(self, key: str) -> bool:
        """Delete value from in-memory cache."""
        if key in self.cache:
            del self.cache[key]
            logger.info(f"Deleted {key} from memory cache")
            return True
        return False
    
    async def exists(self, key: str) -> bool:
        """Check if key exists in in-memory cache."""
        if key not in self.cache:
            return False
        
        entry = self.cache[key]
        
        # Check if entry has expired
        if entry["expires_at"] and datetime.now() >= entry["expires_at"]:
            del self.cache[key]
            return False
        
        return True


# Global cache instance
_cache_instance: Optional[CacheStore] = None


async def get_cache() -> CacheStore:
    """Get or initialize the global cache instance.
    
    Returns:
        CacheStore: Redis cache if available and configured, otherwise in-memory cache
    """
    global _cache_instance
    
    if _cache_instance is not None:
        return _cache_instance
    
    # Try Redis first
    use_redis = os.getenv("USE_REDIS", "true").lower() == "true"
    
    if use_redis:
        redis_cache = RedisCacheStore()
        # Test connection
        try:
            await redis_cache._ensure_connection()
            if redis_cache.client is not None:
                _cache_instance = redis_cache
                logger.info("Using Redis cache store")
                return _cache_instance
        except Exception as e:
            logger.warning(f"Redis not available: {e}")
    
    # Fallback to in-memory
    _cache_instance = InMemoryCacheStore()
    logger.info("Using in-memory cache store (fallback)")
    return _cache_instance


async def cache_get(key: str) -> Optional[Any]:
    """Retrieve value from cache."""
    cache = await get_cache()
    return await cache.get(key)


async def cache_set(key: str, value: Any, ttl: int = CACHE_TTL_SECONDS) -> bool:
    """Store value in cache with TTL."""
    cache = await get_cache()
    return await cache.set(key, value, ttl)


async def cache_delete(key: str) -> bool:
    """Delete value from cache."""
    cache = await get_cache()
    return await cache.delete(key)


async def cache_exists(key: str) -> bool:
    """Check if key exists in cache."""
    cache = await get_cache()
    return await cache.exists(key)


def build_cache_key(session_id: str) -> str:
    """Build cache key for improvement plan."""
    return f"improvement_plan:{session_id}"
