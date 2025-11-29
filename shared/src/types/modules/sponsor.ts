import { BaseLineItem, CreateLineItemInput, UpdateLineItemInput } from '../line-item';

export interface SponsorLineItem extends BaseLineItem {
  sponsorName: string;
  sponsorType: 'CASH' | 'IN_KIND' | 'MEDIA' | 'VENUE';
  contactEmail?: string;
  contactPhone?: string;
  contractSigned?: boolean;
  benefits?: string[];
  logoUrl?: string;
}

export interface CreateSponsorLineItemInput extends CreateLineItemInput {
  sponsorName: string;
  sponsorType: 'CASH' | 'IN_KIND' | 'MEDIA' | 'VENUE';
  contactEmail?: string;
  contactPhone?: string;
  contractSigned?: boolean;
  benefits?: string[];
  logoUrl?: string;
}

export interface UpdateSponsorLineItemInput extends UpdateLineItemInput {
  sponsorName?: string;
  sponsorType?: 'CASH' | 'IN_KIND' | 'MEDIA' | 'VENUE';
  contactEmail?: string;
  contactPhone?: string;
  contractSigned?: boolean;
  benefits?: string[];
  logoUrl?: string;
}


