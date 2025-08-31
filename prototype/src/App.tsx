// App.tsx
import { Canvas, useThree } from '@react-three/fiber'
import { Environment, Loader, OrbitControls, useProgress } from '@react-three/drei'
import Lamborghini from './components/Models/ARCHON'
import { Leva, levaStore, useControls, button } from 'leva'
import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Model, ModelProps, models } from './components/Models/model'

// Back URL (from request)
const BACK_URL = 'https://archon-roadstar-creation.vercel.app/'

// Return type ko explicitly React.JSX.Element dene se JSX types clean resolve hote hain. [1][2]
const GlobalStyles = (): React.JSX.Element => (
  <style>{`
    .leva__search { display: none !important; }

    /* Top-left button row */
    .btn-row {
      position: absolute;
      left: 12px;
      top: 12px;
      z-index: 50;
      display: flex;
      gap: 10px;
    }

    /* Base button */
    .btn {
      position: relative;
      padding: 8px 12px;
      border-radius: 10px;
      border: 1px solid rgba(255,255,255,0.25);
      background: linear-gradient(180deg, rgba(20,20,20,0.85), rgba(10,10,10,0.85));
      color: #fff;
      font-weight: 600;
      cursor: pointer;
      transition: transform .2s ease, box-shadow .2s ease, background .2s ease, border-color .2s ease;
      box-shadow: 0 6px 18px rgba(0,0,0,0.25);
      backdrop-filter: blur(6px);
      -webkit-backdrop-filter: blur(6px);
      overflow: hidden;
      text-decoration: none; /* for <a> */
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .btn:hover { transform: translateY(-1px) scale(1.02); box-shadow: 0 10px 24px rgba(0,0,0,0.35); }
    .btn:active { transform: translateY(0); box-shadow: 0 4px 12px rgba(0,0,0,0.25); }
    .btn:focus-visible { outline: 0; box-shadow: 0 0 0 3px rgba(255,255,255,0.25), 0 6px 18px rgba(0,0,0,0.25); }

    /* Aesthetic micro static/noise + soft rotating shine */
    .btn.btn--static::before {
      content: "";
      position: absolute;
      inset: 0;
      opacity: .15;
      pointer-events: none;
      background:
        repeating-linear-gradient(0deg, rgba(255,255,255,.06) 0 1px, transparent 1px 2px),
        repeating-linear-gradient(90deg, rgba(255,255,255,.04) 0 1px, transparent 1px 2px);
      mix-blend-mode: overlay;
      animation: noise-flicker .9s steps(2) infinite;
    }
    .btn.btn--static::after {
      content: "";
      position: absolute;
      inset: -40%;
      background: conic-gradient(from 0deg at 50% 50%, rgba(255,255,255,0), rgba(255,255,255,.15), rgba(255,255,255,0) 60%);
      transform: rotate(0deg);
      opacity: .25;
      filter: blur(12px);
      animation: shine 3.2s linear infinite;
      pointer-events: none;
    }
    @keyframes noise-flicker {
      0%, 100% { opacity: .12; transform: translateY(0); }
      50% { opacity: .22; transform: translateY(-1px); }
    }
    @keyframes shine {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    /* Optional hooks */
    .save-btn {}
    .back-btn {}

    /* Minimal caret icon for Back */
    .back-icon {
      width: 10px; height: 10px;
      border-left: 2px solid currentColor;
      border-bottom: 2px solid currentColor;
      transform: rotate(45deg);
      margin-right: 2px;
    }
  `}</style>
)

// JSX.Element → React.JSX.Element; ModelProps same rehta hai. [1][2]
interface Cars {
  readonly Model: (props: ModelProps) => React.JSX.Element
  readonly interior: string
  readonly exterior: string
}

// Expose renderer + invalidate for demand render and capture
// Return type explicit: React.JSX.Element. [1][2]
function CaptureBridge({
  onReady,
}: {
  onReady: (api: {
    gl: any
    scene: any
    camera: any
    invalidate: () => void
  }) => void
}): React.JSX.Element {
  const { gl, scene, camera, invalidate } = useThree()
  useEffect(() => {
    onReady({ gl, scene, camera, invalidate })
  }, [gl, scene, camera, invalidate, onReady])
  return <></>
}

// Component return type bhi React.JSX.Element. [1][2]
export default function App(): React.JSX.Element {
  const cars: Record<Model, Cars> = useMemo(
    () => ({
      "": {
        Model: Lamborghini,
        interior: '#000000',
        exterior: '#9a9898',
      },
      ARCHON: {
        Model: Lamborghini,
        interior: '#000000',
        exterior: '#9a9898',
      },
    }),
    []
  )

  const canvasWrapperRef = useRef<HTMLDivElement | null>(null)
  const controlsRef = useRef<any>(null)

  const [carsState, setCarsState] = useState(() => cars)
  const carsStateRef = useRef(carsState)
  useEffect(() => {
    carsStateRef.current = carsState
  }, [carsState])

  const [{ Rotation }, setLeva] = useControls(() => ({
    Select: {
      options: models,
      onChange: (value: Model) => {
        setLeva({
          Exterior: carsStateRef.current[value].exterior,
          Interior: carsStateRef.current[value].interior,
        })
      },
    },
    Interior: {
      value: '#000000',
      onChange: (interior: string) => {
        const model = levaStore.get('Select') as Model
        setCarsState({
          ...carsStateRef.current,
          [model]: { ...carsStateRef.current[model], interior },
        })
      },
    },
    Exterior: {
      value: '#9a9898',
      onChange: (exterior: string) => {
        const model = levaStore.get('Select') as Model
        setCarsState({
          ...carsStateRef.current,
          [model]: { ...carsStateRef.current[model], exterior },
        })
      },
    },
    Rotation: false,
    'Reset color': button(() => {
      const model = levaStore.get('Select') as Model
      setLeva({
        Exterior: cars[model].exterior,
        Interior: cars[model].interior,
      })
    }),
  }))

  const { progress } = useProgress()

  const captureRef = useRef<{ gl?: any; scene?: any; camera?: any; invalidate?: () => void }>({})
  const waitFrames = (n = 2) =>
    new Promise<void>((resolve) => {
      const step = (k: number) => {
        k <= 0 ? resolve() : requestAnimationFrame(() => step(k - 1))
      }
      step(n)
    })

  // Draw rounded rectangle helper
  const roundRect = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ) => {
    const rr = Math.min(r, w / 2, h / 2)
    ctx.beginPath()
    ctx.moveTo(x + rr, y)
    ctx.arcTo(x + w, y, x + w, y + h, rr)
    ctx.arcTo(x + w, y + h, x, y + h, rr)
    ctx.arcTo(x, y + h, x, y, rr)
    ctx.arcTo(x, y, x + w, y, rr)
    ctx.closePath()
  }

  const handleSave = async () => {
    const gl = captureRef.current.gl
    const invalidate = captureRef.current.invalidate
    // For frameloop="demand", request a render, then wait a couple frames
    if (invalidate) invalidate()
    await waitFrames(2)

    const srcCanvas =
      gl?.domElement ??
      (canvasWrapperRef.current?.querySelector('canvas') as HTMLCanvasElement | null)

    if (!srcCanvas) {
      alert('Canvas not found — make sure the 3D canvas is rendered')
      return
    }

    const width = srcCanvas.width
    const height = srcCanvas.height

    // Compose onto an offscreen 2D canvas
    const out = document.createElement('canvas')
    out.width = width
    out.height = height
    const ctx = out.getContext('2d', { willReadFrequently: false })
    if (!ctx) {
      alert('2D context not available')
      return
    }

    // 1) Draw the WebGL canvas
    ctx.drawImage(srcCanvas, 0, 0, width, height)

    // Collect details
    // Yahan pehle models ko Model type me fallback diya gaya tha; safer: agar levaStore empty ho to default pe jao.
    const selectedModel = (levaStore.get('Select') as Model) ?? 'ARCHON'
    const exterior = carsStateRef.current[selectedModel].exterior
    const interior = carsStateRef.current[selectedModel].interior
    const timestamp = new Date().toLocaleString()

    // 2) Draw info panel at bottom
    const panelH = Math.max(120, Math.round(height * 0.2))
    const pad = Math.round(panelH * 0.18)
    const panelY = height - panelH

    ctx.fillStyle = 'rgba(0,0,0,0.6)'
    ctx.fillRect(0, panelY, width, panelH)

    // Typography
    const titleSize = Math.max(10, Math.round(panelH * 0.32))
    const bodySize = Math.max(10, Math.round(panelH * 0.24))
    ctx.textBaseline = 'top'

    // Title: Model
    ctx.fillStyle = '#ffffff'
    ctx.font = `600 ${titleSize}px Inter, Arial, sans-serif`
    ctx.fillText(`${selectedModel}`, pad, panelY + pad)

    // Labels
    ctx.font = `500 ${bodySize}px Inter, Arial, sans-serif`
    const line2Y = panelY + pad + titleSize + Math.round(pad * 0.6)

    // Swatch sizes
    const sw = Math.round(bodySize * 1.4)
    const sh = sw
    const gap = Math.round(pad * 0.7)

    // Exterior
    ctx.fillStyle = '#ffffff'
    ctx.fillText(`Exterior: ${exterior}`, pad + sw + 10, line2Y)
    ctx.fillStyle = exterior
    roundRect(ctx, pad, line2Y - 2, sw, sh, Math.round(sw * 0.2))
    ctx.fill()

    // Interior
    const interiorX =
      pad + sw + 10 + ctx.measureText(`Exterior: ${exterior}`).width + gap + sw + 10
    ctx.fillStyle = '#ffffff'
    ctx.fillText(`Interior: ${interior}`, interiorX, line2Y)
    ctx.fillStyle = interior
    roundRect(ctx, interiorX - sw - 10, line2Y - 2, sw, sh, Math.round(sw * 0.2))
    ctx.fill()

    // Timestamp at right
    ctx.textAlign = 'right'
    ctx.fillStyle = '#e6e6e6'
    ctx.font = `400 ${bodySize}px Inter, Arial, sans-serif`
    ctx.fillText(timestamp, width - pad, panelY + pad)

    // 3) Export composed canvas
    out.toBlob((blob) => {
      if (!blob) {
        alert('Failed to export image')
        return
      }
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const filename = `${(selectedModel as string) || 'car'}-${Date.now()}.png`
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    }, 'image/png')
  }

  return (
    <>
      <GlobalStyles />
      <div ref={canvasWrapperRef} style={{ position: 'relative', width: '100%', height: '100vh' }}>
        <Canvas
          camera={{ position: [0, 0, 10] }}
          shadows
          frameloop="demand"
          gl={{ antialias: true, preserveDrawingBuffer: true }}
          dpr={[1, 2]}
        >
          <CaptureBridge onReady={(api) => { captureRef.current = api }} />
          <Suspense fallback={null}>
            {models.map((name) => {
              const ModelComp = cars[name].Model
              return (
                <ModelComp
                  key={name}
                  exterior={carsState[name].exterior}
                  interior={carsState[name].interior}
                  visible={levaStore.get('Select') === name}
                />
              )
            })}
          </Suspense>

          {/* Serve HDR from /public to keep canvas origin-clean */}
          <Environment background files={'/venice_sunset_1k.hdr'} blur={0.5} />
          <OrbitControls
            ref={controlsRef}
            maxPolarAngle={(7 * Math.PI) / 18}
            autoRotate={Rotation}
            minDistance={2}
            maxDistance={15}
          />
        </Canvas>

        {/* Button row: Back + Save (both with static effect) */}
        <div className="btn-row">
          <a
            className="btn btn--static back-btn"
            href={BACK_URL}
            aria-label="Go back to Archon Roadstar"
          >
            <span className="back-icon" aria-hidden="true"></span>
            Back
          </a>

          <button
            className="btn btn--static save-btn"
            onClick={handleSave}
            aria-label="Save image"
          >
            Save model
          </button>
        </div>
      </div>

      <Loader />
      <Leva hidden={progress === 100 ? false : true} titleBar={{ filter: false }} />
    </>
  )
}
