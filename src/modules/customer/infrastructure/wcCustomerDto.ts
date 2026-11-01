// wc/v3/customers shapes (server keys). Only the fields we read or write; never leave infrastructure/.

export interface WcCustomerAddress {
  first_name: string;
  last_name: string;
  company?: string;
  address_1: string;
  address_2: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  phone?: string;
  email?: string;
}

export interface WcMeta {
  id?: number;
  key: string;
  value: unknown;
}

/** GET /wc/v3/customers/{id}?_fields=… */
export interface WcCustomerAccount {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  billing?: Partial<WcCustomerAddress>;
  shipping?: Partial<WcCustomerAddress>;
  meta_data?: WcMeta[];
}

/** PUT /wc/v3/customers/{id}: only what changes. */
export interface WcCustomerUpdate {
  first_name?: string;
  last_name?: string;
  billing?: Partial<WcCustomerAddress>;
  shipping?: Partial<WcCustomerAddress>;
  meta_data?: WcMeta[];
}
