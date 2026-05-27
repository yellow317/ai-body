export async function onRequest(context) {
  const { request } = context

  const url = new URL(request.url)
  url.hostname = 'aibody.vercel.app'

  const modifiedRequest = new Request(url.toString(), {
    method: request.method,
    headers: request.headers,
    body: request.method !== 'GET' && request.method !== 'HEAD' ? await request.arrayBuffer() : undefined,
    redirect: 'follow',
  })

  return fetch(modifiedRequest)
}
