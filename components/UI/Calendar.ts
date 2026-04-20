{\rtf1\ansi\ansicpg1252\cocoartf2818
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\paperw11900\paperh16840\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\pard\tx720\tx1440\tx2160\tx2880\tx3600\tx4320\tx5040\tx5760\tx6480\tx7200\tx7920\tx8640\pardirnatural\partightenfactor0

\f0\fs24 \cf0 You are given a task to integrate an existing React component in the codebase\
\
The codebase should support:\
- shadcn project structure  \
- Tailwind CSS\
- Typescript\
\
If it doesn't, provide instructions on how to setup project via shadcn CLI, install Tailwind or Typescript.\
\
Determine the default path for components and styles. \
If default path for components is not /components/ui, provide instructions on why it's important to create this folder\
Copy-paste this component to /components/ui folder:\
```tsx\
calendar.tsx\
"use client";\
\
import React from "react";\
import Link from "next/link";\
import \{ Button \} from "@/components/ui/button";\
\
const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];\
\
const CalendarDay: React.FC<\{ day: number | string; isHeader?: boolean \}> = (\{\
  day,\
  isHeader,\
\}) => \{\
  const randomBgWhite =\
    !isHeader && Math.random() < 0.3\
      ? "bg-indigo-500 text-white "\
      : "text-text-tertiary";\
\
  return (\
    <div\
      className=\{`col-span-1 row-span-1 flex h-8 w-8 items-center justify-center $\{\
        isHeader ? "" : "rounded-xl"\
      \} $\{randomBgWhite\}`\}\
    >\
      <span className=\{`font-medium $\{isHeader ? "text-xs" : "text-sm"\}`\}>\
        \{day\}\
      </span>\
    </div>\
  );\
\};\
\
export function Calendar() \{\
  const currentDate = new Date();\
  const currentMonth = currentDate.toLocaleString("default", \{ month: "long" \});\
  const currentYear = currentDate.getFullYear();\
  const firstDayOfMonth = new Date(currentYear, currentDate.getMonth(), 1);\
  const firstDayOfWeek = firstDayOfMonth.getDay();\
  const daysInMonth = new Date(\
    currentYear,\
    currentDate.getMonth() + 1,\
    0\
  ).getDate();\
\
  const bookingLink = `https://cal.com/aliimam/designali`;\
\
  const renderCalendarDays = () => \{\
    let days: React.ReactNode[] = [\
      ...dayNames.map((day, i) => (\
        <CalendarDay key=\{`header-$\{day\}`\} day=\{day\} isHeader />\
      )),\
      ...Array(firstDayOfWeek).map((_, i) => (\
        <div\
          key=\{`empty-start-$\{i\}`\}\
          className="col-span-1 row-span-1 h-8 w-8"\
        />\
      )),\
      ...Array(daysInMonth)\
        .fill(null)\
        .map((_, i) => <CalendarDay key=\{`date-$\{i + 1\}`\} day=\{i + 1\} />),\
    ];\
\
    return days;\
  \};\
\
  return (\
    <BentoCard height="h-auto" linkTo=\{bookingLink\}>\
      <div className=" grid h-full  gap-5">\
        <div className="">\
          <h2 className="mb-4 text-lg md:text-3xl font-semibold">\
            Any questions about Design?\
          </h2>\
          <p className="mb-2 text-xs md:text-md text-text-secondary">\
            Feel free to reach out to me!\
          </p>\
          <Button className="mt-3 rounded-2xl">Book Now</Button>\
        </div>\
        <div className=" transition-all duration-500 ease-out md:group-hover:-right-12 md:group-hover:top-5">\
          <div>\
            <div className="h-full w-[550px] rounded-[24px] border border-border-primary p-2 transition-colors duration-100 group-hover:border-indigo-400">\
              <div\
                className="h-full rounded-2xl border-2 border-[#A5AEB81F]/10  p-3"\
                style=\{\{ boxShadow: "0px 2px 1.5px 0px #A5AEB852 inset" \}\}\
              >\
                <div className="flex items-center space-x-2">\
                  <p className="text-sm ">\
                    <span className="font-medium">\
                      \{currentMonth\}, \{currentYear\}\
                    </span>\
                  </p>\
                  <span className="h-1 w-1 rounded-full ">&nbsp;</span>\
                  <p className="text-xs text-text-tertiary">30 min call</p>\
                </div>\
                <div className="mt-4 grid grid-cols-7 grid-rows-5 gap-2 px-4">\
                  \{renderCalendarDays()\}\
                </div>\
              </div>\
            </div>\
          </div>\
        </div>\
      </div>\
    </BentoCard>\
  );\
\}\
\
interface BentoCardProps \{\
  children: React.ReactNode;\
  height?: string;\
  rowSpan?: number;\
  colSpan?: number;\
  className?: string;\
  showHoverGradient?: boolean;\
  hideOverflow?: boolean;\
  linkTo?: string;\
\}\
\
export function BentoCard(\{\
  children,\
  height = "h-auto",\
  rowSpan = 8,\
  colSpan = 7,\
  className = "",\
  showHoverGradient = true,\
  hideOverflow = true,\
  linkTo,\
\}: BentoCardProps) \{\
  const cardContent = (\
    <div\
      className=\{`group relative flex flex-col rounded-2xl border border-border-primary bg-bg-primary p-6 hover:bg-indigo-100/10 dark:hover:bg-indigo-900/10 $\{\
        hideOverflow && "overflow-hidden"\
      \} $\{height\} row-span-$\{rowSpan\} col-span-$\{colSpan\} $\{className\}`\}\
    >\
      \{linkTo && (\
        <div className="absolute bottom-4 right-6 z-[999] flex h-12 w-12 rotate-6 items-center justify-center rounded-full bg-white opacity-0 transition-all duration-300 ease-in-out group-hover:translate-y-[-8px] group-hover:rotate-0 group-hover:opacity-100">\
          <svg\
            className="h-6 w-6 text-indigo-600"\
            width="24"\
            height="24"\
            fill="none"\
            viewBox="0 0 24 24"\
          >\
            <path\
              stroke="currentColor"\
              strokeLinecap="round"\
              strokeLinejoin="round"\
              strokeWidth="2"\
              d="M17.25 15.25V6.75H8.75"\
            ></path>\
            <path\
              stroke="currentColor"\
              strokeLinecap="round"\
              strokeLinejoin="round"\
              strokeWidth="2"\
              d="M17 7L6.75 17.25"\
            ></path>\
          </svg>\
        </div>\
      )\}\
      \{showHoverGradient && (\
        <div className="user-select-none pointer-events-none absolute inset-0 z-30 bg-gradient-to-tl from-indigo-400/20 via-transparent to-transparent opacity-0 transition-opacity duration-300 ease-in-out group-hover:opacity-100"></div>\
      )\}\
      \{children\}\
    </div>\
  );\
\
  if (linkTo) \{\
    return linkTo.startsWith("/") ? (\
      <Link href=\{linkTo\} className="block">\
        \{cardContent\}\
      </Link>\
    ) : (\
      <a\
        href=\{linkTo\}\
        target="_blank"\
        rel="noopener noreferrer"\
        className="block"\
      >\
        \{cardContent\}\
      </a>\
    );\
  \}\
\
  return cardContent;\
\}\
\
\
demo.tsx\
import \{ Calendar \} from "@/components/ui/calendar"\
\
export function HomePage() \{\
  return (\
    <main className="overflow-hidden">\
      <Calendar />\
    </main>\
  );\
\}\
\
```\
\
Copy-paste these files for dependencies:\
```tsx\
shadcn/button\
import * as React from "react"\
import \{ Slot \} from "@radix-ui/react-slot"\
import \{ cva, type VariantProps \} from "class-variance-authority"\
\
import \{ cn \} from "@/lib/utils"\
\
const buttonVariants = cva(\
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",\
  \{\
    variants: \{\
      variant: \{\
        default: "bg-primary text-primary-foreground hover:bg-primary/90",\
        destructive:\
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",\
        outline:\
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",\
        secondary:\
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",\
        ghost: "hover:bg-accent hover:text-accent-foreground",\
        link: "text-primary underline-offset-4 hover:underline",\
      \},\
      size: \{\
        default: "h-10 px-4 py-2",\
        sm: "h-9 rounded-md px-3",\
        lg: "h-11 rounded-md px-8",\
        icon: "h-10 w-10",\
      \},\
    \},\
    defaultVariants: \{\
      variant: "default",\
      size: "default",\
    \},\
  \},\
)\
\
export interface ButtonProps\
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,\
    VariantProps<typeof buttonVariants> \{\
  asChild?: boolean\
\}\
\
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(\
  (\{ className, variant, size, asChild = false, ...props \}, ref) => \{\
    const Comp = asChild ? Slot : "button"\
    return (\
      <Comp\
        className=\{cn(buttonVariants(\{ variant, size, className \}))\}\
        ref=\{ref\}\
        \{...props\}\
      />\
    )\
  \},\
)\
Button.displayName = "Button"\
\
export \{ Button, buttonVariants \}\
\
```\
\
Install NPM dependencies:\
```bash\
@radix-ui/react-slot, class-variance-authority\
```\
\
Implementation Guidelines\
 1. Analyze the component structure and identify all required dependencies\
 2. Review the component's argumens and state\
 3. Identify any required context providers or hooks and install them\
 4. Questions to Ask\
 - What data/props will be passed to this component?\
 - Are there any specific state management requirements?\
 - Are there any required assets (images, icons, etc.)?\
 - What is the expected responsive behavior?\
 - What is the best place to use this component in the app?\
\
Steps to integrate\
 0. Copy paste all the code above in the correct directories\
 1. Install external dependencies\
 2. Fill image assets with Unsplash stock images you know exist\
 3. Use lucide-react icons for svgs or logos if component requires them\
}