import { Component, Input, Output, EventEmitter, SimpleChanges, OnChanges } from '@angular/core';
import { NestedTreeControl } from '@angular/cdk/tree';
import { MatTreeNestedDataSource } from '@angular/material/tree';
import { TreeNode } from 'src/app/Models/CommonModel';

@Component({
  selector: 'app-treeview',
  templateUrl: './treeview.component.html',
  styleUrls: ['./treeview.component.scss']
})
export class TreeviewComponent implements OnChanges {
  @Input() label: string = 'Tree View';
  @Input() treeData: TreeNode[] = [];
  @Output() nodeSelectionChange = new EventEmitter<TreeNode[]>();

  treeControl = new NestedTreeControl<TreeNode>(node => node.children);
  dataSource = new MatTreeNestedDataSource<TreeNode>();

  constructor() { }

  ngOnInit() {
    this.initializeTreeData();
    console.log("component TreeView Init", this.treeData);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['treeData'] && changes['treeData'].currentValue) {
      this.initializeTreeData();
      console.log("component TreeView onChange", this.treeData);
      
    }
  }

  initializeTreeData(): void {
    this.setParentReferences(this.treeData, null); // Set parent references for the nodes
    this.dataSource.data = this.treeData; // Update the tree's data source
  }

  hasChild = (_: number, node: TreeNode) => !!node.children && node.children.length > 0;

  // Set parent reference for each node
  setParentReferences(nodes: TreeNode[], parent: TreeNode | null): void {
    nodes.forEach(node => {
      node.parent = parent; // Assign parent node
      if (node.children) {
        this.setParentReferences(node.children, node);
      }
    });
  }

  // Handle checkbox change event
  onNodeCheckChange(node: TreeNode, event: any): void {
    node.checked = event.checked;

    // Propagate changes to children if parent is checked/unchecked
    if (node.children) {
      this.updateChildrenCheckState(node.children, node.checked!);
    }

    // Propagate changes upward to the parent
    if (node.parent) {
      this.updateParentCheckState(node.parent);
    }

    // Create a copy of the tree data without the `parent` property
    const sanitizedTreeData = this.removeParentProperty(this.dataSource.data);

    // Emit the sanitized copy of the tree
    this.nodeSelectionChange.emit(sanitizedTreeData);
  }

  removeParentProperty(nodes: TreeNode[]): TreeNode[] {
    return nodes.map(node => {
      // Create a new node object without the `parent` property
      const { parent, ...sanitizedNode } = node;

      // If the node has children, process them recursively
      if (sanitizedNode.children) {
        sanitizedNode.children = this.removeParentProperty(sanitizedNode.children);
      }

      return sanitizedNode;
    });
  }

  // Update children based on parent state
  updateChildrenCheckState(children: TreeNode[], isChecked: boolean): void {
    children.forEach(child => {
      child.checked = isChecked;
      if (child.children) {
        this.updateChildrenCheckState(child.children, isChecked);
      }
    });
  }

  // Update parent state based on child states
  updateParentCheckState(parent: TreeNode): void {
    const allChildrenChecked = parent.children?.every(child => child.checked) ?? false;
    const someChildrenChecked = parent.children?.some(child => child.checked) ?? false;

    parent.checked = allChildrenChecked || someChildrenChecked;

    // Continue propagating upwards
    if (parent.parent) {
      this.updateParentCheckState(parent.parent);
    }
  }

  selectedItems: string[] = [];

  getLabel(): string[] {
    this.selectedItems =[];
    this.treeData.filter(f => f.checked).forEach(element => {
      this.selectedItems.push(element.name);
    });
 

    return this.selectedItems;
    // if (this.selectedItems.length === 0) {
    //   return "Select Items";
    // } else if (this.selectedItems.length <= 2) {
    //   return this.selectedItems.join(", ");
    // } else {
    //   return `${this.selectedItems.slice(0, 2).join(", ")} +${this.selectedItems.length - 2}`;
    // }
  }
}
