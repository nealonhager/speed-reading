import type { ChapterStatus } from '../../types'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '../../components/ui/sidebar'

const ghostButtonClass =
  'inline-flex min-h-11 items-center justify-center rounded-full border border-outline-strong bg-surface px-4 text-heading transition-[transform,background,color,border-color] duration-200 hover:-translate-y-px hover:bg-surface-strong disabled:cursor-not-allowed disabled:opacity-45 disabled:transform-none'

interface ChapterListProps {
  activeSectionId: string
  chapters: ChapterStatus[]
  onSelect(sectionId: string): void
}

export function ChapterList({ activeSectionId, chapters, onSelect }: ChapterListProps) {
  const { isMobile, setOpenMobile } = useSidebar()

  return (
    <Sidebar id="chapter-sidebar">
      <SidebarHeader className="mb-4 flex items-baseline justify-between gap-4">
        <div>
          <h3>Chapters</h3>
          <p className="text-sm text-muted">
            {chapters.filter((chapter) => chapter.available).length} readable sections
          </p>
        </div>
        {isMobile ? (
          <button
            className={ghostButtonClass}
            type="button"
            onClick={() => setOpenMobile(false)}
          >
            Close
          </button>
        ) : null}
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup className="min-h-0">
          <SidebarGroupContent className="grid max-h-[calc(100vh-8rem)] gap-3 overflow-auto pr-1">
            <SidebarMenu className="grid gap-3">
              {chapters.map((chapter) => (
                <SidebarMenuItem key={chapter.id}>
                  <SidebarMenuButton
                    isActive={chapter.id === activeSectionId}
                    disabled={!chapter.available}
                    onClick={() => {
                      onSelect(chapter.id)
                      setOpenMobile(false)
                    }}
                  >
                    <span>{chapter.label}</span>
                    {chapter.warning ? (
                      <span className="rounded-full bg-warning-soft px-2.5 py-1 text-xs text-warning">
                        Skipped
                      </span>
                    ) : null}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
