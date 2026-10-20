ALTER TABLE "QuizCandidate"
ADD COLUMN "maxSubmissionsOverride" INTEGER;

ALTER TABLE "QuizCandidate"
ADD CONSTRAINT "QuizCandidate_maxSubmissionsOverride_check"
CHECK (
  "maxSubmissionsOverride" IS NULL
  OR ("maxSubmissionsOverride" >= 0 AND "maxSubmissionsOverride" <= 100)
);
