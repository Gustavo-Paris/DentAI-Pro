/**
 * Finance Icons Registry
 *
 * @module icons/registry/finance
 */

import {
  DollarSign,
  CreditCard,
  ShoppingCart,
  Coins,
  Wallet,
  Receipt,
} from 'lucide-react';

export const financeIcons = {
  'dollar-sign': DollarSign,
  dollar: DollarSign,
  money: DollarSign,
  'credit-card': CreditCard,
  'shopping-cart': ShoppingCart,
  cart: ShoppingCart,
  coins: Coins,
  wallet: Wallet,
  receipt: Receipt,
} as const;
