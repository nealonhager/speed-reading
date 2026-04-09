/* eslint-disable react-refresh/only-export-components */
import * as React from 'react'

function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ')
}

interface SidebarContextValue {
  isMobile: boolean
  openMobile: boolean
  setOpenMobile: React.Dispatch<React.SetStateAction<boolean>>
  toggleSidebar(): void
}

const SidebarContext = React.createContext<SidebarContextValue | null>(null)

function useIsMobile(breakpoint = 1024) {
  const [isMobile, setIsMobile] = React.useState(false)

  React.useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return
    }

    const mediaQuery = window.matchMedia(`(max-width: ${breakpoint - 1}px)`)
    const handleChange = (event: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile(event.matches)
    }

    handleChange(mediaQuery)
    mediaQuery.addEventListener('change', handleChange)

    return () => {
      mediaQuery.removeEventListener('change', handleChange)
    }
  }, [breakpoint])

  return isMobile
}

export function useSidebar() {
  const context = React.useContext(SidebarContext)

  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider.')
  }

  return context
}

type SidebarProviderProps = React.HTMLAttributes<HTMLDivElement>

export function SidebarProvider({ children, className, ...props }: SidebarProviderProps) {
  const isMobile = useIsMobile()
  const [openMobile, setOpenMobile] = React.useState(false)

  React.useEffect(() => {
    if (!isMobile) {
      setOpenMobile(false)
    }
  }, [isMobile])

  const value = React.useMemo(
    () => ({
      isMobile,
      openMobile,
      setOpenMobile,
      toggleSidebar() {
        setOpenMobile((current) => !current)
      },
    }),
    [isMobile, openMobile],
  )

  return (
    <SidebarContext.Provider value={value}>
      <div
        data-slot="sidebar-wrapper"
        className={cn('min-h-screen', className)}
        style={
          {
            '--sidebar-width': '24rem',
            '--sidebar-width-mobile': '24rem',
          } as React.CSSProperties
        }
        {...props}
      >
        {children}
      </div>
    </SidebarContext.Provider>
  )
}

type SidebarProps = React.HTMLAttributes<HTMLElement>

export function Sidebar({ children, className, ...props }: SidebarProps) {
  const { isMobile, openMobile, setOpenMobile } = useSidebar()
  const panel = (
    <div className="flex h-full flex-col overflow-hidden rounded-[1.5rem] border border-outline bg-panel p-4 shadow-soft">
      {children}
    </div>
  )

  if (isMobile) {
    return (
      <>
        <aside
          data-slot="sidebar"
          className={cn(
            'fixed inset-y-4 left-4 z-50 w-[min(var(--sidebar-width-mobile),calc(100vw-2rem))] transition-transform duration-200 lg:hidden',
            openMobile ? 'translate-x-0' : '-translate-x-[calc(100%+2rem)]',
            className,
          )}
          {...props}
        >
          {panel}
        </aside>
        {openMobile ? (
          <button
            aria-label="Close chapters"
            className="fixed inset-0 z-40 border-0 bg-overlay lg:hidden"
            type="button"
            onClick={() => setOpenMobile(false)}
          />
        ) : null}
      </>
    )
  }

  return (
    <aside
      data-slot="sidebar"
      className={cn(
        'fixed inset-y-4 left-4 z-20 hidden w-[var(--sidebar-width)] lg:block',
        className,
      )}
      {...props}
    >
      {panel}
    </aside>
  )
}

type SidebarInsetProps = React.HTMLAttributes<HTMLDivElement>

export function SidebarInset({ children, className, ...props }: SidebarInsetProps) {
  return (
    <div
      data-slot="sidebar-inset"
      className={cn(
        'grid min-w-0 gap-5 lg:pl-[calc(var(--sidebar-width)+1rem)]',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

type SidebarTriggerProps = React.ButtonHTMLAttributes<HTMLButtonElement>

export function SidebarTrigger({ children, className, onClick, ...props }: SidebarTriggerProps) {
  const { openMobile, toggleSidebar } = useSidebar()

  return (
    <button
      data-slot="sidebar-trigger"
      aria-controls="chapter-sidebar"
      aria-expanded={openMobile}
      className={className}
      type="button"
      onClick={(event) => {
        onClick?.(event)

        if (!event.defaultPrevented) {
          toggleSidebar()
        }
      }}
      {...props}
    >
      {children}
    </button>
  )
}

type SidebarSectionProps = React.HTMLAttributes<HTMLDivElement>

export function SidebarHeader({ className, ...props }: SidebarSectionProps) {
  return <div data-slot="sidebar-header" className={className} {...props} />
}

export function SidebarContent({ className, ...props }: SidebarSectionProps) {
  return (
    <div
      data-slot="sidebar-content"
      className={cn('flex min-h-0 flex-1 flex-col', className)}
      {...props}
    />
  )
}

export function SidebarGroup({ className, ...props }: SidebarSectionProps) {
  return <div data-slot="sidebar-group" className={className} {...props} />
}

export function SidebarGroupContent({ className, ...props }: SidebarSectionProps) {
  return <div data-slot="sidebar-group-content" className={className} {...props} />
}

type SidebarListProps = React.HTMLAttributes<HTMLUListElement>

export function SidebarMenu({ className, ...props }: SidebarListProps) {
  return <ul data-slot="sidebar-menu" className={cn('m-0 list-none p-0', className)} {...props} />
}

type SidebarListItemProps = React.HTMLAttributes<HTMLLIElement>

export function SidebarMenuItem({ className, ...props }: SidebarListItemProps) {
  return <li data-slot="sidebar-menu-item" className={className} {...props} />
}

interface SidebarMenuButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isActive?: boolean
}

export function SidebarMenuButton({
  children,
  className,
  isActive = false,
  ...props
}: SidebarMenuButtonProps) {
  return (
    <button
      data-slot="sidebar-menu-button"
      className={cn(
        'flex w-full items-center justify-between gap-3 rounded-[1.1rem] border border-outline bg-surface px-4 py-4 text-left text-heading transition-[transform,background,color,border-color] duration-200 hover:-translate-y-px hover:bg-surface-strong disabled:cursor-not-allowed disabled:opacity-45 disabled:transform-none',
        isActive && 'border-accent/45 bg-accent/10',
        className,
      )}
      type="button"
      {...props}
    >
      {children}
    </button>
  )
}

type SidebarRailProps = React.HTMLAttributes<HTMLDivElement>

export function SidebarRail({ className, ...props }: SidebarRailProps) {
  return (
    <div
      aria-hidden="true"
      data-slot="sidebar-rail"
      className={cn(
        'pointer-events-none fixed top-4 bottom-4 left-[calc(var(--sidebar-width)+1.5rem)] hidden w-px bg-outline lg:block',
        className,
      )}
      {...props}
    />
  )
}
