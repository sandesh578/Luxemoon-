// Official Nepal Province → District mapping (all 77 districts)

export const NEPAL_PROVINCES: Record<string, string[]> = {
    "Koshi Province": [
        "Bhojpur", "Dhankuta", "Ilam", "Jhapa", "Khotang",
        "Morang", "Okhaldhunga", "Panchthar", "Sankhuwasabha",
        "Solukhumbu", "Sunsari", "Taplejung", "Terhathum", "Udayapur"
    ],
    "Madhesh Province": [
        "Bara", "Dhanusha", "Mahottari", "Parsa",
        "Rautahat", "Saptari", "Sarlahi", "Siraha"
    ],
    "Bagmati Province": [
        "Bhaktapur", "Chitwan", "Dhading", "Dolakha",
        "Kathmandu", "Kavrepalanchok", "Lalitpur", "Makwanpur",
        "Nuwakot", "Ramechhap", "Rasuwa", "Sindhuli", "Sindhupalchok"
    ],
    "Gandaki Province": [
        "Baglung", "Gorkha", "Kaski", "Lamjung",
        "Manang", "Mustang", "Myagdi", "Nawalparasi East",
        "Parbat", "Syangja", "Tanahun"
    ],
    "Lumbini Province": [
        "Arghakhanchi", "Banke", "Bardiya", "Dang",
        "Gulmi", "Kapilvastu", "Nawalparasi West", "Palpa",
        "Pyuthan", "Rolpa", "Rukum East", "Rupandehi"
    ],
    "Karnali Province": [
        "Dailekh", "Dolpa", "Humla", "Jajarkot", "Jumla",
        "Kalikot", "Mugu", "Rukum West", "Salyan", "Surkhet"
    ],
    "Sudurpashchim Province": [
        "Achham", "Baitadi", "Bajhang", "Bajura",
        "Dadeldhura", "Darchula", "Doti", "Kailali", "Kanchanpur"
    ]
};

// Kathmandu Valley districts for auto-detection
export const VALLEY_DISTRICTS = ["Kathmandu", "Lalitpur", "Bhaktapur"];

export function getDistrictsForProvince(province: string): string[] {
    return NEPAL_PROVINCES[province] || [];
}

export function isValidProvinceDistrict(province: string, district: string): boolean {
    const districts = NEPAL_PROVINCES[province];
    if (!districts) return false;
    return districts.includes(district);
}

export function isValleyDistrict(district: string): boolean {
    return VALLEY_DISTRICTS.includes(district);
}
