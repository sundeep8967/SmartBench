import { NextResponse } from 'next/server'

/**
 * Standardized API response helpers.
 *
 * Usage:
 *   import { success, error, unauthorized } from '@/lib/api/responses'
 *
 *   return success({ companyId: '...' })
 *   return error('Something failed')
 *   return unauthorized()
 */

export function success<T>(data: T, status = 200) {
    return NextResponse.json(data, { status })
}

export function error(message: string, status = 500) {
    return NextResponse.json({ error: message }, { status })
}

export function unauthorized(message = 'Unauthorized') {
    return error(message, 401)
}

export function badRequest(message = 'Bad Request') {
    return error(message, 400)
}

export function notFound(message = 'Not Found') {
    return error(message, 404)
}
