import { Web3Provider } from "@/context/Web3";
import { DataProvider } from "@/context/Data";
import { headers } from "next/headers";

export default async function NftsLayout({ children }: { children: React.ReactNode }) {
    const headersList = await headers()
    const cookies = headersList.get('cookie')

    return (
        <Web3Provider cookies={cookies}>
            <DataProvider>
                {children}
            </DataProvider>
        </Web3Provider>
    )
}