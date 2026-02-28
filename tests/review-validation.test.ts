import assert from "node:assert/strict";
import { ReviewSchema } from "../lib/review-validation";

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

shouldPass();
shouldRejectTooShortComment();
shouldRejectTooManyImages();
shouldRejectEmptyNameAfterSanitize();

console.log("review-validation tests passed");
