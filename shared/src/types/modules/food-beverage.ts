import { BaseLineItem, CreateLineItemInput, UpdateLineItemInput } from '../line-item';

export interface FoodBeverageLineItem extends BaseLineItem {
  itemType: 'FOOD' | 'BEVERAGE';
  dietaryInfo?: string[];
  supplier?: string;
  deliveryDate?: Date;
  servingSize?: string;
  allergens?: string[];
}

export interface CreateFoodBeverageLineItemInput extends CreateLineItemInput {
  itemType: 'FOOD' | 'BEVERAGE';
  dietaryInfo?: string[];
  supplier?: string;
  deliveryDate?: Date;
  servingSize?: string;
  allergens?: string[];
}

export interface UpdateFoodBeverageLineItemInput extends UpdateLineItemInput {
  itemType?: 'FOOD' | 'BEVERAGE';
  dietaryInfo?: string[];
  supplier?: string;
  deliveryDate?: Date;
  servingSize?: string;
  allergens?: string[];
}


