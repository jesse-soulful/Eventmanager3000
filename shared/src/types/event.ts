export interface Event {
  id: string;
  name: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  eventLink?: string;
  ticketshopLink?: string;
  venueName?: string;
  venueAddress?: string;
  venueCapacity?: number;
  promotorName?: string;
  promotorPhone?: string;
  artistLiaisonName?: string;
  artistLiaisonPhone?: string;
  technicalName?: string;
  technicalPhone?: string;
  runningOrder?: string;
  bannerImageUrl?: string;
  metadata?: string | Record<string, any>;
  status: EventStatus;
  createdAt: Date;
  updatedAt: Date;
}

export enum EventStatus {
  DRAFT = 'DRAFT',
  PLANNING = 'PLANNING',
  CONFIRMED = 'CONFIRMED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export interface CreateEventInput {
  name: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  eventLink?: string;
  ticketshopLink?: string;
  venueName?: string;
  venueAddress?: string;
  venueCapacity?: number;
  promotorName?: string;
  promotorPhone?: string;
  artistLiaisonName?: string;
  artistLiaisonPhone?: string;
  technicalName?: string;
  technicalPhone?: string;
  runningOrder?: string;
  bannerImageUrl?: string;
}

export interface UpdateEventInput {
  name?: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
  location?: string;
  eventLink?: string;
  ticketshopLink?: string;
  venueName?: string;
  venueAddress?: string;
  venueCapacity?: number;
  promotorName?: string;
  promotorPhone?: string;
  artistLiaisonName?: string;
  artistLiaisonPhone?: string;
  technicalName?: string;
  technicalPhone?: string;
  runningOrder?: string;
  status?: EventStatus;
}


