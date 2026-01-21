export interface FolderTreeNode {
  id: number;
  label: string;
  parentId: number;
  expanded?: boolean;
  foldertitle?: string;
  children?: FolderTreeNode[];
  parent?: FolderTreeNode;
  path?: string[];
  treeType?: 'DMS' | 'COMPSEQR360'; // Tree type identifier
  isFile?: boolean;
  fileData?: any;
  nodeType?: string; // For compliance tracker: Entity, ComplianceTracker, FinancialYear, Regulation, TypeOfCompliance, Location, Document
  complianceData?: any;
  locationData?: any;
}
