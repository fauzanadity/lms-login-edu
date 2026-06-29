-- ============================================================================
-- LOGIN EDU — Initial Schema Migration
-- ============================================================================
-- Bimbel (tutoring) platform built on Supabase (Postgres).
-- This file creates every table, index, helper function, RLS policy, and
-- trigger required by the application.  It is intended to be executed once
-- via the Supabase migration runner or SQL Editor.
--
-- Created: 2026-06-28
-- ============================================================================


-- ============================================================================
-- 1. TABLES (in dependency order)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1.1  programs
-- ----------------------------------------------------------------------------
-- A program represents a tutoring package (e.g. "UTBK 2026 Batch 1").
-- Students join a program by entering its token during registration.
-- ----------------------------------------------------------------------------
CREATE TABLE programs (
    id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    name                  text        NOT NULL,
    token                 text        NOT NULL UNIQUE,
    token_valid_from      timestamptz NOT NULL,
    token_valid_until     timestamptz NOT NULL,
    title                 text,
    subtitle              text,
    description           text,
    drive_access_notice   text,       -- notice text for Google Drive access
    drive_access_form_url text,       -- Google Form link for Drive access
    is_active             boolean     NOT NULL DEFAULT true,
    created_at            timestamptz NOT NULL DEFAULT now(),
    updated_at            timestamptz NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 1.2  students
-- ----------------------------------------------------------------------------
-- Each student row is linked 1-to-1 with a Supabase Auth user.
-- Soft-delete: deleted_at IS NULL means active; non-null means deleted.
-- ----------------------------------------------------------------------------
CREATE TABLE students (
    id          uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name   text        NOT NULL,
    university  text        NOT NULL,
    major       text        NOT NULL,
    birth_date  date        NOT NULL,
    email       text        NOT NULL UNIQUE,
    program_id  uuid        REFERENCES programs(id) ON DELETE SET NULL,
    deleted_at  timestamptz,          -- soft delete flag
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 1.3  admins
-- ----------------------------------------------------------------------------
-- Admin profiles, also linked 1-to-1 with Supabase Auth users.
-- ----------------------------------------------------------------------------
CREATE TABLE admins (
    id         uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name  text        NOT NULL,
    email      text        NOT NULL UNIQUE,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 1.4  materials
-- ----------------------------------------------------------------------------
-- Learning materials (Google Drive links) created by admins.
-- ----------------------------------------------------------------------------
CREATE TABLE materials (
    id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    title      text        NOT NULL,
    subtitle   text,
    drive_url  text        NOT NULL,
    created_by uuid        REFERENCES admins(id),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 1.5  material_programs  (junction: materials ↔ programs)
-- ----------------------------------------------------------------------------
CREATE TABLE material_programs (
    material_id uuid NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
    program_id  uuid NOT NULL REFERENCES programs(id)  ON DELETE CASCADE,
    PRIMARY KEY (material_id, program_id)
);

-- ----------------------------------------------------------------------------
-- 1.6  exercises
-- ----------------------------------------------------------------------------
-- Exercises or tryouts created by admins.  The questions payload is stored as
-- JSONB so the front-end can render them dynamically.
-- ----------------------------------------------------------------------------
CREATE TABLE exercises (
    id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    title              text        NOT NULL,
    subtitle           text,
    type               text        NOT NULL CHECK (type IN ('exercise', 'tryout')),
    question_count     integer     NOT NULL,
    questions_json     jsonb       NOT NULL,
    time_limit_minutes integer     NOT NULL,
    created_by         uuid        REFERENCES admins(id),
    created_at         timestamptz NOT NULL DEFAULT now(),
    updated_at         timestamptz NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 1.7  exercise_programs  (junction: exercises ↔ programs)
-- ----------------------------------------------------------------------------
CREATE TABLE exercise_programs (
    exercise_id uuid NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
    program_id  uuid NOT NULL REFERENCES programs(id)  ON DELETE CASCADE,
    PRIMARY KEY (exercise_id, program_id)
);

-- ----------------------------------------------------------------------------
-- 1.8  attempts
-- ----------------------------------------------------------------------------
-- Tracks a student's attempt at an exercise / tryout.
-- exercise_type is denormalized from exercises.type to support the partial
-- unique index that limits tryout attempts to one per student per exercise.
-- ----------------------------------------------------------------------------
CREATE TABLE attempts (
    id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id        uuid        REFERENCES students(id),
    exercise_id       uuid        REFERENCES exercises(id),
    exercise_type     text        NOT NULL DEFAULT 'exercise',  -- denormalized
    answers_json      jsonb       NOT NULL DEFAULT '{}',
    score             numeric,
    is_graded         boolean     NOT NULL DEFAULT true,
    started_at        timestamptz NOT NULL DEFAULT now(),
    last_autosaved_at timestamptz,
    submitted_at      timestamptz,
    created_at        timestamptz NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 1.9  broadcasts
-- ----------------------------------------------------------------------------
-- Announcements / notifications published by admins.
-- ----------------------------------------------------------------------------
CREATE TABLE broadcasts (
    id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
    title      text        NOT NULL,
    message    text        NOT NULL,
    created_by uuid        REFERENCES admins(id),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 1.10 broadcast_programs  (junction: broadcasts ↔ programs)
-- ----------------------------------------------------------------------------
CREATE TABLE broadcast_programs (
    broadcast_id uuid NOT NULL REFERENCES broadcasts(id) ON DELETE CASCADE,
    program_id   uuid NOT NULL REFERENCES programs(id)   ON DELETE CASCADE,
    PRIMARY KEY (broadcast_id, program_id)
);


-- ============================================================================
-- 2. INDEXES
-- ============================================================================

-- students
CREATE INDEX idx_students_program_id  ON students(program_id);
CREATE INDEX idx_students_email       ON students(email);
CREATE INDEX idx_students_deleted_at  ON students(deleted_at) WHERE deleted_at IS NULL;

-- attempts
CREATE INDEX  idx_attempts_student_id       ON attempts(student_id);
CREATE INDEX  idx_attempts_exercise_id      ON attempts(exercise_id);
CREATE INDEX  idx_attempts_student_exercise ON attempts(student_id, exercise_id);

-- Partial unique index: each student may only have ONE tryout attempt per exercise.
CREATE UNIQUE INDEX idx_unique_tryout_attempt
    ON attempts(student_id, exercise_id)
    WHERE exercise_type = 'tryout';

-- exercise_programs
CREATE INDEX idx_exercise_programs_program_id  ON exercise_programs(program_id);
CREATE INDEX idx_exercise_programs_exercise_id ON exercise_programs(exercise_id);

-- material_programs
CREATE INDEX idx_material_programs_program_id  ON material_programs(program_id);
CREATE INDEX idx_material_programs_material_id ON material_programs(material_id);

-- broadcast_programs
CREATE INDEX idx_broadcast_programs_program_id    ON broadcast_programs(program_id);
CREATE INDEX idx_broadcast_programs_broadcast_id  ON broadcast_programs(broadcast_id);

-- programs
CREATE INDEX idx_programs_token     ON programs(token);
CREATE INDEX idx_programs_is_active ON programs(is_active) WHERE is_active = true;


-- ============================================================================
-- 3. HELPER FUNCTIONS FOR RLS
-- ============================================================================

-- is_admin()  — returns TRUE when the current Supabase Auth user has a row in admins.
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT EXISTS (
        SELECT 1 FROM admins WHERE id = auth.uid()
    );
$$;

-- get_student_program_id()  — returns the program_id of the current user's
-- active (non-deleted) student record, or NULL if not found.
CREATE OR REPLACE FUNCTION get_student_program_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT program_id
    FROM students
    WHERE id = auth.uid()
      AND deleted_at IS NULL;
$$;


-- ============================================================================
-- 4. ROW LEVEL SECURITY — enable on ALL tables
-- ============================================================================

ALTER TABLE programs           ENABLE ROW LEVEL SECURITY;
ALTER TABLE students           ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins             ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials          ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_programs  ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises          ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_programs  ENABLE ROW LEVEL SECURITY;
ALTER TABLE attempts           ENABLE ROW LEVEL SECURITY;
ALTER TABLE broadcasts         ENABLE ROW LEVEL SECURITY;
ALTER TABLE broadcast_programs ENABLE ROW LEVEL SECURITY;


-- ============================================================================
-- 5. RLS POLICIES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 5.1  programs
-- ----------------------------------------------------------------------------
-- Students may view active programs (needed for token validation at registration).
CREATE POLICY "students_select_active_programs"
    ON programs FOR SELECT
    USING (is_active = true);

-- Admins: full CRUD
CREATE POLICY "admins_select_programs"
    ON programs FOR SELECT
    USING (is_admin());

CREATE POLICY "admins_insert_programs"
    ON programs FOR INSERT
    WITH CHECK (is_admin());

CREATE POLICY "admins_update_programs"
    ON programs FOR UPDATE
    USING (is_admin())
    WITH CHECK (is_admin());

CREATE POLICY "admins_delete_programs"
    ON programs FOR DELETE
    USING (is_admin());

-- ----------------------------------------------------------------------------
-- 5.2  students
-- ----------------------------------------------------------------------------
-- A student can read their own active row.
CREATE POLICY "students_select_own"
    ON students FOR SELECT
    USING (id = auth.uid() AND deleted_at IS NULL);

-- A student can update their own active row.
CREATE POLICY "students_update_own"
    ON students FOR UPDATE
    USING (id = auth.uid() AND deleted_at IS NULL)
    WITH CHECK (id = auth.uid() AND deleted_at IS NULL);

-- Admins: full CRUD on all student rows.
CREATE POLICY "admins_select_students"
    ON students FOR SELECT
    USING (is_admin());

CREATE POLICY "admins_insert_students"
    ON students FOR INSERT
    WITH CHECK (is_admin());

CREATE POLICY "admins_update_students"
    ON students FOR UPDATE
    USING (is_admin())
    WITH CHECK (is_admin());

CREATE POLICY "admins_delete_students"
    ON students FOR DELETE
    USING (is_admin());

-- ----------------------------------------------------------------------------
-- 5.3  admins
-- ----------------------------------------------------------------------------
-- Each admin can read their own row.
CREATE POLICY "admins_select_own"
    ON admins FOR SELECT
    USING (id = auth.uid());

-- Admins can also list all other admins.
CREATE POLICY "admins_select_all"
    ON admins FOR SELECT
    USING (is_admin());

-- Each admin can update their own row.
CREATE POLICY "admins_update_own"
    ON admins FOR UPDATE
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- ----------------------------------------------------------------------------
-- 5.4  materials
-- ----------------------------------------------------------------------------
-- Students can view materials linked to their program.
CREATE POLICY "students_select_materials"
    ON materials FOR SELECT
    USING (
        EXISTS (
            SELECT 1
            FROM material_programs mp
            WHERE mp.material_id = materials.id
              AND mp.program_id  = (
                  SELECT program_id FROM students
                  WHERE id = auth.uid() AND deleted_at IS NULL
              )
        )
    );

-- Admins: full CRUD
CREATE POLICY "admins_select_materials"
    ON materials FOR SELECT
    USING (is_admin());

CREATE POLICY "admins_insert_materials"
    ON materials FOR INSERT
    WITH CHECK (is_admin());

CREATE POLICY "admins_update_materials"
    ON materials FOR UPDATE
    USING (is_admin())
    WITH CHECK (is_admin());

CREATE POLICY "admins_delete_materials"
    ON materials FOR DELETE
    USING (is_admin());

-- ----------------------------------------------------------------------------
-- 5.5  material_programs
-- ----------------------------------------------------------------------------
-- Students can see junction rows that match their own program.
CREATE POLICY "students_select_material_programs"
    ON material_programs FOR SELECT
    USING (
        program_id = (
            SELECT program_id FROM students
            WHERE id = auth.uid() AND deleted_at IS NULL
        )
    );

-- Admins: full CRUD
CREATE POLICY "admins_select_material_programs"
    ON material_programs FOR SELECT
    USING (is_admin());

CREATE POLICY "admins_insert_material_programs"
    ON material_programs FOR INSERT
    WITH CHECK (is_admin());

CREATE POLICY "admins_update_material_programs"
    ON material_programs FOR UPDATE
    USING (is_admin())
    WITH CHECK (is_admin());

CREATE POLICY "admins_delete_material_programs"
    ON material_programs FOR DELETE
    USING (is_admin());

-- ----------------------------------------------------------------------------
-- 5.6  exercises
-- ----------------------------------------------------------------------------
-- Students can view exercises linked to their program.
CREATE POLICY "students_select_exercises"
    ON exercises FOR SELECT
    USING (
        EXISTS (
            SELECT 1
            FROM exercise_programs ep
            WHERE ep.exercise_id = exercises.id
              AND ep.program_id  = (
                  SELECT program_id FROM students
                  WHERE id = auth.uid() AND deleted_at IS NULL
              )
        )
    );

-- Admins: full CRUD
CREATE POLICY "admins_select_exercises"
    ON exercises FOR SELECT
    USING (is_admin());

CREATE POLICY "admins_insert_exercises"
    ON exercises FOR INSERT
    WITH CHECK (is_admin());

CREATE POLICY "admins_update_exercises"
    ON exercises FOR UPDATE
    USING (is_admin())
    WITH CHECK (is_admin());

CREATE POLICY "admins_delete_exercises"
    ON exercises FOR DELETE
    USING (is_admin());

-- ----------------------------------------------------------------------------
-- 5.7  exercise_programs
-- ----------------------------------------------------------------------------
-- Students can see junction rows matching their program.
CREATE POLICY "students_select_exercise_programs"
    ON exercise_programs FOR SELECT
    USING (
        program_id = (
            SELECT program_id FROM students
            WHERE id = auth.uid() AND deleted_at IS NULL
        )
    );

-- Admins: full CRUD
CREATE POLICY "admins_select_exercise_programs"
    ON exercise_programs FOR SELECT
    USING (is_admin());

CREATE POLICY "admins_insert_exercise_programs"
    ON exercise_programs FOR INSERT
    WITH CHECK (is_admin());

CREATE POLICY "admins_update_exercise_programs"
    ON exercise_programs FOR UPDATE
    USING (is_admin())
    WITH CHECK (is_admin());

CREATE POLICY "admins_delete_exercise_programs"
    ON exercise_programs FOR DELETE
    USING (is_admin());

-- ----------------------------------------------------------------------------
-- 5.8  attempts
-- ----------------------------------------------------------------------------
-- Students can view their own attempts.
CREATE POLICY "students_select_own_attempts"
    ON attempts FOR SELECT
    USING (student_id = auth.uid());

-- Students can create attempts for themselves.
CREATE POLICY "students_insert_own_attempts"
    ON attempts FOR INSERT
    WITH CHECK (student_id = auth.uid());

-- Students can update their own attempts (auto-save, submit, etc.).
-- Column-level restrictions (answers_json, last_autosaved_at, submitted_at,
-- score, is_graded) should be enforced at the application layer or via a
-- BEFORE UPDATE trigger; Postgres RLS operates at row level.
CREATE POLICY "students_update_own_attempts"
    ON attempts FOR UPDATE
    USING (student_id = auth.uid())
    WITH CHECK (student_id = auth.uid());

-- Admins: full CRUD (grading, export, etc.)
CREATE POLICY "admins_select_attempts"
    ON attempts FOR SELECT
    USING (is_admin());

CREATE POLICY "admins_insert_attempts"
    ON attempts FOR INSERT
    WITH CHECK (is_admin());

CREATE POLICY "admins_update_attempts"
    ON attempts FOR UPDATE
    USING (is_admin())
    WITH CHECK (is_admin());

CREATE POLICY "admins_delete_attempts"
    ON attempts FOR DELETE
    USING (is_admin());

-- ----------------------------------------------------------------------------
-- 5.9  broadcasts
-- ----------------------------------------------------------------------------
-- Students can view broadcasts linked to their program.
CREATE POLICY "students_select_broadcasts"
    ON broadcasts FOR SELECT
    USING (
        EXISTS (
            SELECT 1
            FROM broadcast_programs bp
            WHERE bp.broadcast_id = broadcasts.id
              AND bp.program_id   = (
                  SELECT program_id FROM students
                  WHERE id = auth.uid() AND deleted_at IS NULL
              )
        )
    );

-- Admins: full CRUD
CREATE POLICY "admins_select_broadcasts"
    ON broadcasts FOR SELECT
    USING (is_admin());

CREATE POLICY "admins_insert_broadcasts"
    ON broadcasts FOR INSERT
    WITH CHECK (is_admin());

CREATE POLICY "admins_update_broadcasts"
    ON broadcasts FOR UPDATE
    USING (is_admin())
    WITH CHECK (is_admin());

CREATE POLICY "admins_delete_broadcasts"
    ON broadcasts FOR DELETE
    USING (is_admin());

-- ----------------------------------------------------------------------------
-- 5.10  broadcast_programs
-- ----------------------------------------------------------------------------
-- Students can see junction rows matching their program.
CREATE POLICY "students_select_broadcast_programs"
    ON broadcast_programs FOR SELECT
    USING (
        program_id = (
            SELECT program_id FROM students
            WHERE id = auth.uid() AND deleted_at IS NULL
        )
    );

-- Admins: full CRUD
CREATE POLICY "admins_select_broadcast_programs"
    ON broadcast_programs FOR SELECT
    USING (is_admin());

CREATE POLICY "admins_insert_broadcast_programs"
    ON broadcast_programs FOR INSERT
    WITH CHECK (is_admin());

CREATE POLICY "admins_update_broadcast_programs"
    ON broadcast_programs FOR UPDATE
    USING (is_admin())
    WITH CHECK (is_admin());

CREATE POLICY "admins_delete_broadcast_programs"
    ON broadcast_programs FOR DELETE
    USING (is_admin());


-- ============================================================================
-- 6. UPDATED_AT TRIGGER
-- ============================================================================

-- Generic trigger function: sets updated_at = now() on every UPDATE.
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Apply the trigger to every table that carries an updated_at column.
CREATE TRIGGER trg_programs_updated_at
    BEFORE UPDATE ON programs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_students_updated_at
    BEFORE UPDATE ON students
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_admins_updated_at
    BEFORE UPDATE ON admins
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_materials_updated_at
    BEFORE UPDATE ON materials
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_exercises_updated_at
    BEFORE UPDATE ON exercises
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_broadcasts_updated_at
    BEFORE UPDATE ON broadcasts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ============================================================================
-- End of migration 001_initial_schema.sql
-- ============================================================================
