export type MarketCategory =
  | "coding"
  | "productivity"
  | "data"
  | "design"
  | "automation"
  | "docs"
  | "research"
  | "operations"
  | "lifestyle";

export type MarketPublisherType = "official" | "community" | "mirror";
export type MarketInstallState = "catalog" | "available" | "partial" | "installed";

export interface MarketPackageMemberDefinition {
  id: string;
  name: string;
  summary: string;
  matchTerms: string[];
  skillhubSlug?: string;
}

export interface MarketPackageDefinition {
  id: string;
  slug: string;
  name: string;
  summary: string;
  description: string;
  primaryCategory: MarketCategory;
  publisher: {
    name: string;
    type: MarketPublisherType;
  };
  icon: {
    monogram: string;
    accent: string;
    surface: string;
    foreground?: string;
  };
  prompts: string[];
  links: {
    website?: string;
    docs?: string;
    source?: string;
    privacy?: string;
    policy?: string;
  };
  members: MarketPackageMemberDefinition[];
}

export interface MarketPackageMember extends MarketPackageMemberDefinition {
  installed: boolean;
}

export interface MarketPackage extends Omit<MarketPackageDefinition, "members"> {
  installState: MarketInstallState;
  installedMemberCount: number;
  installableMemberCount: number;
  members: MarketPackageMember[];
}

export interface MarketRemoteMemberSnapshot {
  slug: string;
  version: string;
  downloads: number;
  installs: number;
  stars: number;
  updatedAt: number | null;
  ownerName: string | null;
  source: string | null;
}

export interface MarketPackageRemoteSnapshot {
  packageId: string;
  totalDownloads: number;
  totalInstalls: number;
  memberCount: number;
  lastUpdatedAt: number | null;
  members: MarketRemoteMemberSnapshot[];
}
