"use client";

import { useEffect, useState } from "react";
import { createLockContract } from "../lib/contracts";
import { ethers } from "ethers";

export function useLockContract() {
  const [data, setData] = useState({
    unlockTime: Date.now(),
    owner: "0x0000000000000000000000000000000000000000",
    balance: ethers.parseEther("0.0"),
  });

  useEffect(() => {
    async function loadContractData() {
      try {
        if (!window.ethereum) {
          throw new Error('No ethereum provider found');
        }
        const provider = new ethers.BrowserProvider(window.ethereum);
        const contractToUse = createLockContract(provider);

        const [unlockTime, owner, balance] = await Promise.all([
          contractToUse.getUnlockTime(),
          contractToUse.getOwner(),
          contractToUse.getBalance(),
        ]);

        setData({ unlockTime, owner, balance });
      } catch (err) {
        console.warn("Using mock data due to error:", err);
      }
    }

    loadContractData();
  }, []);

  return data;
}
