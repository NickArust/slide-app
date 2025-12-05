-- Enable PostGIS, add a geography(Point,4326) column, and index it.
CREATE EXTENSION IF NOT EXISTS postgis;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='Event' AND column_name='geom'
  ) THEN
    ALTER TABLE "Event" ADD COLUMN geom geography(Point,4326);
    UPDATE "Event" SET geom = ST_SetSRID(ST_MakePoint("lng","lat"),4326)::geography;
    CREATE INDEX IF NOT EXISTS event_geom_gist ON "Event" USING GIST (geom);
  END IF;
END $$;


-- Function to automatically sync geom from lat/lng
CREATE OR REPLACE FUNCTION update_event_geom() RETURNS TRIGGER AS $$
BEGIN
    -- Check if lat/lng are present; if so, create the geometry point
    IF NEW.lat IS NOT NULL AND NEW.lng IS NOT NULL THEN
      NEW.geom := ST_SetSRID(ST_MakePoint(NEW.lng, NEW.lat), 4326)::geography;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it exists to allow re-running this script safely
DROP TRIGGER IF EXISTS event_geom_update ON "Event";

-- Attach the trigger to the Event table
CREATE TRIGGER event_geom_update
BEFORE INSERT OR UPDATE OF lat, lng ON "Event"
FOR EACH ROW
EXECUTE FUNCTION update_event_geom();
