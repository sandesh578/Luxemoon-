import { Prisma } from "@prisma/client";

export function decimalToNumber(value: Prisma.Decimal | number | string | null | undefined): number {
  if (value == null) return 0;
  if (typeof (value as Prisma.Decimal).toNumber === "function") {
    return (value as Prisma.Decimal).toNumber();
  }
  return Number(value);
}

export function decimalToNumberOrNull(
  value: Prisma.Decimal | number | string | null | undefined
): number | null {
  if (value == null) return null;
  return decimalToNumber(value);
}
