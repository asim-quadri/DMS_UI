import { Component, ElementRef, inject, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FolderService } from '../Services/folder.service';
import { FileModel, FolderModel } from '../Models/folderModel';
import { NotifierService } from 'angular-notifier';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FolderTreeNode } from '../Models/filetreeNode';
import { HttpClient } from '@angular/common/http';
import { PersistenceService } from '../Services/persistence.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ClientComplianceTrackerService } from '../Services/client-compliance-tracker.service';
import { UserAssignedEntity, PendingComplianceTracker, LocationMaster, ComplianceTrackerDocument, RegulationWithTOC, TypeOfCompliance } from '../Models/compliancetracker';
import { forkJoin, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AppConfig } from '../app.config';
import { UserEntityService } from '../Services/userentity.service';
import { EntitiesCityCoordinate } from '../Models/userEntityModel';
import { DmsManageAccessComponent, DmsShareTarget } from '../Components/dms-manage-access/dms-manage-access.component';
import { DmsItemType } from '../Models/dmsNotification.model';

// Interface for the Unified Tree API response
interface UnifiedTreeResponse {
  treeData: UnifiedTreeNode[];
  userEntities: UserAssignedEntity[];
  selectedEntity: UserAssignedEntity;
  metadata: {
    totalEntities: number;
    totalPendingCompliance: number;
    totalLocations: number;
    totalRegulations: number;
    totalNotices: number;
    generatedAt: string;
  };
}

// Interface for nodes from the Unified Tree API
interface UnifiedTreeNode {
  id: number;
  label: string;
  parentId: number;
  expanded: boolean;
  folderTitle: string;
  children: UnifiedTreeNode[];
  treeType: string;
  path: string[];
  isFile: boolean;
  nodeType: string | null;
  complianceTrackerDocumentId: string | null;
  regulationId?: number | null;
  fileData?: any;
}

@Component({
  selector: 'app-fileuploadnew',
  templateUrl: './fileuploadnew.component.html',
  styleUrls: ['./fileuploadnew.component.scss']
})
export class FileuploadnewComponent implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  /**
   * Which product tab this page instance is serving — set via route data.
   * 'dms' (ProEDox, /home) loads the DMS-only tree; 'compseqr' (/compseqr)
   * loads the entity/compliance tree. Same component, different data source.
   */
  context: 'dms' | 'compseqr' = 'dms';

  // API Base URLs for the (now split) Unified Tree endpoints
  private dmsTreeApiUrl: string;
  private entityTreeApiUrl: string;

  fileModel: FileModel = {
    fileName: '',
    fileType: '',
    userId: 1,
    lastModifiedOn: 0,
    filePath: "",
    folderId: 1,
    id: 0
  };
  
  selectedFolderId: number = 3;
  folderModel: FolderModel = {
    folderName: "",
    isParent: false,
    userId: this.persistenceService.getUserId() || 0,
    id: 0,
    entityId: 0
  };
  
  primaryfolderName: FolderModel = {
    folderName: "",
    isParent: false,
    userId: this.persistenceService.getUserId() || 0,
    parentId: 0,
    id: 0,
    entityId: 0
  };

  formgroupCreateFolder!: FormGroup;
  fbCreatePrimaryFolder!: FormGroup;

  selectedEntityId: number = 1;
  
  public columnDefs = [
    { headerName: 'ID', valueGetter: 'node.rowIndex + 1', sortable: true, filter: true, width: 70, flex: 0 },
    {
      headerName: 'File Name',
      field: 'fullName',
      cellRenderer: this.fileCellRenderer.bind(this),
      sortable: true,
      filter: true,
      flex: 3,
      minWidth: 260,
      tooltipField: 'fullName',
      wrapText: true,
      autoHeight: true
    },
    { headerName: 'Folder', field: 'folderName', sortable: true, filter: true, flex: 1, tooltipField: 'folderName' },
    { headerName: 'Last modified', field: 'createdOn', sortable: true, filter: true, flex: 1 },
    { headerName: 'Owner', field: 'createdByName', sortable: true, filter: true, flex: 1 },
    {
      headerName: 'Options',
      cellRenderer: (params: any) => this.optionsRenderer(params),
      width: 100,
      flex: 0
    }
  ];

  public defaultColDef = {
    resizable: true,
    sortable: true,
    filter: true,
    flex: 1
  };

  // Pagination settings
  paginationPageSize: number = 5;

  currentUserId: number = 1;
  selectedFolderTreeNodeItem: FolderTreeNode | null = null;
  breadcrumbPath: { label: string, node?: FolderTreeNode }[] = [];
  sidebarCollapsed: boolean = false;
  complianceFolders: any[] = [];
  selectedComplianceFolder: any = null;
  complianceFiles: any[] = [];

  // User entities and compliance data
  userAssignedEntities: UserAssignedEntity[] = [];
  selectedEntity: UserAssignedEntity | null = null;
  pendingComplianceData: PendingComplianceTracker[] = [];
  locationMasterData: LocationMaster[] = [];

  // Regulations and TOC
  regulationsData: RegulationWithTOC[] = [];
  selectedRegulation: RegulationWithTOC | null = null;
  typeOfComplianceList: TypeOfCompliance[] = [];
  selectedTOC: TypeOfCompliance | null = null;
  isLoadingRegulations: boolean = false;
  isLoadingTOC: boolean = false;

  // Notices
  noticesData: RegulationWithTOC[] = [];
  isLoadingNotices: boolean = false;
  noticesListByRegulation: Map<number, any[]> = new Map();

  // Loading state
  isLoading: boolean = false;

  // Metadata from API
  metadata: any = null;

  constructor(
    private folderService: FolderService,
    private notifier: NotifierService,
    private formBuilder: FormBuilder,
    private http: HttpClient,
    private persistenceService: PersistenceService,
    private route: Router,
    private activatedRoute: ActivatedRoute,
    private clientComplianceService: ClientComplianceTrackerService,
    private config: AppConfig,
    private userEntityService: UserEntityService
  ) {
    this.dmsTreeApiUrl = `${this.config.ServiceUrl}/UnifiedTree/dms-tree`;
    this.entityTreeApiUrl = `${this.config.ServiceUrl}/UnifiedTree/entity-tree`;
    var userdata = sessionStorage.getItem('currentUser');
    if (userdata) {
      var user = JSON.parse(userdata);
      this.currentUserId = user.id;
    }
    this.formgroupCreateFolder = this.formBuilder.group({
      folderName: ['', Validators.required],
      isParent: [false]
    });
    this.fbCreatePrimaryFolder = this.formBuilder.group({
      primaryFolderName: ['', Validators.required]
    });
  }

  private routeContextInitialized = false;

  ngOnInit() {
    // This app's RouteReuseStrategy keeps the SAME component instance alive when
    // navigating between routes that share a component (e.g. /home <-> /compseqr),
    // so ngOnInit only ever runs once. Subscribing to route *data* (not the
    // snapshot) is what lets this instance react to later tab switches.
    this.activatedRoute.data.subscribe((data) => {
      const newContext = data['context'] === 'compseqr' ? 'compseqr' : 'dms';
      const contextChanged = this.routeContextInitialized && newContext !== this.context;
      this.context = newContext;
      this.routeContextInitialized = true;

      if (contextChanged) {
        // Old tree/selection/files/search belong to the previous tab — clear them
        // so the new tab doesn't show stale data while (or if) the new load fails.
        this.treeData = [];
        this.selectedFolderTreeNodeItem = null;
        this.breadcrumbPath = [];
        this.files = [];
        this.folderSearchText = '';
        this.fileSearchText = '';
        this.filesCurrentPage = 1;
        this.clearSelection();

        if (this.context === 'compseqr') {
          this.loadComseqTree();
        } else {
          this.loadDmsTreeForCurrentEntity();
        }
      }
    });

    // GetComseq isn't scoped by org/entity at all, so CompSeqr doesn't need the
    // org-session-dependent entity flow below — load it straight away.
    if (this.context === 'compseqr') {
      this.loadComseqTree();
    } else {
      this.loadClientEntities();
    }
  }

  /**
   * Entity selection now lives in the global header (shared via UserEntityService)
   * so it's consistent across every page, not just this one. This just (a) kicks off
   * the load if the header hasn't already, and (b) reacts whenever the header's
   * selection changes.
   */
  /**
   * Loads the DMS tree for whatever entity we can currently determine — the
   * header-selected one if there is one, otherwise a userId-based fallback.
   * Used both on first load and every time the user switches back to this tab.
   */
  private loadDmsTreeForCurrentEntity(): void {
    if (this.selectedEntity) {
      this.loadUnifiedTreeForEntity(this.selectedEntity.id);
      return;
    }
    // No organizationId in session (a backend/login-response gap, not something
    // fixable here) means no entity picker list either — fall back to the
    // user's own id rather than leaving the page dead.
    const fallbackEntityId = this.persistenceService.getUserId() || 1;
    console.warn('No selected entity — falling back to entity', fallbackEntityId, 'for DMS tree.');
    this.loadUnifiedTreeForEntity(fallbackEntityId);
  }

  loadClientEntities() {
    const organizationId = this.persistenceService.getOrganizationId();
    if (!organizationId) {
      this.loadDmsTreeForCurrentEntity();
      return;
    }

    this.isLoading = true;
    this.userEntityService.loadEntitiesForOrganization(organizationId).subscribe({
      error: (err) => {
        console.error('Error loading client entities:', err);
        this.notifier.notify('error', 'Failed to load entities');
        this.isLoading = false;
      }
    });

    this.userEntityService.entities$.subscribe((entities: any[]) => {
      this.userAssignedEntities = entities || [];
      if (this.userAssignedEntities.length === 0 && !this.isLoading) {
        this.treeData = [];
      }
    });

    this.userEntityService.selectedEntity$.subscribe((entity: UserAssignedEntity | null) => {
      if (!entity) {
        return;
      }
      this.selectedEntity = entity;
      this.selectedEntityId = entity.id;
      this.loadUnifiedTreeForEntity(entity.id);
    });
  }

  /**
   * Convert UnifiedTreeNode array to FolderTreeNode array
   */
  convertUnifiedTreeToFolderTree(unifiedNodes: UnifiedTreeNode[], parent: FolderTreeNode | null = null): FolderTreeNode[] {
    if (!unifiedNodes || unifiedNodes.length === 0) {
      return [];
    }

    return unifiedNodes.map(node => {
      // Destructure known structural fields; everything else is metadata that
      // belongs in fileData (e.g. createdByName, createdDate, fileName, fileContent).
      const {
        id, label, parentId, expanded, folderTitle, children,
        treeType, path, isFile, nodeType,
        complianceTrackerDocumentId, regulationId,
        fileData: rawFileData,
        ...extraNodeFields
      } = node as any;

      const fileData: any = { ...rawFileData, ...extraNodeFields };
      if (complianceTrackerDocumentId) {
        fileData.complianceTrackerDocumentId = complianceTrackerDocumentId;
      }
      if (regulationId != null) {
        fileData.id = regulationId;
      }

      const folderNode: FolderTreeNode = {
        id,
        label,
        parentId,
        expanded,
        foldertitle: folderTitle,
        children: [],
        treeType: treeType as 'DMS' | 'COMPSEQR360',
        path,
        isFile,
        nodeType: nodeType || undefined,
        fileData: Object.keys(fileData).length ? fileData : undefined,
        parent: parent || undefined
      };

      // Recursively convert children
      if (children && children.length > 0) {
        folderNode.children = this.convertUnifiedTreeToFolderTree(children, folderNode);
      }

      return folderNode;
    });
  }

  /**
   * Reload tree when entity changes
   */
  onEntityChange(entity: UserAssignedEntity) {
    this.selectedEntity = entity;
    this.selectedEntityId = entity.id;
    
    // Reload the unified tree with the new entity
    this.loadUnifiedTreeForEntity(entity.id);
  }

  /**
   * Load the tree for a specific entity. CompSeqr uses GetComseq (see
   * loadComseqTree()). ProEDox/DMS uses FolderManagement/tree — the
   * UnifiedTree/dms-tree endpoint doesn't exist on this backend (404),
   * FolderManagement/tree is the one that's actually live here.
   */
  loadUnifiedTreeForEntity(entityId: number) {
    if (this.context === 'compseqr') {
      this.loadComseqTree();
      return;
    }

    const userId = this.persistenceService.getUserId() || 16;
    this.isLoading = true;

    this.folderService.getGetFolderTree(entityId, userId).subscribe({
      next: (result: any) => {
        const items = Array.isArray(result) ? result : [];
        const dmsRoot: FolderTreeNode = {
          id: this.nextComseqId(),
          label: 'ProEDox',
          parentId: 0,
          expanded: true,
          foldertitle: 'ProEDox',
          children: this.normalizeDmsNodes(items, ['ProEDox']),
          treeType: 'DMS',
          path: ['ProEDox'],
          isFile: false
        };
        this.treeData = [dmsRoot];
        this.attachParentReferences(this.treeData);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading DMS folder tree:', err);
        this.notifier.notify('error', 'Failed to load tree data');
        this.treeData = [];
        this.isLoading = false;
      }
    });
  }

  private normalizeDmsNodes(items: any[], parentPath: string[]): FolderTreeNode[] {
    return (items || []).map((item: any) => {
      const label = item.label || item.folderName || `Folder_${item.id}`;
      const path = [...parentPath, label];
      const children = item.children || [];
      return {
        id: item.id,
        label,
        parentId: 0,
        expanded: false,
        foldertitle: 'DMS',
        children: this.normalizeDmsNodes(children, path),
        treeType: 'DMS',
        path,
        isFile: !!item.isFile,
        fileData: item.isFile ? item : undefined
      } as FolderTreeNode;
    });
  }

  // ====== CompSeqr tree (FileUpload/GetComseq — not scoped by org/entity id) ======

  private comseqIdSeq = 1;
  private nextComseqId(): number {
    return this.comseqIdSeq++;
  }

  loadComseqTree(): void {
    this.isLoading = true;
    this.folderService.getcompleteFolderList().subscribe({
      next: (data: any) => {
        this.treeData = this.buildComseqTree(data);
        this.attachParentReferences(this.treeData);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading CompSeqr data:', err);
        this.notifier.notify('error', 'Failed to load regulatory compliance data');
        this.treeData = [];
        this.isLoading = false;
      }
    });
  }

  private buildComseqTree(data: any): FolderTreeNode[] {
    const roots: FolderTreeNode[] = [];
    const regulations = data?.regulation || [];
    const organizations = data?.organization || [];

    if (regulations.length > 0) {
      const regRoot: FolderTreeNode = {
        id: this.nextComseqId(),
        label: 'Regulatory Compliance',
        parentId: 0,
        expanded: true,
        foldertitle: 'RegulatoryCompliance',
        children: [],
        treeType: 'COMPSEQR360',
        path: ['Regulatory Compliance'],
        isFile: false
      };
      regRoot.children = regulations.map((reg: any) => this.buildRegulationNode(reg, regRoot.path!));
      roots.push(regRoot);
    }

    // Announcements: same regulation-shaped array as `regulation`, but what
    // matters here is the `announcements[]` attached at each level — those
    // already carry their own `files[]` (with real fileContent), so no
    // separate Dms/GetDataByTypeAndId call is needed for this branch.
    const announcementRegs = data?.announcement || [];
    const announcementsTree = this.buildAnnouncementsTree(announcementRegs);
    roots.push(...announcementsTree);

    if (organizations.length > 0) {
      const orgRoot: FolderTreeNode = {
        id: this.nextComseqId(),
        label: 'Organizations',
        parentId: 0,
        expanded: false,
        foldertitle: 'OrganizationRoot',
        children: [],
        treeType: 'COMPSEQR360',
        path: ['Organizations'],
        isFile: false
      };
      orgRoot.children = organizations
        .filter((org: any) => org.isOrganization !== false)
        .map((org: any) => this.buildOrgNode(org, orgRoot.path!));
      roots.push(orgRoot);
    }

    return roots;
  }

  private buildAnnouncementsTree(announcementRegs: any[]): FolderTreeNode[] {
    const root: FolderTreeNode = {
      id: this.nextComseqId(),
      label: 'Announcements',
      parentId: 0,
      expanded: false,
      foldertitle: 'AnnouncementRoot',
      children: [],
      treeType: 'COMPSEQR360',
      path: ['Announcements'],
      isFile: false
    };

    const regNodes: FolderTreeNode[] = [];
    (announcementRegs || []).forEach((reg: any) => {
      const node = this.buildAnnouncementRegulationNode(reg, root.path!);
      if (node) regNodes.push(node);
    });
    root.children = regNodes;

    return regNodes.length ? [root] : [];
  }

  private buildAnnouncementRegulationNode(reg: any, parentPath: string[]): FolderTreeNode | null {
    const path = [...parentPath, reg.regulationName];
    const children: FolderTreeNode[] = [];

    children.push(...this.announcementsToFileNodes(reg.announcements, path));

    (reg.compliance || []).forEach((comp: any) => {
      const compNode = this.buildAnnouncementComplianceNode(comp, path);
      if (compNode) children.push(compNode);
    });

    (reg.toc || []).forEach((toc: any) => {
      const tocNode = this.buildAnnouncementTocNode(toc, path);
      if (tocNode) children.push(tocNode);
    });

    if (children.length === 0) return null;

    return {
      id: this.nextComseqId(),
      label: reg.regulationName,
      parentId: 0,
      expanded: false,
      foldertitle: 'AnnouncementRegulation',
      children,
      treeType: 'COMPSEQR360',
      path,
      isFile: false,
      sourceId: reg.id
    };
  }

  private buildAnnouncementComplianceNode(comp: any, parentPath: string[]): FolderTreeNode | null {
    const path = [...parentPath, comp.complianceName];
    const children: FolderTreeNode[] = [];

    children.push(...this.announcementsToFileNodes(comp.announcements, path));

    (comp.toc || []).forEach((toc: any) => {
      const tocNode = this.buildAnnouncementTocNode(toc, path);
      if (tocNode) children.push(tocNode);
    });

    if (children.length === 0) return null;

    return {
      id: this.nextComseqId(),
      label: comp.complianceName,
      parentId: 0,
      expanded: false,
      foldertitle: 'AnnouncementCompliance',
      children,
      treeType: 'COMPSEQR360',
      path,
      isFile: false,
      sourceId: comp.id
    };
  }

  private buildAnnouncementTocNode(toc: any, parentPath: string[]): FolderTreeNode | null {
    const label = toc.nameOfToc || toc.typeOfComplianceName;
    const fileNodes = this.announcementsToFileNodes(toc.announcements, [...parentPath, label]);
    if (fileNodes.length === 0) return null;

    return {
      id: this.nextComseqId(),
      label,
      parentId: 0,
      expanded: false,
      foldertitle: 'AnnouncementToc',
      children: fileNodes,
      treeType: 'COMPSEQR360',
      path: [...parentPath, label],
      isFile: false,
      sourceId: toc.id
    };
  }

  /** Announcement items become file leaves directly (data — incl. fileContent — is already embedded). */
  private announcementsToFileNodes(announcements: any[], parentPath: string[]): FolderTreeNode[] {
    const nodes: FolderTreeNode[] = [];

    (announcements || []).forEach((ann: any) => {
      if (Array.isArray(ann.files) && ann.files.length > 0) {
        ann.files.forEach((file: any) => {
          const label = file.fileName || ann.subject || 'Announcement';
          nodes.push({
            id: this.nextComseqId(),
            label,
            parentId: 0,
            expanded: false,
            foldertitle: 'AnnouncementFile',
            children: [],
            treeType: 'COMPSEQR360',
            path: [...parentPath, label],
            isFile: true,
            fileData: {
              fileName: file.fileName,
              fullName: file.fileName,
              fileContent: file.fileContent || null,
              createdOn: file.createdOn,
              createdByName: ann.createdByName,
              fileType: this.getFileExtension(file.fileName || '')
            }
          });
        });
      } else {
        // No attached file — still surface the announcement itself so it's discoverable.
        const label = ann.subject || 'Announcement';
        nodes.push({
          id: this.nextComseqId(),
          label,
          parentId: 0,
          expanded: false,
          foldertitle: 'AnnouncementFile',
          children: [],
          treeType: 'COMPSEQR360',
          path: [...parentPath, label],
          isFile: true,
          fileData: {
            fileName: label,
            fullName: label,
            fileContent: null,
            createdOn: ann.createdDate,
            createdByName: ann.createdByName
          }
        });
      }
    });

    return nodes;
  }

  private buildRegulationNode(reg: any, parentPath: string[]): FolderTreeNode {
    const path = [...parentPath, reg.regulationName];
    const children: FolderTreeNode[] = [];

    (reg.compliance || []).forEach((comp: any) => {
      children.push(this.buildComplianceNode(comp, path));
    });
    (reg.toc || []).forEach((toc: any) => {
      children.push(this.buildTocNode(toc, path));
    });

    return {
      id: this.nextComseqId(),
      label: reg.regulationName,
      parentId: 0,
      expanded: false,
      foldertitle: 'Regulation',
      children,
      treeType: 'COMPSEQR360',
      path,
      isFile: false,
      sourceId: reg.id
    };
  }

  private buildComplianceNode(comp: any, parentPath: string[]): FolderTreeNode {
    const path = [...parentPath, comp.complianceName];
    const children: FolderTreeNode[] = (comp.toc || []).map((toc: any) => this.buildTocNode(toc, path));

    return {
      id: this.nextComseqId(),
      label: comp.complianceName,
      parentId: 0,
      expanded: false,
      foldertitle: 'Compliance',
      children,
      treeType: 'COMPSEQR360',
      path,
      isFile: false,
      sourceId: comp.id,
      isCompliance: true
    };
  }

  private buildTocNode(toc: any, parentPath: string[]): FolderTreeNode {
    const label = toc.nameOfToc || toc.typeOfComplianceName;
    return {
      id: this.nextComseqId(),
      label,
      parentId: 0,
      expanded: false,
      foldertitle: 'TOC',
      children: [],
      treeType: 'COMPSEQR360',
      path: [...parentPath, label],
      isFile: false,
      sourceId: toc.id,
      isToc: true
    };
  }

  private buildOrgNode(org: any, parentPath: string[]): FolderTreeNode {
    const path = [...parentPath, org.organizationName];
    const children: FolderTreeNode[] = (org.entityList || []).map((entity: any) => ({
      id: this.nextComseqId(),
      label: entity.entityName,
      parentId: 0,
      expanded: false,
      foldertitle: 'OrgEntity',
      children: [],
      treeType: 'COMPSEQR360',
      path: [...path, entity.entityName],
      isFile: false,
      sourceId: entity.entityId
    } as FolderTreeNode));

    return {
      id: this.nextComseqId(),
      label: org.organizationName,
      parentId: 0,
      expanded: false,
      foldertitle: 'Organization',
      children,
      treeType: 'COMPSEQR360',
      path,
      isFile: false,
      sourceId: org.id
    };
  }

  /** Fetches actual files for a clicked CompSeqr node via Dms/GetDataByTypeAndId. */
  fetchComseqFilesFromApi(node: FolderTreeNode): void {
    // A single file leaf (e.g. an Announcement file) — just show it directly.
    if (node.isFile && node.fileData) {
      this.files = [node.fileData];
      return;
    }

    // Announcement folders carry their files already embedded in the tree
    // (from GetComseq) — no API round-trip needed, just collect them.
    if ((node.foldertitle || '').startsWith('Announcement')) {
      this.files = this.collectAllFiles(node);
      return;
    }

    let type: string;
    let subType: string | undefined;

    switch (node.foldertitle) {
      case 'TOC':
        type = 'regulation';
        subType = 'tocdues';
        break;
      case 'Compliance':
        type = 'regulation';
        subType = 'regulation';
        break;
      case 'Regulation':
        type = 'regulation';
        break;
      case 'Organization':
      case 'OrgEntity':
        type = 'organization';
        break;
      default:
        this.files = [];
        return;
    }

    const apiId = node.sourceId ?? node.id;
    this.folderService.getDataByTypeAndId(type, apiId, subType).subscribe({
      next: (response: any) => {
        this.files = this.extractComseqFiles(response, node.label, type, subType, apiId);
      },
      error: (err: any) => {
        console.error('Error fetching CompSeqr files:', err);
        this.files = [];
      }
    });
  }

  private extractComseqFiles(response: any, folderName: string, type: string, subType: string | undefined, apiId: number): any[] {
    if (!response) return [];
    const files: any[] = [];

    if (response.success && Array.isArray(response.files)) {
      response.files.forEach((file: any) => {
        files.push({
          ...file,
          folderName,
          fullName: file.fileName,
          // Carried through so View can reopen this same query via /fileview.
          comseqType: type,
          comseqSubType: subType,
          comseqId: apiId
        });
      });
    }

    return files;
  }

  // ====== Grid Renderers ======

  fileCellRenderer(params: any) {
    const fileType = params.data.fileType;
    const fileName = params.data.fileName;
    const iconSrc = this.getFileIcon(fileType);
    const safeName = String(fileName ?? '').replace(/"/g, '&quot;');
    return `<span class="file-name-cell" title="${safeName}" style="display:flex;align-items:center;white-space:normal;word-break:break-word;line-height:1.2;">
              <img src="${iconSrc}" style="margin-right: 8px;width: 24px;height: 24px;flex:0 0 auto;" alt="file">
              <span style="white-space:normal;word-break:break-word;">${fileName}</span>
            </span>`;
  }

  optionsRenderer(params: any) {
    const hasFileContent = params.data.fileContent;
    const hasFilePath = params.data.filePath;
    const canViewDownload = hasFileContent || hasFilePath;

    const viewButton = document.createElement('button');
    viewButton.className = 'btn btn-sm btn-outline-secondary btn-view';
    viewButton.innerHTML = '<i class="bi bi-eye"></i>';

    if (!canViewDownload) {
      viewButton.disabled = true;
      viewButton.style.opacity = '0.5';
      viewButton.style.cursor = 'not-allowed';
      viewButton.title = 'No document available';
    } else {
      viewButton.addEventListener('click', () => {
        this.onViewClick(params);
      });
    }

    const downloadButton = document.createElement('button');
    downloadButton.className = 'btn btn-sm btn-outline-secondary btn-download';
    downloadButton.innerHTML = '<i class="bi bi-download"></i>';

    if (!canViewDownload) {
      downloadButton.disabled = true;
      downloadButton.style.opacity = '0.5';
      downloadButton.style.cursor = 'not-allowed';
      downloadButton.title = 'No document available';
    } else {
      downloadButton.addEventListener('click', () => {
        this.onDownloadClick(params);
      });
    }

    const container = document.createElement('div');
    container.className = 'btn-group';
    container.appendChild(viewButton);
    container.appendChild(downloadButton);

    return container;
  }

  getFileIcon(fileType: string | null): string {
    switch (fileType) {
      case 'application/pdf':
        return 'assets/images/icons/pdf.png';
      case 'image/jpeg':
      case 'image/jpg':
      case 'image/png':
        return 'assets/images/icons/google.png';
      case 'application/vnd.ms-excel':
      case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
        return 'assets/images/icons/excel.svg';
      default:
        return 'assets/images/icons/docs.png';
    }
  }

  // ====== File Operations ======

  /** Template-friendly view — routes through /fileview so PDFs/images/Excel/Word render properly */
  viewFileContent(file: any, event?: Event): void {
    event?.stopPropagation();
    if (file?.mtype === 'opinions' || file?.mtype === 'audits') {
      this.streamOpinionAuditFile(file, false);
      return;
    }

    // CompSeqr (Regulation/Compliance/TOC/Organization): reopen the same
    // Dms/GetDataByTypeAndId query the fileview page itself will re-run.
    if (this.context === 'compseqr' && file?.comseqType && file?.comseqId != null) {
      let url = `/#/fileview?fileId=${file.comseqId}&type=${file.comseqType}`;
      if (file.comseqSubType) {
        url += `&subType=${file.comseqSubType}`;
      }
      window.open(url, '_blank');
      return;
    }

    // ProEDox (DMS): stream directly from the DB id — renders inline (PDF/image)
    // when the browser can, otherwise downloads.
    if (file?.id != null) {
      window.open(this.getFileStreamUrl(file.id), '_blank');
      return;
    }

    // Fallback (e.g. Announcement files with embedded content but no DB id).
    if (file?.fileContent) {
      this.viewBase64File(file.fileContent, file.fileName || 'document');
    } else {
      this.notifier.notify('warning', 'No viewable content available');
    }
  }

  /** Template-friendly download */
  downloadFileContent(file: any, event?: Event): void {
    event?.stopPropagation();
    if (file?.mtype === 'opinions' || file?.mtype === 'audits') {
      this.streamOpinionAuditFile(file, true);
      return;
    }
    if (file?.fileContent) {
      this.downloadBase64File(file.fileContent, file.fileName || 'document');
    } else if (file?.id != null) {
      window.open(this.getFileStreamUrl(file.id, true), '_blank');
    } else {
      this.notifier.notify('warning', 'No downloadable content available');
    }
  }

  /** GET /api/FileUpload/GetFile/{fileId} — streams by DB id (no ?download = inline, with it = attachment) */
  private getFileStreamUrl(fileId: number, download = false): string {
    const url = `${this.config.ServiceUrl}/FileUpload/GetFile/${fileId}`;
    return download ? `${url}?download=true` : url;
  }

  /** Fetch opinion/audit document via API and open or download the blob */
  private streamOpinionAuditFile(file: any, download: boolean): void {
    const apiType: 'Opinions' | 'Audits' = file.mtype === 'audits' ? 'Audits' : 'Opinions';
    const recordId: number = file.recordId;
    const documentId: number = file.documentId;

    if (!recordId || !documentId) {
      this.notifier.notify('warning', 'Document reference missing — cannot open file');
      return;
    }

    this.folderService.getOpinionAuditDocument(apiType, recordId, documentId).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        if (download) {
          const link = document.createElement('a');
          link.href = url;
          link.download = file.fileName || 'document';
          link.click();
          setTimeout(() => window.URL.revokeObjectURL(url), 5000);
        } else {
          const win = window.open(url, '_blank');
          if (!win) this.notifier.notify('warning', 'Popup blocked — please allow popups');
          setTimeout(() => window.URL.revokeObjectURL(url), 10000);
        }
      },
      error: () => this.notifier.notify('error', 'Failed to load document')
    });
  }

  canAccessFile(file: any): boolean {
    if (file?.mtype === 'opinions' || file?.mtype === 'audits') {
      return !!(file?.recordId && file?.documentId);
    }
    return !!(file?.fileContent || file?.filePath);
  }

  onViewClick(params: any): void {
    const data = params.data;

    if (data?.fileContent) {
      const fileName = data.fileName || data.fullName || 'document';
      this.viewBase64File(data.fileContent, fileName);
      return;
    }

    if (data?.activityData?.fileContent) {
      const fileName = data.activityData.fileName || data.fileName || 'document';
      this.viewBase64File(data.activityData.fileContent, fileName);
      return;
    }

    if (data?.filePath) {
      window.open(data.filePath, '_blank');
      return;
    }

    this.notifier.notify('error', 'No file content available to view');
  }

  onDownloadClick(params: any): void {
    if (params.data.fileContent) {
      this.downloadBase64File(params.data.fileContent, params.data.fileName);
    } else {
      const imagePath = params.data.filePath;
      const fileName = params.data.fileName || 'downloaded-file';

      this.http.get(imagePath, { responseType: 'blob' }).subscribe((blob: Blob | MediaSource) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.click();
        window.URL.revokeObjectURL(url);
      }, (error: any) => {
        console.error('Error downloading the file:', error);
      });
    }
  }

  viewBase64File(base64Content: string, fileName: string): void {
    try {
      const mimeType = this.getMimeType(fileName);
      const byteCharacters = atob(base64Content);
      const byteNumbers = new Array(byteCharacters.length);

      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }

      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: mimeType });
      const url = window.URL.createObjectURL(blob);

      const newWindow = window.open(url, '_blank');

      if (!newWindow) {
        this.notifier.notify('warning', 'Popup blocked. Please allow popups or use download instead.');
        const link = document.createElement('a');
        link.href = url;
        link.target = '_blank';
        link.click();
      }

      setTimeout(() => window.URL.revokeObjectURL(url), 10000);
    } catch (error) {
      console.error('Error viewing file:', error);
      this.notifier.notify('error', 'Failed to view file');
    }
  }

  downloadBase64File(base64Content: string, fileName: string): void {
    try {
      const mimeType = this.getMimeType(fileName);
      const byteCharacters = atob(base64Content);
      const byteNumbers = new Array(byteCharacters.length);

      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }

      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: mimeType });
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      this.notifier.notify('error', 'Failed to download file');
    }
  }

  getMimeType(fileName: string): string {
    const ext = this.getFileExtension(fileName);
    const mimeTypes: { [key: string]: string } = {
      'pdf': 'application/pdf',
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'gif': 'image/gif',
      'bmp': 'image/bmp',
      'webp': 'image/webp',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'ppt': 'application/vnd.ms-powerpoint',
      'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'txt': 'text/plain',
      'csv': 'text/csv',
      'json': 'application/json',
      'xml': 'application/xml',
      'zip': 'application/zip',
      'html': 'text/html'
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }

  getFileExtension(fileName: string): string {
    if (!fileName) return '';
    const lastDot = fileName.lastIndexOf('.');
    return lastDot !== -1 ? fileName.substring(lastDot + 1).toLowerCase() : '';
  }

  // ====== Modal and UI ======

  searchFilter = 'Owned by me';
  private modalService = inject(NgbModal);

  folders: any[] = [];
  files: any[] = [];
  treeData: FolderTreeNode[] = [];

  // ====== Row selection (checkboxes) ======
  selectedFileKeys: Set<any> = new Set();

  private fileKey(file: any): any {
    return file?.id ?? file?.recordId ?? file?.fullName;
  }

  isFileSelected(file: any): boolean {
    return this.selectedFileKeys.has(this.fileKey(file));
  }

  toggleFileSelection(file: any, event?: Event): void {
    event?.stopPropagation();
    const key = this.fileKey(file);
    if (this.selectedFileKeys.has(key)) {
      this.selectedFileKeys.delete(key);
    } else {
      this.selectedFileKeys.add(key);
    }
  }

  get isAllOnPageSelected(): boolean {
    const page = this.pagedFiles;
    return page.length > 0 && page.every(f => this.isFileSelected(f));
  }

  toggleSelectAllOnPage(): void {
    const page = this.pagedFiles;
    if (this.isAllOnPageSelected) {
      page.forEach(f => this.selectedFileKeys.delete(this.fileKey(f)));
    } else {
      page.forEach(f => this.selectedFileKeys.add(this.fileKey(f)));
    }
  }

  get selectedCount(): number {
    return this.selectedFileKeys.size;
  }

  bulkDownloadSelected(): void {
    const selected = this.filteredFiles.filter(f => this.isFileSelected(f));
    selected.forEach(f => this.downloadFileContent(f));
  }

  /** Single-row delete (bypasses checkbox selection) */
  deleteSingleFile(file: any, event?: Event): void {
    event?.stopPropagation();
    const name = file.fullName || file.fileName || 'this file';
    if (!window.confirm(`Delete ${name}? This cannot be undone.`)) {
      return;
    }

    this.folderService.deleteFile(file.id).subscribe({
      next: () => {
        this.notifier.notify('success', 'File deleted');
        this.selectedFileKeys.delete(this.fileKey(file));
        if (this.selectedFolderTreeNodeItem) {
          this.getAllFilesbyFolderId(
            this.selectedFolderTreeNodeItem.id,
            this.getModuleType(this.selectedFolderTreeNodeItem.foldertitle || '')
          );
        }
      },
      error: (err) => {
        console.error('Error deleting file:', err);
        this.notifier.notify('error', 'Failed to delete file');
      }
    });
  }

  /**
   * Deletes the selected files via FileUpload/deleteFile. Only offered in the
   * ProEDox (dms) context — CompSeqr rows are compliance-tracker/notice/opinion/
   * audit records, not FileUpload entries, so this endpoint doesn't apply to them.
   */
  bulkDeleteSelected(): void {
    const selected = this.filteredFiles.filter(f => this.isFileSelected(f));
    if (selected.length === 0) {
      return;
    }

    const label = selected.length === 1 ? selected[0].fullName || selected[0].fileName : `${selected.length} files`;
    const confirmed = window.confirm(`Delete ${label}? This cannot be undone.`);
    if (!confirmed) {
      return;
    }

    const deletions = selected.map(f => this.folderService.deleteFile(f.id));
    forkJoin(deletions).subscribe({
      next: () => {
        this.notifier.notify('success', `Deleted ${selected.length} file(s)`);
        this.clearSelection();
        if (this.selectedFolderTreeNodeItem) {
          this.getAllFilesbyFolderId(
            this.selectedFolderTreeNodeItem.id,
            this.getModuleType(this.selectedFolderTreeNodeItem.foldertitle || '')
          );
        }
      },
      error: (err) => {
        console.error('Error deleting files:', err);
        this.notifier.notify('error', 'Failed to delete one or more files');
      }
    });
  }

  clearSelection(): void {
    this.selectedFileKeys.clear();
  }

  // ====== DMS Access (Manage Access / Share) ======
  // Only offered in the ProEDox (dms) context — CompSeqr rows (compliance
  // tracker/notice/opinion/audit records) aren't DMS FileUpload/Folder rows,
  // so itemId here wouldn't mean anything to api/DmsAccess for them.

  /** Single file or folder — opens the same dialog GrantAccess/RevokeAccess/GetAccessList operate on. */
  openManageAccess(itemType: DmsItemType, itemId: number, label: string): void {
    const modalRef = this.modalService.open(DmsManageAccessComponent, { centered: true, size: 'lg' });
    modalRef.componentInstance.itemType = itemType;
    modalRef.componentInstance.itemId = itemId;
    modalRef.componentInstance.itemLabel = label;
  }

  /** Currently selected folder in the sidebar tree. */
  openFolderShare(): void {
    const node = this.selectedFolderTreeNodeItem;
    if (!node || node.isFile) {
      return;
    }
    this.openManageAccess('Folder', node.id, node.label);
  }

  /** Checkbox-selected files — one grant per file, same recipient/permissions for all. */
  openBulkShare(): void {
    const selected = this.filteredFiles.filter(f => this.isFileSelected(f));
    if (selected.length === 0) {
      return;
    }
    const targets: DmsShareTarget[] = selected.map(f => ({
      itemType: 'File',
      itemId: f.id,
      label: f.fullName || f.fileName || 'file'
    }));

    const modalRef = this.modalService.open(DmsManageAccessComponent, { centered: true, size: 'md' });
    modalRef.componentInstance.bulkItems = targets;
    modalRef.result.then(
      () => this.clearSelection(),
      () => { /* dismissed — leave selection as-is */ }
    );
  }

  // ====== Search / pagination (real data only) ======
  folderSearchText: string = '';
  fileSearchText: string = '';
  filesPageSize: number = 10;
  filesCurrentPage: number = 1;

  get filteredTreeData(): FolderTreeNode[] {
    const term = this.folderSearchText.trim().toLowerCase();
    if (!term) return this.treeData;
    return this.filterTreeNodes(this.treeData, term);
  }

  private filterTreeNodes(nodes: FolderTreeNode[], term: string): FolderTreeNode[] {
    const result: FolderTreeNode[] = [];
    for (const node of nodes || []) {
      const matches = (node.label || '').toLowerCase().includes(term);
      const filteredChildren = node.children?.length ? this.filterTreeNodes(node.children, term) : [];
      if (matches || filteredChildren.length) {
        result.push({ ...node, expanded: true, children: filteredChildren.length ? filteredChildren : node.children });
      }
    }
    return result;
  }

  get filteredFiles(): any[] {
    const term = this.fileSearchText.trim().toLowerCase();
    if (!term) return this.files;
    return this.files.filter(f =>
      (f.fullName || f.fileName || '').toLowerCase().includes(term)
    );
  }

  get totalFilesPages(): number {
    return Math.max(1, Math.ceil(this.filteredFiles.length / this.filesPageSize));
  }

  get pagedFiles(): any[] {
    const totalPages = this.totalFilesPages;
    if (this.filesCurrentPage > totalPages) this.filesCurrentPage = totalPages;
    if (this.filesCurrentPage < 1) this.filesCurrentPage = 1;
    const start = (this.filesCurrentPage - 1) * this.filesPageSize;
    return this.filteredFiles.slice(start, start + this.filesPageSize);
  }

  goToFilesPage(page: number): void {
    if (page < 1 || page > this.totalFilesPages) return;
    this.filesCurrentPage = page;
  }

  pageRangeEnd(): number {
    return Math.min(this.filesCurrentPage * this.filesPageSize, this.filteredFiles.length);
  }

  get pageNumbers(): (number | '...')[] {
    const total = this.totalFilesPages;
    const current = this.filesCurrentPage;
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    const pages: (number | '...')[] = [1];
    if (current > 3) pages.push('...');
    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);
    for (let p = start; p <= end; p++) pages.push(p);
    if (current < total - 2) pages.push('...');
    pages.push(total);
    return pages;
  }

  onFileSearchChange(): void {
    this.filesCurrentPage = 1;
  }

  get breadcrumbChain(): FolderTreeNode[] {
    const chain: FolderTreeNode[] = [];
    let current: FolderTreeNode | undefined = this.selectedFolderTreeNodeItem || undefined;
    while (current) {
      chain.unshift(current);
      current = current.parent;
    }
    return chain;
  }

  /** Subfolder count for whichever folder is currently selected (root-level folders when none is). */
  get totalFolderCount(): number {
    const children = this.selectedFolderTreeNodeItem ? this.selectedFolderTreeNodeItem.children : this.treeData;
    return (children || []).filter(c => !c.isFile).length;
  }

  getNodeChildCount(node: FolderTreeNode): number {
    return node.children?.length || 0;
  }

  getFileTypeLabel(fileType: string | null | undefined): string {
    const t = (fileType || '').toLowerCase();
    if (t.includes('pdf')) return 'PDF';
    if (t.includes('sheet') || t.includes('excel') || t === 'xlsx' || t === 'xls') return 'Excel';
    if (t.includes('word') || t === 'doc' || t === 'docx') return 'Word';
    if (t.includes('presentation') || t === 'ppt' || t === 'pptx') return 'PowerPoint';
    if (t.includes('image') || ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(t)) return 'Image';
    if (t.includes('zip')) return 'ZIP';
    if (t === 'folder' || t === 'compliance') return 'Folder';
    if (!t) return 'File';
    return t.toUpperCase();
  }

  triggerFileInput() {
    var path = this.selectedFolderTreeNodeItem?.path;
    if (path && path.includes("COMPSEQR360")) {
      alert("Cannot create or upload files to COMPSEQR360 folder.");
      return;
    }
    this.fileInput.nativeElement.click();
  }

  toggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file && this.selectedFolderTreeNodeItem) {
      this.fileModel.fileName = file.name;
      this.fileModel.fileType = file.type;
      this.fileModel.filePath = file.webkitRelativePath;
      this.fileModel.folderId = this.selectedFolderTreeNodeItem.id;
      this.fileModel.lastModifiedOn = file.lastModified;

      this.uploadFile(file);
    }
  }

  isSelected(item: FolderTreeNode): boolean {
    return this.selectedFolderTreeNodeItem?.id === item.id;
  }

  uploadFile(file: File) {
    this.folderService.uploadFile(this.fileModel, file).subscribe(
      (result: any) => {
        if (this.selectedFolderTreeNodeItem) {
          this.getAllFilesbyFolderId(
            this.selectedFolderTreeNodeItem.id,
            this.getModuleType(this.selectedFolderTreeNodeItem.foldertitle || '')
          );
        } else {
          this.getAllFilesbyFolderId(this.selectedFolderId);
        }
        this.notifier.notify('success', 'Uploaded Successfully');
      },
      (error: any) => {
        console.error('Error uploading file:', error);
      }
    );
  }

  getAllFilesbyFolderId(folderId: number, type: any = 'proedox', filters?: {
    regulationId?: number;
    auditType?: string;
    financialYear?: string;
  }) {
    this.files = [];
    this.folderService.getFilesbyFolderId(folderId, type, filters).subscribe((result: any) => {
      // This DMS endpoint reuses `fullName` for the uploader's display name,
      // not the file name (every other source in this app sets fullName ===
      // fileName) — normalize it here so the table/view/download logic that
      // reads `fullName` as "the file's name" stays correct everywhere.
      this.files = (result || []).map((file: any) => ({
        ...file,
        createdByName: file.createdByName || file.fullName,
        fullName: file.fileName || file.fullName
      }));
    }, (error: any) => {
      console.error("Error fetching files:", error);
      this.files = [];
    });
  }

  createSubFolder() {
    if (this.formgroupCreateFolder.valid && this.selectedFolderTreeNodeItem) {
      this.folderModel.folderName = this.formgroupCreateFolder.controls['folderName'].value;
      this.folderModel.isParent = false;
      this.folderModel.entityId = this.selectedEntityId;
      this.folderModel.parentId = this.selectedFolderTreeNodeItem.id;
      
      this.folderService.createFolder(this.folderModel).subscribe(
        (result: any) => {
          this.notifier.notify('success', 'Folder Created Successfully');
          this.loadUnifiedTreeForEntity(this.selectedEntityId);
          this.files = result;
          this.modalService.dismissAll();
        },
        (error: any) => {
          console.error("Error creating folder:", error);
          this.notifier.notify('error', 'Error creating folder. Please try again.');
        }
      );
    } else {
      this.notifier.notify('warning', 'Please enter a valid folder name.');
    }
  }

  createPrimaryFolder() {
    if (this.fbCreatePrimaryFolder.valid) {
      this.folderModel.folderName = this.fbCreatePrimaryFolder.controls['primaryFolderName'].value;
      this.folderModel.isParent = true;
      this.folderModel.entityId = this.selectedEntityId;
      this.folderModel.parentId = 0;
      
      this.folderService.createFolder(this.folderModel).subscribe(
        (result: any) => {
          this.notifier.notify('success', 'Folder Created Successfully');
          this.loadUnifiedTreeForEntity(this.selectedEntityId);
          this.files = result;
          this.modalService.dismissAll();
        },
        (error: any) => {
          console.error("Error creating folder:", error);
          this.notifier.notify('error', 'Error creating folder. Please try again.');
        }
      );
    } else {
      this.notifier.notify('warning', 'Please enter a valid folder name.');
    }
  }

  openSm(content: TemplateRef<any>, type: string = 'subfolder') {
    if (type === 'subfolder') {
      const dmsRoot = this.findDmsRoot();
      if (!dmsRoot || !dmsRoot.children || dmsRoot.children.length === 0) {
        this.notifier.notify('warning', 'Please create a Primary Folder first.');
        return;
      }
    }

    var path = this.selectedFolderTreeNodeItem?.path;
    if (path && path.includes("COMPSEQR360")) {
      alert("Cannot create or upload files to COMPSEQR360 folder.");
      return;
    }
    this.modalService.open(content, { centered: true, size: 'md' });
  }

  open(content: TemplateRef<any>) {
    this.modalService.open(content, { centered: true });
  }

  toggle(item: FolderTreeNode, event: Event): void {
    event.stopPropagation();
    item.expanded = !item.expanded;
  }

  selectItem(item: FolderTreeNode, event: MouseEvent): void {
    event.stopPropagation();

    const realNode = this.findNodeById(this.treeData, item.id, item.treeType) || item;

    this.selectedFolderTreeNodeItem = realNode;
    this.buildBreadcrumbPath(realNode);
    this.clearSelection();
    this.filesCurrentPage = 1;

    console.log('selectItem clicked node:', realNode);

    // CompSeqr (this backend): tree comes from FileUpload/GetComseq, files are
    // fetched per-node via Dms/GetDataByTypeAndId — a completely different
    // shape/flow from the old entity-tree API, so branch out early.
    if (this.context === 'compseqr') {
      this.fetchComseqFilesFromApi(realNode);
      return;
    }

    // Notice regulation: a node whose parent path segment is "Notices"
    if (this.isNoticeRegulationNode(realNode)) {
      this.loadNoticesForRegulation(realNode);
      return;
    }

    // Opinions / Audits nodes — also catches sub-folders (regulation, year,
    // named folder) whose ancestors include "opinions" or "audits" in the path.
    const _ft = (realNode.foldertitle || '').toLowerCase();
    const _nt = (realNode.nodeType   || '').toLowerCase();
    const _pathLower = (realNode.path || []).map((s: string) => (s || '').toLowerCase());
    const _inOpinionsOrAudits = _pathLower.some(s => s === 'opinions' || s === 'audits');

    if (_ft === 'opinions' || _nt === 'opinions' ||
        _ft === 'audits'   || _nt === 'audits'   || _inOpinionsOrAudits) {
      const mtype: 'opinions' | 'audits' =
        (_ft === 'audits' || _nt === 'audits' || _pathLower.includes('audits')) ? 'audits' : 'opinions';
      this.files = this.collectTreeFiles(realNode, mtype);
      return;
    }

    // Handle selection based on node type
    if (realNode.treeType === 'COMPSEQR360') {
      this.handleComplianceTrackerSelection(realNode);
    } else {
      this.getAllFilesbyFolderId(realNode.id, this.getModuleType(realNode.path || ''));
    }
  }

  /**
   * Treat a click as "notices" when:
   *   - foldertitle/nodeType/label is Notices/NoticeRegulation, OR
   *   - the immediate parent path segment is "Notices" (a regulation under Notices)
   */
  isNoticeRegulationNode(node: FolderTreeNode): boolean {
    const ft = (node.foldertitle || '').toLowerCase();
    const nt = (node.nodeType || '').toLowerCase();
    const lbl = (node.label || '').toLowerCase();
    if (ft === 'noticeregulation' || nt === 'noticeregulation') return true;
    if (ft === 'notices' || nt === 'notices' || lbl === 'notices') return true;
    const path = node.path || [];
    if (path.length >= 2) {
      const parentSegment = path[path.length - 2];
      if ((parentSegment || '').toLowerCase() === 'notices') return true;
    }
    return false;
  }

  /**
   * Handle selection of Compliance Tracker nodes
   */
  handleComplianceTrackerSelection(node: FolderTreeNode): void {
    const foldertitle = (node.foldertitle || '').toLowerCase();
    const nodeType   = (node.nodeType   || '').toLowerCase();

    // Notice regulation node: load notices for this regulation
    if (node.foldertitle === 'NoticeRegulation' || node.nodeType === 'NoticeRegulation') {
      this.loadNoticesForRegulation(node);
      return;
    }

    // Opinions / Audits: tree already carries the docs — no API call needed
    if (foldertitle === 'opinions' || nodeType === 'opinions' ||
        foldertitle === 'audits'   || nodeType === 'audits') {
      const mtype: 'opinions' | 'audits' =
        (foldertitle === 'audits' || nodeType === 'audits') ? 'audits' : 'opinions';
      this.files = this.collectTreeFiles(node, mtype);
      return;
    }

    // Get complianceTrackerDocumentId from node's fileData
    const complianceTrackerDocumentId = node.fileData?.complianceTrackerDocumentId;

    if (complianceTrackerDocumentId) {
      // Load documents for this compliance item
      this.loadComplianceDocuments(parseInt(complianceTrackerDocumentId, 10), node);
    } else if (node.children && node.children.length > 0) {
      // Collect all complianceTrackerDocumentIds from children
      this.loadComplianceDocumentsForParent(node);
    } else {
      // No documents to load, display node info
      this.files = [{
        id: node.id,
        fileName: node.label,
        fullName: node.label,
        folderName: node.path?.[node.path.length - 2] || 'Folder',
        fileType: 'folder'
      }];
    }
  }

  /**
   * Load notices for the clicked notice-regulation node.
   * API: /Notices/GetListOfNoticesByIds?entityId={entityId}&regulationId={regulationId}
   */
  loadNoticesForRegulation(node: FolderTreeNode): void {
    const entityId = this.selectedEntityId;
    const regulationId = node.fileData?.id ?? node.id;

    if (!entityId || !regulationId) {
      this.notifier.notify('error', 'Missing entity or regulation');
      this.files = [];
      return;
    }

    this.isLoadingNotices = true;
    this.clientComplianceService.getListOfNoticesByIds(entityId, regulationId).subscribe({
      next: (response: any) => {
        const noticesData = response?.data || response?.notices || response || [];
        const notices = Array.isArray(noticesData) ? noticesData : [noticesData];

        if (notices.length > 0 && notices[0]) {
          this.noticesListByRegulation.set(regulationId, notices);
          this.files = notices.map((notice: any, index: number) => {
            const noticeName = notice.subject || notice.complianceName || notice.fileName || `Notice ${index + 1}`;
            return {
              id: notice.id ?? index + 1,
              fileName: noticeName,
              fullName: noticeName,
              folderName: node.label,
              fileContent: notice.fileContent || notice.filecontent || notice.FileContent,
              createdBy: notice.createdBy,
              createdByName: notice.createdByName,
              createdOn: notice.createdDate || notice.createdOn,
              fileType: this.getMimeType(noticeName)
            };
          });
        } else {
          this.files = [];
          this.notifier.notify('info', 'No notices found for this regulation');
        }
        this.isLoadingNotices = false;
      },
      error: (err) => {
        console.error('Error loading notices:', err);
        this.notifier.notify('error', 'Failed to load notices');
        this.files = [];
        this.isLoadingNotices = false;
      }
    });
  }

  /**
   * Load compliance tracker documents from API
   */
  loadComplianceDocuments(complianceTrackerDocumentId: number, node: FolderTreeNode): void {
    const folderNameForDocs = this.getFolderNameForLeaf(node);

    this.clientComplianceService.getComplianceTrackerDocuments(complianceTrackerDocumentId).subscribe({
      next: (documents: ComplianceTrackerDocument[]) => {
        if (documents && documents.length > 0) {
          this.files = documents.map((doc, index) => ({
            id: index + 1,
            fileName: doc.fileName,
            fullName: doc.fileName,
            folderName: folderNameForDocs,
            compId: doc.compId,
            fileContent: doc.fileContent,
            createdBy: doc.createdBy,
            createdByName: doc.createdByName,
            isDelete: doc.isDelete,
            createdOn: doc.createdDate,
            fileType: this.getFileExtension(doc.fileName)
          }));
        } else {
          this.files = [{
            id: node.id,
            fileName: node.label,
            fullName: node.label,
            folderName: folderNameForDocs,
            fileType: 'compliance'
          }];
        }
      },
      error: (err) => {
        console.error('Error loading compliance documents:', err);
        this.notifier.notify('error', 'Failed to load documents');
        this.files = [];
      }
    });
  }

  /**
   * Collect all complianceTrackerDocumentIds from child nodes and load documents.
   * Atomic ids are grouped by their financial-year folder so we fire one batched
   * API call per folder (instead of one per leaf), and every returned document is
   * tagged with its folder for the grid's "Folder" column.
   */
  loadComplianceDocumentsForParent(node: FolderTreeNode): void {
    const idsByFolder = this.collectAtomicDocumentIdsByFolder(node);

    if (idsByFolder.size === 0) {
      this.files = this.collectAllFiles(node);
      return;
    }

    const requests: Observable<{ folderName: string; documents: ComplianceTrackerDocument[] }>[] = [];
    idsByFolder.forEach((ids, folderName) => {
      const idsParam = Array.from(ids).join(',');
      if (!idsParam) return;
      requests.push(
        this.clientComplianceService.getComplianceTrackerDocuments(idsParam).pipe(
          map(docs => ({ folderName, documents: docs || [] }))
        )
      );
    });

    if (requests.length === 0) {
      this.files = this.collectAllFiles(node);
      return;
    }

    forkJoin(requests).subscribe({
      next: (results) => {
        const merged: any[] = [];
        results.forEach(({ folderName, documents }) => {
          documents.forEach(doc => {
            merged.push({
              id: merged.length + 1,
              fileName: doc.fileName,
              fullName: doc.fileName,
              folderName,
              compId: doc.compId,
              fileContent: doc.fileContent,
              createdBy: doc.createdBy,
              createdByName: doc.createdByName,
              isDelete: doc.isDelete,
              createdOn: doc.createdDate,
              fileType: this.getMimeType(doc.fileName)
            });
          });
        });

        if (merged.length > 0) {
          this.files = merged;
        } else {
          this.files = this.collectAllFiles(node);
        }
      },
      error: (err) => {
        console.error('Error loading documents for parent:', err);
        this.files = this.collectAllFiles(node);
      }
    });
  }

  /**
   * Returns the folder label that best describes where a leaf document lives.
   * Preference order: nearest FinancialYear ancestor, then path[1] (year slot in the
   * compliance tree), then the leaf's immediate parent label, then the leaf label.
   */
  getFolderNameForLeaf(leaf: FolderTreeNode): string {
    let current: FolderTreeNode | undefined = leaf;
    while (current) {
      if ((current.nodeType || '').toLowerCase() === 'financialyear') {
        return current.label;
      }
      current = current.parent;
    }
    const path = leaf.path || [];
    if (path.length >= 2) {
      const fyCandidate = path.find(seg => /^\d{4}\s*-\s*\d{4}$/.test(seg || ''));
      if (fyCandidate) return fyCandidate;
    }
    return leaf.parent?.label || path[path.length - 2] || leaf.label;
  }

  /**
   * Walk the subtree and group atomic complianceTrackerDocumentIds by their
   * resolved folder name (financial year). Comma-joined id strings on a single
   * node are split, so each id is counted once. Returns Map<folderName, Set<id>>.
   */
  collectAtomicDocumentIdsByFolder(node: FolderTreeNode): Map<string, Set<string>> {
    const result = new Map<string, Set<string>>();
    const walk = (current: FolderTreeNode) => {
      const raw = current.fileData?.complianceTrackerDocumentId;
      if (raw !== undefined && raw !== null && String(raw).trim() !== '') {
        const folderName = this.getFolderNameForLeaf(current);
        const bucket = result.get(folderName) ?? new Set<string>();
        String(raw)
          .split(',')
          .map(s => s.trim())
          .filter(s => s.length > 0)
          .forEach(id => bucket.add(id));
        result.set(folderName, bucket);
      }
      if (current.children) {
        for (const child of current.children) walk(child);
      }
    };
    walk(node);
    return result;
  }

  /**
   * Collect all complianceTrackerDocumentIds from child nodes recursively
   */
  collectComplianceTrackerDocumentIds(node: FolderTreeNode): string[] {
    let ids: string[] = [];

    if (node.fileData?.complianceTrackerDocumentId) {
      ids.push(node.fileData.complianceTrackerDocumentId);
    }

    if (node.children && node.children.length > 0) {
      for (const child of node.children) {
        ids = [...ids, ...this.collectComplianceTrackerDocumentIds(child)];
      }
    }

    return [...new Set(ids)]; // Remove duplicates
  }

  /**
   * Collect all files from node and children
   */
  collectAllFiles(node: FolderTreeNode): any[] {
    let files: any[] = [];
    if (node.children && node.children.length > 0) {
      for (const child of node.children) {
        if (child.isFile && child.fileData) {
          files.push({
            ...child.fileData,
            folderName: node.label,
            fullName: child.label
          });
        } else {
          files = [...files, ...this.collectAllFiles(child)];
        }
      }
    }
    return files;
  }

  /**
   * Collect displayable file rows from a tree node and its descendants.
   * Used for Opinions and Audits nodes whose docs are already embedded in the
   * tree returned by the UnifiedTree API — no extra HTTP call is needed.
   * Each child node's fileData is spread into a flat row; leaf nodes that
   * have no children are also included so a single-document node shows up.
   */
  /** Recursively find the first child node's docId/recordId plus any fileContent/filePath */
  private findChildFilePayload(n: FolderTreeNode): {
    fileContent?: string; filePath?: string; fileName?: string;
    documentId?: number; recordId?: number;
  } {
    for (const child of (n.children || [])) {
      const fd = child.fileData || {};
      // docId and recordId are explicit API fields on document nodes
      const documentId: number = fd.docId ?? fd.id ?? child.id;
      const recordId: number | undefined = fd.recordId;
      if (fd.fileContent || fd.filePath) {
        return { fileContent: fd.fileContent, filePath: fd.filePath, fileName: fd.fileName, documentId, recordId };
      }
      if (documentId) return { documentId, recordId, fileName: fd.fileName };
      const deeper = this.findChildFilePayload(child);
      if (deeper.documentId) return deeper;
    }
    return {};
  }

  collectTreeFiles(node: FolderTreeNode, mtype: 'opinions' | 'audits' | 'dms' = 'dms'): any[] {
    const files: any[] = [];

    const walk = (n: FolderTreeNode, parentLabel: string) => {
      const fd = n.fileData || {};
      const isDocRecord = !!(fd.createdByName || fd.createdDate);

      if (isDocRecord) {
        // Always walk children to get explicit docId / recordId from the document node
        const childPayload = this.findChildFilePayload(n);

        // recordId: child's explicit field first, then parent fileData.id, then tree node id
        const recordId: number = childPayload.recordId ?? fd.id ?? n.id;

        files.push({
          ...fd,
          // Only spread child file bytes if the parent doesn't already carry them
          ...(fd.fileContent || fd.filePath ? {} : childPayload),
          fileContent: fd.fileContent || childPayload.fileContent,
          filePath: fd.filePath || childPayload.filePath,
          id: recordId,
          recordId,
          documentId: childPayload.documentId ?? null,
          mtype,
          fileName: fd.fileName || childPayload.fileName || n.label,
          fullName: fd.fileName || childPayload.fileName || n.label,
          folderName: parentLabel,
          createdOn: fd.createdOn || fd.createdDate || null,
          createdByName: fd.createdByName || '',
          fileType: fd.fileType || this.getMimeType(fd.fileName || childPayload.fileName || n.label || '')
        });
        return;
      }

      const isLeaf = !n.children || n.children.length === 0;
      if (isLeaf && (n.isFile || Object.keys(fd).length > 0)) {
        files.push({
          ...fd,
          id: fd.id ?? n.id,
          fileName: fd.fileName || n.label,
          fullName: fd.fileName || n.label,
          folderName: parentLabel,
          createdOn: fd.createdOn || fd.createdDate || null,
          createdByName: fd.createdByName || '',
          fileType: fd.fileType || this.getMimeType(fd.fileName || n.label || '')
        });
        return;
      }

      if (!isLeaf) {
        n.children!.forEach(child => walk(child, n.label || parentLabel));
      }
    };

    walk(node, node.label);
    return files;
  }

  // ====== Tree Navigation ======

  findNodeById(nodes: FolderTreeNode[], id: number, treeType?: 'DMS' | 'COMPSEQR360'): FolderTreeNode | null {
    if (!nodes) return null;
    for (const n of nodes) {
      if (n.id === id && (!treeType || n.treeType === treeType)) {
        return n;
      }
      if (n.children && n.children.length) {
        const found = this.findNodeById(n.children, id, treeType);
        if (found) return found;
      }
    }
    return null;
  }

  buildBreadcrumbPath(selectedNode: FolderTreeNode): void {
    if (!selectedNode) {
      this.breadcrumbPath = [{ label: 'ProEDox' }];
      return;
    }

    const node: any = selectedNode;
    this.breadcrumbPath = [];

    if (node.path && Array.isArray(node.path)) {
      this.breadcrumbPath = node.path.map((label: string, i: number) => ({
        label,
        node: i === node.path.length - 1 ? selectedNode : undefined
      }));
      return;
    }

    const path: FolderTreeNode[] = [];
    let current: FolderTreeNode | undefined = selectedNode;

    while (current) {
      path.unshift(current);
      current = current.parent;
    }

    path.forEach(n => this.breadcrumbPath.push({
      label: n.label,
      node: n
    }));
  }

  navigateToBreadcrumb(breadcrumb: { label: string; node?: FolderTreeNode }): void {
    if (!breadcrumb.node) {
      const dmsRoot = this.findDmsRoot();
      if (dmsRoot) {
        this.selectedFolderTreeNodeItem = dmsRoot;
        this.buildBreadcrumbPath(dmsRoot);
        this.getAllFilesbyFolderId(dmsRoot.id, 'Dms');
      }
      return;
    }

    const actualNode = this.findNodeById(this.treeData, breadcrumb.node.id) || breadcrumb.node;

    this.selectedFolderTreeNodeItem = actualNode;
    this.buildBreadcrumbPath(actualNode);
    this.getAllFilesbyFolderId(
      actualNode.id,
      this.getModuleType(actualNode.foldertitle || '')
    );
  }

  findDmsRoot(): FolderTreeNode | null {
    return this.treeData.find(node =>
      node.label.toLowerCase() === 'proedox' ||
      (node.foldertitle || '').toLowerCase() === 'proedox'
    ) || null;
  }

  attachParentReferences(nodes: FolderTreeNode[], parent: FolderTreeNode | null = null) {
    if (!nodes) return;
    for (const n of nodes) {
      n.parent = parent || undefined;
      if (parent) n.parentId = parent.id;
      if (n.children && n.children.length > 0) {
        this.attachParentReferences(n.children, n);
      }
    }
  }

  getModuleType(label: any): string {
    if (label.includes("COMPSEQR360") && label.length > 1) {
      return label[1]?.toLowerCase();
    } else if (label.includes("COMPSEQR360") && label.length === 1) {
      return label[0]?.toLowerCase();
    } else {
      return label[0]?.toLowerCase();
    }
  }

  /**
   * Check if current view is showing compliance files
   */
  isComplianceView(): boolean {
    return this.selectedComplianceFolder !== null;
  }

  /**
   * Compare entities for dropdown selection
   */
  compareEntities(entity1: UserAssignedEntity, entity2: UserAssignedEntity): boolean {
    return entity1 && entity2 ? entity1.id === entity2.id : entity1 === entity2;
  }
}
