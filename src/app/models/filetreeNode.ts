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
}
