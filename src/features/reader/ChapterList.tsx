import { Button } from '../../components/ui/button'
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

interface ChapterListProps {
  activeSectionId: string
  chapters: ChapterStatus[]
  onSelect(sectionId: string): void
}

export function ChapterList({ activeSectionId, chapters, onSelect }: ChapterListProps) {
  const { isMobile, setOpenMobile } = useSidebar()
  const readableChapterCount = chapters.filter((chapter) => chapter.available).length

  return (
    <Sidebar id="chapter-sidebar" variant="inset">
      <SidebarHeader className="gap-3 border-b border-sidebar-border px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-base">Chapters</h3>
            <p className="text-sm text-muted-foreground">
              {readableChapterCount} readable sections
            </p>
          </div>
          {isMobile ? (
            <Button size="sm" type="button" variant="ghost" onClick={() => setOpenMobile(false)}>
              Close
            </Button>
          ) : null}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup className="min-h-0 p-2">
          <SidebarGroupContent className="grid gap-1">
            <SidebarMenu>
              {chapters.map((chapter) => (
                <SidebarMenuItem key={chapter.id}>
                  <SidebarMenuButton
                    isActive={chapter.id === activeSectionId}
                    disabled={!chapter.available}
                    className="h-auto items-start justify-between gap-3 px-3 py-3"
                    onClick={() => {
                      onSelect(chapter.id)
                      setOpenMobile(false)
                    }}
                  >
                    <span>{chapter.label}</span>
                    {chapter.warning ? (
                      <span className="text-xs text-muted-foreground">
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
