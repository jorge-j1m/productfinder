/**
 * Branded type utilities shared across all entities
 * This ensures a single source of truth for the __brand symbol
 */

export declare const __brand: unique symbol;
export type Brand<T, TBrand extends string> = T & { [__brand]: TBrand };
