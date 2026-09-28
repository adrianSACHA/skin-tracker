import { SUPABASE_URL } from './constants.js'

// Mock backendu Supabase dla testow e2e.
//
// Przechwytuje WSZYSTKIE zapytania do `SUPABASE_URL` (w testach wskazuje na
// `https://e2e.invalid`) i odpowiada przygotowanymi danymi. Zaden prawdziwy
// projekt Supabase nie jest dotykany - nie trzeba bazy, konta ani internetu.
//
// `mockSupabase(page, ...)` trzeba wywolac PRZED `page.goto(...)`, zeby mock
// zlapal juz pierwsze zapytanie aplikacji.

const PATTERN = `${SUPABASE_URL}/**`

export const DEMO_USER = {
  id: 'user-e2e-1',
  aud: 'authenticated',
  role: 'authenticated',
  email: 'demo@example.com',
  created_at: '2026-01-01T00:00:00Z',
  app_metadata: { provider: 'email', providers: ['email'] },
  user_metadata: {},
  identities: [],
  email_confirmed_at: '2026-01-01T00:00:00Z',
}

// Malutki obrazek zastepczy dla Storage (gdyby ktos chcial wyswietlic zdjecie).
const PLACEHOLDER_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8">' +
  '<rect width="8" height="8" fill="#e2e8f0"/></svg>'

// Stan poczatkowy „bazy". Zwracamy nowy obiekt przy kazdym wywolaniu, zeby
// mutacje jednego testu nie przeciekaly do drugiego.
export function makeData() {
  return {
    persons: [
      {
        id: 'person-1',
        owner_user_id: DEMO_USER.id,
        display_name: 'Ja',
        interval_weeks: 6,
        reminder_lead_days: 7,
        created_at: '2026-01-01T00:00:00Z',
      },
      {
        id: 'person-2',
        owner_user_id: DEMO_USER.id,
        display_name: 'Syn',
        interval_weeks: 6,
        reminder_lead_days: 7,
        created_at: '2026-01-02T00:00:00Z',
      },
    ],
    bodyMaps: [
      {
        id: 'map-1',
        person_id: 'person-1',
        view_name: 'back',
        image_url: 'user-e2e-1/person-1/body-map/back.webp',
        created_at: '2026-01-03T00:00:00Z',
      },
    ],
    lesions: [
      {
        // Auto-nazwa (`Tył-N`) - okolica jest juz w nazwie, wiec UI jej nie dubluje.
        id: 'lesion-1',
        person_id: 'person-1',
        body_map_id: 'map-1',
        label: 'Tył-1',
        pos_x: 40,
        pos_y: 30,
        status: 'stable',
        next_check_at: null,
        created_at: '2026-02-01T00:00:00Z',
        lesion_photos: [
          { taken_at: '2026-02-01', size_mm: 5.2, photo_url: null },
        ],
        body_maps: { view_name: 'back' },
      },
      {
        // Nazwa nadpisana recznie - UI dokłada kontekst okolicy („Tył · ...").
        id: 'lesion-2',
        person_id: 'person-1',
        body_map_id: 'map-1',
        label: 'Kark — znamię przy włosach',
        pos_x: 50,
        pos_y: 12,
        status: 'watch',
        next_check_at: '2026-12-01',
        created_at: '2026-03-01T00:00:00Z',
        lesion_photos: [],
        body_maps: { view_name: 'back' },
      },
    ],
    photos: [],
  }
}

// --- pomocnicze -------------------------------------------------------------

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': '*',
  'access-control-allow-methods': 'GET,POST,PATCH,PUT,DELETE,OPTIONS',
  'access-control-expose-headers': 'content-range, x-total-count',
}

function json(route, body, status = 200) {
  return route.fulfill({
    status,
    headers: { ...CORS, 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function noContent(route) {
  return route.fulfill({ status: 204, headers: CORS, body: '' })
}

function inserted(route) {
  return route.fulfill({
    status: 201,
    headers: { ...CORS, 'content-type': 'application/json' },
    body: '[]',
  })
}

function base64url(value) {
  return Buffer.from(value, 'utf8').toString('base64url')
}

function makeSession() {
  const expiresAt = Math.floor(Date.now() / 1000) + 3600
  const accessToken = [
    base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' })),
    base64url(
      JSON.stringify({
        sub: DEMO_USER.id,
        email: DEMO_USER.email,
        role: 'authenticated',
        aud: 'authenticated',
        exp: expiresAt,
      })
    ),
    'e2e-signature',
  ].join('.')

  return {
    access_token: accessToken,
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: expiresAt,
    refresh_token: 'e2e-refresh-token',
    user: DEMO_USER,
  }
}

// Supabase/PostgREST rozroznia „jeden obiekt" od „lista" naglowkiem Accept.
function wantsObject(request) {
  return (request.headers().accept || '').includes('vnd.pgrst.object')
}

function eqParam(url, name) {
  const match = new RegExp(`[?&]${name}=eq\\.([^&]+)`).exec(url)
  return match ? decodeURIComponent(match[1]) : null
}

const REST_TABLES = {
  monitored_persons: 'persons',
  body_maps: 'bodyMaps',
  lesions: 'lesions',
  lesion_photos: 'photos',
}

function filterRows(rows, url) {
  const id = eqParam(url, 'id')
  const personId = eqParam(url, 'person_id')
  const lesionId = eqParam(url, 'lesion_id')
  const viewName = eqParam(url, 'view_name')
  return rows.filter((row) => {
    if (id && row.id !== id) return false
    if (personId && row.person_id !== personId) return false
    if (lesionId && row.lesion_id !== lesionId) return false
    if (viewName && row.view_name !== viewName) return false
    return true
  })
}

function handleRest(route, request, url, data) {
  const method = request.method()
  const table = /\/rest\/v1\/([a-z_]+)/.exec(url)?.[1]
  const key = REST_TABLES[table]
  if (!key) return json(route, [])

  const rows = data[key]

  if (method === 'GET') {
    const result = filterRows(rows, url)
    if (wantsObject(request)) return json(route, result[0] ?? null)
    return json(route, result)
  }

  if (method === 'POST') {
    const payload = request.postDataJSON()
    for (const item of Array.isArray(payload) ? payload : [payload]) {
      rows.push({
        id: `${String(table).replace(/_/g, '-')}-${rows.length + 1}`,
        created_at: new Date().toISOString(),
        ...item,
      })
    }
    return inserted(route)
  }

  if (method === 'PATCH') {
    const payload = request.postDataJSON()
    const targets = filterRows(rows, url)
    // Bez filtra (id/person_id) nic nie zmieniamy - mock nie ma odpowiadac
    // hurtowo, bo maskowalby bledy w zapytaniach aplikacji.
    if (targets.length === rows.length && !eqParam(url, 'id') && !eqParam(url, 'person_id')) {
      return noContent(route)
    }
    for (const row of targets) Object.assign(row, payload)
    return noContent(route)
  }

  if (method === 'DELETE') {
    const removed = filterRows(rows, url)
    for (const row of removed) {
      const index = rows.indexOf(row)
      if (index !== -1) rows.splice(index, 1)
    }
    // Kaskada z bazy: usuniecie osoby zabiera jej widoki i znamiona.
    if (table === 'monitored_persons') {
      for (const person of removed) {
        data.bodyMaps = data.bodyMaps.filter((m) => m.person_id !== person.id)
        data.lesions = data.lesions.filter((l) => l.person_id !== person.id)
      }
    }
    if (table === 'body_maps') {
      for (const map of removed) {
        data.lesions = data.lesions.filter((l) => l.body_map_id !== map.id)
      }
    }
    return noContent(route)
  }

  return noContent(route)
}

function handleAuth(route, request, path, options) {
  const method = request.method()

  if (path === '/auth/v1/token') {
    if (options.loginFails) {
      return json(
        route,
        {
          error: 'invalid_grant',
          error_description: 'Invalid login credentials',
          msg: 'Invalid login credentials',
        },
        400
      )
    }
    return json(route, options.session)
  }

  if (path === '/auth/v1/user') return json(route, DEMO_USER)
  if (path === '/auth/v1/logout') return noContent(route)
  if (path === '/auth/v1/signup') return json(route, options.session)
  if (method === 'OPTIONS') return noContent(route)

  return json(route, {})
}

function handleStorage(route, request, url) {
  const method = request.method()

  if (url.includes('/object/list/')) return json(route, [])
  if (method === 'DELETE') return json(route, [])

  if (url.includes('/object/sign/')) {
    if (method === 'POST') {
      const match = /object\/sign\/(.+)$/.exec(url.split('?')[0])
      return json(route, {
        signedURL: `/object/sign/${match ? match[1] : 'file'}?token=e2e`,
      })
    }
    return route.fulfill({
      status: 200,
      headers: { ...CORS, 'content-type': 'image/svg+xml' },
      body: PLACEHOLDER_SVG,
    })
  }

  return route.fulfill({
    status: 200,
    headers: { ...CORS, 'content-type': 'image/svg+xml' },
    body: PLACEHOLDER_SVG,
  })
}

/**
 * Podmienia backend Supabase na mock.
 *
 * @param {import('@playwright/test').Page} page
 * @param {object} [options]
 * @param {ReturnType<typeof makeData>} [options.data] stan „bazy" (mutowalny w trakcie testu)
 * @param {boolean} [options.loginFails] czy logowanie ma zwracac blad
 */
export async function mockSupabase(page, options = {}) {
  const data = options.data ?? makeData()
  const settings = {
    data,
    loginFails: options.loginFails ?? false,
    session: options.session ?? makeSession(),
  }

  await page.route(PATTERN, async (route) => {
    const request = route.request()
    const url = request.url()
    const { pathname } = new URL(url)

    // CORS preflight.
    if (request.method() === 'OPTIONS') return noContent(route)

    if (pathname.startsWith('/auth/v1/')) {
      return handleAuth(route, request, pathname, settings)
    }
    if (pathname.startsWith('/rest/v1/')) {
      return handleRest(route, request, url, settings.data)
    }
    if (pathname.startsWith('/storage/v1/')) {
      return handleStorage(route, request, url)
    }

    // Nieznany endpoint - nie udajemy, ze istnieje.
    return json(route, { message: `mock: nieobsluzowany endpoint ${pathname}` }, 404)
  })

  return settings.data
}
