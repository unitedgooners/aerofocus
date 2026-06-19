// Maps aircraft id -> illustration filename in /public/aircraft/
// Shared by FleetCarousel (owned fleet) and ShopGrid (purchasable catalog)
// so both pull from the same source of truth as new images are added.
export const AIRCRAFT_IMAGES: Record<string, string> = {
  cessna172:      '/aircraft/cessna172.png',
  piper_cub:      '/aircraft/piper_cub.png',
  cub:            '/aircraft/piper_cub.png',
  dc3:            '/aircraft/dc3.png',
  e175:           '/aircraft/e175.png',
  b737:           '/aircraft/b737.png',
  a320:           '/aircraft/a320.png',
  b787:           '/aircraft/b787.png',
  a350:           '/aircraft/a350.png',
  b747:           '/aircraft/b747.png',
  a380:           '/aircraft/a380.png',
  concorde:       '/aircraft/concorde.png',
  wright_flyer:   '/aircraft/wright_flyer.png',
  wright_b:       '/aircraft/wright_model_b.png',
  wright_model_b: '/aircraft/wright_model_b.png',
  spad:           '/aircraft/spad.png',
  spitfire:       '/aircraft/spitfire.png',
  p51:            '/aircraft/p51.png',
  zero:           '/aircraft/zero.png',
  bf109:          '/aircraft/bf109.png',
  b17:            '/aircraft/b17.png',
  f86:            '/aircraft/f86.png',
  f4:             '/aircraft/f4.png',
  sr71:           '/aircraft/sr71.png',
  mig29:          '/aircraft/mig29.png',
  f22:            '/aircraft/f22.png',
  b2:             '/aircraft/b2.png',

  // Mixed-era additions (migration 010)
  fokker_dr1:     '/aircraft/fokker_dr1.png',
  dc10:           '/aircraft/dc10.png',
  huey:           '/aircraft/huey.png',
  gulfstream:     '/aircraft/gulfstream.png',
  concorde2:      '/aircraft/concorde2.png',

  // Wildland firefighting pack (migrations 011, 013)
  s2t_tanker:     '/aircraft/s2t_tanker.png',
  dc10_tanker:    '/aircraft/dc10_tanker.png',
  ov10_attack:    '/aircraft/ov10_attack.png',
  sky_crane:      '/aircraft/sky_crane.png',
  s70_firehawk:   '/aircraft/s70_firehawk.png',

  // Rotary pack (migration 014) — military, civilian, first-responder mix
  blackhawk:        '/aircraft/blackhawk.png',
  h125_news:        '/aircraft/h125_news.png',
  ec135_ambulance:  '/aircraft/ec135_ambulance.png',
  chinook:          '/aircraft/chinook.png',
  jetranger_police: '/aircraft/jetranger_police.png',
}