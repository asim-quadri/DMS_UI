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

