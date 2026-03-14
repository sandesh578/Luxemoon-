import assert from "node:assert/strict";
import { ReviewSchema } from "../lib/review-validation";
import { sanitizeAdminHtml } from "../lib/sanitize-admin-html";
import { calculateDiscountedPrice, isDiscountActive } from "../lib/settings";
import { prisma } from "../lib/prisma";

function shouldPass() {
  const parsed = ReviewSchema.parse({
    productId: "prod_123",
    userName: "  <b>Jane Doe</b>  ",
    address: "",
    rating: "5",
    comment: "  <p>This product worked very well for me.</p>  ",
    images: [],
    video: null,
  });

  assert.equal(parsed.userName, "Jane Doe");
  assert.equal(parsed.address, null);
  assert.equal(parsed.rating, 5);
  assert.equal(parsed.video, null);
  assert.equal(parsed.comment, "This product worked very well for me.");
}

function shouldRejectTooShortComment() {
  assert.throws(() => {
    ReviewSchema.parse({
      productId: "prod_123",
      userName: "Jane Doe",
      address: null,
      rating: 4,
      comment: "short",
      images: [],
      video: null,
    });
  });
}

function shouldRejectTooManyImages() {
  assert.throws(() => {
    ReviewSchema.parse({
      productId: "prod_123",
      userName: "Jane Doe",
      address: null,
      rating: 4,
      comment: "This is a valid review comment.",
      images: ["https://a.com/1.jpg", "https://a.com/2.jpg", "https://a.com/3.jpg", "https://a.com/4.jpg"],
      video: null,
    });
  });
}

function shouldRejectEmptyNameAfterSanitize() {
  assert.throws(() => {
    ReviewSchema.parse({
      productId: "prod_123",
      userName: "   <b> </b>   ",
      address: null,
      rating: 4,
      comment: "This is a valid review comment.",
      images: [],
      video: null,
    });
  });
}

function shouldSanitizeAdminHtml() {
  const sanitized = sanitizeAdminHtml(
    '<p onclick="alert(1)">Safe</p><script>alert(1)</script><a href="javascript:evil()">x</a>'
  );

  assert.equal(sanitized.includes("<script"), false);
  assert.equal(sanitized.includes("onclick="), false);
  assert.equal(sanitized.includes('href="#"'), true);
  assert.equal(sanitized.includes("<p"), true);
}

function shouldHandleDiscountLogic() {
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  assert.equal(isDiscountActive(null, null), true);
  assert.equal(isDiscountActive(yesterday, tomorrow), true);
  assert.equal(isDiscountActive(tomorrow, null), false);
  assert.equal(isDiscountActive(null, yesterday), false);

  const noStacking = calculateDiscountedPrice(
    1000,
    {
      discountPercent: 10,
      discountFixed: null,
      discountStart: yesterday,
      discountEnd: tomorrow,
    },
    {
      globalDiscountPercent: 20,
      globalDiscountStart: yesterday,
      globalDiscountEnd: tomorrow,
      allowStacking: false,
    }
  );

  assert.equal(noStacking, 1000);

  const stacked = calculateDiscountedPrice(
    1000,
    {
      discountPercent: 0,
      discountFixed: null,
      discountStart: null,
      discountEnd: null,
    },
    {
      globalDiscountPercent: 20,
      globalDiscountStart: yesterday,
      globalDiscountEnd: tomorrow,
      allowStacking: true,
    }
  );

  assert.equal(stacked, 800);
}

async function main() {
  try {
    shouldPass();
    shouldRejectTooShortComment();
    shouldRejectTooManyImages();
    shouldRejectEmptyNameAfterSanitize();
    shouldSanitizeAdminHtml();
    shouldHandleDiscountLogic();
    console.log("unit tests passed");
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
