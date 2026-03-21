ALTER TABLE "HomepageContent"
ADD COLUMN IF NOT EXISTS "heritageSubtitle" TEXT DEFAULT 'OUR HERITAGE';

ALTER TABLE "HomepageContent"
ADD COLUMN IF NOT EXISTS "heritageTitle" TEXT DEFAULT 'Honoring the Art of Korean Cosmetics.';

ALTER TABLE "HomepageContent"
ADD COLUMN IF NOT EXISTS "heritageBody" TEXT DEFAULT 'Luxe Moon brings the sophisticated tradition of Korean beauty innovation to you. Our formulas combine ancient botanical wisdom with modern technology, delivering professional salon results in the comfort of your home.';
