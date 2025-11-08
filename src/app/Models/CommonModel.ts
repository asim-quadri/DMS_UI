
export interface TreeNode {
  name: string;
  id: number;
  checked?: boolean;
  children?: TreeNode[];
  parent?: TreeNode | null;
}