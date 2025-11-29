export interface Category {
  id: number;
  name: string;
}

export interface Participant {
  id: number;
  name: string;
  categoryId: number;
  isPaid: boolean;
}

export enum GroupDistributionType {
  SAME_NUMBER = 'same',
  AUTOMATIC = 'automatic'
}

export interface GroupSettings {
  numberOfGroups: number;
  distributionType: GroupDistributionType;
  minParticipantsPerGroup?: number;
  manualGroupSizes?: number[];
}

export interface Tournament {
  name: string;
  numberOfCategories: number;
  categories: Category[];
  mixedGroups: boolean;
  groupSettings: GroupSettings;
  participants: Participant[];
}

export interface Group {
  id: number;
  name: string;
  participants: Participant[];
}

export interface Match {
  id: number;
  participant1Id: number;
  participant2Id: number;
  score1: number;
  score2: number;
  winner: number | null; // 1 or 2
}

export interface GroupStanding {
  participantId: number;
  wins: number;
  goalDifference: number;
}
