export const Role = {
  ADMIN: "ADMIN",
  MANAGER: "MANAGER",
  STAFF: "STAFF",
  CUSTOMER: "CUSTOMER",
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export const UserStatus = {
  PENDING: "PENDING",
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
} as const;
export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

export const ActiveStatus = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
} as const;
export type ActiveStatus = (typeof ActiveStatus)[keyof typeof ActiveStatus];

export const CategoryStatus = ActiveStatus;
export type CategoryStatus = ActiveStatus;

export const BrandStatus = ActiveStatus;
export type BrandStatus = ActiveStatus;

export const PolicyStatus = ActiveStatus;
export type PolicyStatus = ActiveStatus;

export const ProductStatus = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  HIDDEN: "HIDDEN",
} as const;
export type ProductStatus = (typeof ProductStatus)[keyof typeof ProductStatus];

export const ProductSort = {
  NEWEST: "NEWEST",
  PRICE_ASC: "PRICE_ASC",
  PRICE_DESC: "PRICE_DESC",
  RATING_DESC: "RATING_DESC",
  NAME_ASC: "NAME_ASC",
} as const;
export type ProductSort = (typeof ProductSort)[keyof typeof ProductSort];

export const InventoryStatus = {
  IN_STOCK: "IN_STOCK",
  LOW_STOCK: "LOW_STOCK",
  OUT_OF_STOCK: "OUT_OF_STOCK",
} as const;
export type InventoryStatus =
  (typeof InventoryStatus)[keyof typeof InventoryStatus];

export const InventoryAction = {
  ADD: "ADD",
  DEDUCT: "DEDUCT",
} as const;
export type InventoryAction =
  (typeof InventoryAction)[keyof typeof InventoryAction];

export const OrderStatus = {
  PENDING: "PENDING",
  PROCESSING: "PROCESSING",
  SHIPPED: "SHIPPED",
  DELIVERED: "DELIVERED",
  CANCELLED: "CANCELLED",
  RETURN_REQUESTED: "RETURN_REQUESTED",
  RETURNED: "RETURNED",
  RETURN_REJECTED: "RETURN_REJECTED",
} as const;
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

export const PaymentStatus = {
  UNPAID: "UNPAID",
  PAID: "PAID",
  PENDING_REFUND: "PENDING_REFUND",
  REFUNDED: "REFUNDED",
} as const;
export type PaymentStatus =
  (typeof PaymentStatus)[keyof typeof PaymentStatus];

export const PaymentMethod = {
  COD: "COD",
  VNPAY: "VNPAY",
} as const;
export type PaymentMethod =
  (typeof PaymentMethod)[keyof typeof PaymentMethod];

export const DiscountType = {
  PERCENTAGE: "PERCENTAGE",
  FIXED_AMOUNT: "FIXED_AMOUNT",
} as const;
export type DiscountType =
  (typeof DiscountType)[keyof typeof DiscountType];

export const ReturnStatus = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const;
export type ReturnStatus = (typeof ReturnStatus)[keyof typeof ReturnStatus];

export const PolicyType = {
  SHIPPING: "SHIPPING",
  PAYMENT: "PAYMENT",
  RETURN: "RETURN",
} as const;
export type PolicyType = (typeof PolicyType)[keyof typeof PolicyType];

export const ORDER_TRANSITIONS = {
  [OrderStatus.PENDING]: [
    OrderStatus.PROCESSING,
    OrderStatus.CANCELLED,
  ],
  [OrderStatus.PROCESSING]: [
    OrderStatus.SHIPPED,
    OrderStatus.CANCELLED,
  ],
  [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
  [OrderStatus.DELIVERED]: [OrderStatus.RETURN_REQUESTED],
  [OrderStatus.RETURN_REQUESTED]: [
      OrderStatus.RETURNED,
      OrderStatus.RETURN_REJECTED,
    ],
  [OrderStatus.CANCELLED]: [],
  [OrderStatus.RETURNED]: [],
  [OrderStatus.RETURN_REJECTED]: [],
} as const satisfies Record<OrderStatus, readonly OrderStatus[]>;