"use client";
import { StoreContext } from "@/contexts/StoreContext";
import { observer } from "mobx-react-lite";
import React, { useContext } from "react";
import UserData from "./UserData";
import EditProfileModal from "./EditProfileModal";
import EditButton from "./EditButton";

const UserInformation = () => {
  const { user } = useContext(StoreContext);
  const { first_name, last_name, username, email } = user.strapiUserdata;
  const name = [first_name, last_name].filter(Boolean).join(" ") || username;
  const initials = (first_name?.[0] ?? username?.[0] ?? "") + (last_name?.[0] ?? "");

  return (
    <section aria-labelledby="profile-name" className="max-w-3xl mx-auto bg-white rounded-3xl p-5 md:p-8 flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-4">
        <span
          aria-hidden="true"
          className="w-16 h-16 md:w-20 md:h-20 shrink-0 grid place-items-center rounded-full bg-garden text-cream font-display text-2xl md:text-3xl uppercase"
        >
          {initials}
        </span>
        <div className="flex-1 min-w-0">
          <h2 id="profile-name" className="font-display text-2xl md:text-[1.75rem] leading-tight break-words">
            {name}
          </h2>
          {email && <p className="text-garden-muted break-all">{email}</p>}
        </div>
        <EditButton />
      </div>
      <UserData />
      <EditProfileModal />
    </section>
  );
};

export default observer(UserInformation);
