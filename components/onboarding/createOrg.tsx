import React, {useEffect, useState} from "react";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useProfile } from "../contextManagers/profile";

export default function CreateOrgScreen() {
  const [orgName, setOrgName] = useState("");
  const { profile, refreshProfile } = useProfile();

  return (
    <div className="min-h-screen flex flex-col max-h-screen justify-center place-items-center w-screen bg-gray-800 gap-y-8">
      <h1 className="text-3xl font-medium text-gray-200">
        Create an Organization
      </h1>
      {/*  TODO: Add a way to join existing organizations  */}
      <input
        value={orgName}
        onChange={(e) => setOrgName(e.target.value)}
        className="bg-gray-100 border-2 border-gray-600 rounded-md p-2 w-96"
      />
      <button
        className="bg-pink-500 text-white rounded-md py-1.5 w-60"
        onClick={async () => {
          const res = await fetch("/api/create-org", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              org_name: orgName,
              user_id: profile?.id,
            }),
          });
          if (res.status !== 200)
            throw new Error("Failed to create org: " + res.statusText);
          if (refreshProfile) await refreshProfile();
        }}
      >
        Create Organization
      </button>
      <div className="h-40" />
    </div>
  );
}