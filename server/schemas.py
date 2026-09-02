from pydantic import BaseModel

# The material taxonomy Gemini is allowed to choose from.
# `material_type` is the join key into recycling_app_material_info (see the
# 202609020000_create_material_info.sql migration). 
# Categories/types are drawn from earth911's recycling guide:
# https://earth911.com/recycling-center-search-guides/

MATERIAL_CATEGORIES = [
    "plastic",
    "paper",
    "glass",
    "metal",
    "electronics",
    "household_hazardous_waste",
    "automotive",
    "construction",
    "household",
]

MATERIAL_TYPES = [
    # (material_type, category, display_name)
    ("pet_plastic_bottle", "plastic", "PET plastic bottle"),
    ("hdpe_plastic_container", "plastic", "HDPE plastic container"),
    ("plastic_bag_or_film", "plastic", "Plastic bag or film"),
    ("styrofoam", "plastic", "Styrofoam / expanded polystyrene"),
    ("bubble_wrap", "plastic", "Bubble wrap"),
    ("black_plastic", "plastic", "Black-colored plastic"),
    ("cardboard", "paper", "Cardboard"),
    ("newspaper", "paper", "Newspaper"),
    ("paper_generic", "paper", "Paper"),
    ("paper_cup", "paper", "Paper cup"),
    ("paper_bag", "paper", "Paper bag"),
    ("book_or_magazine", "paper", "Book or magazine"),
    ("carton", "paper", "Carton"),
    ("glass_bottle_or_jar", "glass", "Glass bottle or jar"),
    ("window_glass", "glass", "Window glass"),
    ("kitchen_glassware", "glass", "Kitchen glassware"),
    ("aluminum_can", "metal", "Aluminum can"),
    ("steel_or_tin_can", "metal", "Steel or tin can"),
    ("aluminum_foil", "metal", "Aluminum foil"),
    ("aerosol_can", "metal", "Aerosol can"),
    ("propane_tank", "metal", "Propane tank"),
    ("cell_phone", "electronics", "Cell phone"),
    ("computer_or_laptop", "electronics", "Computer or laptop"),
    ("computer_monitor", "electronics", "Computer monitor"),
    ("cd_or_dvd", "electronics", "CD or DVD"),
    ("ink_cartridge", "electronics", "Ink cartridge"),
    ("small_appliance", "electronics", "Small appliance"),
    ("large_appliance", "electronics", "Large appliance"),
    ("cfl_or_fluorescent_bulb", "household_hazardous_waste", "CFL or fluorescent bulb"),
    ("battery_household", "household_hazardous_waste", "Household battery"),
    ("paint", "household_hazardous_waste", "Paint"),
    ("medication", "household_hazardous_waste", "Medication"),
    ("motor_oil_or_filter", "automotive", "Motor oil or filter"),
    ("car_battery", "automotive", "Car battery"),
    ("tire", "automotive", "Tire"),
    ("carpet", "construction", "Carpet"),
    ("shingles", "construction", "Shingles"),
    ("clothing_or_textile", "household", "Clothing or textile"),
    ("furniture", "household", "Furniture"),
    ("cookware", "household", "Cookware"),
]

MATERIAL_TYPE_KEYS = [key for key, _, _ in MATERIAL_TYPES]


class RecyclingIdentification(BaseModel):
    contains_recyclable_item: bool
    material_type: str | None = None
    item_description: str | None = None
    confidence: float | None = None
    unidentified_reason: str | None = None


# Gemini's response_schema needs `nullable: True`, not the `str | None` union shape
# Pydantic's auto-conversion produces (which Gemini's schema validator rejects).
RECYCLING_IDENTIFICATION_SCHEMA = {
    "type": "OBJECT",
    "properties": {
        "contains_recyclable_item": {"type": "BOOLEAN"},
        "material_type": {
            "type": "STRING",
            "enum": MATERIAL_TYPE_KEYS,
            "nullable": True,
        },
        "item_description": {"type": "STRING", "nullable": True},
        "confidence": {"type": "NUMBER", "nullable": True},
        "unidentified_reason": {"type": "STRING", "nullable": True},
    },
    "required": ["contains_recyclable_item"],
}

    