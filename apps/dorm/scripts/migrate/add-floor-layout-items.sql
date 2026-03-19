-- Migration: add floor_layout_items table for 3D property viewer
-- Run once against the Neon production database.
-- Idempotent — safe to run more than once.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'floor_layout_item_type') THEN
    CREATE TYPE floor_layout_item_type AS ENUM (
      'RENTAL_UNIT',
      'CORRIDOR',
      'BATHROOM',
      'KITCHEN',
      'COMMON_ROOM',
      'STAIRWELL',
      'ELEVATOR',
      'STORAGE',
      'OFFICE',
      'CUSTOM'
    );
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS floor_layout_items (
  id              serial PRIMARY KEY,
  floor_id        integer NOT NULL REFERENCES floors(id),
  rental_unit_id  integer REFERENCES rental_unit(id),
  item_type       floor_layout_item_type NOT NULL,
  grid_x          integer NOT NULL,
  grid_y          integer NOT NULL,
  grid_w          integer NOT NULL DEFAULT 2,
  grid_h          integer NOT NULL DEFAULT 2,
  label           text,
  color           text,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now(),
  deleted_at      timestamptz
);

-- Index for the most common query: all items on a floor
CREATE INDEX IF NOT EXISTS idx_floor_layout_items_floor_id
  ON floor_layout_items(floor_id);

-- Reverse lookup: which item links to a rental_unit
CREATE INDEX IF NOT EXISTS idx_floor_layout_items_rental_unit_id
  ON floor_layout_items(rental_unit_id)
  WHERE rental_unit_id IS NOT NULL;

-- Checkpoint-based replication cursor (updated_at + id)
CREATE INDEX IF NOT EXISTS idx_floor_layout_items_updated_at_id
  ON floor_layout_items(updated_at ASC, id ASC);
