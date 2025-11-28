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
