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
ticket-confirmation-card.tsx\
import * as React from "react";\
import \{ cn \} from "@/lib/utils";\
\
// --- SVG Icons ---\
\
const CheckCircleIcon = (props: React.SVGProps<SVGSVGElement>) => (\
  <svg\
    \{...props\}\
    xmlns="http://www.w3.org/2000/svg"\
    width="24"\
    height="24"\
    viewBox="0 0 24 24"\
    fill="none"\
    stroke="currentColor"\
    strokeWidth="2"\
    strokeLinecap="round"\
    strokeLinejoin="round"\
  >\
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />\
    <polyline points="22 4 12 14.01 9 11.01" />\
  </svg>\
);\
\
const MastercardIcon = (props: React.SVGProps<SVGSVGElement>) => (\
    <svg\
        \{...props\}\
        xmlns="http://www.w3.org/2000/svg"\
        viewBox="0 0 24 24"\
        width="36"\
        height="24"\
    >\
        <circle cx="8" cy="12" r="7" fill="#EA001B"></circle>\
        <circle cx="16" cy="12" r="7" fill="#F79E1B" fillOpacity="0.8"></circle>\
    </svg>\
);\
\
\
// --- Helper Components ---\
\
const DashedLine = () => (\
  <div\
    className="w-full border-t-2 border-dashed border-border"\
    aria-hidden="true"\
  />\
);\
\
const Barcode = (\{ value \}: \{ value: string \}) => \{\
    const hashCode = (s: string) => s.split('').reduce((a, b) => \{ a = ((a << 5) - a) + b.charCodeAt(0); return a & a \}, 0);\
    const seed = hashCode(value);\
    const random = (s: number) => \{\
        const x = Math.sin(s) * 10000;\
        return x - Math.floor(x);\
    \};\
\
    const bars = Array.from(\{ length: 60 \}).map((_, index) => \{\
        const rand = random(seed + index);\
        const width = rand > 0.7 ? 2.5 : 1.5;\
        return \{ width \};\
    \});\
\
    const spacing = 1.5;\
    const totalWidth = bars.reduce((acc, bar) => acc + bar.width + spacing, 0) - spacing;\
    const svgWidth = 250;\
    const svgHeight = 70;\
    let currentX = (svgWidth - totalWidth) / 2;\
\
    return (\
        <div className="flex flex-col items-center py-2">\
             <svg\
                xmlns="http://www.w3.org/2000/svg"\
                width=\{svgWidth\}\
                height=\{svgHeight\}\
                viewBox=\{`0 0 $\{svgWidth\} $\{svgHeight\}`\}\
                aria-label=\{`Barcode for value $\{value\}`\}\
                className="fill-current text-foreground"\
            >\
                \{bars.map((bar, index) => \{\
                    const x = currentX;\
                    currentX += bar.width + spacing;\
                    return (\
                        <rect\
                            key=\{index\}\
                            x=\{x\}\
                            y="10"\
                            width=\{bar.width\}\
                            height="50"\
                        />\
                    );\
                \})\}\
            </svg>\
            <p className="text-sm text-muted-foreground tracking-[0.3em] mt-2">\{value\}</p>\
        </div>\
    );\
\};\
\
const ConfettiExplosion = () => \{\
  const confettiCount = 100;\
  const colors = ["#ef4444", "#3b82f6", "#22c55e", "#eab308", "#8b5cf6", "#f97316"];\
\
  return (\
    <>\
      <style>\
        \{`\
          @keyframes fall \{\
            0% \{\
                transform: translateY(-10vh) rotate(0deg);\
                opacity: 1;\
            \}\
            100% \{\
              transform: translateY(110vh) rotate(720deg);\
              opacity: 0;\
            \}\
          \}\
        `\}\
      </style>\
      <div className="fixed inset-0 z-0 pointer-events-none" aria-hidden="true">\
        \{Array.from(\{ length: confettiCount \}).map((_, i) => (\
          <div\
            key=\{i\}\
            className="absolute w-2 h-4"\
            style=\{\{\
              left: `$\{Math.random() * 100\}%`,\
              top: `$\{-20 + Math.random() * 10\}%`,\
              backgroundColor: colors[i % colors.length],\
              transform: `rotate($\{Math.random() * 360\}deg)`,\
              animation: `fall $\{2.5 + Math.random() * 2.5\}s $\{Math.random() * 2\}s linear forwards`,\
            \}\}\
          />\
        ))\}\
      </div>\
    </>\
  );\
\};\
\
\
// --- Main Ticket Component ---\
\
export interface TicketProps extends React.HTMLAttributes<HTMLDivElement> \{\
  ticketId: string;\
  amount: number;\
  date: Date;\
  cardHolder: string;\
  last4Digits: string;\
  barcodeValue: string;\
  icon?: React.ReactNode;\
\}\
\
const AnimatedTicket = React.forwardRef<HTMLDivElement, TicketProps>(\
  (\
    \{\
      className,\
      ticketId,\
      amount,\
      date,\
      cardHolder,\
      last4Digits,\
      barcodeValue,\
      ...props\
    \},\
    ref\
  ) => \{\
    const [showConfetti, setShowConfetti] = React.useState(false);\
\
    React.useEffect(() => \{\
      const mountTimer = setTimeout(() => setShowConfetti(true), 100);\
      const unmountTimer = setTimeout(() => setShowConfetti(false), 6000);\
      return () => \{\
        clearTimeout(mountTimer);\
        clearTimeout(unmountTimer);\
      \};\
    \}, []);\
\
    const formattedAmount = new Intl.NumberFormat("en-US", \{\
      style: "currency",\
      currency: "USD",\
    \}).format(amount);\
\
    const formattedDate = new Intl.DateTimeFormat("en-GB", \{\
      day: 'numeric',\
      month: 'short',\
      year: 'numeric',\
      hour: '2-digit',\
      minute: '2-digit',\
      hour12: false\
    \}).format(date).replace(',', ' \'95');\
\
    return (\
      <>\
        \{showConfetti && <ConfettiExplosion />\}\
        <div\
          ref=\{ref\}\
          className=\{cn(\
            "relative w-full max-w-sm bg-card text-card-foreground rounded-2xl shadow-lg font-sans z-10",\
            "animate-in fade-in-0 zoom-in-95 duration-500",\
            className\
          )\}\
          \{...props\}\
        >\
          \{/* Ticket cut-out effect */\}\
          <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background" />\
          <div className="absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background" />\
\
          <div className="p-8 flex flex-col items-center text-center">\
              <div className="p-3 bg-primary/10 rounded-full animate-in zoom-in-50 delay-300 duration-500">\
                  <CheckCircleIcon className="w-10 h-10 text-primary animate-in zoom-in-75 delay-500 duration-500" />\
              </div>\
              <h1 className="text-2xl font-semibold mt-4">Thank you!</h1>\
              <p className="text-muted-foreground mt-1">\
                Your ticket has been issued successfully\
              </p>\
          </div>\
\
          <div className="px-8 pb-8 space-y-6">\
              <DashedLine />\
\
              <div className="grid grid-cols-2 gap-4 text-left">\
                  <div>\
                      <p className="text-xs text-muted-foreground uppercase">Ticket ID</p>\
                      <p className="font-mono font-medium">\{ticketId\}</p>\
                  </div>\
                  <div className="text-right">\
                      <p className="text-xs text-muted-foreground uppercase">Amount</p>\
                      <p className="font-semibold text-lg">\{formattedAmount\}</p>\
                  </div>\
              </div>\
\
              <div>\
                  <p className="text-xs text-muted-foreground uppercase">Date & Time</p>\
                  <p className="font-medium">\{formattedDate\}</p>\
              </div>\
\
              <div className="bg-muted/50 p-4 rounded-lg flex items-center space-x-4">\
                  <MastercardIcon />\
                  <div>\
                      <p className="font-semibold">\{cardHolder\}</p>\
                      <p className="text-muted-foreground font-mono text-sm tracking-wider">\'95\'95\'95\'95 \{last4Digits\}</p>\
                  </div>\
              </div>\
\
              <DashedLine />\
\
              <Barcode value=\{barcodeValue\} />\
          </div>\
        </div>\
      </>\
    );\
  \}\
);\
\
AnimatedTicket.displayName = "AnimatedTicket";\
\
export \{ AnimatedTicket \};\
\
\
demo.tsx\
import \{ AnimatedTicket \} from "@/components/ui/ticket-confirmation-card";\
\
export default function AnimatedTicketDemo() \{\
  return (\
    <div className="flex h-full w-full items-center justify-center bg-background p-4">\
      <AnimatedTicket\
        ticketId="0120034399434"\
        amount=\{305.50\}\
        date=\{new Date("2025-06-19T10:15:00")\}\
        cardHolder="Liana80 Tudakova"\
        last4Digits="8237"\
        barcodeValue="28937261273650"\
      />\
    </div>\
  );\
\}\
\
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