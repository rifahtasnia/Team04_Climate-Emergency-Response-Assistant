export async function fetchApiJson<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<T> {
  let response: Response

  try {
    response = await fetch(input, init)
  } catch {
    throw new Error(
      'The live location service could not be reached. Restart AEGIS with “npm run dev” and try again.',
    )
  }

  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.toLowerCase().includes('application/json')) {
    throw new Error(
      'The live location service is not connected. Restart AEGIS with “npm run dev” and try again.',
    )
  }

  let data: T & { error?: string }
  try {
    data = await response.json()
  } catch {
    throw new Error('The location service returned an unreadable response. Please try again.')
  }

  if (!response.ok) {
    throw new Error(data.error ?? 'The requested live service is temporarily unavailable.')
  }

  return data
}
