import { useRef, useEffect, useState } from "react"
import { motion } from "framer-motion"
import { ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import type { LucideIcon } from "lucide-react"

export interface DocMenuItem {
    id: string
    text?: string
    icon?: LucideIcon
}

interface DocProps {
    menus: DocMenuItem[]
    selectedId: string
    onSelect: (id: string) => void
    showGoBack?: boolean
    onGoBack?: () => void
    className?: string
    containerRef?: React.RefObject<HTMLElement | null>
    centerAlwaysThreshold?: number
    showOnlyIconsThreshold?: number
}

export function Doc({menus, selectedId, onSelect, showGoBack = false, onGoBack, className, containerRef, centerAlwaysThreshold, showOnlyIconsThreshold}: DocProps) {
    const refs = useRef<Array<HTMLButtonElement | null>>([])
    const dockRef = useRef<HTMLDivElement | null>(null)

    const [sliderStyle, setSliderStyle] = useState({ width: 0, x: 0 })
    const [left, setLeft] = useState<number | null>(null)

    const [iconsOnly, setIconsOnly] = useState(false);

    const activeIndex = menus.findIndex((m) => m.id === selectedId)

    const updateSlider = () => {
        const el = refs.current[activeIndex]
        if(el) {
            setSliderStyle({ width: el.offsetWidth, x: el.offsetLeft })
        }
    }

    useEffect(() => {
        updateSlider()
        const raf = requestAnimationFrame(updateSlider)
        return() => cancelAnimationFrame(raf)
    }, [activeIndex, menus, iconsOnly])

    useEffect(() => {
        const dockEl = dockRef.current
        if(!dockEl) return

        const update = () => {
            const dockWidth = dockEl.offsetWidth
            const viewportWidth = window.innerWidth

            const parentWidth = containerRef?.current?.getBoundingClientRect().width ?? viewportWidth

            if(typeof showOnlyIconsThreshold === "number") {
                setIconsOnly(parentWidth < showOnlyIconsThreshold)
            }
            else {
                setIconsOnly(false)
            }

            if(containerRef?.current) {
                const rect = containerRef.current.getBoundingClientRect()

                if(typeof centerAlwaysThreshold === "number" && viewportWidth >= centerAlwaysThreshold) {
                    setLeft((viewportWidth - dockWidth) / 2 + (showGoBack ? 30 : 0))
                }
                else {
                    setLeft(rect.left + (rect.width - dockWidth) / 2)
                }
                return
            }

            setLeft((viewportWidth - dockWidth) / 2)
        }

        update()

        const ro = new ResizeObserver(() => {
            update()
            requestAnimationFrame(updateSlider)
        })

        ro.observe(dockEl)

        if(containerRef?.current) {
            ro.observe(containerRef.current)
        }

        window.addEventListener("resize", update)

        return () => {
            ro.disconnect()
            window.removeEventListener("resize", update)
        }
    }, [containerRef, centerAlwaysThreshold, showOnlyIconsThreshold, showGoBack])

    return (
        <div
            ref={dockRef}
            style={left !== null ? { left } : undefined}
            className={cn("fixed bottom-8 z-50 flex items-center gap-x-4", className)}
        >
        {showGoBack && onGoBack && (
            <Button
                size="icon"
                onClick={onGoBack}
                className="px-7 py-5.5 rounded-xl bg-blue-200/10 hover:bg-blue-200/20 backdrop-blur-xs border border-blue-300/20 shadow-sm "
            >
                <span>
                    <ArrowLeft fontSize={20} />
                </span>
            </Button>
        )}

        <div className="relative flex rounded-xl bg-blue-200/10 backdrop-blur-xs border border-blue-300/20 shadow-sm overflow-hidden">
            {menus.map((menu, index) => {
            const Icon = menu.icon
            const isActive = menu.id === selectedId

            return (
                <button
                    key={menu.id}
                    ref={(el) => {
                        refs.current[index] = el
                    }}
                    onClick={() => onSelect(menu.id)}
                    className={cn(
                        "relative z-10 flex items-center gap-2 px-4 py-2.5 text-md font-medium transition-colors",
                        isActive
                        ? "text-accent-foreground"
                        : ""
                    )}
                    aria-label={iconsOnly ? menu.text ?? menu.id : undefined}
                    title={iconsOnly ? menu.text ?? menu.id : undefined}
                >
                    {Icon && <Icon className={`${iconsOnly ? "h-6 w-6" : "h-4 w-4"}`} />}
                    {!iconsOnly && menu.text && (
                        <span className="whitespace-nowrap">{menu.text}</span>
                    )}
                </button>
            )})}

            <motion.div
                className="absolute top-0 bottom-0 rounded-md bg-accent/80 z-0"
                animate={sliderStyle}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
            />
        </div>
        </div>
    )
}