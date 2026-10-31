"use client";
import { StoreContext } from "@/contexts/StoreContext";
import React, { useContext, useEffect } from "react";
import RawProductCard from "./RawProductCard";
import { Spinner } from "@nextui-org/react";
import { observer } from "mobx-react-lite";
import { useSearchParams } from "next/navigation";
import EmptyProducts from "./EmptyProducts";
import { useLocale } from "next-intl";

const RowStyleView = () => {
  const { products } = useContext(StoreContext);
  const locale = useLocale();

  const searchParams = useSearchParams();
  const pageSize = searchParams.get("psize");

  // ${
  //   pageSize === "16"
  //     ? `grid-rows-[repeat(8,minmax(0,1fr))]`
  //     : pageSize === "20"
  //     ? `grid-rows-[repeat(10,minmax(0,1fr))]`
  //     : pageSize === "24"
  //     ? `grid-rows-[repeat(12,minmax(0,1fr))]`
  //     : `grid-rows-6`
  //   }

  return (
    <>
      {/* <div className='w-full min-h-[200vh] grid grid-cols-4 gap-10 px-28 py-0'></div> */}

      {!products.productsLoading ? (
        <div dir={locale === "en" ? "ltr" : "rtl"}>
          {products.products?.length > 0 ? (
            <div
              className={` w-full h-auto grid grid-cols-1 xl:grid-cols-2 gap-5 lmob:gap-2 lg:gap-10 py-0 
             
              
                `}
            >
              {products.products?.map((product) => (
                <RawProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <EmptyProducts />
          )}
        </div>
      ) : (
        <div className="w-full min-h-[50vh] grid place-items-center   px-28 py-0">
          <Spinner
            label="loading..."
            size="lg"
            className=""
            classNames={{
              circle1: "border-l-mainPink border-b-mainPink",
              circle2: "border-mainPink",
              wrapper: "w-40 h-40",
            }}
          />
        </div>
      )}
    </>
  );
};

export default observer(RowStyleView);
