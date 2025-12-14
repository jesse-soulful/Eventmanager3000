import { BaseLineItem, CreateLineItemInput, UpdateLineItemInput } from '../line-item';

export interface ArtistLineItem extends BaseLineItem {
  artistName: string;
  performanceDate?: Date;
  performanceDuration?: number; // in minutes
  genre?: string;
  contactEmail?: string;
  contactPhone?: string;
  contractSigned?: boolean;
  paymentTerms?: string;
}

export interface CreateArtistLineItemInput extends CreateLineItemInput {
  artistName: string;
  performanceDate?: Date;
  performanceDuration?: number;
  genre?: string;
  contactEmail?: string;
  contactPhone?: string;
  contractSigned?: boolean;
  paymentTerms?: string;
}

export interface UpdateArtistLineItemInput extends UpdateLineItemInput {
  artistName?: string;
  performanceDate?: Date;
  performanceDuration?: number;
  genre?: string;
  contactEmail?: string;
  contactPhone?: string;
  contractSigned?: boolean;
  paymentTerms?: string;
}




