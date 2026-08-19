import { ResponseModel } from "./responseModel";

export interface FolderModel{
  id: number;
  folderName: string;
  isParent: boolean;
  userId: number;
  entityId: number;
  parentId?:number;
  }
  export interface FileModel {
    id: number;
    userId:number | null;
    fileName: string | null;
    fileType: string | null;
    lastModifiedOn: number | null;
    filePath: string | null;
    folderId: number | null;

}

/** Response shape of GET /api/FileUpload/getFile?fileId={id} — a single DMS/ProEDox file by id. */
export interface FileDetail {
  id: number;
  fileName: string | null;
  fileType: string | null;
  filePath: string | null;
  folderId: number;
  userId: number;
  fullName: string | null;
  folderName: string | null;
  createdOn: string | null;
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  isOwner: boolean;
}

