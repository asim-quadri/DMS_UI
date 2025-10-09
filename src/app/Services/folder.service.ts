import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http'
import { AppConfig } from '../app.config'
import { FolderModel,FileModel } from '../models/folderModel';
import { forkJoin, Observable } from 'rxjs';
import { accessModel } from '../models/pendingapproval';

@Injectable({
  providedIn: 'root'
})
export class FolderService {
  //    formData.append('file', file);
  // Inserting every file to formData
  // for (const file of files) {
  //     // Use the name as file
  //     // as mock backend configured
  //     // to get file as input in the name of file
  //     formData.append('file', file);
  // }
  // return this.http.post<any>(
  //   `${this.BASEURL}/FileUpload/FileUpload?folderId=${fileModel.folderId}&userId=${fileModel.userId}`,formData,
  //   );
  //}



  private BASEURL: any = '';
  public error: any;


  friends: Array<any> = [];
  public headers: Array<any> = [];

  constructor(public http: HttpClient, private config: AppConfig) {

    this.BASEURL = this.config.ServiceUrl;
    this.http = http;
    this.headers = [];
    this.headers.push('Content-Type', 'application/json');
    var currnetu: any = localStorage.getItem('currentUser');
    let currentUser = JSON.parse(currnetu);

    if (currentUser && currentUser.access_token) {
      this.headers.push('Authorization', 'Bearer ' + currentUser.token);
    }
  }

  getAuthHeaders() {
    var currnetu: any = localStorage.getItem('currentUser');
    let currentUser = JSON.parse(currnetu);
    if (currentUser && currentUser.access_token) {
      return { headers: { 'Authorization': 'Bearer ' + currentUser.access_token } };

    }
    return { headers: { 'Authorization': 'Bearer ' } };
  }


  getAuthHeadersJSON() {
    var currnetu: any = localStorage.getItem('currentUser');
    let currentUser = JSON.parse(currnetu);
    if (currentUser && currentUser.access_token) {

      return { headers: { 'Authorization': 'Bearer ' + currentUser.access_token, 'Content-Type': 'application/json' } };

    }
    return { headers: { 'Authorization': 'Bearer ', 'Content-Type': 'application/json' } };
  }
  getImageAuthHeadersJSON() {
    return { headers: undefined };
  }

  getHeadersJSON() {
    return { headers: { 'Content-Type': 'application/json' } }
  }


  getAllFolders() {
    return this.http.get<Array<FolderModel>>(this.BASEURL + '/FolderManagement/FoldersByEntity', this.getAuthHeadersJSON());
  }
  getGetFolderTree(selectedEntityId: number, currentUserId: any) {
    return this.http.get<Array<FolderModel>>(
      `${this.BASEURL}/FolderManagement/tree?intityId=${selectedEntityId}&userId=${currentUserId}`,
      this.getAuthHeadersJSON()
  );
  }
  getFilesbyFolderId(id: any) {
    return this.http.get<Array<FolderModel>>(
        `${this.BASEURL}/FileUpload/getFiles?folderId=${id}`,
        this.getAuthHeadersJSON()
    );
}
createFolder(folderModel: FolderModel) {
  return this.http.post<boolean>(this.BASEURL + '/FolderManagement/create-folder', folderModel,this.getAuthHeadersJSON());

}
//uploadFile(fileModel: FileModel,file: File){
  // Formdata to store files to send it
        // as a multipart/form-data post request
  //      const formData = new FormData();
    //    formData.append('file', file);

        // Inserting every file to formData
        // for (const file of files) {

        //     // Use the name as file
        //     // as mock backend configured
        //     // to get file as input in the name of file
        //     formData.append('file', file);
        // }
  // return this.http.post<any>(
  //   `${this.BASEURL}/FileUpload/FileUpload?folderId=${fileModel.folderId}&userId=${fileModel.userId}`,formData,
  //   );

//}
uploadFile( fileModel: FileModel,file: File): Observable<any> {
  const formData: FormData = new FormData();
  formData.append('file', file, file.name);
  //formData.append('folderId', fileModel.folderId.toString());
  //formData.append('userId', fileModel.userId.toString());

  const headers = new HttpHeaders();
  headers.append('Accept', 'application/json');

  return this.http.post<any>(`${this.BASEURL}/FileUpload/FileUpload?folderId=${fileModel.folderId}&userId=${fileModel.userId}`, formData, { headers });
}
}
