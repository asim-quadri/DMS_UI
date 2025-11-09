export interface FolderTreeNode {
  id: number;
  label: string;
  parentId: number;
  expanded?: boolean;
  foldertitle?: string;
  children?: FolderTreeNode[];
  parent?: FolderTreeNode; // ✅ perfect
}
