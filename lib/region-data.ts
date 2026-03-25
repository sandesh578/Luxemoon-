// Global Region → Area mapping for shipping and pricing

export const SHIPPING_REGIONS: Record<string, string[]> = {
    "Koshi": [
        "Bhojpur", "Dhankuta", "Ilam", "Jhapa", "Khotang",
        "Morang", "Okhaldhunga", "Panchthar", "Sankhuwasabha",
        "Solukhumbu", "Sunsari", "Taplejung", "Terhathum", "Udayapur"
    ],
    "Madhesh": [
        "Bara", "Dhanusha", "Mahottari", "Parsa",
        "Rautahat", "Saptari", "Sarlahi", "Siraha"
    ],
    "Bagmati": [
        "Bhaktapur", "Chitwan", "Dhading", "Dolakha",
        "Kathmandu", "Kavrepalanchok", "Lalitpur", "Makwanpur",
        "Nuwakot", "Ramechhap", "Rasuwa", "Sindhuli", "Sindhupalchok"
    ],
    "Gandaki": [
        "Baglung", "Gorkha", "Kaski", "Lamjung",
        "Manang", "Mustang", "Myagdi", "Nawalparasi East",
        "Parbat", "Syangja", "Tanahun"
    ],
    "Lumbini": [
        "Arghakhanchi", "Banke", "Bardiya", "Dang",
        "Gulmi", "Kapilvastu", "Nawalparasi West", "Palpa",
        "Pyuthan", "Rolpa", "Rukum East", "Rupandehi"
    ],
    "Karnali": [
        "Dailekh", "Dolpa", "Humla", "Jajarkot", "Jumla",
        "Kalikot", "Mugu", "Rukum West", "Salyan", "Surkhet"
    ],
    "Sudurpashchim": [
        "Achham", "Baitadi", "Bajhang", "Bajura",
        "Dadeldhura", "Darchula", "Doti", "Kailali", "Kanchanpur"
    ]
};

// Core urban areas for auto-detection (Inside/Outside Valley logic)
export const CORE_URBAN_AREAS = ["Kathmandu", "Lalitpur", "Bhaktapur"];

export function getAreasForRegion(region: string): string[] {
    return SHIPPING_REGIONS[region] || [];
}

export function isValidRegionArea(region: string, area: string): boolean {
    const areas = SHIPPING_REGIONS[region];
    if (!areas) return false;
    return areas.includes(area);
}

export function isCoreUrbanArea(area: string): boolean {
    return CORE_URBAN_AREAS.includes(area);
}
