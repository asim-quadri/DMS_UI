export enum helperProducts {
  productSetup = 'Product Setup',
  organizationSetup = 'Organization Setup',
  userManagement = 'User Management',
  roleScreen = 'Role Screen',
  userScreen = 'User Screen',
  accessControlScreen = 'Access Control Screen',
}

export enum UserRole {
  SuperAdmin = 'SuperAdmin',
  Admin = 'Admin',
  Approver = 'Approver',
  Reviewer = 'Reviewer',
  ITSupportAdmin = 'ITSupportAdmin',
  ITAdmin = 'ITAdmin',
  ITUser = 'ITUser',
  User = 'User',
}

export enum ModuleType {
  User = 1,
  Organization = 2,
  Entity = 3,
  Country = 4,
  State = 5,
  StateMapping = 6,
  MajorIndustry = 7,
  MinorIndustry = 8,
  IndustryMapping = 9,
  TypeOfBranch = 10,
  TypeOfBranchMapping = 11,
  EntityType = 12,
  EntityTypeMapping = 13,
  ComplianceTracker = 14,
  Role = 15,
  Parameter = 16,
  RegulationGroup = 17,
  RegulationGroupMapping = 18,
  RegulationSetup = 19,
}

export enum RefApprovalStatus {
  Pending = 'Pending',
  Approved = 'Approved',
  Rejected = 'Rejected',
   Reviewed = "Reviewed",
   Forward = "Forward"
}

  export enum Genders
  {
      Male=1,
      Female=2,
      Other=3,
  }
  export enum ReportType {
    P1 = 'P1', // List of active countries
    P2 = 'P2', // List of industries with country
    P3 = 'P3', // List of entities with country
    P4 = 'P4', // List of Customers
    P5 = 'P5', // List of overdue bills
    P6 = 'P6', // List of Regulations with country
    P7 = 'P7', // List of Compliances with country
    P8 = 'P8', // List of users with Country, roles, Status
    P9 = 'P9', // Updates tracker
    P10 = 'P10'
  }