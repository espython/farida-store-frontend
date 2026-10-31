import { makeAutoObservable } from "mobx";

// Search overlay UI state. Results come from the catalog module (QuickSearch).

export class SearchBoxStore {
  showBackdrop: boolean = false;

  showSearchBox: boolean = false;

  searchInputValue: string = "";

  constructor() {
    makeAutoObservable(this);
  }

  set displayBackdrop(state: boolean) {
    if (state) {
      this.showBackdrop = state;
      if (typeof window !== 'undefined') {
        document.body.style.overflow = "hidden";
      }
    } else {
      this.showBackdrop = state;
      if (typeof window !== 'undefined') {
        document.body.style.overflow = "unset";
      }
    }
  }

  set displaySearchBox(state: boolean) {
    state ? (this.showSearchBox = state) : (this.showSearchBox = state);
  }

  hideWholeSearchBox = () => {
    this.displaySearchBox = false;
    setTimeout(() => {
      this.displayBackdrop = false;
    }, 500);
  };

  displayWholeSearchBox = () => {
    this.displayBackdrop = true;
    setTimeout(() => {
      this.displaySearchBox = true;
    }, 500);
  };

  setSearchInputValue(val: string) {
    this.searchInputValue = val;
  }

}
