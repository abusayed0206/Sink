import { LinkSchema } from '@/schemas/link'

export default eventHandler(async (event) => {
  const link = await readValidatedBody(event, LinkSchema.parse)

  const { cloudflare } = event.context
  const { KV } = cloudflare.env
  const existingLink = await KV.get(`link:${link.slug}`)
  
  if (existingLink) {
    throw createError({
      status: 409, // Conflict
      statusText: 'Link already exists',
    })
  } else {
    const expiration = getExpiration(event, link.expiration)

    await KV.put(`link:${link.slug}`, JSON.stringify(link), {
      expiration,
      metadata: {
        expiration,
      },
    })
    
    // Construct the shortened URL
    const shorturl = `https://link.abusayed.dev/${link.slug}`

    setResponseStatus(event, 201)
    
    // Return the response with the short URL
    return {
      link: {
        ...link,           // Include all other link details
        shorturl: shorturl, // Add the shortened URL
      }
    }
  }
})
