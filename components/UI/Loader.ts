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
loader-2.tsx\
import \{ cn \} from "@/lib/utils";\
import \{ useState \} from "react";\
\
export const Component = () => \{\
  const [count, setCount] = useState(0);\
\
  return (\
  <>\
    <div className="loader">\
      <svg viewBox="0 0 80 80">\
        <circle r="32" cy="40" cx="40" id="test"></circle>\
      </svg>\
    </div>\
\
    <div className="loader triangle">\
      <svg viewBox="0 0 86 80">\
        <polygon points="43 8 79 72 7 72"></polygon>\
      </svg>\
    </div>\
\
    <div className="loader">\
      <svg viewBox="0 0 80 80">\
        <rect height="64" width="64" y="8" x="8"></rect>\
      </svg>\
    </div>\
  </>\
);\
\};\
\
\
demo.tsx\
import \{ Component \} from "@/components/ui/loader-2";\
\
export default function DemoOne() \{\
  return <Component />;\
\}\
\
```\
\
Extend existing Tailwind 4 index.css with this code (or if project uses Tailwind 3, extend tailwind.config.js or globals.css):\
```css\
@import "tailwindcss";\
@import "tw-animate-css";\
\
:root \{\
  --clr: #000;\
  --bkg: #fff;\
\}\
\
.dark \{\
  --bkg: #000;\
  --clr: #fff;\
\}\
\
\
@keyframes pathTriangle \{\
  33% \{\
    stroke-dashoffset: 74;\
  \}\
  66% \{\
    stroke-dashoffset: 147;\
  \}\
  100% \{\
    stroke-dashoffset: 221;\
  \}\
\}\
\
@keyframes dotTriangle \{\
  33% \{\
    transform: translate(0, 0);\
  \}\
  66% \{\
    transform: translate(10px, -18px);\
  \}\
  100% \{\
    transform: translate(-10px, -18px);\
  \}\
\}\
\
@keyframes pathRect \{\
  25% \{\
    stroke-dashoffset: 64;\
  \}\
  50% \{\
    stroke-dashoffset: 128;\
  \}\
  75% \{\
    stroke-dashoffset: 192;\
  \}\
  100% \{\
    stroke-dashoffset: 256;\
  \}\
\}\
\
@keyframes dotRect \{\
  25% \{\
    transform: translate(0, 0);\
  \}\
  50% \{\
    transform: translate(18px, -18px);\
  \}\
  75% \{\
    transform: translate(0, -36px);\
  \}\
  100% \{\
    transform: translate(-18px, -18px);\
  \}\
\}\
\
@keyframes pathCircle \{\
  25% \{\
    stroke-dashoffset: 125;\
  \}\
  50% \{\
    stroke-dashoffset: 175;\
  \}\
  75% \{\
    stroke-dashoffset: 225;\
  \}\
  100% \{\
    stroke-dashoffset: 275;\
  \}\
\}\
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