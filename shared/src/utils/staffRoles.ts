export enum StaffRole {
  PROMOTOR = 'PROMOTOR',
  ARTIST_LIAISON = 'ARTIST_LIAISON',
  TECHNICAL = 'TECHNICAL',
  BAR_MANAGER = 'BAR_MANAGER',
  BARTENDER = 'BARTENDER',
  TICKET_TOKEN_SALES = 'TICKET_TOKEN_SALES',
  SECURITY = 'SECURITY',
  PRODUCTION_MANAGER = 'PRODUCTION_MANAGER',
  STAGE_MANAGER = 'STAGE_MANAGER',
  SOUND_TECHNICIAN = 'SOUND_TECHNICIAN',
  LIGHTING_TECHNICIAN = 'LIGHTING_TECHNICIAN',
  VENUE_MANAGER = 'VENUE_MANAGER',
  CATERING_MANAGER = 'CATERING_MANAGER',
  VOLUNTEER_COORDINATOR = 'VOLUNTEER_COORDINATOR',
}

export const STAFF_ROLE_DISPLAY_NAMES: Record<StaffRole, string> = {
  [StaffRole.PROMOTOR]: 'Promotor',
  [StaffRole.ARTIST_LIAISON]: 'Artist Liaison',
  [StaffRole.TECHNICAL]: 'Technical',
  [StaffRole.BAR_MANAGER]: 'Bar Manager',
  [StaffRole.BARTENDER]: 'Bartender',
  [StaffRole.TICKET_TOKEN_SALES]: 'Ticket/Token Sales',
  [StaffRole.SECURITY]: 'Security',
  [StaffRole.PRODUCTION_MANAGER]: 'Production Manager',
  [StaffRole.STAGE_MANAGER]: 'Stage Manager',
  [StaffRole.SOUND_TECHNICIAN]: 'Sound Technician',
  [StaffRole.LIGHTING_TECHNICIAN]: 'Lighting Technician',
  [StaffRole.VENUE_MANAGER]: 'Venue Manager',
  [StaffRole.CATERING_MANAGER]: 'Catering Manager',
  [StaffRole.VOLUNTEER_COORDINATOR]: 'Volunteer Coordinator',
};

export const STAFF_ROLES = Object.values(StaffRole);



