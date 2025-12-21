import { BaseLineItem, CreateLineItemInput, UpdateLineItemInput } from '../line-item';

export interface VendorLineItem extends BaseLineItem {
  vendorName: string;
  vendorType: string;
  contactEmail?: string;
  contactPhone?: string;
  contractSigned?: boolean;
  paymentTerms?: string;
  deliveryDate?: Date;
}

export interface CreateVendorLineItemInput extends CreateLineItemInput {
  vendorName: string;
  vendorType: string;
  contactEmail?: string;
  contactPhone?: string;
  contractSigned?: boolean;
  paymentTerms?: string;
  deliveryDate?: Date;
}

export interface UpdateVendorLineItemInput extends UpdateLineItemInput {
  vendorName?: string;
  vendorType?: string;
  contactEmail?: string;
  contactPhone?: string;
  contractSigned?: boolean;
  paymentTerms?: string;
  deliveryDate?: Date;
}






