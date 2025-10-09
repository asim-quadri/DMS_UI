export const Constant = {
  version: '1.0.0',
  minDate: new Date('1950-01-01'),
  maxDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
  dropSetting: {
    single: {
      selectAllText: 'Select',
      unSelectAllText: 'UnSelect',
    },
    multi: {
      selectAllText: 'Select All',
      unSelectAllText: 'UnSelect All',
    },
    itemsShowLimit: 20,
  },
  timeOut: 1000,
};
