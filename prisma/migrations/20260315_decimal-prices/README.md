-- decimal-prices migration
This migration converts the product and order price columns from `Int` to `Decimal` with a fixed scale so we can preserve cents/paisa when displaying USD prices and persisting totals.
