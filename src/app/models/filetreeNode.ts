export interface FolderTreeNode {
  id: number;
  label: string;
  parentId: number;
  expanded?: boolean;
  children?: FolderTreeNode[];
}
