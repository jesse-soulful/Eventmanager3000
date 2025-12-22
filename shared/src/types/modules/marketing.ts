import { BaseLineItem, CreateLineItemInput, UpdateLineItemInput } from '../line-item';

export interface MarketingLineItem extends BaseLineItem {
  channel: 'SOCIAL_MEDIA' | 'EMAIL' | 'PRINT' | 'RADIO' | 'TV' | 'ONLINE' | 'OTHER';
  campaignName?: string;
  targetAudience?: string;
  startDate?: Date;
  endDate?: Date;
  reach?: number;
  impressions?: number;
}

export interface CreateMarketingLineItemInput extends CreateLineItemInput {
  channel: 'SOCIAL_MEDIA' | 'EMAIL' | 'PRINT' | 'RADIO' | 'TV' | 'ONLINE' | 'OTHER';
  campaignName?: string;
  targetAudience?: string;
  startDate?: Date;
  endDate?: Date;
  reach?: number;
  impressions?: number;
}

export interface UpdateMarketingLineItemInput extends UpdateLineItemInput {
  channel?: 'SOCIAL_MEDIA' | 'EMAIL' | 'PRINT' | 'RADIO' | 'TV' | 'ONLINE' | 'OTHER';
  campaignName?: string;
  targetAudience?: string;
  startDate?: Date;
  endDate?: Date;
  reach?: number;
  impressions?: number;
}







