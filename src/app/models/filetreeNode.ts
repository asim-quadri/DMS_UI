export interface FolderTreeNode {
  id: number;
  label: string;
  parentId: number;
  expanded?: boolean;
  foldertitle?: string;
  children?: FolderTreeNode[];
  parent?: FolderTreeNode;
  path?: string[];
  treeType?: 'DMS' | 'COMPSEQR360'; // ✅ add this
  isFile?: boolean;
  fileData?: any;
  sourceId?: number; // Original ID from API for regulations/organizations/announcements
  isToc?: boolean; // Indicates this is a TOC folder
  isCompliance?: boolean; // Indicates this is a Compliance folder
}
