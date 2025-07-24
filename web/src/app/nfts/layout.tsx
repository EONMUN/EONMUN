import { Providers } from "@/context";
import { headers } from "next/headers";

export default async function NftsLayout({ children }: { children: React.ReactNode }) {
    const headersList = await headers()
    const cookies = headersList.get('cookie')

    return (
        <Providers cookies={cookies}>
            {children}
        </Providers>
    )
}