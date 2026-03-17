ALTER TABLE "Product" ALTER COLUMN "priceInside" TYPE numeric(12,2) USING ("priceInside"::numeric);
ALTER TABLE "Product" ALTER COLUMN "priceOutside" TYPE numeric(12,2) USING ("priceOutside"::numeric);
ALTER TABLE "Product" ALTER COLUMN "originalPrice" TYPE numeric(12,2) USING ("originalPrice"::numeric);

ALTER TABLE "Order" ALTER COLUMN "total" TYPE numeric(14,2) USING ("total"::numeric);
ALTER TABLE "Order" ALTER COLUMN "couponDiscount" TYPE numeric(14,2) USING ("couponDiscount"::numeric);

ALTER TABLE "OrderItem" ALTER COLUMN "price" TYPE numeric(14,2) USING ("price"::numeric);
