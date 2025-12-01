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
