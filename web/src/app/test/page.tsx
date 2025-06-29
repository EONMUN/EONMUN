"use client";
import { useAccount } from "wagmi";
import { useReadEmnBalanceOf, useReadEmnVersion, useReadEmnRoyaltyInfo, useReadEmnGetTokenCounter } from "@/abis";

export default function TestPage() {
  const { address } = useAccount();
  const { data: upgradeInterfaceVersion } = useReadEmnVersion();
  const { data: royaltyInfo } = useReadEmnRoyaltyInfo();
  const { data: balanceOf } = useReadEmnBalanceOf();
  const { data: tokenCounter } = useReadEmnGetTokenCounter();
  // console.log(upgradeInterfaceVersion, royaltyInfo);
  return <div>Test {address}
  <div>Upgrade Interface Version: {upgradeInterfaceVersion}</div>
  <div>Royalty Info: {royaltyInfo}</div>
  <div>Balance Of: {balanceOf}</div> 
  <div>Token Counter: {tokenCounter}</div>
  </div>;
}