import { Component } from '@angular/core';
import { IDropdownSettings } from 'ng-multiselect-dropdown';
import { ModalDismissReasons, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { HttpService } from 'src/app/Services/http.service';
import { url } from 'src/app/@core/utils/url';
import { Subscription } from 'rxjs';
import { Constant } from 'src/app/@core/utils/constant';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NotifierService } from 'angular-notifier';
import { find, uniq } from 'underscore';
import { PersistenceService } from 'src/app/Services/persistence.service';
import { MenuOptionModel } from 'src/app/Models/Users';

@Component({
  selector: 'app-entity',
  templateUrl: './entity.component.html',
  styleUrls: ['./entity.component.scss'],
})
export class EntityComponent {
  private hardCode = {
    userId: this.persistenceService.getUserId(),
    managerId: this.persistenceService.getManagerId(),
    isSuperAdmin: this.persistenceService.isSuperAdmin,
  };

  active = 3;

  public common = {
    isLoaded: false,
    errorMsg: '',
    closeResult: '',
    apiGetEntityData: [] as any,
  };

  public addMapping = {
    countryDD: {
      singleSelection: true,
      idField: 'Id',
      textField: 'CountryName',
      selectAllText: Constant.dropSetting.single.selectAllText,
      unSelectAllText: Constant.dropSetting.single.unSelectAllText,
      itemsShowLimit: Constant.dropSetting.itemsShowLimit,
      allowSearchFilter: true,
      data: [] as any,
      selectedItems: [] as any,
    },
    entityDD: {
      singleSelection: false,
      idField: 'id',
      textField: 'code',
      selectAllText: Constant.dropSetting.multi.selectAllText,
      unSelectAllText: Constant.dropSetting.multi.unSelectAllText,
      itemsShowLimit: Constant.dropSetting.itemsShowLimit,
      allowSearchFilter: true,
      data: [] as any,
      selectedItems: [] as any,
    },
    isLoaded: true,
    isSubmit: false,
  };

  public view = {
    selected: undefined as number | undefined,
    country: {
      data: [] as any,
      isDelete: false,
      deleteId: 0,
      isLoaded: true,
    } as any,
    entity: {
      data: [] as any,
      isDelete: false,
      deleteId: 0,
      isLoaded: true,
    } as any,
  };

  public newEntity = {
    form: this.formBuilder.group({
      code: ['', Validators.compose([Validators.required])],
      name: ['', [Validators.required]],
    }) as FormGroup,
    isLoaded: true,
  };

  public approval = {
    mapping: {
      approved: 0,
      pending: 0,
      rejected: 0,
      data: [] as any,
    },
    insertion: {
      approved: 0,
      pending: 0,
      rejected: 0,
      data: [] as any,
    },
    isLoaded: true,
    count: 0 as number,
  };

  stateList: any[] = [];
  entitytype: any[] = [];
  dropdownSettings: IDropdownSettings = {};
  statedropdownSettings: IDropdownSettings = {};

  showAddButton : boolean = false;
  showApprovalButton : boolean = false;
  showAddNewEntityTypeButton : boolean = false;

  public subscriptions: any = {
    GetEntityData$: Subscription,
    InsertEntity$: Subscription,
    MapEntity$: Subscription,
    DeleteCountry$: Subscription,
    DeleteEntity$: Subscription,
  };

  constructor(
    private modalService: NgbModal,
    private http: HttpService,
    private formBuilder: FormBuilder,
    private notifier: NotifierService,
    private persistenceService: PersistenceService
  ) {}

  ngOnInit() {
    this._getInit();
    this.entitytype = [
      { item_id: 1, item_text: 'Pvt Ltd Company' },
      { item_id: 2, item_text: 'Limited Company' },
    ];
    this.stateList = [
      { item_id: 1, item_text: 'Maharashtra' },
      { item_id: 2, item_text: 'Telangana' },
      { item_id: 3, item_text: 'Karnataka' },
      { item_id: 4, item_text: 'Tamil Nadu' },
      { item_id: 5, item_text: 'Kerala' },
      { item_id: 6, item_text: 'Maharashtra' },
      { item_id: 7, item_text: 'Telangana' },
      { item_id: 8, item_text: 'Karnataka' },
      { item_id: 9, item_text: 'Tamil Nadu' },
      { item_id: 10, item_text: 'Kerala' },
    ];

    this.statedropdownSettings = {
      singleSelection: true,
      idField: 'item_id',
      textField: 'item_text',
      selectAllText: 'Select All',
      unSelectAllText: 'UnSelect All',
      itemsShowLimit: 2,
      allowSearchFilter: true,
    };
    
  }

  private _getInit() {
    try {

var roleMenuOptions = this.persistenceService.getSessionStorage('menuOptions');      
    if (roleMenuOptions && roleMenuOptions.length > 0) {
      //get menu options for for parentId = 11
      var menuOptions = roleMenuOptions.filter((option: MenuOptionModel) => option.parentId === 11);
      console.log('entity setup Menu Options:', menuOptions);
      if (menuOptions.length > 0) {
        this.showAddButton = menuOptions.filter((option: MenuOptionModel) => option.title === 'Add' && option.canView).length > 0;
        this.showAddNewEntityTypeButton = menuOptions.filter((option: MenuOptionModel) => option.title === 'Add New Entity Type' && option.canView).length > 0;
        this.showApprovalButton = menuOptions.filter((option: MenuOptionModel) => option.title === 'APPROVALS' && option.canView).length > 0;
      }
    }
      const _tA = this.addMapping;
      const _i = this.approval.insertion;
      const _m = this.approval.mapping;
      const _v = this.view;
      // default
      {
        _tA.countryDD.data = [];
        _tA.entityDD.data = [];
        this.common.isLoaded = false;
        _i.approved = 0;
        _i.pending = 0;
        _i.rejected = 0;
        _i.data = [];
        _m.approved = 0;
        _m.pending = 0;
        _m.rejected = 0;
        _m.data = [];
        this.approval.count = 0;
        _v.selected = undefined;
        _v.country.isLoaded = true;
        _v.country.data = [];
        _v.entity.isLoaded = true;
        _v.entity.data = [];
      }
      let apiUrl = url.productSetup.entity.GetEntityData;
      apiUrl = this.http.replaceApiValue(apiUrl, {
        '{userId}': this.hardCode.userId,
      });
      const _rest = () => {
        this.common.isLoaded = true;
      };
      this.subscriptions.GetEntityData$ = this.http.get(apiUrl).subscribe({
        next: (v: any) => {
          this.common.apiGetEntityData = v;

          let _data = {
            country: [],
            insertion: [],
            mapping: [],
          } as any;

          if (!v || v.length === 0) {
            return;
          }
          _data.country = v[0];
          _tA.countryDD.data = _data.country;

          // insertion
          if (v[1] && v[1].length > 0) {
            _data.insertion = v[1];
            _tA.entityDD.data = _data.insertion.filter((v: any) => {
              return v.status_id === 2;
            });
            _i.approved = _data.insertion.filter((v: any) => {
              return (
                (v.fk_user_id === this.hardCode.userId ||
                  v.approval_id === this.hardCode.userId) &&
                v.status_id === 2
              ); // hard code
            }).length;
            _i.pending = _data.insertion.filter((v: any) => {
              return (
                (v.fk_user_id === this.hardCode.userId ||
                  v.approval_id === this.hardCode.userId) &&
                v.status_id == 1
              );
            }).length;
            _i.rejected = _data.insertion.filter((v: any) => {
              return (
                (v.fk_user_id === this.hardCode.userId ||
                  v.approval_id === this.hardCode.userId) &&
                v.status_id === 3
              );
            }).length;

            _i.data = _data.insertion.filter((v: any) => {
              return (
                v.fk_user_id === this.hardCode.userId ||
                v.approval_id === this.hardCode.userId
              );
            });
            _i.data.forEach((v: any) => {
              v.isApprovalAllow =
                v.approval_id === this.hardCode.userId ||
                this.hardCode.isSuperAdmin
                  ? true
                  : false;
            });
          }

          // mapping
          if (v[2] && v[2].length > 0 && _tA.countryDD.data.length > 0) {
            _data.mapping = v[2];
            const _getCountry = (id: number) => {
              return find(_tA.countryDD.data, (v: any) => {
                return v.Id === id;
              }).CountryName;
            };

            _data.mapping.forEach((v: any) => {
              v.countryName = _getCountry(v.fk_country_id);
              v.isApprovalAllow =
                v.approval_id === this.hardCode.userId ||
                this.hardCode.isSuperAdmin
                  ? true
                  : false;
            });
            _m.approved = _data.mapping.filter((v: any) => {
              return (
                (v.fk_user_id === this.hardCode.userId ||
                  v.approval_id === this.hardCode.userId) &&
                v.status_id === 2
              );
            }).length;
            _m.pending = _data.mapping.filter((v: any) => {
              return (
                (v.fk_user_id === this.hardCode.userId ||
                  v.approval_id === this.hardCode.userId) &&
                v.status_id == 1
              );
            }).length;
            _m.rejected = _data.mapping.filter((v: any) => {
              return (
                (v.fk_user_id === this.hardCode.userId ||
                  v.approval_id === this.hardCode.userId) &&
                v.status_id === 3
              );
            }).length;

            _m.data = _data.mapping.filter((v: any) => {
              return (
                v.fk_user_id === this.hardCode.userId ||
                v.approval_id === this.hardCode.userId
              );
            });
          }
          this.approval.count =
            this.approval.insertion.pending +
            this.approval.insertion.rejected +
            this.approval.mapping.pending +
            this.approval.mapping.rejected;

          // view
          {
            if (_data.mapping.length > 0) {
              _v.selected = undefined;
              const _aData = _data.mapping.filter((v: any) => {
                return v.status_id === 2;
              });
              _v.country.data = uniq(_aData, (v: any) => {
                return v.fk_country_id;
              });
              _v.entity.data = uniq(_aData, (v: any) => {
                return v.entity_id;
              });
            }
          }
        },
        error: (e) => {
          this.errorMsg(e.error);
          _rest();
        },
        complete: () => {
          _rest();
        },
      });
    } catch (ex) {
      console.log(ex);
    }
  }

  public insertEntity() {
    const _t = this.newEntity,
      _f = _t.form;
    if (_f.invalid) {
      return;
    }
    let apiUrl = url.productSetup.entity.InsertEntity; /*  */
    apiUrl = this.http.replaceApiValue(apiUrl, {
      '{userId}': this.hardCode.userId,
      '{entityCode}': _f.get('code')?.value.trim(),
      '{entityName}': _f.get('name')?.value.trim(),
    });
    _t.isLoaded = false;
    const _rest = () => {
      _t.isLoaded = true;
    };
    this.subscriptions.InsertEntity$ = this.http.get(apiUrl).subscribe({
      next: (v: any) => {
        this.modalService.dismissAll();
        this.notifier.notify('success', 'New Entity Created Successfully');
        setTimeout(() => {
          this._getInit();
        }, 100);
      },
      error: (e) => {
        _rest();
        if (e.error.indexOf('duplicate') > 0) {
          this.errorMsg('Duplicate entity found');
        } else {
          this.errorMsg(e.error);
        }
      },
      complete: () => {
        _rest();
        _f.reset();
      },
    });
  }

  public addEntityMapping() {
    const _t = this.addMapping;
    _t.isSubmit = true;
    try {
      if (
        !_t.isLoaded ||
        _t.countryDD.selectedItems.length === 0 ||
        _t.entityDD.selectedItems.length === 0
      ) {
        return;
      }
      let apiUrl = url.productSetup.entity.MapEntity; /*  */
      apiUrl = this.http.replaceApiValue(apiUrl, {
        '{userId}': this.hardCode.userId,
      });
      const _arrEntityId = [] as any;
      _t.entityDD.selectedItems.forEach((v: any) => {
        _arrEntityId.push(v.id);
      });
      const req = {
        countryId: _t.countryDD.selectedItems[0].Id,
        arrEntityId: _arrEntityId,
      };
      _t.isLoaded = false;
      this.subscriptions.MapEntity$ = this.http.post(apiUrl, req).subscribe({
        next: (v: any) => {
          this.modalService.dismissAll();
          this.notifier.notify(
            'success',
            'Entity Mapping Created Successfully'
          );
          setTimeout(() => {
            this._getInit();
          }, 100);
        },
        error: (e) => {
          _t.isLoaded = true;
          _t.countryDD.selectedItems = [];
          _t.entityDD.selectedItems = [];
          _t.isSubmit = false;
          if (e.error.indexOf('duplicate') > 0) {
            this.errorMsg('Duplicate entity found');
          } else {
            this.errorMsg(e.error);
          }
        },
        complete: () => {
          _t.isLoaded = true;
          _t.countryDD.selectedItems = [];
          _t.entityDD.selectedItems = [];
          _t.isSubmit = false;
        },
      });
    } catch (ex: any) {
      this.errorMsg(ex);
    }
  }

  public entityStatusUpdate(isAccept: boolean) {
    if (!this.approval.isLoaded) {
      return;
    }
    const _t = this.approval.insertion;
    try {
      let apiUrl = url.productSetup.entity.AcceptOrRejectEntity;
      apiUrl = this.http.replaceApiValue(apiUrl, {
        '{userId}': this.hardCode.userId,
      });
      const _rest = () => {
        this.approval.isLoaded = true;
      };
      const _selected = _t.data.filter((v: any) => {
        return v.isChecked === true;
      }) as any;
      const _arrEntityId = [] as any;
      _selected.forEach((v: any) => {
        _arrEntityId.push(v.id);
      });
      const req = {
        isAccept: isAccept,
        arrEntityId: _arrEntityId,
      };
      this.approval.isLoaded = false;
      this.subscriptions.GetEntityData$ = this.http
        .post(apiUrl, req)
        .subscribe({
          next: (v: any) => {
            if (!v || v <= 0) {
              this.errorMsg('Something went wrong');
              return;
            }
            _rest();
            this.modalService.dismissAll();
            this.notifier.notify('success', 'Entity Update Successfully');
            setTimeout(() => {
              this._getInit();
            }, 100);
          },
          error: (e) => {
            this.errorMsg(e.error);
            _rest();
          },
          complete: () => {
            _rest();
          },
        });
    } catch (ex: any) {
      this.errorMsg(ex);
    }
  }

  public mappingStatusUpdate(isAccept: boolean) {
    if (!this.approval.isLoaded) {
      return;
    }
    const _t = this.approval.mapping;
    try {
      let apiUrl = url.productSetup.entity.AcceptOrRejectMapping;
      apiUrl = this.http.replaceApiValue(apiUrl, {
        '{userId}': this.hardCode.userId,
      });
      const _rest = () => {
        this.approval.isLoaded = true;
      };
      const _selected = _t.data.filter((v: any) => {
        return v.isChecked === true;
      }) as any;
      const _arrEntityId = [] as any;
      _selected.forEach((v: any) => {
        _arrEntityId.push(v.map_id);
      });
      const req = {
        isAccept: isAccept,
        arrEntityId: _arrEntityId,
      };
      this.approval.isLoaded = false;
      this.subscriptions.GetEntityData$ = this.http
        .post(apiUrl, req)
        .subscribe({
          next: (v: any) => {
            if (!v || v <= 0) {
              this.errorMsg('Something went wrong');
              return;
            }
            _rest();
            this.modalService.dismissAll();
            this.notifier.notify('success', 'Entity Update Successfully');
            setTimeout(() => {
              this._getInit();
            }, 100);
          },
          error: (e) => {
            this.errorMsg(e.error);
            _rest();
          },
          complete: () => {
            _rest();
          },
        });
    } catch (ex: any) {
      this.errorMsg(ex);
    }
  }

  public openPopUp(content: any, size: any = undefined) {
    this.modalService.open(content, { size: size, centered: true }).result.then(
      (result) => {
        this.common.closeResult = `Closed with: ${result}`;
      },
      (reason) => {
        this.common.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
      }
    );
  }

  public setSelectedCountry(selectedVal: any) {
    const _t = this.view;
    if (_t.country.isDelete) return;
    try {
      _t.selected = selectedVal.countryName;
      _t.entity.data = this.common.apiGetEntityData[2].filter((v: any) => {
        return v.fk_country_id === selectedVal.fk_country_id;
      });
    } catch (ex: any) {
      this.errorMsg(ex);
    }
  }

  public isApproveAllow(e: any, value: any) {
    if (value.isApprovalAllow) {
      value.isChecked = !value.isChecked;
    } else {
      e.preventDefault();
      return;
    }
  }

  public onDeleteClick(moduleName: 'entity' | 'country', isDelete: boolean) {
    const _obj = moduleName === 'entity' ? this.view.entity : this.view.country;
    _obj.isDelete = isDelete;
  }

  public openDeletePopUp(
    moduleName: 'entity' | 'country',
    modal: any,
    id: any
  ) {
    const _obj = moduleName === 'entity' ? this.view.entity : this.view.country;
    if (!_obj.isDelete) return;
    _obj.deleteId = id;
    this.openPopUp(modal);
  }

  public onDeleteCountry() {
    const _t = this.view.country;
    let apiUrl = url.productSetup.entity.DeleteCountry;
    apiUrl = this.http.replaceApiValue(apiUrl, {
      '{userId}': this.hardCode.userId,
      '{countryId}': _t.deleteId,
    });
    _t.isLoaded = false;
    const _rest = () => {
      _t.isLoaded = true;
    };
    this.subscriptions.DeleteCountry$ = this.http.delete(apiUrl).subscribe({
      next: (v: any) => {
        this.modalService.dismissAll();
        this.notifier.notify('success', 'Country Deleted Successfully');
        setTimeout(() => {
          this._getInit();
        }, 100);
      },
      error: (e) => {
        _rest();
        this.errorMsg(e.error);
      },
      complete: () => {
        _rest();
      },
    });
  }

  public onDeleteEntity() {
    const _t = this.view.entity;
    let apiUrl = url.productSetup.entity.DeleteEntity;
    apiUrl = this.http.replaceApiValue(apiUrl, {
      '{userId}': this.hardCode.userId,
      '{countryId}': _t.deleteId.fk_country_id,
      '{entityType}': _t.deleteId.type,
    });
    _t.isLoaded = false;
    const _rest = () => {
      _t.isLoaded = true;
    };
    this.subscriptions.DeleteEntity$ = this.http.delete(apiUrl).subscribe({
      next: (v: any) => {
        this.modalService.dismissAll();
        this.notifier.notify('success', 'Entity Deleted Successfully');
        setTimeout(() => {
          this._getInit();
        }, 100);
      },
      error: (e) => {
        this.errorMsg(e.error);
        _rest();
      },
      complete: () => {
        _rest();
      },
    });
  }

  public onSearch(
    moduleName: 'country' | 'insert' | 'mapping',
    searchText: any
  ) {
    searchText = searchText.value.toLowerCase();
    if (searchText.length <= 3 && searchText !== '') {
      return;
    }
    const _listSearch = {
      country: () => {
        const _t = this.view.country;
        if (searchText === '') {
          _t.data = uniq(this.common.apiGetEntityData[2], (v: any) => {
            return v.fk_country_id;
          });
        } else {
          const _fltr = _t.data.filter((v: any) => {
            return v.countryName.toLowerCase().indexOf(searchText) > -1;
          });
          _t.data = _fltr;
        }
      },
    } as any;
    _listSearch[moduleName]();
  }

  private errorMsg(msg: string) {
    this.common.errorMsg = msg;
    this.common.isLoaded = true;
    setTimeout(() => {
      this.common.errorMsg = '';
    }, Constant.timeOut);
    this.notifier.notify('error', msg);
  }

  private getDismissReason(reason: any): string {
    if (reason === ModalDismissReasons.ESC) {
      return 'by pressing ESC';
    } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
      return 'by clicking on a backdrop';
    } else {
      return `with: ${reason}`;
    }
  }
}
