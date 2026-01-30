# Feature Blueprint: Geo-Availability
**Domain:** Marketplace
**Related Epics:** [Epic 3: Marketplace & Search](../../../prd/epic-3.md)

> **Important:** This blueprint documents both PostgreSQL extensions and TypeScript Haversine formula implementations. **For all search queries, the worker search engine uses PostgreSQL extensions (`earthdistance` or `postgis`) for distance calculations at the database level.** The TypeScript Haversine formula shown below is used for client-side validation, UI display calculations, or fallback scenarios. See the "Important Note" section below for details on when to use each approach.

## Requirement Reference

For detailed business rules, acceptance criteria, and context, see:
- [Epic 3.2: Distance Radius Filtering](../../../prd/epic-3.md#story-32-distance-radius-filtering)

## Technical Strategy (The "How")

### Zip Code Coordinate Storage

**Schema Reference:** See [schema-marketplace.md](../../schema-marketplace.md) for complete table definition, indexes, constraints, and foreign keys:
- `zip_codes` - Zip code coordinate storage for geo-availability calculations

### Haversine Distance Formula

**Distance Calculation:**
```typescript
interface Coordinates {
  latitude: number;
  longitude: number;
}

function calculateDistance(
  coord1: Coordinates, 
  coord2: Coordinates
): number {
  const R = 3959; // Earth radius in miles (Haversine formula constant)
  
  const dLat = toRadians(coord2.latitude - coord1.latitude);
  const dLon = toRadians(coord2.longitude - coord1.longitude);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(coord1.latitude)) * 
    Math.cos(toRadians(coord2.latitude)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}
```

**Important Note: PostgreSQL Extensions vs. TypeScript Calculations**

**For Search Queries:** The worker search engine uses PostgreSQL extensions (`earthdistance` or `postgis`) for distance calculations in SQL queries. This provides:
- **Database-Level Filtering:** Distance filtering happens at the database level, reducing data transfer
- **Query Optimization:** Database can use indexes and query optimization for geo queries
- **Performance:** More efficient than calculating distances in application code for large result sets

**For TypeScript Calculations:** The Haversine formula shown above is used for:
- **Client-Side Validation:** Pre-validating distance before submitting search queries
- **Non-Search Distance Calculations:** Distance calculations outside of search queries (e.g., displaying distance in UI, calculating travel time estimates)
- **Fallback Scenarios:** If PostgreSQL extensions are unavailable, the application can fall back to TypeScript calculations (with degraded performance)

**Search Query Implementation:** See [Worker Search Engine Blueprint](../marketplace/worker-search-engine.md) for the actual SQL implementation using PostgreSQL extensions:
```sql
-- Example from worker-search-engine.md
(point(zip.longitude, zip.latitude) <@> point($search_long, $search_lat)) as distance_miles
```

**When to Use Each Approach:**
- **Use PostgreSQL Extensions:** For all search queries, availability checks, and any database-level filtering
- **Use TypeScript Haversine:** For client-side validation, UI display calculations, or fallback scenarios when extensions are unavailable

### Zip Code Lookup

**Coordinate Retrieval:**
```typescript
async function getZipCodeCoordinates(zipCode: string): Promise<Coordinates | null> {
  // Check cache first
  const cacheKey = `zipcode:${zipCode}`;
  const cached = await redis.get(cacheKey);
  
  if (cached) {
    return JSON.parse(cached);
  }

  // Query database
  const zipCodeData = await db('zip_codes')
    .where({ zip_code: zipCode })
    .first();

  if (!zipCodeData) {
    // Try to geocode via external API (e.g., Google Maps Geocoding)
    const coordinates = await geocodeZipCode(zipCode);
    
    if (coordinates) {
      // Store in database for future use
      await db('zip_codes').insert({
        zip_code: zipCode,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude
      });
      
      // Cache for 24 hours
      await redis.setex(cacheKey, 86400, JSON.stringify(coordinates));
      
      return coordinates;
    }
    
    return null;
  }

  const coordinates = {
    latitude: parseFloat(zipCodeData.latitude),
    longitude: parseFloat(zipCodeData.longitude)
  };

  // Cache for 24 hours (86400 seconds)
  await redis.setex(cacheKey, 86400, JSON.stringify(coordinates));

  return coordinates;
}

async function geocodeZipCode(zipCode: string): Promise<Coordinates | null> {
  // Use Google Maps Geocoding API or similar
  const response = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${zipCode}&key=${process.env.GOOGLE_MAPS_API_KEY}`
  );
  
  const data = await response.json();
  
  if (data.results && data.results.length > 0) {
    const location = data.results[0].geometry.location;
    return {
      latitude: location.lat,
      longitude: location.lng
    };
  }
  
  return null;
}
```

### Distance Filter in Search Query

**PostgreSQL Distance Filter:**
```typescript
function addDistanceFilter(
  query: any, 
  searchZipCode: string, 
  maxDistanceMiles: number
) {
  // Get search location coordinates
  const searchCoords = await getZipCodeCoordinates(searchZipCode);
  
  if (!searchCoords) {
    throw new Error(`Invalid zip code: ${searchZipCode}`);
  }

  // Add distance calculation to query
  // Using PostgreSQL's point type and distance operator
  query
    .innerJoin('zip_codes as search_zip', function() {
      this.on('search_zip.zip_code', '=', db.raw('?', [searchZipCode]));
    })
    .innerJoin('zip_codes as worker_zip', 'worker_profiles.home_zip_code', 'worker_zip.zip_code')
    .whereRaw(`
      (
        3959 * acos(
          cos(radians(?)) * 
          cos(radians(worker_zip.latitude)) * 
          cos(radians(worker_zip.longitude) - radians(?)) + 
          sin(radians(?)) * 
          sin(radians(worker_zip.latitude))
        )
      ) <= worker_profiles.max_travel_distance_miles
      AND
      (
        3959 * acos(
          cos(radians(?)) * 
          cos(radians(worker_zip.latitude)) * 
          cos(radians(worker_zip.longitude) - radians(?)) + 
          sin(radians(?)) * 
          sin(radians(worker_zip.latitude))
        )
      ) <= ?
    `, [
      searchCoords.latitude, searchCoords.longitude, searchCoords.latitude, // For worker radius check
      searchCoords.latitude, searchCoords.longitude, searchCoords.latitude, // For search radius check
      maxDistanceMiles
    ])
    .select(
      db.raw(`
        (
          3959 * acos(
            cos(radians(?)) * 
            cos(radians(worker_zip.latitude)) * 
            cos(radians(worker_zip.longitude) - radians(?)) + 
            sin(radians(?)) * 
            sin(radians(worker_zip.latitude))
          )
        ) as distance_miles
      `, [searchCoords.latitude, searchCoords.longitude, searchCoords.latitude])
    );

  return query;
}
```

### Worker Profile Update

**Set Home Location:**
```typescript
async function updateWorkerHomeLocation(req: Request, res: Response) {
  const { workerId } = req.params;
  const { homeZipCode, maxTravelDistanceMiles } = req.body;
  const companyId = req.user.companyId;

  // Verify worker belongs to company
  const membership = await db('company_members')
    .where({ user_id: workerId, company_id: companyId, status: 'Active' })
    .first();

  if (!membership) {
    return res.status(404).json({ 
      error: 'Worker not found',
      userHint: 'Worker is not a member of this company'
    });
  }

  // Verify zip code exists or can be geocoded
  const coordinates = await getZipCodeCoordinates(homeZipCode);
  if (!coordinates) {
    return res.status(400).json({ 
      error: 'Invalid zip code',
      userHint: 'Please enter a valid US zip code'
    });
  }

  // Update worker profile
  await db('worker_profiles')
    .where({ user_id: workerId })
    .update({
      home_zip_code: homeZipCode,
      max_travel_distance_miles: maxTravelDistanceMiles || 50,
      updated_at: new Date()
    });

  res.json({ 
    success: true,
    homeZipCode,
    maxTravelDistanceMiles: maxTravelDistanceMiles || 50
  });
}
```

### Search with Distance Filter

**Enhanced Search:**
```typescript
async function searchWorkersWithDistance(req: Request, res: Response) {
  const { 
    searchZipCode, 
    maxDistanceMiles,
    ...otherFilters 
  } = req.query;

  let query = buildSearchQuery(otherFilters);

  // Add distance filter if provided
  if (searchZipCode && maxDistanceMiles) {
    query = addDistanceFilter(query, searchZipCode, parseInt(maxDistanceMiles));
  }

  const results = await query;

  // Format results with distance
  const formattedResults = results.map(worker => ({
    ...worker,
    distanceMiles: parseFloat(worker.distance_miles).toFixed(1),
    distanceDisplay: `${parseFloat(worker.distance_miles).toFixed(1)} miles from ${searchZipCode}`
  }));

  res.json({ results: formattedResults });
}
```

### Performance Optimization

**Bounding Box Pre-Filter:**
```typescript
// Use bounding box to quickly filter before expensive distance calculation
function getBoundingBox(center: Coordinates, radiusMiles: number) {
  const latDelta = radiusMiles / 69; // Approximate miles per degree latitude
  const lonDelta = radiusMiles / (69 * Math.cos(toRadians(center.latitude)));
  
  return {
    minLat: center.latitude - latDelta,
    maxLat: center.latitude + latDelta,
    minLon: center.longitude - lonDelta,
    maxLon: center.longitude + lonDelta
  };
}

function addBoundingBoxFilter(query: any, searchCoords: Coordinates, maxDistanceMiles: number) {
  const bbox = getBoundingBox(searchCoords, maxDistanceMiles);
  
  query
    .innerJoin('zip_codes as worker_zip', 'worker_profiles.home_zip_code', 'worker_zip.zip_code')
    .whereBetween('worker_zip.latitude', [bbox.minLat, bbox.maxLat])
    .whereBetween('worker_zip.longitude', [bbox.minLon, bbox.maxLon]);
  
  return query;
}
```

## 4. Edge Cases & Failure Handling

### Invalid Zip Codes

**Scenario:** User enters invalid or non-existent zip code
- **Solution:** Validate zip code format, attempt geocoding
- **Error Handling:** Return clear error message if zip code cannot be geocoded
- **Fallback:** Suggest similar zip codes if available

### Coordinate Precision

**Scenario:** Distance calculations need high precision
- **Solution:** Use DECIMAL type for coordinates (10,8 for lat, 11,8 for lon)
- **Calculation:** Haversine formula provides accuracy within ~0.5% for distances
- **Testing:** Validate against known distances

### Performance with Large Datasets

**Scenario:** Thousands of workers, distance calculation is slow
- **Solution:** 
  - Use bounding box pre-filter to reduce candidates
  - Index zip code coordinates
  - Cache zip code lookups
  - Consider PostGIS extension for advanced geo queries
- **Optimization:** Calculate distance only for workers within bounding box

### Missing Zip Code Data

**Scenario:** Worker's zip code not in database
- **Solution:** Geocode on-demand and store in database
- **Caching:** Cache geocoded results to avoid repeated API calls
- **Rate Limiting:** Respect geocoding API rate limits

## Data Model Impact

### Tables Modified/Created

**Schema Reference:** See [schema-marketplace.md](../../schema-marketplace.md) for complete table definitions, indexes, constraints, and foreign keys:
- `zip_codes` - Zip code coordinate storage for geo-availability calculations
- `worker_profiles` - Added `home_zip_code` and `max_travel_distance_miles` columns

### External Dependencies

**APIs:**
- Google Maps Geocoding API (or similar) for zip code coordinate lookup
- Alternative: USPS Zip Code API, GeoNames API

**Environment Variables:**
```env
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

### Performance Considerations

1. **Caching:** Cache zip code coordinates in Redis (24-hour TTL)
2. **Bounding Box:** Use bounding box pre-filter before expensive distance calculation
3. **Database Indexes:** Index zip code coordinates for fast lookups
4. **PostGIS:** Consider PostGIS extension for production-scale geo queries
5. **Batch Geocoding:** Pre-populate zip code database with common zip codes
