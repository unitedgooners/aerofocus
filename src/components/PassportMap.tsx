import React, { memo } from 'react'
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
} from 'react-simple-maps'
import { useThemeStore } from '../store/themeStore'

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

const NUMERIC_TO_ALPHA2: Record<string, string> = {
  '840':'US','124':'CA','484':'MX','076':'BR','032':'AR','170':'CO','604':'PE',
  '152':'CL','862':'VE','218':'EC','600':'PY','858':'UY','068':'BO','328':'GY',
  '740':'SR','192':'CU','214':'DO','188':'CR','591':'PA','320':'GT','340':'HN',
  '222':'SV','558':'NI','826':'GB','250':'FR','276':'DE','724':'ES','380':'IT',
  '528':'NL','620':'PT','756':'CH','040':'AT','616':'PL','643':'RU','156':'CN',
  '392':'JP','410':'KR','356':'IN','036':'AU','554':'NZ','710':'ZA','566':'NG',
  '818':'EG','404':'KE','784':'AE','682':'SA','792':'TR','764':'TH','702':'SG',
  '458':'MY','360':'ID','608':'PH','752':'SE','578':'NO','208':'DK','246':'FI',
  '804':'UA','642':'RO','300':'GR','348':'HU','203':'CZ','056':'BE','372':'IE',
  '586':'PK','050':'BD','704':'VN','104':'MM','398':'KZ','364':'IR','368':'IQ',
  '760':'SY','376':'IL','400':'JO','860':'UZ','004':'AF','344':'HK','158':'TW',
  '024':'AO','120':'CM','716':'ZW','894':'ZM','508':'MZ','450':'MG','231':'ET',
  '834':'TZ','288':'GH','504':'MA','012':'DZ','434':'LY','729':'SD','706':'SO',
  '646':'RW','800':'UG','516':'NA','072':'BW','426':'LS','748':'SZ','466':'ML',
  '562':'NE','686':'SN','694':'SL','324':'GN','180':'CD','140':'CF','266':'GA',
  '108':'BI','454':'MW','064':'BT','144':'LK','524':'NP','496':'MN','418':'LA',
  '116':'KH','096':'BN','408':'KP','422':'LB','512':'OM','634':'QA','414':'KW',
  '048':'BH','887':'YE','795':'TM','762':'TJ','417':'KG','031':'AZ','051':'AM',
  '268':'GE','498':'MD','070':'BA','191':'HR','705':'SI','807':'MK','008':'AL',
  '499':'ME','688':'RS','100':'BG','703':'SK','233':'EE','428':'LV','440':'LT',
  '112':'BY','630':'PR',
}

export interface CityPin {
  name: string
  country: string
  lat: number
  lng: number
}

interface Props {
  visitedCountries: string[]
  visitedCities: CityPin[]
}

export const CITY_COORDS: Record<string, { lat: number; lng: number; country: string }> = {
  'New York':       { lat: 40.71,  lng: -74.01,  country: 'US' },
  'Los Angeles':    { lat: 34.05,  lng: -118.24, country: 'US' },
  'Chicago':        { lat: 41.88,  lng: -87.63,  country: 'US' },
  'Houston':        { lat: 29.76,  lng: -95.37,  country: 'US' },
  'Miami':          { lat: 25.77,  lng: -80.19,  country: 'US' },
  'Atlanta':        { lat: 33.75,  lng: -84.39,  country: 'US' },
  'Dallas':         { lat: 32.78,  lng: -96.80,  country: 'US' },
  'Denver':         { lat: 39.74,  lng: -104.99, country: 'US' },
  'Seattle':        { lat: 47.61,  lng: -122.33, country: 'US' },
  'San Francisco':  { lat: 37.77,  lng: -122.42, country: 'US' },
  'Boston':         { lat: 42.36,  lng: -71.06,  country: 'US' },
  'Nashville':      { lat: 36.17,  lng: -86.78,  country: 'US' },
  'Newark':         { lat: 40.69,  lng: -74.17,  country: 'US' },
  'Chicago Midway': { lat: 41.79,  lng: -87.74,  country: 'US' },
  'London':         { lat: 51.51,  lng: -0.13,   country: 'GB' },
  'Paris':          { lat: 48.85,  lng: 2.35,    country: 'FR' },
  'Frankfurt':      { lat: 50.11,  lng: 8.68,    country: 'DE' },
  'Amsterdam':      { lat: 52.37,  lng: 4.90,    country: 'NL' },
  'Madrid':         { lat: 40.42,  lng: -3.70,   country: 'ES' },
  'Rome':           { lat: 41.90,  lng: 12.50,   country: 'IT' },
  'Barcelona':      { lat: 41.39,  lng: 2.15,    country: 'ES' },
  'Zurich':         { lat: 47.38,  lng: 8.54,    country: 'CH' },
  'Vienna':         { lat: 48.21,  lng: 16.37,   country: 'AT' },
  'Brussels':       { lat: 50.85,  lng: 4.35,    country: 'BE' },
  'Dublin':         { lat: 53.33,  lng: -6.25,   country: 'IE' },
  'Lisbon':         { lat: 38.72,  lng: -9.14,   country: 'PT' },
  'Stockholm':      { lat: 59.33,  lng: 18.07,   country: 'SE' },
  'Oslo':           { lat: 59.91,  lng: 10.75,   country: 'NO' },
  'Copenhagen':     { lat: 55.68,  lng: 12.57,   country: 'DK' },
  'Helsinki':       { lat: 60.17,  lng: 24.94,   country: 'FI' },
  'Warsaw':         { lat: 52.23,  lng: 21.01,   country: 'PL' },
  'Prague':         { lat: 50.08,  lng: 14.44,   country: 'CZ' },
  'Athens':         { lat: 37.98,  lng: 23.73,   country: 'GR' },
  'Istanbul':       { lat: 41.01,  lng: 28.95,   country: 'TR' },
  'Moscow':         { lat: 55.75,  lng: 37.62,   country: 'RU' },
  'Tokyo':          { lat: 35.69,  lng: 139.69,  country: 'JP' },
  'Seoul':          { lat: 37.57,  lng: 126.98,  country: 'KR' },
  'Beijing':        { lat: 39.91,  lng: 116.39,  country: 'CN' },
  'Shanghai':       { lat: 31.23,  lng: 121.47,  country: 'CN' },
  'Hong Kong':      { lat: 22.32,  lng: 114.17,  country: 'HK' },
  'Singapore':      { lat: 1.35,   lng: 103.82,  country: 'SG' },
  'Bangkok':        { lat: 13.75,  lng: 100.52,  country: 'TH' },
  'Kuala Lumpur':   { lat: 3.14,   lng: 101.69,  country: 'MY' },
  'Mumbai':         { lat: 19.08,  lng: 72.88,   country: 'IN' },
  'Delhi':          { lat: 28.61,  lng: 77.21,   country: 'IN' },
  'Dubai':          { lat: 25.20,  lng: 55.27,   country: 'AE' },
  'Sydney':         { lat: -33.87, lng: 151.21,  country: 'AU' },
  'Melbourne':      { lat: -37.81, lng: 144.96,  country: 'AU' },
  'Toronto':        { lat: 43.65,  lng: -79.38,  country: 'CA' },
  'Vancouver':      { lat: 49.25,  lng: -123.12, country: 'CA' },
  'Mexico City':    { lat: 19.43,  lng: -99.13,  country: 'MX' },
  'São Paulo':      { lat: -23.55, lng: -46.63,  country: 'BR' },
  'Buenos Aires':   { lat: -34.60, lng: -58.38,  country: 'AR' },
  'Bogotá':         { lat: 4.71,   lng: -74.07,  country: 'CO' },
  'Cairo':          { lat: 30.04,  lng: 31.24,   country: 'EG' },
  'Johannesburg':   { lat: -26.20, lng: 28.04,   country: 'ZA' },
  'Nairobi':        { lat: -1.29,  lng: 36.82,   country: 'KE' },
}

function PassportMap({ visitedCountries, visitedCities }: Props) {
  const { theme }   = useThemeStore()
  const visitedSet  = new Set(visitedCountries)
  const isDark      = theme.mode === 'dark'
  const fillVisited = isDark ? '#38b48b' : '#185FA5'
  const fillDefault = isDark ? '#1A3050' : '#C8DCE8'
  const strokeColor = isDark ? '#07111F' : '#ffffff'
  const oceanColor  = isDark ? '#071525' : '#D6EAF2'
  const pinFill     = isDark ? '#38b48b' : '#185FA5'

  return (
    <div style={{
      background: oceanColor,
      borderRadius: 12,
      border: `0.5px solid ${theme.border}`,
      overflow: 'hidden',
      position: 'relative',
    }}>
      <ComposableMap
        projection="geoNaturalEarth1"
        projectionConfig={{ scale: 140 }}
        style={{ width: '100%', height: 'auto' }}
      >
        <Geographies geography={GEO_URL}>
          {({ geographies }) =>
            geographies.map(geo => {
              const alpha2    = NUMERIC_TO_ALPHA2[String(geo.id)] ?? ''
              const isVisited = visitedSet.has(alpha2)
              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={isVisited ? fillVisited : fillDefault}
                  stroke={strokeColor}
                  strokeWidth={0.4}
                  style={{
                    default: { outline: 'none' },
                    hover:   { outline: 'none' },
                    pressed: { outline: 'none' },
                  }}
                />
              )
            })
          }
        </Geographies>

        {visitedCities.map(city => {
          const coords = CITY_COORDS[city.name]
          if (!coords) return null
          return (
            <Marker key={city.name} coordinates={[coords.lng, coords.lat]}>
              <circle r={3} fill="#fff" stroke={pinFill} strokeWidth={1.5} />
              <circle r={6} fill="none" stroke={pinFill} strokeWidth={0.8} opacity={0.4} />
            </Marker>
          )
        })}
      </ComposableMap>

      {visitedCountries.length === 0 && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ fontSize: 12, color: theme.textTertiary, textAlign: 'center', padding: 16 }}>
            Complete sessions to fill your passport
          </div>
        </div>
      )}

      <div style={{
        position: 'absolute', bottom: 8, right: 8,
        display: 'flex', gap: 8,
        background: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.85)',
        padding: '4px 8px', borderRadius: 6, fontSize: 10,
        color: theme.textSecondary,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: fillVisited }} />
          <span>visited</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', border: `2px solid ${pinFill}`, background: '#fff' }} />
          <span>city</span>
        </div>
      </div>
    </div>
  )
}

export default memo(PassportMap)