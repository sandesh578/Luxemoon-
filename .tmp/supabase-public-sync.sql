--
-- PostgreSQL database dump
--

\restrict lfQIW8lecOQl6k48Dmf8LZPT0lbGhZ1ZuybTh0OD2vkMraAmHmaEGlUcekqBKJz

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.9 (Debian 17.9-1.pgdg13+1)


--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: SCHEMA "public"; Type: COMMENT; Schema: -; Owner: -
--



--
-- Name: DiscountType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE "public"."DiscountType" AS ENUM (
    'PERCENTAGE',
    'FIXED'
);


--
-- Name: OrderStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE "public"."OrderStatus" AS ENUM (
    'PENDING',
    'CONFIRMED',
    'SHIPPED',
    'DELIVERED',
    'CANCELLED'
);




--
-- Name: BlockedCustomer; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."BlockedCustomer" (
    "id" "text" NOT NULL,
    "phone" "text" NOT NULL,
    "reason" "text" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Category; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."Category" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "image" "text",
    "description" "text",
    "isActive" boolean DEFAULT true NOT NULL,
    "isArchived" boolean DEFAULT false NOT NULL,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: ContactMessage; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."ContactMessage" (
    "id" "text" NOT NULL,
    "name" "text" NOT NULL,
    "email" "text",
    "phone" "text" NOT NULL,
    "subject" "text" NOT NULL,
    "message" "text" NOT NULL,
    "ipAddress" "text",
    "isResolved" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Coupon; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."Coupon" (
    "id" "text" NOT NULL,
    "code" "text" NOT NULL,
    "description" "text",
    "discountType" "public"."DiscountType" NOT NULL,
    "discountValue" integer NOT NULL,
    "appliesToAll" boolean DEFAULT true NOT NULL,
    "productIds" "text"[],
    "categoryIds" "text"[],
    "minOrderAmount" integer,
    "maxDiscountCap" integer,
    "usageLimit" integer,
    "usageCount" integer DEFAULT 0 NOT NULL,
    "perUserLimit" integer DEFAULT 1,
    "startsAt" timestamp(3) without time zone,
    "expiresAt" timestamp(3) without time zone,
    "isActive" boolean DEFAULT true NOT NULL,
    "deletedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: HomepageContent; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."HomepageContent" (
    "id" integer DEFAULT 1 NOT NULL,
    "heroSlides" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "banners" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "promotionalImages" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "noticeBarText" "text",
    "noticeBarEnabled" boolean DEFAULT false NOT NULL,
    "heritageSubtitle" "text" DEFAULT 'OUR HERITAGE'::"text",
    "heritageTitle" "text" DEFAULT 'Honoring the Art of Korean Cosmetics.'::"text",
    "heritageBody" "text" DEFAULT 'Luxe Moon brings the sophisticated tradition of Korean beauty innovation to you. Our formulas combine ancient botanical wisdom with modern technology, delivering professional salon results in the comfort of your home.'::"text",
    "communityReviews" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL
);


--
-- Name: LoginAttempt; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."LoginAttempt" (
    "id" "text" NOT NULL,
    "ip" "text" NOT NULL,
    "email" "text" NOT NULL,
    "success" boolean NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: NotificationLog; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."NotificationLog" (
    "id" "text" NOT NULL,
    "orderId" "text" NOT NULL,
    "type" "text" NOT NULL,
    "status" "text" NOT NULL,
    "errorMessage" "text",
    "sentAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: NotificationTemplate; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."NotificationTemplate" (
    "id" "text" NOT NULL,
    "type" "text" NOT NULL,
    "subject" "text" NOT NULL,
    "bodyHtml" "text" NOT NULL,
    "smsBody" "text" NOT NULL,
    "isSMS" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Order; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."Order" (
    "id" "text" NOT NULL,
    "customerName" "text" NOT NULL,
    "phone" "text" NOT NULL,
    "email" "text",
    "province" "text" NOT NULL,
    "district" "text" NOT NULL,
    "address" "text" NOT NULL,
    "landmark" "text",
    "notes" "text",
    "isInsideValley" boolean NOT NULL,
    "total" numeric(14,2) NOT NULL,
    "status" "public"."OrderStatus" DEFAULT 'PENDING'::"public"."OrderStatus" NOT NULL,
    "rejectionReason" "text",
    "ipAddress" "text",
    "idempotencyKey" "text",
    "paymentReceived" boolean DEFAULT false NOT NULL,
    "adminNotes" "text",
    "trackingNumber" "text",
    "courierName" "text",
    "couponId" "text",
    "couponCode" "text",
    "couponDiscount" numeric(14,2),
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: OrderItem; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."OrderItem" (
    "id" "text" NOT NULL,
    "quantity" integer NOT NULL,
    "price" numeric(14,2) NOT NULL,
    "orderId" "text" NOT NULL,
    "productId" "text" NOT NULL
);


--
-- Name: Product; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."Product" (
    "id" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text" NOT NULL,
    "priceInside" numeric(12,2) NOT NULL,
    "priceOutside" numeric(12,2) NOT NULL,
    "originalPrice" numeric(12,2),
    "images" "text"[],
    "features" "text"[],
    "videoUrl" "text",
    "stock" integer DEFAULT 0 NOT NULL,
    "categoryId" "text",
    "sku" "text",
    "weight" "text",
    "dimensions" "text",
    "discountPercent" integer DEFAULT 0 NOT NULL,
    "discountFixed" integer,
    "discountStart" timestamp(3) without time zone,
    "discountEnd" timestamp(3) without time zone,
    "isFeatured" boolean DEFAULT false NOT NULL,
    "isNew" boolean DEFAULT false NOT NULL,
    "seoTitle" "text",
    "seoDescription" "text",
    "tags" "text"[],
    "isBundle" boolean DEFAULT false NOT NULL,
    "bundleItemIds" "text"[],
    "isDeleted" boolean DEFAULT false NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "isArchived" boolean DEFAULT false NOT NULL,
    "isDraft" boolean DEFAULT false NOT NULL,
    "deletedAt" timestamp(3) without time zone,
    "marketingDescription" "text",
    "ingredients" "text",
    "howToUse" "text",
    "benefits" "text"[],
    "comparisonImages" "text"[],
    "faqs" "jsonb" DEFAULT '[]'::"jsonb",
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "isBestSeller" boolean DEFAULT false NOT NULL
);


--
-- Name: Review; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."Review" (
    "id" "text" NOT NULL,
    "userName" "text" NOT NULL,
    "address" "text",
    "rating" integer NOT NULL,
    "comment" "text" NOT NULL,
    "productId" "text" NOT NULL,
    "approved" boolean DEFAULT true NOT NULL,
    "verifiedPurchase" boolean DEFAULT false NOT NULL,
    "images" "text"[],
    "video" "text",
    "isFeatured" boolean DEFAULT false NOT NULL,
    "isHidden" boolean DEFAULT false NOT NULL,
    "isVerified" boolean DEFAULT false NOT NULL,
    "ipAddress" "text",
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: SiteConfig; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."SiteConfig" (
    "id" integer DEFAULT 1 NOT NULL,
    "storeName" "text" DEFAULT 'Luxe Moon'::"text" NOT NULL,
    "bannerText" "text" DEFAULT 'Rooted in Korea. Created for the World.'::"text" NOT NULL,
    "logoUrl" "text",
    "faviconUrl" "text",
    "deliveryChargeInside" integer DEFAULT 0 NOT NULL,
    "deliveryChargeOutside" integer DEFAULT 150 NOT NULL,
    "freeDeliveryThreshold" integer DEFAULT 5000 NOT NULL,
    "codFee" integer DEFAULT 0 NOT NULL,
    "expressDeliveryEnabled" boolean DEFAULT false NOT NULL,
    "estimatedDeliveryInside" "text" DEFAULT '1-2 days'::"text" NOT NULL,
    "estimatedDeliveryOutside" "text" DEFAULT '3-5 days'::"text" NOT NULL,
    "globalDiscountPercent" integer DEFAULT 0 NOT NULL,
    "globalDiscountStart" timestamp(3) without time zone,
    "globalDiscountEnd" timestamp(3) without time zone,
    "allowStacking" boolean DEFAULT false NOT NULL,
    "festiveSaleEnabled" boolean DEFAULT false NOT NULL,
    "contactPhone" "text" DEFAULT '+977 9800000000'::"text" NOT NULL,
    "contactEmail" "text" DEFAULT 'hello@luxemoon.com.np'::"text" NOT NULL,
    "contactAddress" "text" DEFAULT 'Durbarmarg, Kathmandu'::"text" NOT NULL,
    "whatsappNumber" "text",
    "facebookUrl" "text",
    "instagramUrl" "text",
    "tiktokUrl" "text",
    "metaTitle" "text",
    "metaDescription" "text",
    "footerContent" "text",
    "privacyPolicy" "text",
    "termsConditions" "text",
    "aboutContent" "text",
    "deliveryPolicy" "text",
    "refundPolicy" "text",
    "emailNotificationsEnabled" boolean DEFAULT false NOT NULL,
    "smsNotificationsEnabled" boolean DEFAULT false NOT NULL,
    "currencyCode" "text" DEFAULT 'USD'::"text" NOT NULL,
    "languageToggleEnabled" boolean DEFAULT false NOT NULL,
    "nprConversionRate" double precision DEFAULT 133.5 NOT NULL,
    "showStockOnProduct" boolean DEFAULT true NOT NULL
);


--
-- Name: Transformation; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."Transformation" (
    "id" "text" NOT NULL,
    "beforeImage" "text" NOT NULL,
    "afterImage" "text" NOT NULL,
    "caption" "text",
    "productId" "text" NOT NULL,
    "durationUsed" "text",
    "isFeatured" boolean DEFAULT false NOT NULL,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE "public"."_prisma_migrations" (
    "id" character varying(36) NOT NULL,
    "checksum" character varying(64) NOT NULL,
    "finished_at" timestamp with time zone,
    "migration_name" character varying(255) NOT NULL,
    "logs" "text",
    "rolled_back_at" timestamp with time zone,
    "started_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "applied_steps_count" integer DEFAULT 0 NOT NULL
);


--
-- Data for Name: BlockedCustomer; Type: TABLE DATA; Schema: public; Owner: -
--

COPY "public"."BlockedCustomer" ("id", "phone", "reason", "createdAt") FROM stdin;
\.


--
-- Data for Name: Category; Type: TABLE DATA; Schema: public; Owner: -
--

COPY "public"."Category" ("id", "name", "slug", "image", "description", "isActive", "isArchived", "deletedAt", "createdAt", "updatedAt") FROM stdin;
cmm68r1o30000kxu48wlmuzaz	Nano Botox 4-in-1	nanoplastia-collection	\N	Complete haircare system: Shampoo + Hair Mask + Hair Serum.	t	f	\N	2026-02-28 11:31:57.363	2026-02-28 11:31:57.363
\.


--
-- Data for Name: ContactMessage; Type: TABLE DATA; Schema: public; Owner: -
--

COPY "public"."ContactMessage" ("id", "name", "email", "phone", "subject", "message", "ipAddress", "isResolved", "createdAt") FROM stdin;
\.


--
-- Data for Name: Coupon; Type: TABLE DATA; Schema: public; Owner: -
--

COPY "public"."Coupon" ("id", "code", "description", "discountType", "discountValue", "appliesToAll", "productIds", "categoryIds", "minOrderAmount", "maxDiscountCap", "usageLimit", "usageCount", "perUserLimit", "startsAt", "expiresAt", "isActive", "deletedAt", "createdAt", "updatedAt") FROM stdin;
cmmoj64nm0000l204c7hcz8fy	TEST		PERCENTAGE	10	t	{}	{}	5000	500	\N	0	1	\N	\N	t	\N	2026-03-13 06:43:28.402	2026-03-13 06:43:28.402
\.


--
-- Data for Name: HomepageContent; Type: TABLE DATA; Schema: public; Owner: -
--

COPY "public"."HomepageContent" ("id", "heroSlides", "banners", "promotionalImages", "noticeBarText", "noticeBarEnabled", "heritageSubtitle", "heritageTitle", "heritageBody", "communityReviews") FROM stdin;
1	[{"link": "/shop", "image": "https://res.cloudinary.com/dvzgdwp6u/image/upload/v1773937987/luxemoon/products/ak0blxurfv0vzkmzvwif.jpg", "title": "", "subtitle": "", "buttonText": "SHOP 3-STEP ROUTINE", "mobileImage": ""}]	[{"link": "/products/anti-hair-fall-shampoo", "image": "/products/shampoo.jpg", "title": "Anti-Hair Fall Shampoo"}, {"link": "/products/soft-silky-serum", "image": "/products/serum.jpg", "title": "Soft & Silky Hair Serum"}]	["https://res.cloudinary.com/dvzgdwp6u/image/upload/v1773562378/luxemoon/products/hm4dygjvvuedsmwhouwk.png"]	Sulfate-Free | Paraben-Free | Silicone-Free	t	OUR HERITAGE	Honoring the Art of Korean Cosmetics.	Luxe Moon brings the sophisticated tradition of Korean beauty innovation to you. Our formulas combine ancient botanical wisdom with modern technology, delivering professional salon results in the comfort of your home.	[{"mediaUrl": "https://res.cloudinary.com/dvzgdwp6u/image/upload/v1774117155/luxemoon/products/k4oipdcxjlve3loezqhg.jpg", "mediaType": "image", "productId": "cmmrakiw40001jv04uoxytkas"}, {"mediaUrl": "https://res.cloudinary.com/dvzgdwp6u/image/upload/v1774117182/luxemoon/products/emptuaapwqajx7ahiqfn.png", "mediaType": "image", "productId": "cmm68r1wl0002kxu4jdqoc1hx"}, {"mediaUrl": "https://res.cloudinary.com/dvzgdwp6u/image/upload/v1774117243/luxemoon/products/fcrmmvrfrjxll67jzrnw.png", "mediaType": "image", "productId": "cmm68r28s0006kxu4sr68owb1"}]
\.


--
-- Data for Name: LoginAttempt; Type: TABLE DATA; Schema: public; Owner: -
--

COPY "public"."LoginAttempt" ("id", "ip", "email", "success", "createdAt") FROM stdin;
cmm691ess0000ky04ndf39qna	106.222.231.26	admin@luxemoon.com	t	2026-02-28 11:40:00.941
cmm6mqspz0000jv04jjlbil05	160.250.254.71	admin@luxemoon.com	t	2026-02-28 18:03:40.391
cmm7t4ldg0000ld04p3jhnf48	106.222.231.26	admin@luxemoon.com	t	2026-03-01 13:50:07.925
cmmnv40tr0000ky04dmffbmjw	160.250.254.164	admin@luxemoon.com	t	2026-03-12 19:29:59.343
cmmohwazq0000ky04r842sdug	49.205.254.173	admin@luxemoon.com	t	2026-03-13 06:07:50.438
cmmoivxz80000l5048zh62x8b	49.205.254.173	admin@luxemoon.com	t	2026-03-13 06:35:33.188
cmmoixlqx0002l504z25c1t0z	49.205.254.173	admin@luxemoon.com	t	2026-03-13 06:36:50.65
cmmpsiu6f0000k104s4cak38k	160.250.254.164	admin@luxemoon.com	t	2026-03-14 03:53:04.072
cmmpsr57g0000i5049xm7dccb	160.250.254.164	upload:admin	t	2026-03-14 03:59:31.613
cmmpss8km0000l704iyjjasey	160.250.254.164	upload:admin	t	2026-03-14 04:00:22.63
cmmpst84p0001l704uns5v3g1	160.250.254.164	upload:admin	t	2026-03-14 04:01:08.713
cmmpxnz550001kx2k9p6p8o7z	::1	admin@luxemoon.com	t	2026-03-14 06:17:01.865
cmmq0yac00000kx7wdspi7asd	::ffff:127.0.0.1	bad@example.com	f	2026-03-14 07:49:01.775
cmmq0ysnv0001kx7w6urs893k	::ffff:127.0.0.1	bad@example.com	f	2026-03-14 07:49:25.531
cmmq4iobn0005kxus9b8g6jeu	::ffff:192.168.0.100	admin@luxemoon.com	t	2026-03-14 09:28:51.876
cmmq4itih0006kxusmde41orn	::ffff:192.168.0.100	admin@luxemoon.com	t	2026-03-14 09:28:58.602
cmmq4izk90007kxusne5ehpsm	::ffff:192.168.0.100	admin@luxemoon.com	t	2026-03-14 09:29:06.297
cmmq4j5o90008kxus0271veab	::ffff:192.168.0.100	admin@luxemoon.com	t	2026-03-14 09:29:14.361
cmmq4jmz90009kxus54zfp3if	::1	admin@luxemoon.com	t	2026-03-14 09:29:36.789
cmmq4juu8000akxus587iwd4t	::ffff:192.168.0.100	admin@luxemoon.com	t	2026-03-14 09:29:46.977
cmmq4jxyl000bkxust6wsmg15	::ffff:192.168.0.100	admin@luxemoon.com	t	2026-03-14 09:29:51.022
cmmq4k1a1000ckxusuwlah3ql	::ffff:192.168.0.100	admin@luxemoon.com	t	2026-03-14 09:29:55.321
cmmq4kfw8000dkxusm47ak3g4	::ffff:192.168.0.100	admin@luxemoon.com	t	2026-03-14 09:30:14.265
cmmq4kt91000ekxus6q7kn1l5	::1	admin@luxemoon.com	t	2026-03-14 09:30:31.574
cmmq4p2ow0000kxd86oczcoh2	::ffff:192.168.0.100	admin@luxemoon.com	t	2026-03-14 09:33:50.432
cmmq4pjc00001kxd8hd3fdk2m	::ffff:192.168.0.100	admin@luxemoon.com	t	2026-03-14 09:34:12
cmmq4qy5z0002kxd8go6eq891	::1	admin@luxemoon.com	t	2026-03-14 09:35:17.88
cmmq4w17i0000l804kp64gnne	49.205.254.173	admin@luxemoon.com	t	2026-03-14 09:39:15.103
cmmq9ehs50003kxd81hp9xfy6	::ffff:127.0.0.1	bad@example.com	f	2026-03-14 11:45:34.852
cmmqabgb20000kx902qwhho5i	::1	admin@luxemoon.com	t	2026-03-14 12:11:12.591
cmmqbntdr0000kxhkmocxvzuq	::1	admin@luxemoon.com	t	2026-03-14 12:48:49.023
cmmqbogxl0001kxhkrzbnc411	::1	upload:admin	t	2026-03-14 12:49:19.545
cmmqbopj10002kxhkpwy00ndm	::1	upload:admin	t	2026-03-14 12:49:30.686
cmmqbviin0003kxhk17lqwm90	::ffff:192.168.1.5	admin@luxemoon.com	t	2026-03-14 12:54:48.191
cmmqbvn2e0004kxhkc4ep28b5	::ffff:192.168.1.5	admin@luxemoon.com	t	2026-03-14 12:54:54.087
cmmqc2aii0000kxyoqlrzkehj	::1	upload:admin	t	2026-03-14 13:00:04.41
cmmqc2xwo0001kxyotccj3y4b	::1	upload:admin	t	2026-03-14 13:00:34.728
cmmqca1710000kxpsxfq7bpsm	::1	upload:admin	t	2026-03-14 13:06:05.582
cmmqcimiq0000jy04uktqe44s	152.57.163.212	admin@luxemoon.com	t	2026-03-14 13:12:46.466
cmmqcjmp60000ld04kg4xhnab	152.57.163.212	upload:admin	t	2026-03-14 13:13:33.354
cmmr4nhme0000jm04ywezgtiu	160.250.254.164	admin@luxemoon.com	t	2026-03-15 02:20:22.646
cmmr4v3xn0000lb04ewy29yhr	160.250.254.164	admin@luxemoon.com	t	2026-03-15 02:26:18.155
cmmr8cdut0000ld048djlkc7w	160.250.254.164	upload:admin	t	2026-03-15 04:03:43.013
cmmradxit0000ia047nc237yd	160.250.254.164	upload:admin	t	2026-03-15 05:00:54.389
cmmrae5wg0001ia04odzgijk8	160.250.254.164	upload:admin	t	2026-03-15 05:01:05.248
cmmraenf30002ia04qbays955	160.250.254.164	upload:admin	t	2026-03-15 05:01:27.951
cmmraigd30000l104qube5j8z	160.250.254.164	upload:admin	t	2026-03-15 05:04:25.431
cmmraiqh30001l104rnh4359b	160.250.254.164	upload:admin	t	2026-03-15 05:04:38.536
cmmralvc90003ia0467zwxw12	160.250.254.164	upload:admin	t	2026-03-15 05:07:04.81
cmmram9rs0004ia04wxwyjruu	160.250.254.164	upload:admin	t	2026-03-15 05:07:23.512
cmmrdnn460000l504e7nrew40	160.250.254.164	upload:admin	t	2026-03-15 06:32:26.311
cmmrgbz960000js04ix7do0pe	106.222.234.110	admin@luxemoon.com	t	2026-03-15 07:47:21.018
cmmrh8uj10000if04u9cmyaun	160.250.254.164	upload:admin	t	2026-03-15 08:12:54.541
cmmrkvvji0000ju04mbtfdxy8	160.250.254.164	upload:admin	t	2026-03-15 09:54:47.791
cmmrkw51w0001ju04gvz4wx78	160.250.254.164	upload:admin	t	2026-03-15 09:55:00.116
cmmrkz6ua0002ju04io6gjcrj	160.250.254.164	upload:admin	t	2026-03-15 09:57:22.402
cmmrlxpym0000lb04t0x9ao3b	160.250.254.164	upload:admin	t	2026-03-15 10:24:13.487
cmmrm1reh0001lb04ofq3p6gp	160.250.254.164	upload:admin	t	2026-03-15 10:27:21.977
cmmrmdpj20005kx10d6e2dm7x	::1	admin@luxemoon.com	t	2026-03-15 10:36:39.423
cmmrmlmhq0000lb04xvez06b9	106.222.234.110	admin@luxemoon.com	t	2026-03-15 10:42:48.735
cmmrn1nlj0002kw040jvhyvbn	106.222.234.110	admin@luxemoon.com	t	2026-03-15 10:55:16.475
cmmrn2sby0003kw04v6mroax7	160.250.254.164	upload:admin	t	2026-03-15 10:56:09.454
cmmrngxwk0000kz040hwvdgkh	160.250.254.164	upload:admin	t	2026-03-15 11:07:09.86
cmmrnstwj0000l104imp2unac	160.250.254.164	upload:admin	t	2026-03-15 11:16:24.548
cmms1vq3u0008kxu47wr5gqaz	::1	upload:admin	t	2026-03-15 17:50:34.218
cmmu4ir640000kx7om80xuy1d	::1	admin@luxemoon.com	t	2026-03-17 04:40:00.268
cmmu511180000kxqg03ixk064	::1	upload:admin	t	2026-03-17 04:54:12.86
cmmu6hdv00000kz04vmevjmb7	106.222.234.110	admin@luxemoon.com	t	2026-03-17 05:34:55.596
cmmu6qdi50000l704uvqpohd1	106.222.234.110	admin@luxemoon.com	t	2026-03-17 05:41:55.037
cmmu6rv4r0001l704aea5yjpy	106.222.234.110	upload:admin	t	2026-03-17 05:43:04.54
cmmu8f8at0000l504o4iaklkl	106.222.234.110	admin@luxemoon.com	t	2026-03-17 06:29:14.309
cmmu8sh2n0000ib04nuvrchao	103.190.40.146	admin@luxemoon.com	t	2026-03-17 06:39:32.207
cmmxmqaek0000jx044g78yq8n	103.190.40.146	admin@luxemoon.com	t	2026-03-19 15:33:03.404
cmmxnp81t0000jm04v9dkxcio	103.190.40.146	upload:admin	t	2026-03-19 16:00:13.314
cmmxovgsw0000k1048b0s3jeh	103.190.40.146	upload:admin	t	2026-03-19 16:33:04.209
cmmzthpl10000kxxwsglv18f1	::1	admin@luxemoon.com	t	2026-03-21 04:17:52.837
cmmzx7e3z0000k304i45pyc17	103.190.40.146	admin@luxemoon.com	t	2026-03-21 06:01:49.871
cmmzx81vp0000kw04kpv1l0bo	106.222.235.92	admin@luxemoon.com	t	2026-03-21 06:02:20.677
cmmzxv0cq0000kxzw5qfqab3g	::1	admin@luxemoon.com	t	2026-03-21 06:20:11.786
cmn0f7szt0000kxkosvwza6d3	127.0.0.1	upload:admin	t	2026-03-21 14:26:02.249
cmn0fr7px0000kxhk5dn4asn7	127.0.0.1	upload:admin	t	2026-03-21 14:41:07.797
cmn0fscae0001kxhknll324mx	127.0.0.1	upload:admin	t	2026-03-21 14:42:00.374
cmn0njlpu0000kxooz34herqf	127.0.0.1	upload:admin	t	2026-03-21 18:19:09.618
cmn0nk7ql0001kxoo9iz7wm1k	127.0.0.1	upload:admin	t	2026-03-21 18:19:38.157
cmn0nkzud0002kxoo9cf4fnc7	127.0.0.1	upload:admin	t	2026-03-21 18:20:14.581
cmn0nl9xz0003kxoo4or4220r	127.0.0.1	upload:admin	t	2026-03-21 18:20:27.671
\.


--
-- Data for Name: NotificationLog; Type: TABLE DATA; Schema: public; Owner: -
--

COPY "public"."NotificationLog" ("id", "orderId", "type", "status", "errorMessage", "sentAt") FROM stdin;
\.


--
-- Data for Name: NotificationTemplate; Type: TABLE DATA; Schema: public; Owner: -
--

COPY "public"."NotificationTemplate" ("id", "type", "subject", "bodyHtml", "smsBody", "isSMS", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Order; Type: TABLE DATA; Schema: public; Owner: -
--

COPY "public"."Order" ("id", "customerName", "phone", "email", "province", "district", "address", "landmark", "notes", "isInsideValley", "total", "status", "rejectionReason", "ipAddress", "idempotencyKey", "paymentReceived", "adminNotes", "trackingNumber", "courierName", "couponId", "couponCode", "couponDiscount", "createdAt", "updatedAt") FROM stdin;
cmm695zne0002ky04dq4f06mm	Sandesh Parajuli	9861392656	sandesh57801@gmail.com	Bagmati Province	Kathmandu	Kapan, Sir Raj Bahadur Road, Aakashedhara, Budhanilkantha-10, Budhanilkantha, Budhanilkantha Municipality, Kathmandu, Bagamati Province, 44622, Nepal	Milanchowk		t	5600.00	DELIVERED	\N	106.222.231.26	9861392656_1772279010821	f	\N	\N	\N	\N	\N	\N	2026-02-28 11:43:34.586	2026-03-13 06:35:58.602
cmmoiydxd0004l5048o5ff7am	Bhuwan Dhamala	9818997178	parajulisandesh578@gmail.com	Bagmati Province	Lalitpur	kapan, kathmandu			t	5700.00	SHIPPED	\N	49.205.254.173	9818997178_1773383842049	f	\N	\N	\N	\N	\N	\N	2026-03-13 06:37:27.169	2026-03-13 06:38:32.379
cmmq4bgle0001kxus0tv58czg	Rakersh	9818996574	\N	Koshi Province	Dhankuta	Katunje, Chhathar Jorpati-05, Chhathar Jorpati, Dhankuta, Koshi Province, Nepal			f	14150.00	PENDING	\N	::1	9818996574_1773480193014	f	\N	\N	\N	\N	\N	\N	2026-03-14 09:23:15.265	2026-03-14 09:23:15.265
cmms1p8z80001kxu41nivld87	Balen Shah	9814545453	\N	Gandaki Province	Kaski	Pokhara, Kaski, Gandaki Province, Nepal			f	6386.00	SHIPPED	\N	::1	9814545453_1773596729394	f	\N	\N	\N	\N	\N	\N	2026-03-15 17:45:32.079	2026-03-17 04:52:35.371
cmmu4m2qm0002kx7o2pchkjhy	Soniya Dhital	9814545454	\N	Koshi Province	Sunsari	Dharan, Sunsari, Koshi Province, 56700, Nepal			f	1620.00	CANCELLED	already cancelled	::1	9814545454_1773722554292	f	\N	\N	\N	\N	\N	\N	2026-03-17 04:42:35.23	2026-03-17 04:52:53.068
\.


--
-- Data for Name: OrderItem; Type: TABLE DATA; Schema: public; Owner: -
--

COPY "public"."OrderItem" ("id", "quantity", "price", "orderId", "productId") FROM stdin;
cmm695zne0004ky04kc6yqfrp	4	1400.00	cmm695zne0002ky04dq4f06mm	cmm68r28s0006kxu4sr68owb1
cmmoiydxd0006l504a61o4e0s	1	1400.00	cmmoiydxd0004l5048o5ff7am	cmm68r28s0006kxu4sr68owb1
cmmoiydxd0007l504vbewjezg	1	1800.00	cmmoiydxd0004l5048o5ff7am	cmm68r1wl0002kxu4jdqoc1hx
cmmoiydxd0008l5045eiop22q	1	2500.00	cmmoiydxd0004l5048o5ff7am	cmm68r24o0004kxu4125qufxv
cmmq4bgle0003kxus09e04l4v	1	1550.00	cmmq4bgle0001kxus0tv58czg	cmm68r28s0006kxu4sr68owb1
cmmq4bgle0004kxusgb6hw1gf	4	3150.00	cmmq4bgle0001kxus0tv58czg	cmm68r24o0004kxu4125qufxv
cmms1p8z80003kxu46r8olcve	1	3140.00	cmms1p8z80001kxu41nivld87	cmm68r28s0006kxu4sr68owb1
cmms1p8z80004kxu4or0w0hhw	1	1626.00	cmms1p8z80001kxu41nivld87	cmm68r1wl0002kxu4jdqoc1hx
cmms1p8z80005kxu403fji1d8	1	1620.00	cmms1p8z80001kxu41nivld87	cmmrakiw40001jv04uoxytkas
cmmu4m2qm0004kx7oygomp9zh	1	1620.00	cmmu4m2qm0002kx7o2pchkjhy	cmmrakiw40001jv04uoxytkas
\.


--
-- Data for Name: Product; Type: TABLE DATA; Schema: public; Owner: -
--

COPY "public"."Product" ("id", "slug", "name", "description", "priceInside", "priceOutside", "originalPrice", "images", "features", "videoUrl", "stock", "categoryId", "sku", "weight", "dimensions", "discountPercent", "discountFixed", "discountStart", "discountEnd", "isFeatured", "isNew", "seoTitle", "seoDescription", "tags", "isBundle", "bundleItemIds", "isDeleted", "isActive", "isArchived", "isDraft", "deletedAt", "marketingDescription", "ingredients", "howToUse", "benefits", "comparisonImages", "faqs", "createdAt", "updatedAt", "isBestSeller") FROM stdin;
cmm68r24o0004kxu4125qufxv	shining-silk-hair-mask	LuxeMoon ðŸŒ™ Soft & Silky Hair Serum Botox + Biotin + Keratin + Nanoplastia also for after treatments hair and natural hair ðŸ’«	âœ¨ Advanced Korean Hair Technology\n\nLuxe Moon Serum is powered by a powerful blend of advanced ingredients:\n\nNano Botox Technology\nHelps repair damaged hair fibers and restore smoothness.\n\nBiotin (Vitamin B7)\nStrengthens hair strands and supports healthier hair structure.\n\nHydrolyzed Keratin\nRebuilds hair protein structure, improving elasticity and reducing breakage.\n\nNanoplastia Complex\nSmooths frizz, enhances shine, and deeply nourishes hair.\n\nTogether, these ingredients work to repair internal hair damage, seal moisture, and create silky, healthy-looking hair.	10.00	10.00	11.00	{/products/mask.jpg}	{"pH-Balanced Formula",Sulfate-Free,Paraben-Free,Silicone-Free}	\N	95	cmm68r1o30000kxu48wlmuzaz	\N	\N	\N	0	\N	\N	\N	f	f	Shining Silk Hair Mask | LuxeMoon Nano Botox 4-in-1	Repair-focused hair mask for deep nourishment, softness, and frizz control.	{hair-mask,repair,4-in-1}	f	{}	f	t	f	f	\N	<h1>ðŸŒ™ Luxe Moon Soft &amp; Silky Hair Serum</h1><h3>Premium Korean Hair Repair &amp; Shine Serum</h3><p>Experience instantly smoother, shinier, and healthier hair with <strong>Luxe Moon Soft &amp; Silky Hair Serum</strong> â€” a lightweight professional hair treatment inspired by advanced Korean cosmetic technology.</p><p>This premium serum is specially designed to <strong>repair damaged hair, control frizz, and add luxurious shine</strong> while deeply nourishing every strand. Its advanced formula works from mid-length to ends, helping restore softness, improve hair texture, and protect hair from daily environmental stress.</p><p>Even if you have never used professional hair treatments before, Luxe Moon Serum provides <strong>instant visible results</strong> â€” smoother hair, silky texture, and natural glossy shine.</p>	ðŸ§ª Key Ingredients\n\nâ€¢ Nano Botox Complex\nâ€¢ Biotin (Vitamin B7)\nâ€¢ Hydrolyzed Keratin\nâ€¢ Nanoplastia Complex\nâ€¢ Moisturizing Hair Conditioning Agents	ðŸ§´ How to Use\n\n1ï¸âƒ£ Take 2â€“3 drops of serum on your palm.\n2ï¸âƒ£ Rub hands gently to spread the serum evenly.\n3ï¸âƒ£ Apply from mid-length to ends of semi-dry or dry hair.\n4ï¸âƒ£ Avoid applying directly on the scalp.\n5ï¸âƒ£ Style hair as desired.\n\nFor best results, use after Luxe Moon Shampoo and Hair Mask.	{"Deep nourishment","Frizz reduction","Improved softness and shine"}	{}	[{"answer": "Use 2-3 times per week after shampoo.", "question": "How often should I use this mask?"}, {"answer": "Yes, it helps smooth cuticles and control frizz.", "question": "Does it help frizz?"}]	2026-02-28 11:31:57.96	2026-03-19 17:02:22.552	f
cmm68r28s0006kxu4sr68owb1	soft-silky-serum	âœ¨ Complete Hair Care with Luxe Moon 3-in-1 Combo ðŸŒ™ Botox + Biotin + Keratin + Nanoplastia Perfect for after treatments hair  and natural hair ðŸ’«	Discover the power of Luxe Moon Hair Shampoo + Hair Treatment + Hair Serum â€” a complete routine designed to cleanse, repair, and nourish your hair from root to tip.  \n\nFormulated with advanced ingredients like Nano Botox Technology, Biotin (Vitamin B7), Hydrolyzed Keratin & Nanoplastia-inspired care to help strengthen hair fibers, improve moisture balance, and restore silky smooth shine.  \n	37.00	37.00	40.00	{/products/serum.jpg}	{"pH-Balanced Formula",Sulfate-Free,Paraben-Free,Silicone-Free}	\N	149	cmm68r1o30000kxu48wlmuzaz	\N	\N	\N	0	\N	\N	\N	f	f	Soft & Silky Hair Serum | LuxeMoon Nano Botox 4-in-1	Lightweight serum for frizz control, shine, and daily manageability.	{serum,frizz-control,4-in-1}	f	{}	f	t	f	f	\N	<h1>ðŸŒ™ Luxe Moon Hair Care Collection</h1><h3>Premium Korean Salon-Level Hair Treatment System</h3><p>Transform your hair with <strong>Luxe Moon Hair Care</strong>, a premium hair treatment collection inspired by advanced Korean cosmetic science. Designed to repair, nourish, and strengthen hair from deep within, Luxe Moon delivers salon-quality results at home.</p><p>Unlike ordinary hair products that only give temporary shine, Luxe Moon focuses on <strong>long-lasting hair health</strong> â€” restoring smoothness, reducing frizz, and deeply hydrating each strand.</p><p>Whether your hair is <strong>dry, frizzy, damaged, or weak</strong>, Luxe Moon helps bring it back to life with silky softness, natural shine, and stronger hair from root to tip.</p><hr><h1>âœ¨ Why Choose Luxe Moon?</h1><p>Luxe Moon products are powered by an advanced formula combining:</p><p>â€¢ <strong>Nano Botox Technology</strong> â€“ Deep hair fiber repair<br>â€¢ <strong>Biotin</strong> â€“ Strengthens hair and supports healthy growth<br>â€¢ <strong>Hydrolyzed Keratin</strong> â€“ Restores hair structure and elasticity<br>â€¢ <strong>Nanoplastia Complex</strong> â€“ Enhances smoothness and shine</p><p>This powerful blend penetrates deeply into the hair shaft to repair internal damage, restore moisture balance, and protect hair from daily stress.</p><hr><h1>ðŸ’Ž Luxe Moon Hair Care Benefits</h1><p>âœ” Deep hydration and long-lasting moisture<br>âœ” Smooth, silky, frizz-free hair<br>âœ” Stronger hair fibers and reduced breakage<br>âœ” Healthy scalp and nourished roots<br>âœ” Brilliant natural shine<br>âœ” Protection from environmental damage</p><p>Perfect for anyone who wants <strong>salon-smooth hair without visiting a salon.</strong></p><hr><h1>ðŸ§´ Whatâ€™s Inside the Luxe Moon Hair Care Collection</h1><h3>1ï¸âƒ£ Luxe Moon Nano Botox Shining Silk Hair Mask</h3><p>A professional deep-repair hair mask designed to revive dry, damaged, and frizzy hair. The Nano Botox + Biotin + Keratin + Nanoplastia formula deeply nourishes each strand, leaving hair soft, silky, and manageable.</p><p><strong>Key Benefits</strong></p><p>â€¢ Repairs damaged and chemically treated hair<br>â€¢ Reduces frizz and split ends<br>â€¢ Restores smoothness and shine<br>â€¢ Strengthens weak hair fibers<br>â€¢ Improves hair texture and softness</p><p><strong>How to Use</strong></p><p>Apply on freshly washed hair when it is about <strong>80% dry</strong>. Massage evenly from roots to ends and rinse after full absorption.</p><p><strong>Size:</strong> 500ml / 17.6 fl.oz<br>Formulated in Korea | Made in P.R.C</p><hr><h3>2ï¸âƒ£ Luxe Moon Soft &amp; Silky Hair Serum</h3><p>A lightweight finishing serum that instantly smooths hair, controls frizz, and adds mirror-like shine. It deeply nourishes hair while protecting it from heat, pollution, and daily styling damage.</p><p><strong>Key Benefits</strong></p><p>â€¢ Instantly smooths and softens hair<br>â€¢ Adds brilliant glossy shine<br>â€¢ Protects hair structure<br>â€¢ Reduces breakage and split ends<br>â€¢ Leaves hair silky without heaviness</p><p><strong>How to Use</strong></p><p>Apply <strong>2â€“3 drops</strong> to semi-dry or dry hair. Spread evenly through mid-length to ends.</p><p><strong>Size:</strong> 100ml / 3.52 fl.oz<br>Formulated in Korea | Made in P.R.C</p><hr><h3>3ï¸âƒ£ Luxe Moon Nano Botox Anti-Hair Fall Shampoo</h3><p>A salon-level cleansing shampoo that removes dirt and excess oil while strengthening hair from the roots. The advanced Nano Botox complex helps reduce hair fall while keeping hair smooth, soft, and healthy.</p><p><strong>Key Benefits</strong></p><p>â€¢ Deep yet gentle scalp cleansing<br>â€¢ Strengthens hair roots<br>â€¢ Helps reduce hair fall and breakage<br>â€¢ Smooths frizzy strands<br>â€¢ Leaves hair soft and shiny</p><p><strong>How to Use</strong></p><p>Apply to wet hair, massage gently into scalp, create lather, then rinse thoroughly.</p><p><strong>Size:</strong> 500ml / 17.6 fl.oz<br>Formulated in Korea | Made in P.R.C</p><hr><h1>ðŸŒŸ Luxe Moon Hair Care Promise</h1><p>All Luxe Moon products are designed to deliver <strong>premium salon results at home</strong>.</p><p>âœ” Sulfate-Free<br>âœ” Paraben-Free<br>âœ” Silicone-Free<br>âœ” Suitable for all hair types<br>âœ” Safe for regular use</p>	ðŸŒ™ Luxe Moon Hair Shampoo â€“ Key Ingredients\n\n(Sulfate Free â€¢ Paraben Free â€¢ Silicone Free)\n\nðŸ’§ Cleansing & Base Ingredients\n\tâ€¢\tAqua (Purified Water)\n\tâ€¢\tCocamidopropyl Betaine\n\tâ€¢\tSodium Lauroyl Sarcosinate\n\tâ€¢\tDecyl Glucoside\n\tâ€¢\tLauryl Glucoside\n\nðŸŒ¿ Nourishing Ingredients\n\tâ€¢\tBiotin (Vitamin B7)\n\tâ€¢\tHydrolyzed Keratin\n\tâ€¢\tNano Botox Complex\n\tâ€¢\tArgan Oil Extract\n\tâ€¢\tCoconut Oil Extract\n\tâ€¢\tAloe Vera Extract\n\nâœ¨ Hair Care & Conditioning Agents\n\tâ€¢\tPanthenol (Pro-Vitamin B5)\n\tâ€¢\tHydrolyzed Silk Protein\n\tâ€¢\tPolyquaternium Conditioning Agents\n\nðŸ§ª Stability & Safety Ingredients\n\tâ€¢\tCitric Acid (pH Balancer)\n\tâ€¢\tPhenoxyethanol (Cosmetic Grade Preservative)\n\tâ€¢\tEthylhexylglycerin\n\tâ€¢\tNatural Fragrance\n\nâ¸»\n\nðŸŒ™ Luxe Moon Hair Treatment â€“ Key Ingredients\n\n(Sulfate Free â€¢ Paraben Free â€¢ Silicone Free)\n\nðŸ’§ Base & Conditioning Ingredients\n\tâ€¢\tAqua (Purified Water)\n\tâ€¢\tCetearyl Alcohol\n\tâ€¢\tBehentrimonium Chloride\n\tâ€¢\tCetyl Alcohol\n\nðŸŒ¿ Repair & Nourishing Ingredients\n\tâ€¢\tNano Botox Complex\n\tâ€¢\tBiotin (Vitamin B7)\n\tâ€¢\tHydrolyzed Keratin\n\tâ€¢\tHydrolyzed Collagen\n\tâ€¢\tArgan Oil\n\tâ€¢\tShea Butter\n\tâ€¢\tJojoba Oil\n\nâœ¨ Hair Repair Technology\n\tâ€¢\tNanoplastia Inspired Complex\n\tâ€¢\tSilk Protein\n\tâ€¢\tPanthenol (Vitamin B5)\n\nðŸ§ª Stability & Protection\n\tâ€¢\tCitric Acid\n\tâ€¢\tPhenoxyethanol\n\tâ€¢\tEthylhexylglycerin\n\tâ€¢\tNatural Fragrance\n\nâ¸»\n\nðŸŒ™ Luxe Moon Hair Serum â€“ Key Ingredients\n\n(Sulfate Free â€¢ Paraben Free)\n(Serum à¤®à¤¾ à¤•à¤¹à¤¿à¤²à¥‡à¤•à¤¾à¤¹à¥€à¤ light cosmetic silicones use à¤¹à¥à¤¨ à¤¸à¤•à¥à¤› smooth finish à¤•à¤¾ à¤²à¤¾à¤—à¤¿, à¤¤à¤° silicone-free formula à¤ªà¤¨à¤¿ possible à¤¹à¥à¤¨à¥à¤›)\n\nðŸ’§ Base Ingredients\n\tâ€¢\tCyclopentasiloxane / Natural Silicone Alternative\n\tâ€¢\tDimethiconol Conditioning Complex\n\nðŸŒ¿ Active Hair Care Ingredients\n\tâ€¢\tNano Botox Complex\n\tâ€¢\tBiotin (Vitamin B7)\n\tâ€¢\tHydrolyzed Keratin\n\tâ€¢\tNanoplastia Inspired Smooth Complex\n\nðŸŒ¿ Natural Nourishing Oils\n\tâ€¢\tArgan Oil\n\tâ€¢\tMacadamia Oil\n\tâ€¢\tJojoba Oil\n\tâ€¢\tVitamin E (Tocopherol)\n\nâœ¨ Hair Shine & Protection\n\tâ€¢\tSilk Protein\n\tâ€¢\tUV Hair Protection Complex\n\nðŸ§ª Stability\n\tâ€¢\tFragrance\n\tâ€¢\tCosmetic Grade Stabilizers	ðŸŒ™ How to Use â€“ Luxe Moon 3-Step Hair Care Routine\n\n1ï¸âƒ£ Luxe Moon Hair Shampoo\n\nStep 1: Cleanse Your Scalp\n\t1.\tWet your hair thoroughly with clean water.\n\t2.\tTake a small amount of Luxe Moon Hair Shampoo in your hands.\n\t3.\tGently massage the shampoo into your scalp to create a rich lather.\n\t4.\tMassage for 1â€“2 minutes to cleanse thoroughly.\n\t5.\tRinse completely with clean water.\n\nâœ¨ This step removes dirt, excess oil, and product buildup while preparing your hair for the next stage of care.\n\nâ¸»\n\n2ï¸âƒ£ Luxe Moon Hair Treatment\n\nStep 2: Deep Nourish & Repair\n\t1.\tAfter shampooing, gently squeeze out excess water from your hair.\n\t2.\tApply Luxe Moon Hair Treatment from mid-lengths to ends.\n\t3.\tSpread evenly and leave on for 3â€“5 minutes.\n\t4.\tRinse thoroughly with clean water.\n\nâœ¨ This step provides deep nourishment, repair, softness, and smoothness for healthier hair.\n\nâ¸»\n\n3ï¸âƒ£ Luxe Moon Hair Serum\n\nStep 3: Smooth & Protect\n\t1.\tApply 2â€“3 drops of Luxe Moon Hair Serum to towel-dried or slightly damp hair.\n\t2.\tRub the serum between your hands and apply from mid-lengths to ends.\n\t3.\tComb through to distribute evenly.\n\t4.\tDo not rinse.\n\nâœ¨ This step delivers silky, shiny, smooth, and frizz-free hair with long-lasting protection.\n\nâ¸»\n\nðŸ’Ž Pro Tips for Best Results\n\tâ€¢\tShampoo: Use regularly for a clean, healthy scalp.\n\tâ€¢\tTreatment: 2â€“3 times per week for deep repair.\n\tâ€¢\tSerum: Daily for smooth, glossy hair and heat protection.	{"Frizz control","Shine boost","Easy combing and styling"}	{}	[{"answer": "Yes, apply a small amount before or after styling.", "question": "Can I use this before styling?"}, {"answer": "No. It is lightweight and non-greasy when used in small quantity.", "question": "Will it feel sticky?"}]	2026-02-28 11:31:58.108	2026-03-21 06:55:40.516	f
cmm68r1wl0002kxu4jdqoc1hx	anti-hair-fall-shampoo	ðŸŒ™ Luxe Moon Anti-Hair Fall Shampoo ðŸŒ™  Botox + Biotin + Keratin + Nanoplastia Perfect for after treatments hair and natural hair ðŸ’«	âœ¨ Advanced Korean Hair Technology\n\nLuxe Moon Shampoo is powered by a powerful combination of advanced ingredients:\n\nNano Botox Technology\nHelps repair hair fibers and restore smoothness.\n\nBiotin (Vitamin B7)\nStrengthens hair roots and supports healthier hair growth.\n\nHydrolyzed Keratin\nRebuilds the hairâ€™s protein structure and improves elasticity.\n\nNanoplastia Complex\nSmooths frizz, enhances shine, and deeply nourishes hair.\n\nTogether, these ingredients work to repair damaged hair structure, strengthen roots, and restore natural hair vitality.	16.00	16.00	19.00	{/products/shampoo2.jpg}	{"pH-Balanced Formula",Sulfate-Free,Paraben-Free,Silicone-Free}	\N	98	cmm68r1o30000kxu48wlmuzaz	\N	\N	\N	0	\N	\N	\N	f	f	Anti-Hair Fall Shampoo | LuxeMoon Nano Botox 4-in-1	Sulfate-free, pH-balanced shampoo that helps reduce breakage-related hair fall.	{anti-hair-fall,shampoo,4-in-1}	f	{}	f	t	f	f	\N	<h1>ðŸŒ™ Luxe Moon Nano Botox Anti-Hair Fall Shampoo</h1><h3>Premium Korean Scalp Care &amp; Hair Strengthening Shampoo</h3><p>Restore your hairâ€™s natural strength, softness, and shine with <strong>Luxe Moon Nano Botox Anti-Hair Fall Shampoo</strong>, a salon-level cleansing formula inspired by advanced Korean cosmetic science.</p><p>This premium shampoo is designed to gently cleanse the scalp while strengthening hair from the roots. Its advanced formula helps reduce hair fall, repair damaged strands, and restore smoothness and shine.</p><p>Unlike ordinary shampoos that can strip away natural oils, Luxe Moon Shampoo provides <strong>deep yet gentle cleansing</strong> while nourishing the scalp and hair fibers. With consistent use, hair feels <strong>stronger, softer, smoother, and healthier</strong> from the very first wash.</p>	ðŸ§ª Key Ingredients\n\nâ€¢ Nano Botox Complex\nâ€¢ Biotin (Vitamin B7)\nâ€¢ Hydrolyzed Keratin\nâ€¢ Nanoplastia Complex\nâ€¢ Gentle Cleansing Agents\nâ€¢ Hair Conditioning Ingredients	ðŸ§´ How to Use\n\n1ï¸âƒ£ Wet your hair thoroughly with water.\n2ï¸âƒ£ Apply a small amount of shampoo to your scalp.\n3ï¸âƒ£ Gently massage to create a rich lather.\n4ï¸âƒ£ Spread the foam through hair lengths.\n5ï¸âƒ£ Rinse thoroughly with clean water.\n\nFor best results, follow with Luxe Moon Shining Silk Hair Mask and Luxe Moon Hair Serum.	{"Root strengthening","Scalp-friendly cleansing","Daily-use comfort"}	{}	[{"answer": "Yes. The formula is designed for regular use.", "question": "Is this for daily use?"}, {"answer": "Anyone facing breakage-related hair fall and weak roots.", "question": "Who should use this?"}]	2026-02-28 11:31:57.668	2026-03-19 17:04:02.501	f
cmmrakiw40001jv04uoxytkas	-luxe-moon-silkeysineysmooth-hair-treatment-mask--botox--biotin--keratin--nanoplastia-perfect-for-after-treatments-hair-and-natural-hair-	ðŸŒ™ Luxe Moon Silkey,Siney,Smooth Hair Treatment Mask-ðŸŒ™ Botox + Biotin + Keratin + Nanoplastia Perfect for after treatments hair and natural hair ðŸ’«	âœ¨ Advanced Korean Hair Technology\n\nLuxe Moon Hair Treatment is powered by an advanced combination of premium ingredients:\n\nNano Botox Technology\nDeeply repairs damaged hair fibers and improves smoothness.\n\nBiotin (Vitamin B7)\nStrengthens hair strands and supports healthier hair structure.\n\nHydrolyzed Keratin\nRebuilds and restores the natural protein structure of hair.\n\nNanoplastia Complex\nEnhances smoothness, shine, and overall hair health.\n\nThis powerful formula penetrates deeply into the hair shaft to restore internal strength, repair damage, and seal in moisture for long-lasting silky hair.	15.00	15.00	17.00	{https://res.cloudinary.com/dvzgdwp6u/image/upload/v1773551245/luxemoon/products/vorqlphgwd4sop1isz5o.png}	{"pH-Balanced Formula",Sulfate-Free,Paraben-Free,Silicone-Free}	\N	98	cmm68r1o30000kxu48wlmuzaz	\N	\N	\N	0	\N	\N	\N	f	f	Anti-Hair Fall Shampoo | LuxeMoon Nano Botox 4-in-1	Sulfate-free, pH-balanced shampoo that helps reduce breakage-related hair fall.	{}	f	{}	f	t	f	f	\N	<h1>ðŸŒ™ Luxe Moon Nano Botox Shining Silk Hair Treatment Mask</h1><h3>Premium Korean Deep Repair &amp; Smoothing Hair Treatment</h3><p>Revive dry, damaged, and frizzy hair with <strong>Luxe Moon Nano Botox Shining Silk Hair Treatment Mask</strong>, a professional salon-level deep repair treatment inspired by advanced Korean cosmetic science.</p><p>This luxurious hair treatment is specially designed to <strong>repair damaged hair fibers, restore moisture, and transform rough hair into silky, smooth strands</strong>. Its rich formula penetrates deeply into the hair structure to provide intense nourishment, long-lasting hydration, and visible smoothness.</p><p>Even if you have never used professional hair treatments before, Luxe Moon Hair Treatment delivers <strong>instant softness, improved texture, and radiant shine</strong> after every use.</p>	ðŸ§ª Key Ingredients\n\nâ€¢ Nano Botox Complex\nâ€¢ Biotin (Vitamin B7)\nâ€¢ Hydrolyzed Keratin\nâ€¢ Nanoplastia Complex\nâ€¢ Moisturizing and Conditioning Agents	ðŸ§´ How to Use\n\n1ï¸âƒ£ Wash hair with shampoo and gently towel-dry until about 80% dry.\n2ï¸âƒ£ Take a suitable amount of hair treatment mask.\n3ï¸âƒ£ Apply evenly from mid-length to ends of the hair.\n4ï¸âƒ£ Massage gently to ensure deep absorption.\n5ï¸âƒ£ Leave for 5â€“10 minutes for better nourishment.\n6ï¸âƒ£ Rinse thoroughly with clean water.\n\nFor best results, use together with Luxe Moon Nano Botox Shampoo and Luxe Moon Soft & Silky Hair Serum.	{}	{}	[]	2026-03-15 05:06:02.02	2026-03-19 17:03:05.407	f
\.


--
-- Data for Name: Review; Type: TABLE DATA; Schema: public; Owner: -
--

COPY "public"."Review" ("id", "userName", "address", "rating", "comment", "productId", "approved", "verifiedPurchase", "images", "video", "isFeatured", "isHidden", "isVerified", "ipAddress", "sortOrder", "createdAt") FROM stdin;
cmm697ugl0006ky04o443npig	Sandesh Parajuli	Kapan	5	Great Product â£ï¸ðŸ˜	cmm68r28s0006kxu4sr68owb1	t	t	{}	\N	f	f	f	106.222.231.26	0	2026-02-28 11:45:00.008
cmms1qsvq0007kxu43micj4wa	Balen	\N	5	Product is awasome. Loved itðŸ˜	cmm68r24o0004kxu4125qufxv	t	t	{}	\N	f	f	f	::1	0	2026-03-15 17:46:44.534
\.


--
-- Data for Name: SiteConfig; Type: TABLE DATA; Schema: public; Owner: -
--

COPY "public"."SiteConfig" ("id", "storeName", "bannerText", "logoUrl", "faviconUrl", "deliveryChargeInside", "deliveryChargeOutside", "freeDeliveryThreshold", "codFee", "expressDeliveryEnabled", "estimatedDeliveryInside", "estimatedDeliveryOutside", "globalDiscountPercent", "globalDiscountStart", "globalDiscountEnd", "allowStacking", "festiveSaleEnabled", "contactPhone", "contactEmail", "contactAddress", "whatsappNumber", "facebookUrl", "instagramUrl", "tiktokUrl", "metaTitle", "metaDescription", "footerContent", "privacyPolicy", "termsConditions", "aboutContent", "deliveryPolicy", "refundPolicy", "emailNotificationsEnabled", "smsNotificationsEnabled", "currencyCode", "languageToggleEnabled", "nprConversionRate", "showStockOnProduct") FROM stdin;
1	LuxeMoon	Nano Botox Biotin + Keratin 4-in-1	\N	https://res.cloudinary.com/dvzgdwp6u/image/upload/v1773726195/luxemoon/products/txnxubqmvmyfwoyurqab.png	0	1	37	0	f	1-2 days	3-5 days	0	\N	\N	f	t	+977 9800000000	luxemoon108@gmail.com	Kathmandu, Nepal	\N	\N	\N	\N	LuxeMoon Nano Botox 4-in-1 | Official Haircare Store Nepal	Official LuxeMoon Nepal store for Nano Botox Biotin + Keratin 4-in-1 haircare: Anti-Hair Fall Shampoo, Shining Silk Hair Mask, and Soft & Silky Hair Serum.	<p>3-step haircare system built for stronger roots, deep nourishment, and smooth frizz-controlled shine.</p>	<h2>Privacy Policy</h2><p>We respect your privacy. Your data is never sold.</p>	<h2>Terms & Conditions</h2><p>By using this site, you agree to our terms.</p>	<h2>Our Story</h2><p>Luxe Moon is premium Korean haircare created for the world.</p>	<h2>Delivery Policy</h2><p>We deliver across Nepal. 1-2 days inside valley, 3-5 days outside.</p>	<h2>Refund Policy</h2><p>7-day return policy for unused products.</p>	f	f	USD	f	133.5	f
\.


--
-- Data for Name: Transformation; Type: TABLE DATA; Schema: public; Owner: -
--

COPY "public"."Transformation" ("id", "beforeImage", "afterImage", "caption", "productId", "durationUsed", "isFeatured", "sortOrder", "createdAt") FROM stdin;
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY "public"."_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count") FROM stdin;
65b9b719-039f-49a8-8916-e879d0babd99	d29d8bf1b93e405e1cf57e2f9b47653c3bc6901c5e5fefab824b0524156b14fa	2026-03-21 08:27:13.744747+00	20260315_decimal-prices	\N	\N	2026-03-21 08:27:12.29668+00	1
c79f8f34-933d-4b4f-93ad-184189e74c2d	7bfec24f8719f85abe494588de34e06d18dc5064cd6e7fe68fcd41e840b3dc03	2026-03-21 08:31:07.487008+00	20260321_add_product_is_best_seller	\N	\N	2026-03-21 08:31:06.289996+00	1
b1de536f-692b-4abf-a3c4-47c195a12b19	d1dfcca7fb4d95d834f2af2366c72927df61613553e1b25e5377129db8a543e7	2026-03-21 09:57:09.005989+00	20260321_add_homepage_heritage_columns	\N	\N	2026-03-21 09:57:07.542735+00	1
\.


--
-- Name: BlockedCustomer BlockedCustomer_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."BlockedCustomer"
    ADD CONSTRAINT "BlockedCustomer_pkey" PRIMARY KEY ("id");


--
-- Name: Category Category_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."Category"
    ADD CONSTRAINT "Category_pkey" PRIMARY KEY ("id");


--
-- Name: ContactMessage ContactMessage_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."ContactMessage"
    ADD CONSTRAINT "ContactMessage_pkey" PRIMARY KEY ("id");


--
-- Name: Coupon Coupon_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."Coupon"
    ADD CONSTRAINT "Coupon_pkey" PRIMARY KEY ("id");


--
-- Name: HomepageContent HomepageContent_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."HomepageContent"
    ADD CONSTRAINT "HomepageContent_pkey" PRIMARY KEY ("id");


--
-- Name: LoginAttempt LoginAttempt_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."LoginAttempt"
    ADD CONSTRAINT "LoginAttempt_pkey" PRIMARY KEY ("id");


--
-- Name: NotificationLog NotificationLog_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."NotificationLog"
    ADD CONSTRAINT "NotificationLog_pkey" PRIMARY KEY ("id");


--
-- Name: NotificationTemplate NotificationTemplate_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."NotificationTemplate"
    ADD CONSTRAINT "NotificationTemplate_pkey" PRIMARY KEY ("id");


--
-- Name: OrderItem OrderItem_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."OrderItem"
    ADD CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id");


--
-- Name: Order Order_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."Order"
    ADD CONSTRAINT "Order_pkey" PRIMARY KEY ("id");


--
-- Name: Product Product_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."Product"
    ADD CONSTRAINT "Product_pkey" PRIMARY KEY ("id");


--
-- Name: Review Review_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."Review"
    ADD CONSTRAINT "Review_pkey" PRIMARY KEY ("id");


--
-- Name: SiteConfig SiteConfig_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."SiteConfig"
    ADD CONSTRAINT "SiteConfig_pkey" PRIMARY KEY ("id");


--
-- Name: Transformation Transformation_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."Transformation"
    ADD CONSTRAINT "Transformation_pkey" PRIMARY KEY ("id");


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."_prisma_migrations"
    ADD CONSTRAINT "_prisma_migrations_pkey" PRIMARY KEY ("id");


--
-- Name: BlockedCustomer_phone_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "BlockedCustomer_phone_key" ON "public"."BlockedCustomer" USING "btree" ("phone");


--
-- Name: Category_isActive_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Category_isActive_idx" ON "public"."Category" USING "btree" ("isActive");


--
-- Name: Category_isArchived_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Category_isArchived_idx" ON "public"."Category" USING "btree" ("isArchived");


--
-- Name: Category_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Category_slug_key" ON "public"."Category" USING "btree" ("slug");


--
-- Name: ContactMessage_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ContactMessage_createdAt_idx" ON "public"."ContactMessage" USING "btree" ("createdAt");


--
-- Name: ContactMessage_isResolved_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ContactMessage_isResolved_idx" ON "public"."ContactMessage" USING "btree" ("isResolved");


--
-- Name: Coupon_code_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Coupon_code_idx" ON "public"."Coupon" USING "btree" ("code");


--
-- Name: Coupon_code_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Coupon_code_key" ON "public"."Coupon" USING "btree" ("code");


--
-- Name: Coupon_expiresAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Coupon_expiresAt_idx" ON "public"."Coupon" USING "btree" ("expiresAt");


--
-- Name: Coupon_isActive_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Coupon_isActive_idx" ON "public"."Coupon" USING "btree" ("isActive");


--
-- Name: LoginAttempt_ip_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "LoginAttempt_ip_createdAt_idx" ON "public"."LoginAttempt" USING "btree" ("ip", "createdAt");


--
-- Name: NotificationLog_orderId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "NotificationLog_orderId_idx" ON "public"."NotificationLog" USING "btree" ("orderId");


--
-- Name: NotificationLog_orderId_sentAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "NotificationLog_orderId_sentAt_idx" ON "public"."NotificationLog" USING "btree" ("orderId", "sentAt");


--
-- Name: NotificationTemplate_type_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "NotificationTemplate_type_key" ON "public"."NotificationTemplate" USING "btree" ("type");


--
-- Name: Order_couponId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Order_couponId_idx" ON "public"."Order" USING "btree" ("couponId");


--
-- Name: Order_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Order_createdAt_idx" ON "public"."Order" USING "btree" ("createdAt");


--
-- Name: Order_customerName_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Order_customerName_idx" ON "public"."Order" USING "btree" ("customerName");


--
-- Name: Order_idempotencyKey_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Order_idempotencyKey_key" ON "public"."Order" USING "btree" ("idempotencyKey");


--
-- Name: Order_phone_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Order_phone_idx" ON "public"."Order" USING "btree" ("phone");


--
-- Name: Order_status_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Order_status_createdAt_idx" ON "public"."Order" USING "btree" ("status", "createdAt");


--
-- Name: Order_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Order_status_idx" ON "public"."Order" USING "btree" ("status");


--
-- Name: Product_categoryId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Product_categoryId_idx" ON "public"."Product" USING "btree" ("categoryId");


--
-- Name: Product_categoryId_isActive_isArchived_isDraft_stock_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Product_categoryId_isActive_isArchived_isDraft_stock_idx" ON "public"."Product" USING "btree" ("categoryId", "isActive", "isArchived", "isDraft", "stock");


--
-- Name: Product_isActive_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Product_isActive_idx" ON "public"."Product" USING "btree" ("isActive");


--
-- Name: Product_isActive_isArchived_isDraft_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Product_isActive_isArchived_isDraft_createdAt_idx" ON "public"."Product" USING "btree" ("isActive", "isArchived", "isDraft", "createdAt");


--
-- Name: Product_isArchived_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Product_isArchived_idx" ON "public"."Product" USING "btree" ("isArchived");


--
-- Name: Product_isDeleted_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Product_isDeleted_idx" ON "public"."Product" USING "btree" ("isDeleted");


--
-- Name: Product_isFeatured_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Product_isFeatured_idx" ON "public"."Product" USING "btree" ("isFeatured");


--
-- Name: Product_isNew_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Product_isNew_idx" ON "public"."Product" USING "btree" ("isNew");


--
-- Name: Product_name_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Product_name_idx" ON "public"."Product" USING "btree" ("name");


--
-- Name: Product_sku_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Product_sku_key" ON "public"."Product" USING "btree" ("sku");


--
-- Name: Product_slug_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Product_slug_key" ON "public"."Product" USING "btree" ("slug");


--
-- Name: Review_approved_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Review_approved_idx" ON "public"."Review" USING "btree" ("approved");


--
-- Name: Review_ipAddress_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Review_ipAddress_createdAt_idx" ON "public"."Review" USING "btree" ("ipAddress", "createdAt");


--
-- Name: Review_isFeatured_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Review_isFeatured_idx" ON "public"."Review" USING "btree" ("isFeatured");


--
-- Name: Review_isHidden_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Review_isHidden_idx" ON "public"."Review" USING "btree" ("isHidden");


--
-- Name: Review_productId_approved_isHidden_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Review_productId_approved_isHidden_createdAt_idx" ON "public"."Review" USING "btree" ("productId", "approved", "isHidden", "createdAt");


--
-- Name: Review_productId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Review_productId_idx" ON "public"."Review" USING "btree" ("productId");


--
-- Name: Transformation_isFeatured_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Transformation_isFeatured_idx" ON "public"."Transformation" USING "btree" ("isFeatured");


--
-- Name: Transformation_productId_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Transformation_productId_createdAt_idx" ON "public"."Transformation" USING "btree" ("productId", "createdAt");


--
-- Name: Transformation_productId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Transformation_productId_idx" ON "public"."Transformation" USING "btree" ("productId");


--
-- Name: NotificationLog NotificationLog_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."NotificationLog"
    ADD CONSTRAINT "NotificationLog_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."Order"("id") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: OrderItem OrderItem_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."OrderItem"
    ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."Order"("id") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: OrderItem OrderItem_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."OrderItem"
    ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Order Order_couponId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."Order"
    ADD CONSTRAINT "Order_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "public"."Coupon"("id") ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Product Product_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."Product"
    ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."Category"("id") ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Review Review_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."Review"
    ADD CONSTRAINT "Review_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Transformation Transformation_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY "public"."Transformation"
    ADD CONSTRAINT "Transformation_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict lfQIW8lecOQl6k48Dmf8LZPT0lbGhZ1ZuybTh0OD2vkMraAmHmaEGlUcekqBKJz



