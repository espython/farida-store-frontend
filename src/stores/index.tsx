"use client";
import { UserDropStore } from "./userDropStore";

import React, { createContext } from "react";
import { SideBarStore } from "./sidebarStore";
import { CartSidebarStore } from "./cartSidebarStore";
import { FilterSidebarStore } from "./filterSidebarStore";
import { ProductsView } from "./productsViewStore";
import { SearchBoxStore } from "./searchBoxStore";
import PaymentStore from "./paymentStore";

// userDrop store instance

const userDropInstance = new UserDropStore();

// sidebar state store

const sidebarInstance = new SideBarStore();

// cart sidebar state store

const cartSidebarInstance = new CartSidebarStore();

// cart sidebar state store

const filterSidebarInstance = new FilterSidebarStore();

// search box state store

const searchBoxInstance = new SearchBoxStore();

// products view style store

const productsViewStyle = new ProductsView();

// payment store

const paymentInstance = new PaymentStore();

// ==========================================================
// this object is for all stores that will for all states

export const store = {
  userDrop: userDropInstance,
  sidebar: sidebarInstance,
  cartSidebar: cartSidebarInstance,
  filter: filterSidebarInstance,
  viewStyle: productsViewStyle,
  searchBox: searchBoxInstance,
  payment: paymentInstance,
};

// Create the StoreContext here to avoid circular dependency
export const StoreContext = createContext(store);

interface indexChildren {
  children: React.JSX.Element;
}

// store context provider

const StoreContextProvider = ({ children }: indexChildren) => {
  return (
    <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
  );
};

export default StoreContextProvider;
