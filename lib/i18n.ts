export const LOCALES = ["en", "ne"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE_NAME = "lm_locale";

export const dictionaries = {
  en: {
    common: {
      currency: "NPR",
      items: "items",
      item: "item",
      language: "Language",
    },
    nav: {
      rootedInKorea: "Rooted in Korea",
      home: "Home",
      shop: "Shop",
      ourStory: "Our Story",
      contact: "Contact",
      bag: "Your Bag",
    },
    footer: {
      shop: "Shop",
      support: "Support",
      contact: "Contact",
      allProducts: "All Products",
      nanoplastiaKits: "Nanoplastia Kits",
      ourStory: "Our Story",
      deliveryPolicy: "Delivery Policy",
      refundPolicy: "Refund Policy",
      privacyPolicy: "Privacy Policy",
      terms: "Terms & Conditions",
      contactUs: "Contact Us",
      allRightsReserved: "All rights reserved.",
      defaultCopy:
        "Premium Korean-origin haircare. Formulated with Biotin & Keratin to restore your hair's natural brilliance.",
    },
    cart: {
      yourBag: "Your Bag",
      addForFreeDelivery: "Add {amount} for free delivery",
      unlockedFreeDelivery: "You unlocked free delivery!",
      savingOnDelivery: "You are saving {amount} on delivery fees!",
      emptyBag: "Your bag is empty.",
      startShopping: "Start Shopping",
      onlyLeft: "Only {count} left in stock",
      remove: "Remove",
      subtotal: "Subtotal",
      shippingAtCheckout: "Shipping calculated at checkout.",
      checkoutNow: "Checkout Now",
    },
    whatsapp: {
      helloMessage: "Hello Luxe Moon",
      chatAriaLabel: "Chat on WhatsApp",
      tooltip: "Need help? Chat with us!",
    },
    sort: {
      default: "Sort By: Default",
      bestSelling: "Best Selling",
      newestArrivals: "Newest Arrivals",
      priceLowToHigh: "Price: Low to High",
      priceHighToLow: "Price: High to Low",
    },
    home: {
      trustPremiumFormula: "Premium Korean Formula",
      trustDermTested: "Dermatologically Tested",
      trustGlassFinish: "Instant Glass Finish",
      trustAuthentic: "100% Authentic",
      heritageLabel: "Our Heritage",
      heritageTitleLine1: "Honoring the Art of",
      heritageTitleLine2: "Korean Haircare.",
      heritageBody:
        "Luxe Moon brings the sophisticated tradition of Korean beauty innovation to Nepal. Our formulas combine ancient botanical wisdom with modern Nanoplastia technology, delivering professional salon results in the comfort of your home.",
      readFullStory: "Read Our Full Story",
      nanoLabel: "The Glass Hair Revolution",
      nanoTitle: "Nano Botox Biotin + Keratin 4-in-1",
      nanoSubtitle:
        "Three essentials for anti-hair fall care, deep repair, and frizz control.",
      shop3Step: "Shop 3-Step System",
      featuredTitle: "Featured Collections",
      featuredSubtitle:
        "Curated essentials for your ultimate hair transformation journey.",
      newTitle: "New Arrivals",
      newSubtitle: "The latest innovations in Korean haircare.",
      bestTitle: "Best Sellers",
      bestSubtitle: "Our most loved products by the community.",
      viewAll: "View All",
      exploreNow: "Explore Now",
      quickAbsorption: "Quick Absorption",
      quickAbsorptionBody:
        "Innovative formulas that penetrate deep into the hair shaft for instant results.",
      cleanIngredients: "Clean Ingredients",
      cleanIngredientsBody:
        "Free from harsh sulfates and parabens. Only the goodness of nature.",
      professionalCare: "Professional Care",
      professionalCareBody:
        "Salon-grade quality tested by professionals for guaranteed excellence.",
      offer: "Offer",
      newBadge: "New",
    },
    shopPage: {
      title: "The Luxe Collection",
      subtitle:
        "Premium Korean haircare solutions, curated for your specific hair needs.",
      featuredTitle: "Featured Collections",
      featuredSubtitle:
        "Curated essentials for your ultimate hair transformation journey.",
      newTitle: "New Arrivals",
      newSubtitle: "The latest innovations in Korean haircare.",
      bestTitle: "Best Sellers",
      bestSubtitle: "Our most loved products by the community.",
      allProducts: "All Products",
      showingItems: "Showing {count} Items",
      bestseller: "Bestseller",
      offer: "Offer",
      soldOut: "Sold Out",
    },
    about: {
      title: "Our Story",
      fallbackP1:
        "Luxe Moon was born from a simple belief: everyone deserves access to world-class haircare, no matter where they are.",
      fallbackP2:
        "We source the finest Korean haircare formulations, enriched with Biotin, Keratin, and natural botanicals, and bring them directly to Nepal.",
      fallbackP3:
        "Our products are carefully selected for their proven efficacy, premium ingredients, and salon-grade results that you can achieve at home.",
      quote: "Rooted in Korea. Created for the World.",
    },
    contact: {
      heroTag: "Contact Luxe Moon",
      heroTitle: "We're here to help you shine.",
      heroBody:
        "Whether you have a question about our premium hair care line or need assistance with your order, our dedicated team is at your service.",
      messageReceived: "Message Received",
      messageReceivedBody:
        "Thank you for reaching out to Luxe Moon. Our team will review your message and reply shortly.",
      sendAnother: "Send Another Message",
      sendMessage: "Send a Message",
      fullName: "Full Name",
      emailOptional: "Email (Optional)",
      phoneNumber: "Phone Number",
      subject: "Subject",
      yourMessage: "Your Message",
      sendMessageBtn: "Send Message",
      sending: "Sending...",
      protectedBy: "Protected by Recaptcha & IP Limits",
      directContact: "Direct Contact",
      callUs: "Call Us",
      whatsapp: "WhatsApp",
      messageDirectly: "Message us directly",
      emailDirectly: "Email Directly",
      visitOffice: "Visit Our Office",
      subjectOrderIssue: "Order Issue",
      subjectProductQuery: "Product Query",
      subjectCollaboration: "Collaboration",
      subjectOther: "Other",
      placeholderName: "e.g. Aavya Sharma",
      placeholderMessage: "How can we help you?",
      toastSent: "Your message has been sent successfully.",
      toastFixErrors: "Please fix the errors in the form.",
      toastSomethingWrong: "Something went wrong.",
    },
  },
  ne: {
    common: {
      currency: "रु",
      items: "वस्तुहरू",
      item: "वस्तु",
      language: "भाषा",
    },
    nav: {
      rootedInKorea: "कोरियामा आधारित",
      home: "होम",
      shop: "दोकान",
      ourStory: "हाम्रो कथा",
      contact: "सम्पर्क",
      bag: "तपाईंको ब्याग",
    },
    footer: {
      shop: "दोकान",
      support: "सहयोग",
      contact: "सम्पर्क",
      allProducts: "सबै उत्पादन",
      nanoplastiaKits: "नानो-प्लास्टिया किट",
      ourStory: "हाम्रो कथा",
      deliveryPolicy: "डेलिभरी नीति",
      refundPolicy: "फिर्ता नीति",
      privacyPolicy: "गोपनीयता नीति",
      terms: "नियम तथा सर्तहरू",
      contactUs: "हामीलाई सम्पर्क गर्नुहोस्",
      allRightsReserved: "सबै अधिकार सुरक्षित।",
      defaultCopy:
        "प्रिमियम कोरियन उत्पत्तिको हेयरकेयर। बायोटिन र केराटिनसहित तपाईंको कपालको प्राकृतिक चमक फर्काउन तयार।",
    },
    cart: {
      yourBag: "तपाईंको ब्याग",
      addForFreeDelivery: "निःशुल्क डेलिभरीका लागि {amount} थप्नुहोस्",
      unlockedFreeDelivery: "तपाईंले निःशुल्क डेलिभरी पाउनुभयो!",
      savingOnDelivery: "तपाईंले डेलिभरी शुल्कमा {amount} बचत गर्दै हुनुहुन्छ!",
      emptyBag: "तपाईंको ब्याग खाली छ।",
      startShopping: "किनमेल सुरु गर्नुहोस्",
      onlyLeft: "स्टकमा केवल {count} बाँकी",
      remove: "हटाउनुहोस्",
      subtotal: "जम्मा",
      shippingAtCheckout: "डेलिभरी शुल्क चेकआउटमा गणना हुन्छ।",
      checkoutNow: "अहिले चेकआउट",
    },
    whatsapp: {
      helloMessage: "नमस्ते Luxe Moon",
      chatAriaLabel: "WhatsApp मा च्याट गर्नुहोस्",
      tooltip: "सहयोग चाहियो? हामीसँग च्याट गर्नुहोस्!",
    },
    sort: {
      default: "क्रमबद्ध: पूर्वनिर्धारित",
      bestSelling: "सबैभन्दा बढी बिक्री",
      newestArrivals: "नयाँ आगमन",
      priceLowToHigh: "मूल्य: कम देखि बढी",
      priceHighToLow: "मूल्य: बढी देखि कम",
    },
    home: {
      trustPremiumFormula: "प्रिमियम कोरियन फर्मुला",
      trustDermTested: "त्वचा विशेषज्ञद्वारा परीक्षण गरिएको",
      trustGlassFinish: "तुरुन्तै ग्लास फिनिश",
      trustAuthentic: "१००% वास्तविक",
      heritageLabel: "हाम्रो विरासत",
      heritageTitleLine1: "सम्मान गर्दै",
      heritageTitleLine2: "कोरियन हेयरकेयर कला",
      heritageBody:
        "Luxe Moon ले कोरियन सौन्दर्य नवप्रवर्तनको परिष्कृत परम्परा नेपालमा ल्याउँछ। हाम्रा फर्मुलामा वनस्पतिको पुरानो ज्ञान र आधुनिक नानो-प्लास्टिया प्रविधिको संयोजन छ।",
      readFullStory: "पूरा कथा पढ्नुहोस्",
      nanoLabel: "ग्लास हेयर क्रान्ति",
      nanoTitle: "नानो बोटक्स बायोटिन + केराटिन 4-in-1",
      nanoSubtitle:
        "केश झर्ने समस्या, गहिरो मर्मत, र फ्रिज नियन्त्रणका लागि तीन आवश्यक उत्पादन।",
      shop3Step: "३-स्टेप प्रणाली किनमेल गर्नुहोस्",
      featuredTitle: "विशेष संग्रह",
      featuredSubtitle: "तपाईंको कपाल परिवर्तन यात्राका लागि छनोट गरिएका उत्पादन।",
      newTitle: "नयाँ आगमन",
      newSubtitle: "कोरियन हेयरकेयरका नयाँ नवप्रवर्तनहरू।",
      bestTitle: "लोकप्रिय उत्पादन",
      bestSubtitle: "समुदायले सबैभन्दा धेरै मन पराएका उत्पादन।",
      viewAll: "सबै हेर्नुहोस्",
      exploreNow: "अहिले हेर्नुहोस्",
      quickAbsorption: "छिटो अवशोषण",
      quickAbsorptionBody:
        "कपालको भित्री तहसम्म छिटो पुग्ने फर्मुला, तुरुन्तै परिणामका लागि।",
      cleanIngredients: "स्वच्छ सामग्री",
      cleanIngredientsBody:
        "कडा सल्फेट र प्याराबेनविहीन, केवल प्राकृतिक गुणहरूको मिश्रण।",
      professionalCare: "प्रोफेशनल केयर",
      professionalCareBody:
        "विशेषज्ञद्वारा परीक्षण गरिएको सैलुन-स्तरको गुणस्तर।",
      offer: "अफर",
      newBadge: "नयाँ",
    },
    shopPage: {
      title: "Luxe संग्रह",
      subtitle: "तपाईंको कपालको आवश्यकताअनुसार प्रिमियम कोरियन हेयरकेयर समाधान।",
      featuredTitle: "विशेष संग्रह",
      featuredSubtitle: "तपाईंको कपाल परिवर्तन यात्राका लागि छनोट गरिएका उत्पादन।",
      newTitle: "नयाँ आगमन",
      newSubtitle: "कोरियन हेयरकेयरका नयाँ नवप्रवर्तनहरू।",
      bestTitle: "लोकप्रिय उत्पादन",
      bestSubtitle: "समुदायले सबैभन्दा धेरै मन पराएका उत्पादन।",
      allProducts: "सबै उत्पादन",
      showingItems: "{count} वस्तु देखाउँदै",
      bestseller: "लोकप्रिय",
      offer: "अफर",
      soldOut: "स्टक सकियो",
    },
    about: {
      title: "हाम्रो कथा",
      fallbackP1:
        "Luxe Moon एउटा सरल विश्वासबाट सुरु भयो: सबैले विश्वस्तरीय हेयरकेयर पाउनुपर्छ।",
      fallbackP2:
        "हामी बायोटिन, केराटिन र प्राकृतिक तत्वयुक्त उत्कृष्ट कोरियन फर्मुला नेपालमा ल्याउँछौं।",
      fallbackP3:
        "हाम्रा उत्पादन प्रभावकारी, प्रिमियम र घरमै सैलुन जस्तै परिणाम दिने गरी छनोट गरिएका छन्।",
      quote: "कोरियामा आधारित। विश्वका लागि तयार।",
    },
    contact: {
      heroTag: "Luxe Moon सम्पर्क",
      heroTitle: "हामी तपाईंको सहयोगका लागि यहाँ छौं।",
      heroBody:
        "हाम्रो प्रिमियम हेयरकेयर वा अर्डर सम्बन्धी कुनै प्रश्न भएमा हाम्रो टोली सहयोगका लागि तयार छ।",
      messageReceived: "सन्देश प्राप्त भयो",
      messageReceivedBody:
        "सम्पर्क गर्नुभएकोमा धन्यवाद। हाम्रो टोलीले तपाईंको सन्देश छिट्टै हेरी जवाफ दिनेछ।",
      sendAnother: "अर्को सन्देश पठाउनुहोस्",
      sendMessage: "सन्देश पठाउनुहोस्",
      fullName: "पूरा नाम",
      emailOptional: "इमेल (ऐच्छिक)",
      phoneNumber: "फोन नम्बर",
      subject: "विषय",
      yourMessage: "तपाईंको सन्देश",
      sendMessageBtn: "सन्देश पठाउनुहोस्",
      sending: "पठाउँदै...",
      protectedBy: "Recaptcha र IP Limits द्वारा सुरक्षित",
      directContact: "प्रत्यक्ष सम्पर्क",
      callUs: "फोन गर्नुहोस्",
      whatsapp: "व्हाट्सएप",
      messageDirectly: "हामीलाई सिधै सन्देश पठाउनुहोस्",
      emailDirectly: "इमेल पठाउनुहोस्",
      visitOffice: "हाम्रो कार्यालय भ्रमण गर्नुहोस्",
      subjectOrderIssue: "अर्डर समस्या",
      subjectProductQuery: "उत्पादन जिज्ञासा",
      subjectCollaboration: "सहकार्य",
      subjectOther: "अन्य",
      placeholderName: "उदाहरण: आव्या शर्मा",
      placeholderMessage: "हामीले कसरी सहयोग गर्न सक्छौं?",
      toastSent: "तपाईंको सन्देश सफलतापूर्वक पठाइयो।",
      toastFixErrors: "कृपया फारमका त्रुटिहरू सुधार्नुहोस्।",
      toastSomethingWrong: "केही समस्या भयो।",
    },
  },
} as const;

export function isLocale(value: string | null | undefined): value is Locale {
  return value === "en" || value === "ne";
}

function getByPath(source: unknown, path: string): string | undefined {
  const parts = path.split(".");
  let current: unknown = source;
  for (const part of parts) {
    if (!current || typeof current !== "object" || !(part in current)) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === "string" ? current : undefined;
}

export function translate(locale: Locale, key: string, vars?: Record<string, string | number>): string {
  const dict = dictionaries[locale];
  const fallback = dictionaries.en;
  const raw = getByPath(dict, key) ?? getByPath(fallback, key) ?? key;
  if (!vars) return raw;
  return Object.entries(vars).reduce(
    (acc, [varKey, value]) => acc.replaceAll(`{${varKey}}`, String(value)),
    raw
  );
}
