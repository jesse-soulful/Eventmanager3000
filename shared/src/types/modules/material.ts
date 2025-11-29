import { BaseLineItem, CreateLineItemInput, UpdateLineItemInput } from '../line-item';

export interface MaterialLineItem extends BaseLineItem {
  materialType: string;
  supplier?: string;
  deliveryDate?: Date;
  returnDate?: Date;
  isRental?: boolean;
}

export interface CreateMaterialLineItemInput extends CreateLineItemInput {
  materialType: string;
  supplier?: string;
  deliveryDate?: Date;
  returnDate?: Date;
  isRental?: boolean;
}

export interface UpdateMaterialLineItemInput extends UpdateLineItemInput {
  materialType?: string;
  supplier?: string;
  deliveryDate?: Date;
  returnDate?: Date;
  isRental?: boolean;
}

