import { prisma } from "./prisma";

export async function getSiteConfig() {
  let config = await prisma.siteConfig.findFirst();
  
  if (!config) {
    config = await prisma.siteConfig.create({
      data: {
        storeName: "Luxe Moon",
        bannerText: "Rooted in Korea. Created for the World.",
        deliveryChargeInside: 0,
        deliveryChargeOutside: 150,
        freeDeliveryThreshold: 5000,
        contactPhone: "+977 9800000000",
        contactEmail: "hello@luxemoon.com.np",
        contactAddress: "Durbarmarg, Kathmandu"
      }
    });
  }
  
  return config;
}
