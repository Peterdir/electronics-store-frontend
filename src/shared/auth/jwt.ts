export interface JwtClaims {
  sub?: string;
  email?: string;
  role?: string;
  exp?: number;
}

export function decodeJwt(token: string): JwtClaims | null {
    const payload = token.split(".")[1];

    if (!payload) {
        return null;
    }

    try {
        const normalized = payload
            .replace(/-/g, "+")
            .replace(/_/g, "/");

        const padded = normalized.padEnd(
            normalized.length + ((4 - (normalized.length % 4)) % 4),
            "=",
        );
        
        const bytes = Uint8Array.from(
            atob(padded),
            (character) => character.charCodeAt(0),
        );

        const decoded: unknown = JSON.parse(
            new TextDecoder().decode(bytes),
        );

        if (
            typeof decoded !== "object" ||
            decoded === null ||
            Array.isArray(decoded)
        ) {
            return null;
        }

        return decoded as JwtClaims;
    } catch {
        return null;
    }
}

export function isExpired(token: string, now = Date.now(),): boolean {
    const expiration = decodeJwt(token)?.exp;

    return (
        typeof expiration !== "number" ||
        expiration * 1000 <= now
    );
}