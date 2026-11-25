import { Suspense } from "react";
import { UstCubuk } from "@/components/ust-cubuk";
import { GrupMenusu, MobilGrupMenusu } from "@/components/grup-menusu";
import { KenarDugmesi } from "@/components/kenar-dugmesi";

export default function UygulamaDuzeni({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh">
      <UstCubuk
        solMenu={
          <>
            <span className="hidden lg:inline-flex">
              <KenarDugmesi />
            </span>
            <Suspense
              fallback={<span className="inline-block size-8 lg:hidden" />}
            >
              <MobilGrupMenusu />
            </Suspense>
          </>
        }
      />
      <div className="mx-auto flex w-full max-w-[1600px]">
        <aside
          data-daralir
          className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] w-60 shrink-0 flex-col border-r bg-sidebar transition-[width] duration-200 lg:flex dar:w-16"
        >
          <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
            <Suspense fallback={<MenuIskeleti />}>
              <GrupMenusu />
            </Suspense>
          </div>
        </aside>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}

function MenuIskeleti() {
  return (
    <div className="flex flex-col gap-2 p-3 dar:px-2">
      <div className="h-7 animate-pulse rounded bg-muted" />
      <div className="mt-4 h-3 w-20 animate-pulse rounded bg-muted" />
      <div className="h-7 animate-pulse rounded bg-muted" />
      <div className="h-7 animate-pulse rounded bg-muted" />
    </div>
  );
}
