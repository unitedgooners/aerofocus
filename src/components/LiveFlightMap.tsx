import React, { useEffect, useRef } from 'react'
import { useThemeStore } from '../store/themeStore'

interface Props {
  lat: number
  lng: number
  heading?: number  // degrees, 0 = north
}

// Leaflet is loaded from CDN to avoid bundling — see index.html for script/link tags
declare global {
  interface Window {
    L?: any
  }
}

export default function LiveFlightMap({ lat, lng, heading = 0 }: Props) {
  const { theme }     = useThemeStore()
  const containerRef  = useRef<HTMLDivElement>(null)
  const mapRef        = useRef<any>(null)
  const markerRef     = useRef<any>(null)
  const trailRef      = useRef<any>(null)
  const trailPoints   = useRef<[number, number][]>([])

  // Initialize map once
  useEffect(() => {
    if (!containerRef.current || !window.L || mapRef.current) return

    const isDark = theme.mode === 'dark'
    const tileUrl = isDark
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'

    const map = window.L.map(containerRef.current, {
      center: [lat, lng],
      zoom: 6,
      zoomControl: false,
      attributionControl: false,
      dragging: true,
      scrollWheelZoom: false,
      doubleClickZoom: false,
    })

    window.L.tileLayer(tileUrl, {
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map)

    // Plane icon — rotates with heading
    const planeIcon = window.L.divIcon({
      html: `<div style="
        font-size: 22px;
        transform: rotate(${heading - 45}deg);
        transition: transform 1s ease;
      ">✈</div>`,
      className: '',
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    })

    const marker = window.L.marker([lat, lng], { icon: planeIcon }).addTo(map)

    trailPoints.current = [[lat, lng]]
    const trail = window.L.polyline(trailPoints.current, {
      color: theme.accentAlt,
      weight: 2,
      opacity: 0.6,
      dashArray: '4 6',
    }).addTo(map)

    mapRef.current  = map
    markerRef.current = marker
    trailRef.current  = trail

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Update marker position + trail on lat/lng change
  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return

    const planeIcon = window.L.divIcon({
      html: `<div style="
        font-size: 22px;
        transform: rotate(${heading - 45}deg);
        transition: transform 1s ease;
      ">✈</div>`,
      className: '',
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    })

    markerRef.current.setIcon(planeIcon)
    markerRef.current.setLatLng([lat, lng])
    mapRef.current.panTo([lat, lng], { animate: true, duration: 1 })

    trailPoints.current.push([lat, lng])
    if (trailPoints.current.length > 50) trailPoints.current.shift()
    trailRef.current?.setLatLngs(trailPoints.current)
  }, [lat, lng, heading])

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: 180,
        borderRadius: 12,
        overflow: 'hidden',
      }}
    />
  )
}